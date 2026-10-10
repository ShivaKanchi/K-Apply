/**
 * K-Apply Next.js Backend API Client
 * Connects the Chrome Extension directly to Next.js API routes with robust timeout & error handling
 */

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export class ApiClient {
  constructor(baseUrl = DEFAULT_BACKEND_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url) {
    if (url && typeof url === 'string') {
      this.baseUrl = url.replace(/\/+$/, '');
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Internal request helper with timeout and standardized response shape
   */
  async _request(endpoint, options = {}, timeoutMs = 3000) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const fetchOptions = {
        ...options,
        signal: controller ? controller.signal : undefined,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      };

      const res = await fetch(url, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = null;
      }

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`,
          data
        };
      }

      return {
        success: true,
        status: res.status,
        ...(data || {})
      };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      return {
        success: false,
        status: 0,
        error: isAbort ? `Request timed out after ${timeoutMs}ms` : (err.message || 'Network request failed'),
        isOffline: true
      };
    }
  }

  // --- Health Check ---
  async checkHealth(timeoutMs = 1500) {
    const res = await this._request('/api/health', { method: 'GET' }, timeoutMs);
    if (!res.success) {
      return {
        connected: false,
        mode: 'offline',
        error: res.error,
        message: 'Next.js SaaS Command Center is not reachable at ' + this.baseUrl
      };
    }
    return {
      connected: res.connected !== false,
      mode: res.mode || 'connected',
      database: res.database || null,
      message: res.message || 'Connected to Next.js SaaS backend'
    };
  }

  // --- Applications API ---
  async getApplications(status = 'all') {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await this._request(`/api/applications${query}`, { method: 'GET' });
    if (res.success && Array.isArray(res.applications)) {
      return { success: true, applications: res.applications };
    }
    return { success: false, applications: [], error: res.error };
  }

  async createApplication(applicationData) {
    const res = await this._request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
    if (res.success && res.application) {
      return { success: true, application: res.application };
    }
    return { success: false, application: null, error: res.error };
  }

  async updateApplication(id, updates) {
    if (!id) return { success: false, error: 'Application ID is required' };
    const res = await this._request(`/api/applications/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (res.success && res.application) {
      return { success: true, application: res.application };
    }
    return { success: false, application: null, error: res.error };
  }

  async deleteApplication(id) {
    if (!id) return { success: false, error: 'Application ID is required' };
    const res = await this._request(`/api/applications/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return { success: res.success, error: res.error };
  }

  // --- Profile API ---
  async getProfile() {
    const res = await this._request('/api/profile', { method: 'GET' });
    if (res.success && res.profile) {
      return { success: true, profile: res.profile };
    }
    return { success: false, profile: null, error: res.error };
  }

  async saveProfile(profileData) {
    const res = await this._request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (res.success && res.profile) {
      return { success: true, profile: res.profile };
    }
    return { success: false, profile: null, error: res.error };
  }

  // --- Q&A Knowledge Base API ---
  async getQAList() {
    const res = await this._request('/api/qa', { method: 'GET' });
    if (res.success && Array.isArray(res.qa)) {
      return { success: true, qa: res.qa };
    }
    return { success: false, qa: [], error: res.error };
  }

  async createQAItem(itemData) {
    const res = await this._request('/api/qa', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    if (res.success && res.item) {
      return { success: true, item: res.item };
    }
    return { success: false, item: null, error: res.error };
  }

  // --- AI Assistance Endpoints ---
  async generateCoverLetter(params) {
    const res = await this._request('/api/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify(params)
    }, 15000);
    return res;
  }

  async generateAnswer(params) {
    const res = await this._request('/api/ai/answer', {
      method: 'POST',
      body: JSON.stringify(params)
    }, 15000);
    return res;
  }
}

export const api = new ApiClient();
