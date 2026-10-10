/**
 * Automated Test: Form Autofill Results (Filled & Skipped Fields)
 */

import { DEFAULT_PROFILE } from '../data/default-data.js';
import { getFieldLabel } from '../content/matcher.js';
import { AutofillEngine } from '../content/autofill-engine.js';

// Sample populated profile & Q&A used to exercise the autofill engine.
// The shipped defaults are intentionally blank (no user data).
const sampleProfile = {
  ...DEFAULT_PROFILE,
  firstName: 'Alex',
  lastName: 'Morgan',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  linkedin: 'https://linkedin.com/in/alexmorgan',
  phone: ''
};

const sampleQA = [
  {
    id: 'qa-cover-letter',
    title: 'Cover Letter',
    category: 'Cover Letter',
    keywords: ['cover letter', 'cover', 'letter', 'note to hiring team'],
    answer: 'Dear Hiring Team, I am excited about the {{role}} role at {{company_name}}.\n\nSincerely,\n{{full_name}}'
  }
];

console.log('--- 1. Testing getFieldLabel Heuristics ---');

// Mock element helper
function createMockElement({ tag = 'INPUT', type = 'text', id = '', name = '', placeholder = '', ariaLabel = '', value = '', parentLabel = null }) {
  const el = {
    tagName: tag.toUpperCase(),
    type,
    id,
    name,
    placeholder,
    value,
    attributes: {},
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    style: {},
    focus() {},
    dispatchEvent() { return true; },
    getAttribute(attr) {
      if (attr === 'aria-label') return ariaLabel || null;
      if (attr === 'placeholder') return placeholder || null;
      if (attr === 'name') return name || null;
      if (attr === 'id') return id || null;
      return this.attributes[attr] || null;
    },
    setAttribute(attr, val) {
      this.attributes[attr] = val;
    },
    closest(selector) {
      if (selector === 'label' && parentLabel) {
        return { innerText: parentLabel };
      }
      return null;
    }
  };
  return el;
}

const el1 = createMockElement({ placeholder: 'First Name' });
console.assert(getFieldLabel(el1) === 'First Name', `Expected 'First Name', got: ${getFieldLabel(el1)}`);

const el2 = createMockElement({ name: 'current_company' });
console.assert(getFieldLabel(el2).includes('Company'), `Expected Company in label, got: ${getFieldLabel(el2)}`);

const el3 = createMockElement({ ariaLabel: 'Your LinkedIn Profile URL' });
console.assert(getFieldLabel(el3) === 'Your LinkedIn Profile URL', `Expected 'Your LinkedIn Profile URL', got: ${getFieldLabel(el3)}`);

console.log('✓ Label extraction heuristics verified successfully.');

console.log('\n--- 2. Testing AutofillEngine Filled & Skipped Tracking ---');

const engine = new AutofillEngine();

// Create candidate mock elements
const candidates = [
  // Should match profile firstName
  createMockElement({ name: 'first_name', placeholder: 'Enter first name' }),
  // Should match profile email
  createMockElement({ name: 'email', type: 'email' }),
  // Should match profile linkedin
  createMockElement({ name: 'linkedin_url', placeholder: 'LinkedIn profile' }),
  // Should match Q&A cover letter
  createMockElement({ tag: 'TEXTAREA', name: 'cover_letter', placeholder: 'Paste cover letter' }),
  // Unmatched custom question -> Should be skipped as NO_MATCH
  createMockElement({ name: 'favorite_snack', placeholder: 'What is your favorite snack?' }),
  // Already filled with user data -> Should be skipped as ALREADY_FILLED when skipFilled is true
  createMockElement({ name: 'phone_number', type: 'tel', value: '+1 999 888 7777' })
];

// Override findFormCandidates for unit test environment
engine.findFormCandidates = () => candidates;

// Test with skipFilled: true
engine.options.skipFilled = true;

const job = { company: 'Linear', role: 'Staff Frontend Engineer', url: 'https://linear.app/careers' };

engine.autofill(sampleProfile, sampleQA, job).then(stats => {
  console.log(`Total found: ${stats.totalFound}`);
  console.log(`Filled: ${stats.filledCount}`);
  console.log(`Skipped: ${stats.skippedCount}`);

  console.assert(stats.totalFound === 6, 'Expected 6 total candidates');
  console.assert(stats.filledCount === 4, `Expected 4 filled fields, got: ${stats.filledCount}`);
  console.assert(stats.skippedCount === 2, `Expected 2 skipped fields, got: ${stats.skippedCount}`);
  console.assert(stats.filled.length === 4, 'Filled array length must match filledCount');
  console.assert(stats.skipped.length === 2, 'Skipped array length must match skippedCount');

  // Verify filled items
  const filledNames = stats.filled.map(f => f.title);
  console.log('Filled items:', filledNames);
  console.assert(stats.filled.some(f => f.value === sampleProfile.firstName), 'First name filled');
  console.assert(stats.filled.some(f => f.value === sampleProfile.email), 'Email filled');
  console.assert(stats.filled.some(f => f.value.includes('Linear')), 'Cover letter filled with Linear interpolated');

  // Verify skipped items
  console.log('Skipped items:');
  stats.skipped.forEach(s => {
    console.log(`  - ${s.title}: ${s.reason} (${s.reasonText})`);
  });

  const snackSkip = stats.skipped.find(s => s.title.toLowerCase().includes('snack'));
  console.assert(snackSkip && snackSkip.reason === 'NO_MATCH', 'Snack field should be skipped with NO_MATCH');

  const phoneSkip = stats.skipped.find(s => s.title.toLowerCase().includes('phone'));
  console.assert(phoneSkip && phoneSkip.reason === 'ALREADY_FILLED', 'Phone field should be skipped with ALREADY_FILLED');

  console.log('\nAll filled & skipped audit tests PASSED successfully!');
}).catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
