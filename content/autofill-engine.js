/**
 * Autofill Engine
 * Discovers form fields, applies matches safely, adds visual highlights, and collects statistics
 */

import { matchElement, getFieldLabel } from './matcher.js';
import { setNativeValue } from '../utils/events.js';

export class AutofillEngine {
  constructor(options = {}) {
    this.options = {
      highlightClass: 'autoapply-filled-field',
      skipFilled: false, // If true, won't overwrite existing non-empty values
      ...options
    };
  }

  /**
   * Main autofill execution
   */
  async autofill(profile, qaList, jobContext = {}) {
    const stats = {
      totalFound: 0,
      filledCount: 0,
      skippedCount: 0,
      errorsCount: 0,
      filled: [],
      skipped: [],
      details: []
    };

    try {
      const candidates = this.findFormCandidates();
      stats.totalFound = candidates.length;

      candidates.forEach((element, index) => {
        const fieldId = element.getAttribute('data-kapply-field-id') || `kapply-field-${index + 1}`;
        element.setAttribute('data-kapply-field-id', fieldId);

        const label = getFieldLabel(element);
        const inputType = element.tagName === 'TEXTAREA' ? 'textarea' : (element.tagName === 'SELECT' ? 'select' : (element.type || 'text'));
        const currentValue = element.value !== undefined ? String(element.value).trim() : '';

        try {
          // If skipFilled is enabled and element already has a value, skip
          if (this.options.skipFilled && currentValue.length > 0) {
            stats.skippedCount++;
            stats.skipped.push({
              fieldId,
              title: label,
              label,
              type: inputType,
              currentValue,
              reason: 'ALREADY_FILLED',
              reasonText: `Already filled with: "${currentValue.slice(0, 32)}${currentValue.length > 32 ? '...' : ''}"`,
              element
            });
            return;
          }

          const match = matchElement(element, profile, qaList, jobContext);

          if (match && match.value !== undefined && match.value !== null) {
            const success = setNativeValue(element, match.value);

            if (success) {
              stats.filledCount++;
              this.applyHighlight(element, match.title);
              const preview = String(match.value).substring(0, 45) + (String(match.value).length > 45 ? '...' : '');
              
              stats.filled.push({
                fieldId,
                title: match.title || label,
                label,
                type: inputType,
                value: match.value,
                preview,
                source: match.type === 'profile' ? `Profile: ${match.key}` : `Q&A: ${match.title}`,
                element
              });

              stats.details.push({
                field: match.title,
                type: match.type,
                preview
              });
            } else {
              stats.errorsCount++;
              stats.skippedCount++;
              stats.skipped.push({
                fieldId,
                title: label,
                label,
                type: inputType,
                currentValue,
                reason: 'ERROR',
                reasonText: 'DOM event setter could not apply value',
                element
              });
            }
          } else {
            stats.skippedCount++;
            const isFilled = currentValue.length > 0;
            stats.skipped.push({
              fieldId,
              title: label,
              label,
              type: inputType,
              currentValue,
              reason: isFilled ? 'ALREADY_FILLED' : 'NO_MATCH',
              reasonText: isFilled 
                ? `Existing value retained: "${currentValue.slice(0, 32)}${currentValue.length > 32 ? '...' : ''}"`
                : 'No matching data in profile or Q&A vault',
              element
            });
          }
        } catch (fieldError) {
          console.warn('[K-Apply] Error filling individual field:', fieldError);
          stats.errorsCount++;
          stats.skippedCount++;
          stats.skipped.push({
            fieldId,
            title: label,
            label,
            type: inputType,
            currentValue,
            reason: 'ERROR',
            reasonText: `Error: ${fieldError.message || 'Evaluation error'}`,
            element
          });
        }
      });
    } catch (globalError) {
      console.error('[K-Apply] Autofill engine encountered a critical error:', globalError);
    }

    return stats;
  }

  /**
   * Discovers all candidate input elements on the page
   */
  findFormCandidates() {
    const selector = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="password"]):not([type="image"])',
      'textarea',
      'select',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(document.querySelectorAll(selector));

    return elements.filter(el => {
      // Must be visible
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return false;
      }
      return true;
    });
  }

  /**
   * Adds an aesthetic visual highlight to filled inputs
   */
  applyHighlight(element, tooltipText) {
    if (!element) return;

    if (element.classList && typeof element.classList.add === 'function') {
      element.classList.add(this.options.highlightClass);
    }

    // Subtle outline animation
    if (element.style) {
      element.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      element.style.borderColor = '#3b82f6';
      element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
    }

    if (tooltipText && typeof element.setAttribute === 'function') {
      element.setAttribute('title', `AutoApply: Filled from ${tooltipText}`);
    }

    // Fade outline back after a short time while keeping a subtle mark
    setTimeout(() => {
      if (element && element.style) {
        element.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.3)';
      }
    }, 2500);
  }
}
