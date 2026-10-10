/**
 * K-Apply Dashboard Controller
 * Manages Applications Tracker, Q&A Knowledge Base, Candidate Profile, and Backup & Restore
 */

import { storage } from '../utils/storage.js';
import { DEFAULT_QA, DEFAULT_PROFILE, APPLICATION_STATUSES } from '../data/default-data.js';

// Application State
const state = {
  currentTab: 'applications',
  applications: [],
  qaList: [],
  profile: {},
  appSearchQuery: '',
  appStatusFilter: 'all',
  appViewMode: 'table', // 'table' | 'kanban'
  qaSearchQuery: '',
  qaCategoryFilter: 'all'
};

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initModals();
  initApplicationFilters();
  initQAFilters();
  initProfileForm();
  initBackupHandlers();

  // Load Initial Data
  await refreshAllData();
});

/**
 * Loads all data from storage and updates views
 */
async function refreshAllData() {
  try {
    state.applications = await storage.getApplications();
    state.qaList = await storage.getQAList();
    state.profile = await storage.getProfile();

    updateMetrics();
    renderApplications();
    renderQAList();
    populateProfileForm();
    updateSidebarUser();
  } catch (err) {
    console.error('[K-Apply] Failed to load data:', err);
    showToast('Failed to load storage data');
  }
}

