/**
 * Storage Utility with Error Handling and Fallbacks
 * Supports Chrome Storage API (chrome.storage.local) and falls back to window.localStorage
 */

import { DEFAULT_PROFILE, DEFAULT_QA } from '../data/default-data.js';
import { api } from './api.js';

const STORAGE_KEYS = {
  PROFILE: 'kapply_profile',
  QA_LIST: 'kapply_qa_list',
  APPLICATIONS: 'kapply_applications',
  SETTINGS: 'kapply_settings'
};

// Legacy key map for one-time migration from pre-1.0 "AutoApply" builds.
const LEGACY_STORAGE_KEYS = {
  kapply_profile: 'autoapply_profile',
  kapply_qa_list: 'autoapply_qa_list',
  kapply_applications: 'autoapply_applications',
  kapply_settings: 'autoapply_settings'
};

const DEFAULT_SETTINGS = {
  enableFloatingButton: false,
  autoHighlightFields: true,
  autoDetectJobInfo: true,
  theme: 'system', // 'system' | 'light' | 'dark'
  dashboardUrl: 'http://localhost:3000/dashboard',
  apiUrl: 'http://localhost:3000'
};

class StorageManager {
  constructor() {
    this.isChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    this.memoryStore = new Map();
  }

  /**
   * Generic get method with fallback
   */
  async get(key, defaultValue = null) {
    try {
      if (this.isChromeStorage) {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
              console.warn(`[K-Apply] Chrome storage error:`, chrome.runtime.lastError);
              resolve(this._getFromLocalStorage(key, defaultValue));
              return;
            }
            if (result[key] !== undefined) {
              resolve(result[key]);
              return;
            }
            // One-time migration from legacy "AutoApply" storage keys
            const legacyKey = LEGACY_STORAGE_KEYS[key];
            if (legacyKey) {
              chrome.storage.local.get([legacyKey], (legacy) => {
                if (!chrome.runtime.lastError && legacy[legacyKey] !== undefined) {
                  chrome.storage.local.set({ [key]: legacy[legacyKey] }, () => resolve(legacy[legacyKey]));
                } else {
                  resolve(defaultValue);
                }
              });
              return;
            }
            resolve(defaultValue);
          });
        });
      } else {
        const localValue = this._getFromLocalStorage(key, undefined);
        if (localValue !== undefined) return localValue;
        const legacyKey = LEGACY_STORAGE_KEYS[key];
        const legacyValue = legacyKey ? this._getFromLocalStorage(legacyKey, undefined) : undefined;
        if (legacyValue !== undefined) {
          this._setToLocalStorage(key, legacyValue);
          return legacyValue;
        }
        return defaultValue;
      }
    } catch (err) {
      console.error(`[K-Apply] Error getting key "${key}":`, err);
      return defaultValue;
    }
  }

  /**
   * Generic set method with fallback
   */
  async set(key, value) {
    try {
      if (this.isChromeStorage) {
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
              console.warn(`[K-Apply] Chrome storage set error:`, chrome.runtime.lastError);
              this._setToLocalStorage(key, value);
            }
            resolve(true);
          });
        });
      } else {
        this._setToLocalStorage(key, value);
        return true;
      }
    } catch (err) {
      console.error(`[K-Apply] Error setting key "${key}":`, err);
      return false;
    }
  }

  _getFromLocalStorage(key, defaultValue) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (e) {
      console.warn(`[K-Apply] LocalStorage read failed:`, e);
    }
    return this.memoryStore.has(key) ? this.memoryStore.get(key) : defaultValue;
  }

  _setToLocalStorage(key, value) {
    this.memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`[K-Apply] LocalStorage write failed:`, e);
    }
  }

  // --- Specialized Profile API ---
  async getProfile() {
    try {
      const apiRes = await api.getProfile();
      if (apiRes && apiRes.success && apiRes.profile) {
        const merged = { ...DEFAULT_PROFILE, ...apiRes.profile };
        await this.set(STORAGE_KEYS.PROFILE, merged);
        return merged;
      }
    } catch (e) {
      console.warn('[K-Apply] Backend profile fetch failed, using local cache:', e);
    }

    const profile = await this.get(STORAGE_KEYS.PROFILE, null);
    if (!profile) {
      await this.set(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
      return { ...DEFAULT_PROFILE };
    }
    return { ...DEFAULT_PROFILE, ...profile };
  }

  async saveProfile(profile) {
    const res = await this.set(STORAGE_KEYS.PROFILE, profile);
    // Non-blocking sync to Next.js API backend
    api.saveProfile(profile).catch(err => {
      console.warn('[K-Apply] Could not sync profile to backend:', err);
    });
    return res;
  }

  // --- Specialized Q&A API ---
  async getQAList() {
    try {
      const apiRes = await api.getQAList();
      if (apiRes && apiRes.success && Array.isArray(apiRes.qa) && apiRes.qa.length > 0) {
        await this.set(STORAGE_KEYS.QA_LIST, apiRes.qa);
        return apiRes.qa;
      }
    } catch (e) {
      console.warn('[K-Apply] Backend QA fetch failed, using local cache:', e);
    }

    const list = await this.get(STORAGE_KEYS.QA_LIST, null);
    if (!list || !Array.isArray(list) || list.length === 0) {
      await this.set(STORAGE_KEYS.QA_LIST, DEFAULT_QA);
      return [...DEFAULT_QA];
    }
    return list;
  }

  async saveQAList(qaList) {
    return this.set(STORAGE_KEYS.QA_LIST, qaList);
  }

  async addQAItem(item) {
    const list = await this.getQAList();
    const newItem = {
      id: item.id || `qa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: item.title || 'Untitled Answer',
      category: item.category || 'General',
      keywords: Array.isArray(item.keywords) ? item.keywords : (item.keywords ? item.keywords.split(',').map(s => s.trim().toLowerCase()) : []),
      answer: item.answer || ''
    };
    list.unshift(newItem);
    await this.saveQAList(list);

    // Non-blocking sync to Next.js API backend
    api.createQAItem(newItem).catch(err => {
      console.warn('[K-Apply] Could not sync QA item to backend:', err);
    });

    return newItem;
  }

  async updateQAItem(id, updatedFields) {
    const list = await this.getQAList();
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      await this.saveQAList(list);
      return list[index];
    }
    return null;
  }

  async deleteQAItem(id) {
    const list = await this.getQAList();
    const filtered = list.filter(i => i.id !== id);
    await this.saveQAList(filtered);
    return true;
  }

  // --- Applications Tracker API ---
  async getApplications() {
    try {
      const apiRes = await api.getApplications();
      if (apiRes && apiRes.success && Array.isArray(apiRes.applications)) {
        await this.set(STORAGE_KEYS.APPLICATIONS, apiRes.applications);
        return apiRes.applications;
      }
    } catch (e) {
      console.warn('[K-Apply] Backend applications fetch failed, using local cache:', e);
    }

    const apps = await this.get(STORAGE_KEYS.APPLICATIONS, []);
    return Array.isArray(apps) ? apps : [];
  }

  async saveApplications(applications) {
    return this.set(STORAGE_KEYS.APPLICATIONS, applications);
  }

  async addApplication(application) {
    const apps = await this.getApplications();
    const newApp = {
      id: application.id || `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      company: application.company?.trim() || 'Unknown Company',
      role: application.role?.trim() || 'Software Engineer',
      location: application.location?.trim() || 'Remote / Unspecified',
      url: application.url || '',
      status: application.status || 'applied', // 'applied' | 'wishlist' | 'interviewing' | 'offer' | 'rejected'
      dateApplied: application.dateApplied || new Date().toISOString().split('T')[0],
      salary: application.salary || '',
      notes: application.notes || '',
      autoFilledFieldsCount: application.autoFilledFieldsCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    apps.unshift(newApp);
    await this.saveApplications(apps);

    // Non-blocking sync to Next.js backend
    api.createApplication(newApp).catch(err => {
      console.warn('[K-Apply] Backend application sync failed:', err);
    });

    return newApp;
  }

  async updateApplication(id, updatedFields) {
    const apps = await this.getApplications();
    const index = apps.findIndex(a => a.id === id || a._id === id);
    if (index !== -1) {
      apps[index] = { ...apps[index], ...updatedFields, updatedAt: new Date().toISOString() };
      await this.saveApplications(apps);

      // Sync update to backend
      api.updateApplication(id, updatedFields).catch(err => {
        console.warn('[K-Apply] Backend updateApplication failed:', err);
      });

      return apps[index];
    }
    return null;
  }

  async deleteApplication(id) {
    const apps = await this.getApplications();
    const filtered = apps.filter(a => a.id !== id && a._id !== id);
    await this.saveApplications(filtered);

    // Sync delete to backend
    api.deleteApplication(id).catch(err => {
      console.warn('[K-Apply] Backend deleteApplication failed:', err);
    });

    return true;
  }

  // --- Settings API ---
  async getSettings() {
    const settings = await this.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  async saveSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- Export & Import ---
  async exportAllData() {
    const profile = await this.getProfile();
    const qaList = await this.getQAList();
    const applications = await this.getApplications();
    const settings = await this.getSettings();

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      qaList,
      applications,
      settings
    };
  }

  async importAllData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup data format');
    }
    if (data.profile) await this.saveProfile(data.profile);
    if (data.qaList && Array.isArray(data.qaList)) await this.saveQAList(data.qaList);
    if (data.applications && Array.isArray(data.applications)) await this.saveApplications(data.applications);
    if (data.settings) await this.saveSettings(data.settings);
    return true;
  }
}

export const storage = new StorageManager();
