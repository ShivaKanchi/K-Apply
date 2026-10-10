/**
 * Form Event Simulation and React Synthetic Value Setter
 * Enables seamless autofill on modern web apps (React, Vue, Angular, Svelte, native HTML)
 */

/**
 * Sets input/textarea value with React internal tracker bypass and full event dispatching
 */
export function setNativeValue(element, value) {
  if (!element) return false;

  try {
    element.focus();

    // Check if element is a SELECT dropdown
    if (element.tagName === 'SELECT') {
      return setSelectValue(element, value);
    }

    // Check if element is a CHECKBOX or RADIO
    if (element.type === 'checkbox' || element.type === 'radio') {
      return setCheckableValue(element, value);
    }

    const win = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
    const EventClass = typeof Event !== 'undefined' ? Event : function(name, opts) { this.type = name; this.opts = opts; };

    // Check if element is contenteditable
    if (element.isContentEditable) {
      element.innerText = value;
      element.dispatchEvent(new EventClass('input', { bubbles: true }));
      element.dispatchEvent(new EventClass('change', { bubbles: true }));
      element.dispatchEvent(new EventClass('blur', { bubbles: true }));
      return true;
    }

    // Handle standard INPUT and TEXTAREA
    const prototype = element.tagName === 'TEXTAREA' 
      ? (win?.HTMLTextAreaElement?.prototype || {}) 
      : (win?.HTMLInputElement?.prototype || {});

    const valueDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    if (valueDescriptor && valueDescriptor.set) {
      // Bypass React's internal value tracker
      valueDescriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    // Dispatch native and modern input events
    element.dispatchEvent(new EventClass('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new EventClass('change', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new EventClass('blur', { bubbles: true, cancelable: true }));

    // Fallback: React _valueTracker reset if still attached
    if (element._valueTracker && typeof element._valueTracker.setValue === 'function') {
      element._valueTracker.setValue('');
    }

    return true;
  } catch (error) {
    console.warn(`[K-Apply] Failed to set native value for element:`, element, error);
    // Last-ditch direct assignment fallback
    try {
      element.value = value;
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Smart select element value setter (matches option value or label text)
 */
export function setSelectValue(selectElement, targetValue) {
  if (!selectElement || !targetValue) return false;

  const strTarget = String(targetValue).trim().toLowerCase();
  let matchedIndex = -1;

  // 1. Exact match on value
  for (let i = 0; i < selectElement.options.length; i++) {
    const opt = selectElement.options[i];
    if (opt.value.trim().toLowerCase() === strTarget) {
      matchedIndex = i;
      break;
    }
  }

  // 2. Exact match on text
  if (matchedIndex === -1) {
    for (let i = 0; i < selectElement.options.length; i++) {
      const opt = selectElement.options[i];
      if (opt.text.trim().toLowerCase() === strTarget) {
        matchedIndex = i;
        break;
      }
    }
  }

  // 3. Partial match
  if (matchedIndex === -1) {
    for (let i = 0; i < selectElement.options.length; i++) {
      const opt = selectElement.options[i];
      const optText = opt.text.trim().toLowerCase();
      if (optText.includes(strTarget) || strTarget.includes(optText)) {
        matchedIndex = i;
        break;
      }
    }
  }

  if (matchedIndex !== -1) {
    selectElement.selectedIndex = matchedIndex;
    selectElement.dispatchEvent(new Event('input', { bubbles: true }));
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    selectElement.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Sets checkbox or radio element
 */
export function setCheckableValue(element, targetValue) {
  const isAffirmative = /^(true|yes|1|y)$/i.test(String(targetValue).trim());

  if (element.type === 'checkbox') {
    element.checked = isAffirmative;
  } else if (element.type === 'radio') {
    // Only check if it matches value or affirmative
    const val = element.value.toLowerCase();
    if (val === String(targetValue).toLowerCase() || (isAffirmative && (val === 'yes' || val === 'true'))) {
      element.checked = true;
    }
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('click', { bubbles: true }));
  return true;
}
