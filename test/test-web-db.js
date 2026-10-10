import assert from 'node:assert';
import {
  checkConnectionStatus,
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getQAList,
  createQAItem,
  updateQAItem,
  deleteQAItem,
  getProfile,
  saveProfile,
  seedDatabase
} from '../web-dashboard/lib/db-operations.js';

async function runTests() {
  console.log('--- Testing Web Dashboard DB Operations (In-Memory Fallback) ---');

  // 1. Connection status
  const status = await checkConnectionStatus();
  console.log('✓ Connection status check passed:', status.mode);
  assert(status.mode === 'fallback-memory' || status.mode === 'mongodb');

  // 2. Applications
  const apps = await getApplications();
  assert(Array.isArray(apps), 'Applications should be an array');
  const initialAppCount = apps.length;
  console.log(`✓ Initial applications loaded: ${initialAppCount}`);

  const newApp = await createApplication({
    company: 'Acme AI Corp',
    role: 'Staff Platform Engineer',
    status: 'interviewing',
    location: 'Remote, US',
    salary: '$180,000'
  });
  assert(newApp._id, 'Created app should have an _id');
  assert.strictEqual(newApp.company, 'Acme AI Corp');
  console.log('✓ Created application:', newApp._id);

  const updatedApp = await updateApplication(newApp._id, {
    status: 'offer',
    notes: 'Received competitive offer'
  });
  assert.strictEqual(updatedApp.status, 'offer');
  assert.strictEqual(updatedApp.notes, 'Received competitive offer');
  console.log('✓ Updated application status to offer');

  const deletedApp = await deleteApplication(newApp._id);
  assert.strictEqual(deletedApp, true);
  console.log('✓ Deleted test application');

  // 3. Q&A Operations
  const qas = await getQAList();
  assert(Array.isArray(qas) && qas.length > 0, 'QA items should be non-empty');
  console.log(`✓ QA items loaded: ${qas.length}`);

  const newQA = await createQAItem({
    title: 'Why choose our platform?',
    category: 'Company Fit',
    keywords: ['why us', 'why join'],
    answer: 'I admire the mission and high bar for software excellence.'
  });
  assert(newQA._id, 'New QA must have an _id');
  console.log('✓ Created QA item:', newQA._id);

  const updatedQA = await updateQAItem(newQA._id, {
    answer: 'Updated answer for software excellence.'
  });
  assert.strictEqual(updatedQA.answer, 'Updated answer for software excellence.');
  console.log('✓ Updated QA item answer');

  const deletedQA = await deleteQAItem(newQA._id);
  assert.strictEqual(deletedQA, true);
  console.log('✓ Deleted test QA item');

  // 4. Profile Operations
  const profile = await getProfile();
  assert(profile && typeof profile === 'object');
  assert(typeof profile.firstName === 'string', 'Profile must expose a firstName field');
  console.log(`✓ Blank profile template loaded (firstName: "${profile.firstName}")`);

  const updatedProfile = await saveProfile({ ...profile, headline: 'Principal AI Engineer' });
  assert.strictEqual(updatedProfile.headline, 'Principal AI Engineer');
  console.log('✓ Updated profile headline');

  // Restore original
  await saveProfile(profile);

  // 5. Database Seed
  const seedRes = await seedDatabase(false);
  assert(seedRes.profile === true);
  console.log('✓ Seed database test passed:', seedRes);

  console.log('\nAll Web Dashboard DB operation tests PASSED successfully!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
