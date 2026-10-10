/**
 * K-Apply Chrome Native Side Panel Controller
 * Live copilot embedded directly inside Chrome's side frame
 */

import { storage } from '../utils/storage.js';
import { api } from '../utils/api.js';
import { interpolateVariables } from '../content/matcher.js';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const tabStatus = document.getElementById('sp-tab-status');
  const jobRole = document.getElementById('sp-job-role');
  const jobCompany = document.getElementById('sp-job-company');
  const jobLocation = document.getElementById('sp-job-location');
  const btnAutofill = document.getElementById('sp-btn-autofill');
  const btnTrack = document.getElementById('sp-btn-track');
  const btnRefresh = document.getElementById('sp-btn-refresh');
  const btnDashboard = document.getElementById('sp-btn-dashboard');
  const statusBar = document.getElementById('sp-status-bar');

  const tabAudit = document.getElementById('sp-tab-audit');
  const tabQa = document.getElementById('sp-tab-qa');
  const tabProfile = document.getElementById('sp-tab-profile');
  const tabSettings = document.getElementById('sp-tab-settings');
  const paneAudit = document.getElementById('pane-audit');
  const paneQa = document.getElementById('pane-qa');
  const paneProfile = document.getElementById('pane-profile');
  const paneSettings = document.getElementById('pane-settings');

  const badgeAudit = document.getElementById('sp-badge-audit');
  const badgeQa = document.getElementById('sp-badge-qa');
  const cntAll = document.getElementById('cnt-all');
  const cntFilled = document.getElementById('cnt-filled');
  const cntSkipped = document.getElementById('cnt-skipped');

  const auditList = document.getElementById('sp-audit-list');
  const qaListContainer = document.getElementById('sp-qa-list');
  const profileView = document.getElementById('sp-profile-view');
  const auditSearch = document.getElementById('sp-audit-search');
  const qaSearch = document.getElementById('sp-qa-search');

  let activeTabId = null;
  let currentJob = { company: '', role: '', location: '', url: '' };
  let currentResults = null;
  let candidateProfile = null;
  let candidateQa = [];
  let currentAuditFilter = 'all'; // 'all' | 'filled' | 'skipped'

  // 1. Initial Load of Storage Data
  async function loadStorageData() {
    try {
      candidateProfile = await storage.getProfile();
      candidateQa = await storage.getQAList();
      badgeQa.innerText = candidateQa.length;
      renderQaVault();
      renderProfileView();
    } catch (err) {
      console.warn('[SidePanel] Storage load failed:', err);
    }
  }

  // 2. Query and Sync with Active Tab
  async function syncActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab || !tab.id) {
        tabStatus.innerText = 'No active tab found';
        return;
      }

      activeTabId = tab.id;
      tabStatus.innerText = tab.url ? new URL(tab.url).hostname : 'Active Tab';

      chrome.tabs.sendMessage(activeTabId, { action: 'GET_AUTOFILL_RESULTS' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Fallback: parse from tab title
          parseFallbackTitle(tab.title || '');
          currentResults = null;
          updateAuditCounts(0, 0);
          renderAuditPane();
        } else {
          currentJob = { ...currentJob, ...response.jobDetails };
          currentResults = response.stats;
          updateJobHeader();
          if (currentResults) {
            updateAuditCounts(
              currentResults.filled ? currentResults.filled.length : currentResults.filledCount || 0,
              currentResults.skipped ? currentResults.skipped.length : currentResults.skippedCount || 0
            );
          }
          renderAuditPane();
        }
      });
    } catch (err) {
      tabStatus.innerText = 'Unable to connect to tab';
    }
  }

  function parseFallbackTitle(title) {
    if (title) {
      const parts = title.split(/[-|–]/);
      currentJob.role = parts[0]?.trim() || 'Job Application';
      currentJob.company = parts[1]?.trim() || '';
    }
    updateJobHeader();
  }

  function updateJobHeader() {
    jobRole.innerText = currentJob.role || 'Application Form';
    jobCompany.innerText = currentJob.company || 'Ready to autofill';
    jobLocation.innerText = currentJob.location || '';
    jobLocation.style.display = currentJob.location ? 'inline-block' : 'none';
  }

  function updateAuditCounts(filled, skipped) {
    const total = filled + skipped;
    badgeAudit.innerText = total;
    cntAll.innerText = total;
    cntFilled.innerText = filled;
    cntSkipped.innerText = skipped;
  }

  // 3. Tab Navigation (Audit vs Q&A vs Profile)
  const tabs = [
    { btn: tabAudit, pane: paneAudit },
    { btn: tabQa, pane: paneQa },
    { btn: tabProfile, pane: paneProfile },
    { btn: tabSettings, pane: paneSettings }
  ];

  tabs.forEach(({ btn, pane }) => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => {
        t.btn.classList.remove('active');
        t.pane.classList.remove('active');
      });
      btn.classList.add('active');
      pane.classList.add('active');
    });
  });

  // 4. Filter Pills Listeners for Audit
  document.querySelectorAll('.sp-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.sp-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentAuditFilter = pill.getAttribute('data-filter');
      renderAuditPane(auditSearch.value);
    });
  });

  auditSearch.addEventListener('input', (e) => renderAuditPane(e.target.value));
  qaSearch.addEventListener('input', (e) => renderQaVault(e.target.value));

  // 5. Render Audit Cards
  function renderAuditPane(query = '') {
    auditList.innerHTML = '';
    const q = query.toLowerCase().trim();

    if (!currentResults || ((currentResults.filled?.length || 0) === 0 && (currentResults.skipped?.length || 0) === 0)) {
      auditList.innerHTML = `
        <div class="sp-empty-state">
          <div class="sp-empty-icon">📋</div>
          <h3>Ready to scan form fields</h3>
          <p>Click "Autofill Form" above to scan and fill this page's application inputs.</p>
        </div>
      `;
      return;
    }

    const filledList = (currentResults.filled || []).map(f => ({ ...f, isFilled: true }));
    const skippedList = (currentResults.skipped || []).map(s => ({ ...s, isFilled: false }));

    let combined = [];
    if (currentAuditFilter === 'all') combined = [...filledList, ...skippedList];
    else if (currentAuditFilter === 'filled') combined = filledList;
    else if (currentAuditFilter === 'skipped') combined = skippedList;

    const filtered = combined.filter(item => {
      if (!q) return true;
      const t = (item.title || item.label || '').toLowerCase();
      const p = (item.preview || '').toLowerCase();
      const r = (item.reasonText || '').toLowerCase();
      return t.includes(q) || p.includes(q) || r.includes(q);
    });

    if (filtered.length === 0) {
      auditList.innerHTML = `<div style="text-align: center; padding: 24px; color: #64748b;">No matching fields found.</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `sp-card ${item.isFilled ? 'sp-card-filled' : 'sp-card-skipped'}`;

      if (item.isFilled) {
        card.innerHTML = `
          <div class="sp-card-header">
            <div>
              <div class="sp-card-title">${escapeHTML(item.title || item.label)}</div>
              <div class="sp-card-type">${escapeHTML(item.type || 'text')}</div>
            </div>
            <span class="sp-badge sp-badge-filled">✓ Filled</span>
          </div>
          <div class="sp-card-preview">${escapeHTML(item.preview || String(item.value || ''))}</div>
          <div class="sp-card-actions">
            <button class="sp-action-small-btn sp-btn-focus" data-id="${item.fieldId}">🎯 Focus Field</button>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="sp-card-header">
            <div>
              <div class="sp-card-title">${escapeHTML(item.title || item.label)}</div>
              <div class="sp-card-type">${escapeHTML(item.type || 'text')}</div>
            </div>
            <span class="sp-badge sp-badge-skipped">⚠️ Skipped</span>
          </div>
          <div class="sp-card-reason">ℹ️ ${escapeHTML(item.reasonText || 'No match found in profile')}</div>
          <div class="sp-card-actions">
            <button class="sp-action-small-btn sp-btn-focus" data-id="${item.fieldId}">🎯 Focus</button>
            <button class="sp-action-small-btn sp-btn-quickfill-toggle" data-id="${item.fieldId}">⚡ Quick Fill</button>
          </div>
          <div class="sp-quickfill-box" style="display: none;" id="sp-qbox-${item.fieldId}">
            <select class="sp-quickfill-select" id="sp-qselect-${item.fieldId}">
              <option value="">-- Choose Profile or Vault Value --</option>
              <optgroup label="Profile Defaults">
                ${candidateProfile?.fullName ? `<option value="${escapeHTML(candidateProfile.fullName)}">Full Name: ${escapeHTML(candidateProfile.fullName)}</option>` : ''}
                ${candidateProfile?.email ? `<option value="${escapeHTML(candidateProfile.email)}">Email: ${escapeHTML(candidateProfile.email)}</option>` : ''}
                ${candidateProfile?.phone ? `<option value="${escapeHTML(candidateProfile.phone)}">Phone: ${escapeHTML(candidateProfile.phone)}</option>` : ''}
                ${candidateProfile?.linkedin ? `<option value="${escapeHTML(candidateProfile.linkedin)}">LinkedIn: ${escapeHTML(candidateProfile.linkedin)}</option>` : ''}
                ${candidateProfile?.github ? `<option value="${escapeHTML(candidateProfile.github)}">GitHub: ${escapeHTML(candidateProfile.github)}</option>` : ''}
                ${candidateProfile?.portfolio ? `<option value="${escapeHTML(candidateProfile.portfolio)}">Portfolio: ${escapeHTML(candidateProfile.portfolio)}</option>` : ''}
                ${candidateProfile?.noticePeriod ? `<option value="${escapeHTML(candidateProfile.noticePeriod)}">Notice Period: ${escapeHTML(candidateProfile.noticePeriod)}</option>` : ''}
              </optgroup>
              <optgroup label="Q&A Vault Answers">
                ${candidateQa.map(qItem => `<option value="${escapeHTML(interpolateVariables(qItem.answer, candidateProfile, currentJob))}">${escapeHTML(qItem.title)}</option>`).join('')}
              </optgroup>
            </select>
            <div style="display: flex; gap: 6px;">
              <input type="text" class="sp-quickfill-input" id="sp-qinput-${item.fieldId}" placeholder="Or custom answer..." />
              <button class="sp-action-small-btn sp-action-small-btn-primary" id="sp-qapply-${item.fieldId}">Apply</button>
            </div>
          </div>
        `;

        const toggleBtn = card.querySelector('.sp-btn-quickfill-toggle');
        const qBox = card.querySelector(`#sp-qbox-${item.fieldId}`);
        const qSelect = card.querySelector(`#sp-qselect-${item.fieldId}`);
        const qInput = card.querySelector(`#sp-qinput-${item.fieldId}`);
        const qApply = card.querySelector(`#sp-qapply-${item.fieldId}`);

        if (toggleBtn && qBox) {
          toggleBtn.addEventListener('click', () => {
            const isHidden = qBox.style.display === 'none';
            qBox.style.display = isHidden ? 'flex' : 'none';
            toggleBtn.innerText = isHidden ? '✕ Close' : '⚡ Quick Fill';
          });
        }

        if (qSelect && qInput) {
          qSelect.addEventListener('change', () => {
            if (qSelect.value) qInput.value = qSelect.value;
          });
        }

        if (qApply && qInput) {
          qApply.addEventListener('click', () => {
            const val = qInput.value || qSelect.value;
            if (!val || !val.trim()) return;
            chrome.tabs.sendMessage(activeTabId, { action: 'QUICK_FILL_FIELD', fieldId: item.fieldId, value: val.trim() }, (res) => {
              showStatus(`✓ Filled "${item.title || item.label}"`, 'success');
              syncActiveTab();
            });
          });
        }
      }

      const focusBtn = card.querySelector('.sp-btn-focus');
      if (focusBtn) {
        focusBtn.addEventListener('click', () => {
          chrome.tabs.sendMessage(activeTabId, { action: 'FOCUS_FIELD', fieldId: item.fieldId });
        });
      }

      auditList.appendChild(card);
    });
  }

  // 6. Render Q&A Vault
  function renderQaVault(query = '') {
    qaListContainer.innerHTML = '';
    const q = query.toLowerCase().trim();

    const filtered = candidateQa.filter(item => {
      if (!q) return true;
      const t = (item.title || '').toLowerCase();
      const a = (item.answer || '').toLowerCase();
      const k = (item.keywords || []).join(' ').toLowerCase();
      return t.includes(q) || a.includes(q) || k.includes(q);
    });

    if (filtered.length === 0) {
      qaListContainer.innerHTML = `<div style="text-align: center; padding: 24px; color: #64748b;">No Q&A items matched your search.</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'sp-card';
      const renderedAnswer = interpolateVariables(item.answer, candidateProfile, currentJob);

      card.innerHTML = `
        <div class="sp-card-header">
          <div class="sp-card-title">${escapeHTML(item.title)}</div>
          <span class="sp-badge" style="background:#e0e7ff; color:#3730a3;">${escapeHTML(item.category || 'General')}</span>
        </div>
        <div class="sp-card-preview" style="max-height: 90px; overflow-y: auto;">${escapeHTML(renderedAnswer)}</div>
        <div class="sp-card-actions">
          <button class="sp-action-small-btn sp-btn-copy" data-text="${escapeHTML(renderedAnswer)}">📋 Copy</button>
        </div>
      `;

      card.querySelector('.sp-btn-copy').addEventListener('click', async (e) => {
        const text = e.target.getAttribute('data-text');
        await navigator.clipboard.writeText(text);
        showStatus('✓ Copied to clipboard!', 'success');
      });

      qaListContainer.appendChild(card);
    });
  }

  // 7. Render Candidate Profile View
  function renderProfileView() {
    if (!candidateProfile) return;
    profileView.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title" style="font-size: 13px;">${escapeHTML(candidateProfile.fullName || 'Candidate')}</div>
        <div style="font-size: 11px; color: #64748b;">${escapeHTML(candidateProfile.headline || '')}</div>
      </div>

      <div class="sp-card">
        <div style="font-weight: 700; font-size: 11px; color: #475569; margin-bottom: 4px;">CONTACT DETAILS</div>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div>📧 <b>Email:</b> ${escapeHTML(candidateProfile.email || 'N/A')}</div>
          <div>📱 <b>Phone:</b> ${escapeHTML(candidateProfile.phone || 'N/A')}</div>
          <div>📍 <b>Location:</b> ${escapeHTML([candidateProfile.city, candidateProfile.country].filter(Boolean).join(', ') || 'N/A')}</div>
        </div>
      </div>

      <div class="sp-card">
        <div style="font-weight: 700; font-size: 11px; color: #475569; margin-bottom: 4px;">ONLINE PROFILES</div>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div>🔗 <b>LinkedIn:</b> ${escapeHTML(candidateProfile.linkedin || 'N/A')}</div>
          <div>🐙 <b>GitHub:</b> ${escapeHTML(candidateProfile.github || 'N/A')}</div>
          <div>🌐 <b>Portfolio:</b> ${escapeHTML(candidateProfile.portfolio || 'N/A')}</div>
        </div>
      </div>

      <div class="sp-card">
        <div style="font-weight: 700; font-size: 11px; color: #475569; margin-bottom: 4px;">PREFERENCES</div>
        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div>💼 <b>Experience:</b> ${escapeHTML(candidateProfile.yearsOfExperience || '2')} years</div>
          <div>⏱️ <b>Notice:</b> ${escapeHTML(candidateProfile.noticePeriod || 'Immediate')}</div>
          <div>🛡️ <b>Authorization:</b> ${escapeHTML(candidateProfile.authorizedToWork || 'Yes')}</div>
        </div>
      </div>
    `;
  }

  // 8. Autofill Button Click
  btnAutofill.addEventListener('click', async () => {
    if (!activeTabId) {
      showStatus('No active tab found', 'error');
      return;
    }

    btnAutofill.disabled = true;
    btnAutofill.innerHTML = `<span>Filling form...</span>`;

    chrome.tabs.sendMessage(activeTabId, { action: 'AUTOFILL_FORM' }, async (response) => {
      btnAutofill.disabled = false;
      btnAutofill.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span>Autofill Form</span>
      `;

      if (chrome.runtime.lastError || !response || !response.success) {
        showStatus('Autofill not responding on this page', 'error');
        return;
      }

      currentResults = response.stats;
      const filled = currentResults?.filledCount || 0;
      const skipped = currentResults?.skippedCount || 0;
      showStatus(`⚡ Filled ${filled} field${filled === 1 ? '' : 's'}, ${skipped} skipped!`, 'success');
      updateAuditCounts(filled, skipped);
      renderAuditPane();
    });
  });

  // 9. Track Job Application
  btnTrack.addEventListener('click', async () => {
    if (!currentJob.company && !currentJob.role) {
      showStatus('No detected job details to save', 'error');
      return;
    }

    try {
      await storage.addApplication({
        company: currentJob.company || 'Unknown',
        role: currentJob.role || 'Software Engineer',
        status: 'applied',
        dateApplied: new Date().toISOString().split('T')[0],
        url: currentJob.url || '',
        location: currentJob.location || ''
      });
      showStatus(`Saved application for ${currentJob.company || 'job'}!`, 'success');
    } catch (err) {
      showStatus('Failed to save application: ' + err.message, 'error');
    }
  });

  // 10. Dashboard & Refresh buttons
  btnDashboard.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
  });

  btnRefresh.addEventListener('click', () => {
    showStatus('Refreshing tab connection...', 'info');
    syncActiveTab();
  });

  function showStatus(msg, type = 'info') {
    statusBar.className = `sp-status-bar ${type}`;
    statusBar.innerText = msg;
    statusBar.style.display = 'block';
    setTimeout(() => {
      statusBar.style.display = 'none';
    }, 3800);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 11. Listen for active tab switching
  chrome.tabs.onActivated?.addListener(() => {
    syncActiveTab();
  });

  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete' && tabId === activeTabId) {
      syncActiveTab();
    }
  });

  async function checkBackend() {
    try {
      const health = await api.checkHealth(1200);
      if (health.connected) {
        btnDashboard.title = `Open Next.js SaaS Command Center (Live - ${health.mode})`;
      } else {
        btnDashboard.title = 'Open Next.js SaaS Command Center (Server offline - local mode)';
      }
    } catch (e) {
      btnDashboard.title = 'Open Next.js SaaS Command Center';
    }
  }

  // 12. Settings Panel
  async function initSettingsPane() {
    const toggleWidget = document.getElementById('setting-floating-widget');
    const toggleHighlight = document.getElementById('setting-auto-highlight');
    const toggleDetect = document.getElementById('setting-auto-detect');
    const settingsStatus = document.getElementById('sp-settings-status');

    if (!toggleWidget) return;

    // Load current settings and reflect on toggles
    const currentSettings = await storage.getSettings();
    toggleWidget.checked = currentSettings.enableFloatingButton === true;
    toggleHighlight.checked = currentSettings.autoHighlightFields !== false;
    toggleDetect.checked = currentSettings.autoDetectJobInfo !== false;

    async function saveSettings() {
      const newSettings = {
        ...currentSettings,
        enableFloatingButton: toggleWidget.checked,
        autoHighlightFields: toggleHighlight.checked,
        autoDetectJobInfo: toggleDetect.checked
      };
      await storage.saveSettings(newSettings);

      // Live-apply floating widget toggle to active tab
      if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, {
          action: 'TOGGLE_WIDGET',
          visible: toggleWidget.checked
        }).catch(() => {});
      }

      // Show brief save confirmation
      if (settingsStatus) {
        settingsStatus.innerText = '✓ Settings saved';
        settingsStatus.style.display = 'block';
        setTimeout(() => { settingsStatus.style.display = 'none'; }, 2000);
      }
    }

    toggleWidget.addEventListener('change', saveSettings);
    toggleHighlight.addEventListener('change', saveSettings);
    toggleDetect.addEventListener('change', saveSettings);
  }

  // Initialize
  await loadStorageData();
  await syncActiveTab();
  checkBackend();
  initSettingsPane();
});
