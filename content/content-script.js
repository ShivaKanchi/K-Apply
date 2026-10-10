/**
 * Content Script Entry Point
 * Initializes on web pages, extracts job details, binds floating actions, and responds to messages
 */

(async () => {
  // Prevent double injection
  if (window.__K_APPLY_INJECTED__) return;
  window.__K_APPLY_INJECTED__ = true;

  try {
    // Dynamically import modules using Chrome extension runtime URLs
    const storageModule = await import(chrome.runtime.getURL('utils/storage.js'));
    const extractorModule = await import(chrome.runtime.getURL('utils/extractor.js'));
    const autofillModule = await import(chrome.runtime.getURL('content/autofill-engine.js'));
    const matcherModule = await import(chrome.runtime.getURL('content/matcher.js'));
    const eventsModule = await import(chrome.runtime.getURL('utils/events.js'));

    const { storage } = storageModule;
    const { extractJobDetails } = extractorModule;
    const { AutofillEngine } = autofillModule;
    const { interpolateVariables } = matcherModule;
    const { setNativeValue } = eventsModule;

    const engine = new AutofillEngine();
    let currentJobDetails = null;
    let lastAutofillResults = null;

    // Check settings if widget should be shown
    const settings = await storage.getSettings();

    // Cache job details for current page
    function getJobInfo() {
      if (!currentJobDetails) {
        currentJobDetails = extractJobDetails();
      }
      return currentJobDetails;
    }

    // --- Message Listener from Popup / Side Panel / Background ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'AUTOFILL_FORM') {
        handleAutofill().then(stats => sendResponse({ success: true, stats }));
        return true; // Keep message channel open for async response
      }

      if (request.action === 'SHOW_AUTOFILL_RESULTS') {
        if (lastAutofillResults) {
          openSideDrawer('results');
        } else {
          handleAutofill();
        }
        sendResponse({ success: true });
        return false;
      }

      if (request.action === 'GET_AUTOFILL_RESULTS') {
        sendResponse({ success: true, stats: lastAutofillResults, jobDetails: getJobInfo() });
        return false;
      }

      if (request.action === 'OPEN_SIDE_DRAWER') {
        openSideDrawer(request.tab || 'results');
        sendResponse({ success: true });
        return false;
      }

      if (request.action === 'FOCUS_FIELD') {
        const item = (lastAutofillResults?.filled || []).concat(lastAutofillResults?.skipped || []).find(f => f.fieldId === request.fieldId);
        if (item) {
          focusField(item);
          sendResponse({ success: true });
        } else {
          const el = document.querySelector(`[data-kapply-field-id="${request.fieldId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('autoapply-focused-pulse');
            try { el.focus(); } catch (e) {}
            setTimeout(() => el.classList.remove('autoapply-focused-pulse'), 2300);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Field not found' });
          }
        }
        return false;
      }

      if (request.action === 'QUICK_FILL_FIELD') {
        const item = (lastAutofillResults?.skipped || []).find(f => f.fieldId === request.fieldId);
        if (item && request.value) {
          quickFillField(item, request.value);
          sendResponse({ success: true });
        } else {
          const el = document.querySelector(`[data-kapply-field-id="${request.fieldId}"]`);
          if (el && request.value) {
            setNativeValue(el, request.value);
            engine.applyHighlight(el, 'Side Panel Quick Fill');
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false });
          }
        }
        return false;
      }

      if (request.action === 'GET_JOB_DETAILS') {
        sendResponse({ success: true, jobDetails: getJobInfo() });
        return false;
      }

      if (request.action === 'TOGGLE_WIDGET') {
        toggleFloatingWidget(request.visible);
        sendResponse({ success: true });
        return false;
      }
    });

    // Run Autofill logic
    async function handleAutofill() {
      try {
        const profile = await storage.getProfile();
        const qaList = await storage.getQAList();
        const job = getJobInfo();

        const stats = await engine.autofill(profile, qaList, job);
        lastAutofillResults = stats;

        if (stats.filledCount > 0) {
          showToast(`⚡ K-Apply: Filled ${stats.filledCount} field${stats.filledCount > 1 ? 's' : ''}, ${stats.skippedCount} skipped.`);
        } else {
          showToast(`ℹ️ Form scanned: 0 filled, ${stats.skippedCount} skipped.`);
        }

        // Automatically open the side drawer showing filled and skipped fields!
        await openSideDrawer('results');

        return stats;
      } catch (err) {
        console.error('[K-Apply] Autofill failed:', err);
        showToast('⚠️ Autofill encountered an issue.');
        return { filledCount: 0, skippedCount: 0, error: err.message };
      }
    }

    // Save/Track current job to applications
    async function handleSaveJob() {
      try {
        const job = getJobInfo();
        const app = await storage.addApplication({
          company: job.company || 'Unknown Company',
          role: job.role || 'Software Engineer',
          location: job.location || 'Remote',
          url: window.location.href,
          status: 'applied',
          dateApplied: new Date().toISOString().split('T')[0]
        });

        showToast(`✅ Saved application for ${app.company}!`);
        return app;
      } catch (err) {
        console.error('[K-Apply] Failed to save job:', err);
        showToast('⚠️ Failed to save application.');
      }
    }

    // --- In-Page Floating UI Components ---
    function renderFloatingUI() {
      if (document.getElementById('autoapply-root')) return;

      const root = document.createElement('div');
      root.id = 'autoapply-root';

      // Launcher Button
      const launcher = document.createElement('div');
      launcher.className = 'autoapply-launcher';
      launcher.innerHTML = `
        <svg class="autoapply-launcher-icon" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span class="autoapply-launcher-text">K-Apply</span>
      `;

      // Popover Menu
      const menu = document.createElement('div');
      menu.className = 'autoapply-menu';
      menu.style.display = 'none';

      const job = getJobInfo();
      const jobDisplay = [job.role, job.company].filter(Boolean).join(' • ') || 'Application Form';

      menu.innerHTML = `
        <div class="autoapply-menu-header">
          <div class="autoapply-menu-title">
            <span>⚡ K-Apply Copilot</span>
          </div>
          <button class="autoapply-menu-close" id="autoapply-menu-close-btn">&times;</button>
        </div>
        <div class="autoapply-menu-detected" title="${jobDisplay}">${jobDisplay}</div>
        
        <button class="autoapply-btn autoapply-btn-primary" id="autoapply-btn-fill">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Autofill Application
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-audit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          📋 Review Form Fields
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-ai-cover" style="color: #7c3aed; font-weight: 700;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83l-2.83 2.83m-8 8l-2.83 2.83"/>
          </svg>
          ✨ AI Cover Letter (Ollama)
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-picker">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          Browse Q&A Answers
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-track">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7"/>
          </svg>
          Save to Job Tracker
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-sidepanel" style="color: #2563eb; font-weight: 600;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
          Dock in Side Panel
        </button>

        <button class="autoapply-btn autoapply-btn-secondary" id="autoapply-btn-dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          Open Dashboard
        </button>
      `;

      root.appendChild(launcher);
      root.appendChild(menu);
      document.body.appendChild(root);

      // --- Draggable Floating Launcher Implementation ---
      const DRAG_STORAGE_KEY = '__autoapply_launcher_pos__';
      let isDragging = false;
      let hasDragged = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      // Restore saved position if available
      try {
        const savedPos = JSON.parse(localStorage.getItem(DRAG_STORAGE_KEY));
        if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
          const pad = 12;
          const clampedX = Math.max(pad, Math.min(savedPos.x, window.innerWidth - 130));
          const clampedY = Math.max(pad, Math.min(savedPos.y, window.innerHeight - 50));
          launcher.style.left = `${clampedX}px`;
          launcher.style.top = `${clampedY}px`;
          launcher.style.right = 'auto';
          launcher.style.bottom = 'auto';
        }
      } catch (e) {}

      // Calculate and update menu popover position relative to launcher
      function updateMenuPosition() {
        if (menu.style.display === 'none') return;
        const rect = launcher.getBoundingClientRect();
        const menuWidth = 280;
        const menuHeight = menu.offsetHeight || 300;
        const pad = 12;

        // Vertical position: Above if enough space, else below
        let top;
        if (rect.top > menuHeight + 20) {
          top = rect.top - menuHeight - 10;
        } else {
          top = rect.bottom + 10;
        }
        top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));

        // Horizontal position: align with launcher right or left edge
        let left;
        if (rect.left + launcher.offsetWidth > window.innerWidth / 2) {
          left = rect.right - menuWidth;
        } else {
          left = rect.left;
        }
        left = Math.max(pad, Math.min(left, window.innerWidth - menuWidth - pad));

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
      }

      // Drag event handlers (Supports Mouse & Touch)
      function onPointerStart(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        isDragging = true;
        hasDragged = false;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;

        const rect = launcher.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        launcher.classList.add('is-dragging');
        launcher.style.transition = 'none';

        if (e.touches) {
          window.addEventListener('touchmove', onPointerMove, { passive: false });
          window.addEventListener('touchend', onPointerEnd);
          window.addEventListener('touchcancel', onPointerEnd);
        } else {
          window.addEventListener('mousemove', onPointerMove);
          window.addEventListener('mouseup', onPointerEnd);
        }
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        if (!hasDragged && Math.hypot(dx, dy) > 5) {
          hasDragged = true;
        }

        if (hasDragged) {
          if (e.cancelable) e.preventDefault();
          const pad = 8;
          const maxX = window.innerWidth - launcher.offsetWidth - pad;
          const maxY = window.innerHeight - launcher.offsetHeight - pad;

          const newX = Math.max(pad, Math.min(initialLeft + dx, maxX));
          const newY = Math.max(pad, Math.min(initialTop + dy, maxY));

          launcher.style.left = `${newX}px`;
          launcher.style.top = `${newY}px`;
          launcher.style.right = 'auto';
          launcher.style.bottom = 'auto';

          updateMenuPosition();
        }
      }

      function onPointerEnd() {
        if (!isDragging) return;
        isDragging = false;
        launcher.classList.remove('is-dragging');
        launcher.style.transition = '';

        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerEnd);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerEnd);
        window.removeEventListener('touchcancel', onPointerEnd);

        if (hasDragged) {
          const rect = launcher.getBoundingClientRect();
          try {
            localStorage.setItem(DRAG_STORAGE_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
          } catch (err) {}
        }
      }

      launcher.addEventListener('mousedown', onPointerStart);
      launcher.addEventListener('touchstart', onPointerStart, { passive: true });

      // Click toggles menu (suppressed when dragging)
      launcher.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          hasDragged = false;
          return;
        }
        const willOpen = menu.style.display === 'none';
        menu.style.display = willOpen ? 'flex' : 'none';
        if (willOpen) {
          updateMenuPosition();
        }
      });

      menu.querySelector('#autoapply-menu-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = 'none';
      });

      menu.querySelector('#autoapply-btn-fill').addEventListener('click', () => {
        menu.style.display = 'none';
        handleAutofill();
      });

      menu.querySelector('#autoapply-btn-ai-cover').addEventListener('click', async () => {
        menu.style.display = 'none';
        showToast('✨ Generating AI Cover Letter with Ollama...');
        const job = getJobInfo();
        try {
          const res = await fetch('http://localhost:3000/api/ai/cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company: job.company || 'the company', role: job.role || 'Full Stack Developer' })
          });
          const data = await res.json();
          if (data.success && data.coverLetter) {
            await navigator.clipboard.writeText(data.coverLetter);
            const coverInput = document.querySelector('textarea[name*="cover" i], textarea[id*="cover" i], textarea[placeholder*="cover" i]');
            if (coverInput) {
              setNativeValue(coverInput, data.coverLetter);
              engine.applyHighlight(coverInput, 'AI Cover Letter (Ollama)');
              showToast(`✨ Ollama Cover Letter generated and filled for ${job.company || 'job'}!`);
            } else {
              showToast(`✨ AI Cover Letter copied to clipboard! Paste it into the form.`);
            }
          } else {
            showToast('⚠️ Could not generate cover letter. Try using Q&A answers.');
          }
        } catch (e) {
          showToast('ℹ️ Next.js Ollama server offline. Using JobUtils template.');
        }
      });

      menu.querySelector('#autoapply-btn-audit').addEventListener('click', () => {
        menu.style.display = 'none';
        if (lastAutofillResults) {
          openSideDrawer('results');
        } else {
          handleAutofill();
        }
      });

      menu.querySelector('#autoapply-btn-picker').addEventListener('click', () => {
        menu.style.display = 'none';
        openSideDrawer('qa');
      });

      menu.querySelector('#autoapply-btn-track').addEventListener('click', () => {
        menu.style.display = 'none';
        handleSaveJob();
      });

      menu.querySelector('#autoapply-btn-sidepanel').addEventListener('click', () => {
        menu.style.display = 'none';
        chrome.runtime.sendMessage({ action: 'OPEN_SIDEPANEL' });
      });

      menu.querySelector('#autoapply-btn-dashboard').addEventListener('click', () => {
        menu.style.display = 'none';
        chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
      });
    }

    // --- Unified Side Drawer for Form Audit (Filled & Skipped) and Q&A Knowledge Vault ---
    async function openSideDrawer(initialTab = 'results') {
      const existingDrawer = document.getElementById('autoapply-drawer-root');
      if (existingDrawer) existingDrawer.remove();

      const profile = await storage.getProfile();
      const qaList = await storage.getQAList();
      const job = getJobInfo();
      let activeTab = initialTab;
      let activeFilter = 'all'; // 'all' | 'filled' | 'skipped'

      const drawerHost = document.createElement('div');
      drawerHost.id = 'autoapply-drawer-root';
      drawerHost.style.position = 'fixed';
      drawerHost.style.top = '0';
      drawerHost.style.right = '0';
      drawerHost.style.width = '0';
      drawerHost.style.height = '100vh';
      drawerHost.style.zIndex = '2147483647';
      drawerHost.style.pointerEvents = 'none';

      // 100% Shadow DOM style isolation from host website (Supabase, Tailwind, etc.)
      const shadowRoot = drawerHost.attachShadow({ mode: 'open' });

      // Link stylesheet into Shadow DOM
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = chrome.runtime.getURL('content/floating-widget.css');
      shadowRoot.appendChild(cssLink);

      const drawerContainer = document.createElement('div');
      drawerContainer.className = 'autoapply-drawer';
      drawerContainer.innerHTML = `
        <div class="autoapply-drawer-header">
          <div class="autoapply-drawer-title">
            <svg viewBox="0 0 24 24" fill="#2563eb" width="18" height="18" style="display:inline-block; vertical-align:middle;">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>K-Apply Copilot & Audit</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="autoapply-sidepanel-pop-btn" id="autoapply-btn-open-sidepanel" title="Dock inside Chrome Side Panel">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle;">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              <span>Side Panel</span>
            </button>
            <button class="autoapply-menu-close" id="autoapply-drawer-close" title="Close Drawer">&times;</button>
          </div>
        </div>

        <div class="autoapply-drawer-tabs">
          <button class="autoapply-drawer-tab ${activeTab === 'results' ? 'active' : ''}" id="tab-btn-results">
            <span>⚡ Form Audit</span>
            <span class="autoapply-tab-badge autoapply-tab-badge-results" id="tab-badge-results">${getFilledCount()} filled • ${getSkippedCount()} skipped</span>
          </button>
          <button class="autoapply-drawer-tab ${activeTab === 'qa' ? 'active' : ''}" id="tab-btn-qa">
            <span>📚 Q&A Vault</span>
          </button>
        </div>

        <!-- Tab View 1: Form Audit Results (Filled & Skipped) -->
        <div id="drawer-view-results" style="display: ${activeTab === 'results' ? 'flex' : 'none'}; flex-direction: column; flex: 1; overflow: hidden;">
          <div class="autoapply-filter-bar">
            <button class="autoapply-filter-pill ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              All <span class="pill-count" id="pill-count-all">${getTotalCount()}</span>
            </button>
            <button class="autoapply-filter-pill ${activeFilter === 'filled' ? 'active' : ''}" data-filter="filled">
              🟢 Filled <span class="pill-count" id="pill-count-filled">${getFilledCount()}</span>
            </button>
            <button class="autoapply-filter-pill ${activeFilter === 'skipped' ? 'active' : ''}" data-filter="skipped">
              🟡 Skipped <span class="pill-count" id="pill-count-skipped">${getSkippedCount()}</span>
            </button>
          </div>
          <div class="autoapply-drawer-search">
            <input type="text" id="autoapply-audit-search" placeholder="Filter fields by name, reason, or value..." />
          </div>
          <div class="autoapply-drawer-content" id="autoapply-audit-list"></div>
        </div>

        <!-- Tab View 2: Searchable Q&A Knowledge Vault -->
        <div id="drawer-view-qa" style="display: ${activeTab === 'qa' ? 'flex' : 'none'}; flex-direction: column; flex: 1; overflow: hidden;">
          <div class="autoapply-drawer-search">
            <input type="text" id="autoapply-qa-search" placeholder="Search questions, keywords (e.g. cover letter, proud, notice)..." />
          </div>
          <div class="autoapply-drawer-content" id="autoapply-qa-list"></div>
        </div>
      `;

      shadowRoot.appendChild(drawerContainer);
      document.body.appendChild(drawerHost);

      const tabBtnResults = shadowRoot.querySelector('#tab-btn-results');
      const tabBtnQa = shadowRoot.querySelector('#tab-btn-qa');
      const viewResults = shadowRoot.querySelector('#drawer-view-results');
      const viewQa = shadowRoot.querySelector('#drawer-view-qa');
      const auditListEl = shadowRoot.querySelector('#autoapply-audit-list');
      const qaListEl = shadowRoot.querySelector('#autoapply-qa-list');
      const auditSearchInput = shadowRoot.querySelector('#autoapply-audit-search');
      const qaSearchInput = shadowRoot.querySelector('#autoapply-qa-search');

      function switchTab(tab) {
        activeTab = tab;
        if (tab === 'results') {
          tabBtnResults.classList.add('active');
          tabBtnQa.classList.remove('active');
          viewResults.style.display = 'flex';
          viewQa.style.display = 'none';
          renderAuditItems(auditSearchInput.value);
        } else {
          tabBtnResults.classList.remove('active');
          tabBtnQa.classList.add('active');
          viewResults.style.display = 'none';
          viewQa.style.display = 'flex';
          renderQaItems(qaSearchInput.value);
        }
      }

      tabBtnResults.addEventListener('click', () => switchTab('results'));
      tabBtnQa.addEventListener('click', () => switchTab('qa'));

      function updateCounts() {
        const f = getFilledCount();
        const s = getSkippedCount();
        const tot = f + s;
        const badge = shadowRoot.querySelector('#tab-badge-results');
        if (badge) badge.innerText = `${f} filled • ${s} skipped`;
        const pillAll = shadowRoot.querySelector('#pill-count-all');
        if (pillAll) pillAll.innerText = tot;
        const pillF = shadowRoot.querySelector('#pill-count-filled');
        if (pillF) pillF.innerText = f;
        const pillS = shadowRoot.querySelector('#pill-count-skipped');
        if (pillS) pillS.innerText = s;
      }

      // Filter pills listeners
      shadowRoot.querySelectorAll('.autoapply-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          shadowRoot.querySelectorAll('.autoapply-filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          activeFilter = pill.getAttribute('data-filter');
          renderAuditItems(auditSearchInput.value);
        });
      });

      // Focus on a field in page DOM
      function focusField(item) {
        let el = item.element;
        if (!el || !document.contains(el)) {
          el = document.querySelector(`[data-kapply-field-id="${item.fieldId}"]`);
        }
        if (!el) {
          showToast('⚠️ Field element not currently visible on page.');
          return;
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('autoapply-focused-pulse');
        try {
          el.focus();
        } catch (e) {}
        setTimeout(() => {
          el.classList.remove('autoapply-focused-pulse');
        }, 2300);
      }

      // Quick fill a skipped field
      function quickFillField(item, val) {
        if (!val || !val.trim()) return;
        let el = item.element;
        if (!el || !document.contains(el)) {
          el = document.querySelector(`[data-kapply-field-id="${item.fieldId}"]`);
        }
        if (!el) {
          showToast('⚠️ Field element not found.');
          return;
        }

        const success = setNativeValue(el, val.trim());
        if (success) {
          engine.applyHighlight(el, 'Quick Fill');
          if (lastAutofillResults) {
            const sIdx = (lastAutofillResults.skipped || []).findIndex(s => s.fieldId === item.fieldId);
            if (sIdx !== -1) {
              lastAutofillResults.skipped.splice(sIdx, 1);
              lastAutofillResults.skippedCount = lastAutofillResults.skipped.length;
            }
            if (!lastAutofillResults.filled) lastAutofillResults.filled = [];
            lastAutofillResults.filled.push({
              fieldId: item.fieldId,
              title: item.title,
              label: item.label,
              type: item.type,
              value: val.trim(),
              preview: val.trim().slice(0, 45) + (val.trim().length > 45 ? '...' : ''),
              source: 'Quick Fill (Manual)',
              element: el
            });
            lastAutofillResults.filledCount = lastAutofillResults.filled.length;
          }
          showToast(`✓ Filled "${item.title}"`);
          updateCounts();
          renderAuditItems(auditSearchInput.value);
        } else {
          showToast('⚠️ Could not set field value directly.');
        }
      }

      // Render Audit Tab Cards
      function renderAuditItems(filterText = '') {
        auditListEl.innerHTML = '';
        const query = filterText.toLowerCase().trim();

        if (!lastAutofillResults || (getFilledCount() === 0 && getSkippedCount() === 0)) {
          auditListEl.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #64748b;">
              <div style="font-size: 28px; margin-bottom: 8px;">📋</div>
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">No Autofill Data Yet</div>
              <div style="font-size: 12px; margin-bottom: 16px;">Click below to scan and autofill this page's form fields.</div>
              <button class="autoapply-action-btn autoapply-action-btn-primary" id="btn-run-autofill-now">⚡ Autofill Now</button>
            </div>
          `;
          const runBtn = auditListEl.querySelector('#btn-run-autofill-now');
          if (runBtn) {
            runBtn.addEventListener('click', async () => {
              drawerRoot.remove();
              await handleAutofill();
            });
          }
          return;
        }

        const filledList = (lastAutofillResults.filled || []).map(f => ({ ...f, isFilled: true }));
        const skippedList = (lastAutofillResults.skipped || []).map(s => ({ ...s, isFilled: false }));

        let combined = [];
        if (activeFilter === 'all') {
          combined = [...filledList, ...skippedList];
        } else if (activeFilter === 'filled') {
          combined = filledList;
        } else if (activeFilter === 'skipped') {
          combined = skippedList;
        }

        const filtered = combined.filter(item => {
          if (!query) return true;
          const t = (item.title || '').toLowerCase();
          const l = (item.label || '').toLowerCase();
          const p = (item.preview || '').toLowerCase();
          const r = (item.reasonText || '').toLowerCase();
          return t.includes(query) || l.includes(query) || p.includes(query) || r.includes(query);
        });

        if (filtered.length === 0) {
          auditListEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #64748b; font-size: 13px;">No form fields match your filter.</div>`;
          return;
        }

        filtered.forEach(item => {
          const card = document.createElement('div');
          card.className = `autoapply-audit-card ${item.isFilled ? 'autoapply-card-filled' : 'autoapply-card-skipped'}`;

          if (item.isFilled) {
            card.innerHTML = `
              <div class="autoapply-card-header">
                <div class="autoapply-card-title-group">
                  <span class="autoapply-card-title">${escapeHTML(item.title || item.label)}</span>
                  <span class="autoapply-card-type">${escapeHTML(item.type || 'text')}</span>
                </div>
                <span class="autoapply-badge-filled">✓ Filled</span>
              </div>
              <div class="autoapply-card-preview">${escapeHTML(item.preview || String(item.value || ''))}</div>
              <div class="autoapply-card-preview-source">${escapeHTML(item.source || 'Autofill Match')}</div>
              <div class="autoapply-card-actions">
                <button class="autoapply-action-btn autoapply-btn-focus" data-id="${item.fieldId}">🎯 Focus Field</button>
              </div>
            `;
          } else {
            card.innerHTML = `
              <div class="autoapply-card-header">
                <div class="autoapply-card-title-group">
                  <span class="autoapply-card-title">${escapeHTML(item.title || item.label)}</span>
                  <span class="autoapply-card-type">${escapeHTML(item.type || 'text')}</span>
                </div>
                <span class="autoapply-badge-skipped">⚠️ Skipped</span>
              </div>
              <div class="autoapply-card-reason">
                <span>ℹ️</span>
                <span>${escapeHTML(item.reasonText || 'No matching information found')}</span>
              </div>
              <div class="autoapply-card-actions">
                <button class="autoapply-action-btn autoapply-btn-focus" data-id="${item.fieldId}">🎯 Focus Field</button>
                <button class="autoapply-action-btn autoapply-btn-toggle-quickfill" data-id="${item.fieldId}">⚡ Quick Fill</button>
              </div>
              <div class="autoapply-quickfill-box" style="display: none;" id="quickfill-box-${item.fieldId}">
                <select class="autoapply-quickfill-select" id="quickfill-select-${item.fieldId}">
                  <option value="">-- Choose Profile or Q&A Value --</option>
                  <optgroup label="Candidate Profile">
                    ${profile.fullName ? `<option value="${escapeHTML(profile.fullName)}">Full Name: ${escapeHTML(profile.fullName)}</option>` : ''}
                    ${profile.email ? `<option value="${escapeHTML(profile.email)}">Email: ${escapeHTML(profile.email)}</option>` : ''}
                    ${profile.phone ? `<option value="${escapeHTML(profile.phone)}">Phone: ${escapeHTML(profile.phone)}</option>` : ''}
                    ${profile.portfolio ? `<option value="${escapeHTML(profile.portfolio)}">Portfolio: ${escapeHTML(profile.portfolio)}</option>` : ''}
                    ${profile.linkedin ? `<option value="${escapeHTML(profile.linkedin)}">LinkedIn: ${escapeHTML(profile.linkedin)}</option>` : ''}
                    ${profile.github ? `<option value="${escapeHTML(profile.github)}">GitHub: ${escapeHTML(profile.github)}</option>` : ''}
                    ${profile.currentRole ? `<option value="${escapeHTML(profile.currentRole)}">Current Role: ${escapeHTML(profile.currentRole)}</option>` : ''}
                    ${profile.currentCompany ? `<option value="${escapeHTML(profile.currentCompany)}">Current Employer: ${escapeHTML(profile.currentCompany)}</option>` : ''}
                    ${profile.yearsOfExperience ? `<option value="${escapeHTML(profile.yearsOfExperience)}">Years of Experience: ${escapeHTML(profile.yearsOfExperience)}</option>` : ''}
                    ${profile.noticePeriod ? `<option value="${escapeHTML(profile.noticePeriod)}">Notice Period: ${escapeHTML(profile.noticePeriod)}</option>` : ''}
                  </optgroup>
                  <optgroup label="Q&A Vault Answers">
                    ${qaList.map(q => `<option value="${escapeHTML(interpolateVariables(q.answer, profile, job))}">${escapeHTML(q.title)}</option>`).join('')}
                  </optgroup>
                </select>
                <div class="autoapply-quickfill-row">
                  <input type="text" class="autoapply-quickfill-input" id="quickfill-input-${item.fieldId}" placeholder="Or type custom answer..." />
                  <button class="autoapply-action-btn autoapply-action-btn-primary" id="quickfill-apply-${item.fieldId}">Apply</button>
                </div>
              </div>
            `;

            const toggleBtn = card.querySelector('.autoapply-btn-toggle-quickfill');
            const qBox = card.querySelector(`#quickfill-box-${item.fieldId}`);
            const qSelect = card.querySelector(`#quickfill-select-${item.fieldId}`);
            const qInput = card.querySelector(`#quickfill-input-${item.fieldId}`);
            const qApply = card.querySelector(`#quickfill-apply-${item.fieldId}`);

            if (toggleBtn && qBox) {
              toggleBtn.addEventListener('click', () => {
                const isHidden = qBox.style.display === 'none';
                qBox.style.display = isHidden ? 'flex' : 'none';
                toggleBtn.innerText = isHidden ? '✕ Close Fill' : '⚡ Quick Fill';
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
                quickFillField(item, val);
              });
            }
          }

          const focusBtn = card.querySelector('.autoapply-btn-focus');
          if (focusBtn) {
            focusBtn.addEventListener('click', () => focusField(item));
          }

          auditListEl.appendChild(card);
        });
      }

      // Render Q&A Tab Cards
      function renderQaItems(filterText = '') {
        qaListEl.innerHTML = '';
        const searchLower = filterText.toLowerCase().trim();

        const filtered = qaList.filter(item => {
          if (!searchLower) return true;
          return (
            item.title.toLowerCase().includes(searchLower) ||
            (item.category && item.category.toLowerCase().includes(searchLower)) ||
            (Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(searchLower))) ||
            (item.answer && item.answer.toLowerCase().includes(searchLower))
          );
        });

        if (filtered.length === 0) {
          qaListEl.innerHTML = `<div style="text-align:center; padding: 30px; color: #6b7280; font-size: 13px;">No matching answers found in Q&A vault.</div>`;
          return;
        }

        filtered.forEach(item => {
          const processedAnswer = interpolateVariables(item.answer, profile, job);
          const card = document.createElement('div');
          card.className = 'autoapply-qa-card';
          card.innerHTML = `
            <div class="autoapply-qa-header">
              <span class="autoapply-qa-title">${escapeHTML(item.title)}</span>
              <span class="autoapply-qa-category">${escapeHTML(item.category || 'General')}</span>
            </div>
            <div class="autoapply-qa-body">${escapeHTML(processedAnswer)}</div>
            <div class="autoapply-qa-actions">
              <button class="autoapply-copy-btn" data-id="${item.id}">📋 Copy Answer</button>
            </div>
          `;

          card.querySelector('.autoapply-copy-btn').addEventListener('click', async (e) => {
            await navigator.clipboard.writeText(processedAnswer);
            e.target.innerText = '✓ Copied!';
            setTimeout(() => { e.target.innerText = '📋 Copy Answer'; }, 2000);
            showToast(`Copied "${item.title}" to clipboard!`);
          });

          qaListEl.appendChild(card);
        });
      }

      auditSearchInput.addEventListener('input', (e) => {
        renderAuditItems(e.target.value);
      });

      qaSearchInput.addEventListener('input', (e) => {
        renderQaItems(e.target.value);
      });

      shadowRoot.querySelector('#autoapply-drawer-close').addEventListener('click', () => drawerHost.remove());

      const sidepanelPopBtn = shadowRoot.querySelector('#autoapply-btn-open-sidepanel');
      if (sidepanelPopBtn) {
        sidepanelPopBtn.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'OPEN_SIDEPANEL' });
          drawerHost.remove();
        });
      }

      // Initial render
      if (activeTab === 'results') {
        renderAuditItems();
      } else {
        renderQaItems();
      }
    }

    // --- Toast Notification ---
    function showToast(message) {
      const existingToast = document.querySelector('.autoapply-toast');
      if (existingToast) existingToast.remove();

      const toast = document.createElement('div');
      toast.className = 'autoapply-toast';
      toast.innerText = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function toggleFloatingWidget(visible) {
      const root = document.getElementById('autoapply-root');
      if (root) {
        root.style.display = visible ? 'block' : 'none';
      }
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

    // Render widget if enabled
    if (settings.enableFloatingButton !== false) {
      // Delay slightly for DOM to settle
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFloatingUI);
      } else {
        renderFloatingUI();
      }
    }

  } catch (err) {
    console.error('[K-Apply] Content script init failed:', err);
  }
})();
