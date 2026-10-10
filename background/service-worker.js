/**
 * K-Apply Background Service Worker (Manifest V3)
 * Manages extension initialization, tab messaging, and dashboard opening
 */

import { storage } from '../utils/storage.js';

// Seed default profile and Q&A on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[K-Apply] Service worker installed:', details.reason);
  try {
    // Ensure default profile & QA exist
    await storage.getProfile();
    await storage.getQAList();
    await storage.getSettings();
  } catch (err) {
    console.error('[K-Apply] Failed to seed initial data:', err);
  }
});

// NOTE: sidePanel.open() MUST be called inside a user gesture handler.
// Calling it from onMessage (which is async/indirect) loses the gesture context
// and Chrome throws: "sidePanel.open() may only be called in response to a user gesture."
//
// The popup calls chrome.sidePanel.open() directly in its own click handler (popup.js).
// This onClicked listener handles the case where the popup is disabled or bypassed.
chrome.action.onClicked?.addListener(async (tab) => {
  if (tab?.id && chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('[K-Apply] Could not open side panel on icon click:', err);
    }
  }
});

// Centralized message router
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_DASHBOARD') {
    (async () => {
      try {
        const settings = await storage.getSettings();
        const targetUrl = settings.dashboardUrl || 'http://localhost:3000/dashboard';
        const urlPrefix = targetUrl.replace(/\/+$/, '');

        // Check if dashboard tab is already open and focus it
        const tabs = await chrome.tabs.query({});
        const existingTab = tabs.find(t => t.url && (t.url.startsWith(urlPrefix) || t.url.includes('localhost:3000')));

        if (existingTab && existingTab.id) {
          await chrome.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            await chrome.windows.update(existingTab.windowId, { focused: true });
          }
        } else {
          await chrome.tabs.create({ url: targetUrl });
        }
        sendResponse({ success: true, url: targetUrl });
      } catch (err) {
        console.error('[K-Apply] Error opening dashboard tab:', err);
        const fallbackUrl = chrome.runtime.getURL('dashboard/dashboard.html');
        chrome.tabs.create({ url: fallbackUrl });
        sendResponse({ success: true, fallback: true });
      }
    })();
    return true;
  }

  // OPEN_SIDEPANEL from content scripts:
  // When a user clicks a button in the content script and sends this message,
  // Chrome propagates the user gesture to the background's onMessage handler,
  // so sidePanel.open() is valid here. sender.tab.id provides the correct tab.
  // NOTE: The popup calls sidePanel.open() directly (popup.js) — NOT via this route —
  // because popup→background message relay loses the gesture.
  if (request.action === 'OPEN_SIDEPANEL') {
    const tabId = sender.tab?.id;
    if (tabId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId }).then(() => {
        sendResponse({ success: true });
      }).catch(err => {
        console.error('[K-Apply] Failed to open side panel:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true; // keep message channel open for async response
    }
    sendResponse({ success: false, error: 'No tab context available' });
    return false;
  }

  if (request.action === 'UPDATE_BADGE') {
    if (request.count !== undefined) {
      chrome.action.setBadgeText({ text: request.count > 0 ? String(request.count) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    }
    sendResponse({ success: true });
    return false;
  }
});
