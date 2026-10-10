/**
 * Popup Script
 * Coordinates between user clicks, active tab content script, and storage
 */

import { storage } from '../utils/storage.js';
import { api } from '../utils/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const backendBadge = document.getElementById('backend-status-badge');
  const roleEl = document.getElementById('detected-role');
  const companyEl = document.getElementById('detected-company');
  const locEl = document.getElementById('detected-location');
  const btnAutofill = document.getElementById('btn-autofill');
  const btnTrackToggle = document.getElementById('btn-track-toggle');
  const trackForm = document.getElementById('track-form');
  const btnCancelTrack = document.getElementById('btn-cancel-track');
  const statusMsg = document.getElementById('status-msg');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const btnGotoDashboard = document.getElementById('btn-goto-dashboard');
  const statAppsCount = document.getElementById('stat-apps-count');
  const statQaCount = document.getElementById('stat-qa-count');

  let activeTab = null;
  let detectedJob = { company: '', role: '', location: '', url: '' };

  // Load stats
  async function refreshStats() {
    try {
      const apps = await storage.getApplications();
      const qaList = await storage.getQAList();
      statAppsCount.innerText = apps.length;
      statQaCount.innerText = qaList.length;
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }

  // Get active tab and detect job
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];

    if (activeTab && activeTab.id) {
      detectedJob.url = activeTab.url || '';

      chrome.tabs.sendMessage(activeTab.id, { action: 'GET_JOB_DETAILS' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Tab fallback using title
          parseFallbackTitle(activeTab.title || '');
        } else {
          detectedJob = { ...detectedJob, ...response.jobDetails };
          updateJobUI();
        }
      });
    }
  } catch (err) {
    console.warn('Error querying active tab:', err);
    parseFallbackTitle(document.title);
  }

  function parseFallbackTitle(title) {
    if (title) {
      const parts = title.split(/[-|–]/);
      detectedJob.role = parts[0]?.trim() || 'Job Application';
      detectedJob.company = parts[1]?.trim() || 'Company';
    } else {
      detectedJob.role = 'Job Application';
      detectedJob.company = 'Website';
    }
    updateJobUI();
  }

  function updateJobUI() {
    roleEl.innerText = detectedJob.role || 'Application Form';
    companyEl.innerText = detectedJob.company || 'Ready to autofill';
    locEl.innerText = detectedJob.location || '';

    // Pre-populate track form
    document.getElementById('track-company').value = detectedJob.company || '';
    document.getElementById('track-role').value = detectedJob.role || '';
    document.getElementById('track-date').value = new Date().toISOString().split('T')[0];
  }

  // Autofill button click
  btnAutofill.addEventListener('click', async () => {
    if (!activeTab || !activeTab.id) {
      showStatus('No active tab found', 'error');
      return;
    }

    btnAutofill.disabled = true;
    btnAutofill.innerHTML = `<span>Filling...</span>`;

    try {
      chrome.tabs.sendMessage(activeTab.id, { action: 'AUTOFILL_FORM' }, async (response) => {
        btnAutofill.disabled = false;
        btnAutofill.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>Autofill Form</span>
        `;

        if (chrome.runtime.lastError) {
          // Attempt injection fallback if content script wasn't active
          showStatus('Injecting autofill engine...', 'info');
          try {
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['content/content-script.js']
            });
            showStatus('Engine injected. Click Autofill again!', 'success');
          } catch (injectErr) {
            showStatus('Cannot run on this page (browser restricted)', 'error');
          }
          return;
        }

        if (response && response.success) {
          const filled = response.stats?.filledCount || 0;
          const skipped = response.stats?.skippedCount || 0;
          if (filled > 0 || skipped > 0) {
            showStatus(`✨ Filled ${filled} • 🟡 Skipped ${skipped}`, 'success');
            const drawerBtn = document.getElementById('btn-open-side-drawer');
            if (drawerBtn) {
              drawerBtn.style.display = 'flex';
            }
          } else {
            showStatus('ℹ️ No matching inputs found on this page.', 'info');
          }
        } else {
          showStatus('Could not complete autofill.', 'error');
        }
      });
    } catch (err) {
      btnAutofill.disabled = false;
      showStatus('Error executing autofill: ' + err.message, 'error');
    }
  });

  const btnOpenSideDrawer = document.getElementById('btn-open-side-drawer');
  if (btnOpenSideDrawer) {
    btnOpenSideDrawer.addEventListener('click', () => {
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'SHOW_AUTOFILL_RESULTS' });
        window.close();
      }
    });
  }

  // Track / Save Job button
  btnTrackToggle.addEventListener('click', () => {
    const isHidden = trackForm.style.display === 'none';
    trackForm.style.display = isHidden ? 'flex' : 'none';
  });

  btnCancelTrack.addEventListener('click', () => {
    trackForm.style.display = 'none';
  });

  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const company = document.getElementById('track-company').value;
    const role = document.getElementById('track-role').value;
    const status = document.getElementById('track-status').value;
    const dateApplied = document.getElementById('track-date').value;
    const notes = document.getElementById('track-notes').value;

    try {
      await storage.addApplication({
        company,
        role,
        status,
        dateApplied,
        notes,
        url: detectedJob.url || activeTab?.url || '',
        location: detectedJob.location || ''
      });

      trackForm.style.display = 'none';
      showStatus(`Saved application for ${company}!`, 'success');
      await refreshStats();
    } catch (err) {
      showStatus('Failed to save application: ' + err.message, 'error');
    }
  });

  function showStatus(text, type = 'info') {
    statusMsg.className = `status-msg ${type}`;
    statusMsg.innerText = text;
    statusMsg.style.display = 'block';

    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 4000);
  }

  // Open Dashboard
  const openDashboard = () => {
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    window.close();
  };

  const btnOpenSidePanel = document.getElementById('btn-open-sidepanel');
  if (btnOpenSidePanel) {
    btnOpenSidePanel.addEventListener('click', async () => {
      // Must call sidePanel.open() directly inside the click handler (user gesture context).
      // Routing through the background service worker loses the gesture and throws.
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tabs[0]?.id;
        if (tabId && chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ tabId });
        }
      } catch (err) {
        console.warn('[K-Apply] Could not open side panel:', err);
      }
      window.close();
    });
  }

  async function checkBackendHealth() {
    if (!backendBadge) return;
    try {
      const health = await api.checkHealth(1200);
      if (health.connected) {
        backendBadge.className = 'backend-badge connected';
        backendBadge.innerText = '● SaaS Live';
        backendBadge.title = `Connected to Next.js SaaS Command Center (${health.mode}). Click to open.`;
      } else {
        backendBadge.className = 'backend-badge offline';
        backendBadge.innerText = '● Local Store';
        backendBadge.title = 'Next.js server offline. Applications cached locally in extension storage.';
      }
    } catch (e) {
      backendBadge.className = 'backend-badge offline';
      backendBadge.innerText = '● Local Store';
      backendBadge.title = 'Next.js server offline. Applications cached locally.';
    }
  }

  if (backendBadge) {
    backendBadge.addEventListener('click', openDashboard);
  }

  btnOpenDashboard.addEventListener('click', openDashboard);
  btnGotoDashboard.addEventListener('click', openDashboard);

  refreshStats();
  checkBackendHealth();
});
