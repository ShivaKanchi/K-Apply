/**
 * Storage Unit Tests
 */

import { storage } from '../utils/storage.js';

async function testStorage() {
  console.log('--- Testing Storage Manager ---');

  // Test Profile (ships blank - no user data)
  const profile = await storage.getProfile();
  console.assert(profile.fullName === '', 'Profile should default to a blank profile');
  console.log('✓ Blank profile loaded successfully');

  // Test QA List
  const qa = await storage.getQAList();
  console.assert(qa.length >= 1, 'QA list should have default template items');
  console.log('✓ QA list loaded:', qa.length, 'items');

  // Test Add New QA
  const newQA = await storage.addQAItem({
    title: 'Test Custom Question',
    category: 'Testing',
    keywords: ['test', 'unit test'],
    answer: 'This is a test answer for autofill verification.'
  });
  console.assert(newQA.id.startsWith('qa-'), 'New QA must have valid ID');
  console.log('✓ Added custom QA item:', newQA.title);

  // Test Add Application
  const newApp = await storage.addApplication({
    company: 'Anthropic',
    role: 'Full Stack Engineer',
    status: 'interviewing',
    location: 'Remote',
    notes: 'Completed technical screen'
  });
  console.assert(newApp.company === 'Anthropic', 'App company should match');
  console.log('✓ Added application:', newApp.company, '-', newApp.role);

  // Test Application Query
  const apps = await storage.getApplications();
  console.assert(apps.length >= 1, 'Should have at least 1 application');

  // Clean up test items
  await storage.deleteQAItem(newQA.id);
  await storage.deleteApplication(newApp.id);
  console.log('✓ Successfully deleted test items');

  console.log('\nAll storage operations PASSED!');
}

testStorage();