// ==========================================
// NAVIGATION & HEADER ACTIONS
// ==========================================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageHeading = document.getElementById('page-heading');
  const pageSubheading = document.getElementById('page-subheading');
  const btnMainAction = document.getElementById('btn-main-action');
  const mainActionText = document.getElementById('main-action-text');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabKey = item.getAttribute('data-tab');
      state.currentTab = tabKey;

      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabKey}`);
      if (targetPane) targetPane.classList.add('active');

      // Update Header Text & Action Button
      switch (tabKey) {
        case 'applications':
          pageHeading.innerText = 'Job Applications Tracker';
          pageSubheading.innerText = 'Track your job search progress, interview stages, and offers';
          btnMainAction.style.display = 'inline-flex';
          mainActionText.innerText = 'Add Application';
          break;
        case 'qa-library':
          pageHeading.innerText = 'Q&A Knowledge Base';
          pageSubheading.innerText = 'Prompt answers and templates used to autofill job applications';
          btnMainAction.style.display = 'inline-flex';
          mainActionText.innerText = 'Add New Q&A';
          break;
        case 'profile':
          pageHeading.innerText = 'Candidate Profile';
          pageSubheading.innerText = 'Your master resume and contact info for automated application filling';
          btnMainAction.style.display = 'none';
          break;
        case 'backup':
          pageHeading.innerText = 'Data Management & Backup';
          pageSubheading.innerText = 'Export backups, import data, or restore defaults';
          btnMainAction.style.display = 'none';
          break;
      }
    });
  });

  // Topbar Main Action Click
  btnMainAction.addEventListener('click', () => {
    if (state.currentTab === 'applications') {
      openApplicationModal();
    } else if (state.currentTab === 'qa-library') {
      openQAModal();
    }
  });
}

function updateSidebarUser() {
  const name = state.profile.fullName || state.profile.firstName || 'Candidate';
  const role = state.profile.currentRole || 'Job Seeker';
  const avatar = (name[0] || 'A').toUpperCase();

  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (nameEl) nameEl.innerText = name;
  if (roleEl) roleEl.innerText = role;
  if (avatarEl) avatarEl.innerText = avatar;

  const appBadge = document.getElementById('nav-apps-badge');
  const qaBadge = document.getElementById('nav-qa-badge');
  if (appBadge) appBadge.innerText = state.applications.length;
  if (qaBadge) qaBadge.innerText = state.qaList.length;
}

// ==========================================
// TAB 1: APPLICATIONS TRACKER
// ==========================================
function updateMetrics() {
  const total = state.applications.length;
  const applied = state.applications.filter(a => a.status === 'applied').length;
  const interviewing = state.applications.filter(a => a.status === 'interviewing').length;
  const offer = state.applications.filter(a => a.status === 'offer').length;

  document.getElementById('metric-total').innerText = total;
  document.getElementById('metric-applied').innerText = applied;
  document.getElementById('metric-interviewing').innerText = interviewing;
  document.getElementById('metric-offer').innerText = offer;
}

function initApplicationFilters() {
  const searchInput = document.getElementById('app-search-input');
  const filterPills = document.querySelectorAll('#app-status-filters .pill');
  const viewTableBtn = document.getElementById('view-table-btn');
  const viewKanbanBtn = document.getElementById('view-kanban-btn');
  const appsTableView = document.getElementById('apps-table-view');
  const appsKanbanView = document.getElementById('apps-kanban-view');

  searchInput.addEventListener('input', (e) => {
    state.appSearchQuery = e.target.value.toLowerCase().trim();
    renderApplications();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.appStatusFilter = pill.getAttribute('data-filter');
      renderApplications();
    });
  });

  viewTableBtn.addEventListener('click', () => {
    state.appViewMode = 'table';
    viewTableBtn.classList.add('active');
    viewKanbanBtn.classList.remove('active');
    appsTableView.style.display = 'block';
    appsKanbanView.style.display = 'none';
  });

  viewKanbanBtn.addEventListener('click', () => {
    state.appViewMode = 'kanban';
    viewKanbanBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    appsTableView.style.display = 'none';
    appsKanbanView.style.display = 'grid';
    renderKanban();
  });
}

function getFilteredApplications() {
  return state.applications.filter(app => {
    // Status filter
    if (state.appStatusFilter !== 'all' && app.status !== state.appStatusFilter) {
      return false;
    }
    // Search query
    if (state.appSearchQuery) {
      const q = state.appSearchQuery;
      const match =
        (app.company && app.company.toLowerCase().includes(q)) ||
        (app.role && app.role.toLowerCase().includes(q)) ||
        (app.location && app.location.toLowerCase().includes(q)) ||
        (app.notes && app.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

function renderApplications() {
  if (state.appViewMode === 'table') {
    renderTable();
  } else {
    renderKanban();
  }
}

function renderTable() {
  const tbody = document.getElementById('apps-table-body');
  const emptyState = document.getElementById('apps-empty-state');
  const filtered = getFilteredApplications();

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="app-company-name">${escapeHTML(app.company)}</div>
        ${app.url ? `<a href="${escapeHTML(app.url)}" target="_blank" class="app-link" style="font-size:11px; color:#2563eb; text-decoration:none;">View Posting &nearr;</a>` : ''}
      </td>
      <td>
        <div class="app-role-title">${escapeHTML(app.role)}</div>
      </td>
      <td>
        <select class="status-badge ${app.status}" data-id="${app.id}" style="border:none; cursor:pointer; font-weight:600; font-family:inherit;">
          <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="wishlist" ${app.status === 'wishlist' ? 'selected' : ''}>Wishlist</option>
          <option value="interviewing" ${app.status === 'interviewing' ? 'selected' : ''}>Interviewing</option>
          <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
          <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>${escapeHTML(app.dateApplied || '-')}</td>
      <td>${escapeHTML(app.location || 'Remote')}</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(app.notes || '')}">
        ${escapeHTML(app.notes || '-')}
      </td>
      <td class="text-right">
        <button class="action-icon-btn btn-edit-app" data-id="${app.id}" title="Edit Application">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-icon-btn danger btn-delete-app" data-id="${app.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;

    // Inline status change
    const select = tr.querySelector('select');
    select.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      await storage.updateApplication(app.id, { status: newStatus });
      await refreshAllData();
      showToast(`Updated status to ${newStatus}`);
    });

    // Edit button
    tr.querySelector('.btn-edit-app').addEventListener('click', () => {
      openApplicationModal(app);
    });

    // Delete button
    tr.querySelector('.btn-delete-app').addEventListener('click', async () => {
      if (confirm(`Delete application for "${app.company}"?`)) {
        await storage.deleteApplication(app.id);
        await refreshAllData();
        showToast('Application deleted');
      }
    });

    tbody.appendChild(tr);
  });
}

function renderKanban() {
  const statuses = ['wishlist', 'applied', 'interviewing', 'offer', 'rejected'];
  const filtered = getFilteredApplications();

  statuses.forEach(status => {
    const colCards = document.getElementById(`kanban-${status}`);
    const countBadge = document.getElementById(`count-kanban-${status}`);
    if (!colCards) return;

    colCards.innerHTML = '';
    const appsInStatus = filtered.filter(a => a.status === status);
    if (countBadge) countBadge.innerText = appsInStatus.length;

    appsInStatus.forEach(app => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div class="kanban-card-title">${escapeHTML(app.role)}</div>
        <div class="kanban-card-company">${escapeHTML(app.company)}</div>
        <div class="kanban-card-meta">
          <span>${escapeHTML(app.dateApplied || '')}</span>
          <span>${escapeHTML(app.location || 'Remote')}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        openApplicationModal(app);
      });

      colCards.appendChild(card);
    });
  });
}

// ==========================================
// TAB 2: Q&A KNOWLEDGE BASE
// ==========================================
function initQAFilters() {
  const searchInput = document.getElementById('qa-search-input');
  const catPills = document.querySelectorAll('#qa-category-filters .pill');

  searchInput.addEventListener('input', (e) => {
    state.qaSearchQuery = e.target.value.toLowerCase().trim();
    renderQAList();
  });

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.qaCategoryFilter = pill.getAttribute('data-cat');
      renderQAList();
    });
  });
}

function renderQAList() {
  const grid = document.getElementById('qa-cards-grid');
  grid.innerHTML = '';

  const filtered = state.qaList.filter(item => {
    if (state.qaCategoryFilter !== 'all' && item.category !== state.qaCategoryFilter) {
      return false;
    }
    if (state.qaSearchQuery) {
      const q = state.qaSearchQuery;
      const match =
        item.title.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(q))) ||
        item.answer.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No Q&A Answers Found</h3>
        <p>Try adjusting your search or add a new answer using the button above.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'qa-card';

    const keywordsHtml = Array.isArray(item.keywords)
      ? item.keywords.slice(0, 4).map(k => `<span class="kw-tag">${escapeHTML(k)}</span>`).join('')
      : '';

    card.innerHTML = `
      <div class="qa-card-header">
        <h4 class="qa-card-title">${escapeHTML(item.title)}</h4>
        <span class="qa-card-badge">${escapeHTML(item.category || 'General')}</span>
      </div>

      <div class="qa-card-keywords">${keywordsHtml}</div>

      <div class="qa-card-answer">${escapeHTML(item.answer)}</div>

      <div class="qa-card-footer">
        <button class="btn btn-secondary btn-sm btn-copy-qa" data-id="${item.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
        <div style="display: flex; gap: 4px;">
          <button class="action-icon-btn btn-edit-qa" data-id="${item.id}" title="Edit Answer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-icon-btn danger btn-delete-qa" data-id="${item.id}" title="Delete Answer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Copy action
    card.querySelector('.btn-copy-qa').addEventListener('click', async (e) => {
      await navigator.clipboard.writeText(item.answer);
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      showToast(`Copied "${item.title}"`);
    });

    // Edit action
    card.querySelector('.btn-edit-qa').addEventListener('click', () => {
      openQAModal(item);
    });

    // Delete action
    card.querySelector('.btn-delete-qa').addEventListener('click', async () => {
      if (confirm(`Delete answer "${item.title}"?`)) {
        await storage.deleteQAItem(item.id);
        await refreshAllData();
        showToast('Q&A answer removed');
      }
    });

    grid.appendChild(card);
  });
}

