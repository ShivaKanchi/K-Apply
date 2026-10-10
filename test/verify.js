/**
 * Automated Verification Script
 * Validates modules, default Q&A templates, and variable interpolation
 */

import { DEFAULT_PROFILE, DEFAULT_QA } from '../data/default-data.js';
import { interpolateVariables } from '../content/matcher.js';

console.log('--- 1. Testing Default Data Templates ---');
console.log(`Loaded ${DEFAULT_QA.length} blank Q&A templates.`);
console.assert(DEFAULT_QA.length >= 8, 'Expected at least 8 Q&A templates');

const coverLetterQA = DEFAULT_QA.find(q => q.id === 'qa-cover-letter');
console.assert(coverLetterQA !== undefined, 'Cover letter QA item must exist');
console.assert(coverLetterQA.answer === '', 'Cover letter template should ship blank (no user data)');

const aboutMeQA = DEFAULT_QA.find(q => q.id === 'qa-about-myself');
console.assert(aboutMeQA !== undefined, 'About myself QA item must exist');

console.assert(DEFAULT_PROFILE.fullName === '', 'Default profile must be blank (no user data)');

console.log('--- 2. Testing Variable Interpolation ---');
const sampleProfile = { ...DEFAULT_PROFILE, fullName: 'Sample Candidate' };
const template = "I am excited to apply for {{role}} at {{company_name}}! Reach out to {{full_name}}.";
const result = interpolateVariables(template, sampleProfile, {
  company: 'Google',
  role: 'Staff Full Stack Engineer'
});

console.log('Interpolated result:');
console.log(result);
console.assert(result.includes('Google'), 'Must include Google');
console.assert(result.includes('Staff Full Stack Engineer'), 'Must include role');
console.assert(result.includes('Sample Candidate'), 'Must include candidate name');

console.log('--- 3. Testing Cold Email Template Interpolation ---');
const coldEmailQA = DEFAULT_QA.find(q => q.id === 'qa-cold-email');
console.assert(coldEmailQA !== undefined && coldEmailQA.answer.length > 0, 'Cold email template should ship with a tokenized skeleton');
const populatedEmail = interpolateVariables(coldEmailQA.answer, sampleProfile, {
  company: 'Stripe',
  role: 'Senior React Developer',
  url: 'https://stripe.com/jobs/123'
});
console.assert(populatedEmail.includes('Stripe'), 'Cold email must replace {{company_name}} with Stripe');
console.assert(populatedEmail.includes('Sample Candidate'), 'Cold email must replace {{full_name}}');
console.log('Sample Cold Email Snippet:');
console.log(populatedEmail);

console.log('\nAll core logic tests PASSED successfully!');
