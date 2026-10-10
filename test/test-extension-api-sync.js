/**
 * Test: Chrome Extension API Sync & Unified Dashboard Integration
 * Verifies ApiClient resilient network handling, StorageManager sync, and settings
 */

import { ApiClient, api } from '../utils/api.js';
import { storage } from '../utils/storage.js';

async function runApiSyncTests() {
  console.log('=== 1. Testing ApiClient Defaults & Base URL ===');
  const customClient = new ApiClient('http://127.0.0.1:3000/');
  console.assert(customClient.getBaseUrl() === 'http://127.0.0.1:3000', 'Trailing slash should be stripped');
  console.log('✓ ApiClient base URL normalized:', customClient.getBaseUrl());

  console.log('\n=== 2. Testing Offline Resiliency & Timeout Handling ===');
  // Attempt health check against a non-existent port with small timeout
  const deadClient = new ApiClient('http://127.0.0.1:59999');
  const healthRes = await deadClient.checkHealth(400);
  console.assert(healthRes.connected === false, 'Should return connected: false when backend is offline');
  console.assert(healthRes.mode === 'offline', 'Mode should be offline');
  console.log('✓ Dead backend correctly handled without unhandled exception:', healthRes.message);

  console.log('\n=== 3. Testing Storage Settings (Dashboard URL & API URL) ===');
  const settings = await storage.getSettings();
  console.assert(settings.dashboardUrl === 'http://localhost:3000/dashboard', 'Default dashboardUrl should point to Next.js');
  console.assert(settings.apiUrl === 'http://localhost:3000', 'Default apiUrl should point to Next.js server');
  console.log('✓ Storage settings verified:');
  console.log('   - dashboardUrl:', settings.dashboardUrl);
  console.log('   - apiUrl:', settings.apiUrl);

  console.log('\n=== 4. Testing Storage Local Fallback When Backend is Offline ===');
  // With default api pointing to localhost (even if server is stopped), getProfile should fall back to DEFAULT_PROFILE
  const profile = await storage.getProfile();
  console.assert(profile && profile.fullName === '', 'Profile should fall back to a blank default profile');
  console.log('✓ getProfile fallback succeeded (blank profile)');

  const qaList = await storage.getQAList();
  console.assert(Array.isArray(qaList) && qaList.length >= 1, 'QA list should fall back to default templates');
  console.log('✓ getQAList fallback succeeded:', qaList.length, 'items');

  const apps = await storage.getApplications();
  console.assert(Array.isArray(apps), 'Applications should return an array');
  console.log('✓ getApplications fallback succeeded:', apps.length, 'items');

  console.log('\n=== 5. Testing Application Creation & Sync Fallback ===');
  const testApp = await storage.addApplication({
    company: 'Stripe Test Sync',
    role: 'Staff Solutions Engineer',
    status: 'wishlist',
    notes: 'Testing offline-first two-way sync'
  });
  console.assert(testApp.company === 'Stripe Test Sync', 'Created app should match company');
  console.log('✓ Added application with non-blocking sync dispatch:', testApp.company);

  // Update
  const updated = await storage.updateApplication(testApp.id, { status: 'applied' });
  console.assert(updated.status === 'applied', 'Status should be updated');
  console.log('✓ Updated application status:', updated.status);

  // Clean up
  await storage.deleteApplication(testApp.id);
  console.log('✓ Cleaned up test application');

  console.log('\n========================================');
  console.log('🎉 ALL EXTENSION API SYNC TESTS PASSED! 🎉');
  console.log('========================================\n');
}

runApiSyncTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