// ==========================================
// TAB 3: CANDIDATE PROFILE
// ==========================================
function initProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const updatedProfile = { ...state.profile };

    formData.forEach((value, key) => {
      updatedProfile[key] = value.trim();
    });

    await storage.saveProfile(updatedProfile);
    state.profile = updatedProfile;
    updateSidebarUser();
    showToast('✅ Candidate Profile saved successfully!');
  });
}

function populateProfileForm() {
  const form = document.getElementById('profile-form');
  for (const [key, value] of Object.entries(state.profile)) {
    const input = form.elements[key];
    if (input) {
      input.value = value || '';
    }
  }
}

// ==========================================
// TAB 4: DATA & BACKUP
// ==========================================
function initBackupHandlers() {
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnTriggerImport = document.getElementById('btn-trigger-import');
  const importFileInput = document.getElementById('import-file-input');
  const btnResetQa = document.getElementById('btn-reset-qa');

  // Export JSON
  btnExportJson.addEventListener('click', async () => {
    const fullBackup = await storage.exportAllData();
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k-apply-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded');
  });

  // Export CSV
  btnExportCsv.addEventListener('click', () => {
    if (state.applications.length === 0) {
      showToast('No applications to export');
      return;
    }

    const headers = ['Company', 'Role', 'Status', 'Date Applied', 'Location', 'URL', 'Notes'];
    const rows = state.applications.map(a => [
      `"${(a.company || '').replace(/"/g, '""')}"`,
      `"${(a.role || '').replace(/"/g, '""')}"`,
      `"${a.status || ''}"`,
      `"${a.dateApplied || ''}"`,
      `"${(a.location || '').replace(/"/g, '""')}"`,
      `"${(a.url || '').replace(/"/g, '""')}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k-apply-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Applications CSV downloaded');
  });

  // Import JSON
  btnTriggerImport.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await storage.importAllData(json);
        await refreshAllData();
        showToast('Data restored successfully!');
      } catch (err) {
        alert('Invalid JSON file. Please ensure it is a valid K-Apply backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  });

  // Reset to Defaults
  btnResetQa.addEventListener('click', async () => {
    if (confirm('Reset your Q&A library to the default blank question templates? Custom questions will be replaced.')) {
      await storage.saveQAList(DEFAULT_QA);
      await refreshAllData();
      showToast('Q&A Library restored to defaults');
    }
  });
}

// ==========================================
// MODALS (ADD/EDIT APPLICATION & Q&A)
// ==========================================
function initModals() {
  // Application Modal
  const appModal = document.getElementById('app-modal');
  const appModalClose = document.getElementById('app-modal-close');
  const appModalCancel = document.getElementById('app-modal-cancel');
  const appModalForm = document.getElementById('app-modal-form');

  const closeAppModal = () => { appModal.style.display = 'none'; };
  appModalClose.addEventListener('click', closeAppModal);
  appModalCancel.addEventListener('click', closeAppModal);

  appModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('app-modal-id').value;
    const company = document.getElementById('app-modal-company').value.trim();
    const role = document.getElementById('app-modal-role').value.trim();
    const status = document.getElementById('app-modal-status').value;
    const dateApplied = document.getElementById('app-modal-date').value;
    const location = document.getElementById('app-modal-location').value.trim();
    const url = document.getElementById('app-modal-url').value.trim();
    const notes = document.getElementById('app-modal-notes').value.trim();

    if (id) {
      await storage.updateApplication(id, { company, role, status, dateApplied, location, url, notes });
      showToast('Application updated');
    } else {
      await storage.addApplication({ company, role, status, dateApplied, location, url, notes });
      showToast('Application added');
    }

    closeAppModal();
    await refreshAllData();
  });

  // Q&A Modal
  const qaModal = document.getElementById('qa-modal');
  const qaModalClose = document.getElementById('qa-modal-close');
  const qaModalCancel = document.getElementById('qa-modal-cancel');
  const qaModalForm = document.getElementById('qa-modal-form');

  const closeQAModal = () => { qaModal.style.display = 'none'; };
  qaModalClose.addEventListener('click', closeQAModal);
  qaModalCancel.addEventListener('click', closeQAModal);

  qaModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('qa-modal-id').value;
    const title = document.getElementById('qa-modal-title-input').value.trim();
    const category = document.getElementById('qa-modal-category').value.trim() || 'General';
    const rawKeywords = document.getElementById('qa-modal-keywords').value;
    const answer = document.getElementById('qa-modal-answer').value.trim();

    const keywords = rawKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    if (id) {
      await storage.updateQAItem(id, { title, category, keywords, answer });
      showToast('Q&A answer updated');
    } else {
      await storage.addQAItem({ title, category, keywords, answer });
      showToast('New Q&A answer added');
    }

    closeQAModal();
    await refreshAllData();
  });
}

function openApplicationModal(app = null) {
  const modal = document.getElementById('app-modal');
  const title = document.getElementById('app-modal-title');
  const form = document.getElementById('app-modal-form');

  form.reset();

  if (app) {
    title.innerText = 'Edit Job Application';
    document.getElementById('app-modal-id').value = app.id;
    document.getElementById('app-modal-company').value = app.company || '';
    document.getElementById('app-modal-role').value = app.role || '';
    document.getElementById('app-modal-status').value = app.status || 'applied';
    document.getElementById('app-modal-date').value = app.dateApplied || '';
    document.getElementById('app-modal-location').value = app.location || '';
    document.getElementById('app-modal-url').value = app.url || '';
    document.getElementById('app-modal-notes').value = app.notes || '';
  } else {
    title.innerText = 'Add Job Application';
    document.getElementById('app-modal-id').value = '';
    document.getElementById('app-modal-date').value = new Date().toISOString().split('T')[0];
  }

  modal.style.display = 'flex';
}

function openQAModal(item = null) {
  const modal = document.getElementById('qa-modal');
  const title = document.getElementById('qa-modal-title');
  const form = document.getElementById('qa-modal-form');

  form.reset();

  if (item) {
    title.innerText = 'Edit Q&A Answer';
    document.getElementById('qa-modal-id').value = item.id;
    document.getElementById('qa-modal-title-input').value = item.title || '';
    document.getElementById('qa-modal-category').value = item.category || '';
    document.getElementById('qa-modal-keywords').value = Array.isArray(item.keywords) ? item.keywords.join(', ') : '';
    document.getElementById('qa-modal-answer').value = item.answer || '';
  } else {
    title.innerText = 'Add New Q&A Answer';
    document.getElementById('qa-modal-id').value = '';
  }

  modal.style.display = 'flex';
}

// ==========================================
// TOAST NOTIFICATIONS & UTILITIES
// ==========================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
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
