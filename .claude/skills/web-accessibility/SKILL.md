---
name: web-accessibility
description: Implement WCAG 2.1 accessibility standards for semantic HTML, keyboard navigation, ARIA attributes, and screen reader support. Use when building accessible UIs, fixing accessibility issues, or ensuring compliance with disability standards.
version: 1.0.0
compatible: Claude, ChatGPT, Gemini
---

# Web Accessibility (A11y)

## When to use this skill

- **New UI Component Development**: Designing accessible components
- **Accessibility Audit**: Identifying and fixing accessibility issues in existing sites
- **Form Implementation**: Writing screen reader-friendly forms
- **Modals/Dropdowns**: Focus management and keyboard trap prevention
- **WCAG Compliance**: Meeting legal requirements or standards

## Input Format

### Required Information
- **Framework**: React, Vue, Svelte, Vanilla JS, etc.
- **Component Type**: Button, Form, Modal, Dropdown, Navigation, etc.
- **WCAG Level**: A, AA, AAA (default: AA)

### Optional Information
- **Screen Reader**: NVDA, JAWS, VoiceOver (for testing)
- **Automated Testing Tool**: axe-core, Pa11y, Lighthouse (default: axe-core)
- **Browser**: Chrome, Firefox, Safari (default: Chrome)

### Input Example
```
Make a React modal component accessible:
- Framework: React + TypeScript
- WCAG Level: AA
- Requirements:
  - Focus trap (focus stays inside the modal)
  - Close with ESC key
  - Close by clicking the background
  - Title/description read by screen readers
```

## Instructions

### Step 1: Use Semantic HTML

Use meaningful HTML elements to make the structure clear.

**Tasks:**
- Use semantic tags: `<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, etc.
- Avoid overusing `<div>` and `<span>`
- Use heading hierarchy (`<h1>` ~ `<h6>`) correctly
- Connect `<label>` with `<input>`

```html
<!-- ❌ Bad example: using only div and span -->
<div class="header">
  <span class="title">My App</span>
  <div class="nav">
    <div class="nav-item" onclick="navigate()">Home</div>
  </div>
</div>

<!-- ✅ Good example: semantic HTML -->
<header>
  <h1>My App</h1>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>
```

```html
<!-- ❌ Bad: no label -->
<input type="text" placeholder="Enter your name">

<!-- ✅ Good: label connected -->
<label for="name">Name:</label>
<input type="text" id="name" name="name" required>
```

### Step 2: Implement Keyboard Navigation

Ensure all features are usable without a mouse.

**Tasks:**
- Move focus with Tab and Shift+Tab
- Activate buttons with Enter/Space
- Navigate lists/menus with arrow keys
- Close modals/dropdowns with ESC
- Use tabindex appropriately

**Decision Criteria:**
- Interactive elements → `tabindex="0"` (focusable)
- Exclude from focus order → `tabindex="-1"` (programmatic focus only)
- Do not change focus order → avoid using `tabindex="1+"`

```tsx
import React, { useState, useRef } from 'react';

function AccessibleDropdown({ label, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRef = useRef(null);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else setSelectedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) { onChange(options[selectedIndex].value); setIsOpen(false); }
        else setIsOpen(true);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div className="dropdown">
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} onKeyDown={handleKeyDown}
        aria-haspopup="listbox" aria-expanded={isOpen}>
        {label}
      </button>
      {isOpen && (
        <ul role="listbox" onKeyDown={handleKeyDown} tabIndex={-1}>
          {options.map((option, index) => (
            <li key={option.value} role="option" aria-selected={index === selectedIndex}
              onClick={() => { onChange(option.value); setIsOpen(false); }}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Step 3: Add ARIA Attributes

Provide additional context for screen readers.

**Tasks:**
- `aria-label`: Define the element's name
- `aria-labelledby`: Reference another element as a label
- `aria-describedby`: Provide additional description
- `aria-live`: Announce dynamic content changes
- `aria-hidden`: Hide from screen readers

```tsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) modalRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
      aria-describedby="modal-description" ref={modalRef} tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal-content">
        <h2 id="modal-title">{title}</h2>
        <div id="modal-description">{children}</div>
        <button onClick={onClose} aria-label="Close modal">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
```

```tsx
// aria-live for dynamic notifications
function Notification({ message, type }) {
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true"
      className={`notification notification-${type}`}>
      {type === 'error' && <span aria-label="Error">⚠️</span>}
      {type === 'success' && <span aria-label="Success">✅</span>}
      {message}
    </div>
  );
}
```

### Step 4: Color Contrast and Visual Accessibility

**Tasks:**
- WCAG AA: text 4.5:1, large text 3:1
- WCAG AAA: text 7:1, large text 4.5:1
- Do not convey information by color alone
- Clearly indicate focus (outline)

```css
/* ✅ Sufficient contrast */
.button {
  background-color: #0066cc;
  color: #ffffff; /* contrast ratio 7.7:1 */
}

/* ✅ Focus indicator */
button:focus, a:focus {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

/* ❌ Never remove outline */
/* button:focus { outline: none; } */

/* ✅ Indicate state with color + icon */
.error-message {
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}
.error-message::before { content: '⚠️'; margin-right: 8px; }
```

### Step 5: Accessibility Testing

**Tasks:**
- Automated scan with axe DevTools
- Check Lighthouse Accessibility score
- Test all features with keyboard only
- Screen reader testing (NVDA, VoiceOver)

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('AccessibleButton', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<AccessibleButton onClick={() => {}}>Click Me</AccessibleButton>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Output format

### Basic Checklist

```markdown
## Accessibility Checklist

### Semantic HTML
- [ ] Use semantic tags (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Heading hierarchy is correct (h1 → h2 → h3)
- [ ] All form labels are connected

### Keyboard Navigation
- [ ] All interactive elements accessible via Tab
- [ ] Buttons activated with Enter/Space
- [ ] Modals/dropdowns closed with ESC
- [ ] Focus indicator is clear (outline)

### ARIA
- [ ] `role` used appropriately
- [ ] `aria-label` or `aria-labelledby` provided
- [ ] `aria-live` used for dynamic content
- [ ] Decorative elements use `aria-hidden="true"`

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Information not conveyed by color alone
- [ ] Text size can be adjusted
- [ ] Responsive design

### Testing
- [ ] 0 axe DevTools violations
- [ ] Lighthouse Accessibility score 90+
- [ ] Keyboard test passed
- [ ] Screen reader test completed
```

## Constraints

### Mandatory Rules (MUST)

- **Keyboard Accessibility**: All features must be usable without a mouse. Support Tab, Enter, Space, arrow keys, and ESC. Implement focus trap for modals.
- **Alternative Text**: All images must have an `alt` attribute. Meaningful images: descriptive alt text. Decorative images: `alt=""`.
- **Clear Labels**: All form inputs must have an associated label. Use `<label for="...">` or `aria-label`. Do not use placeholder alone.

### Prohibited Actions (MUST NOT)

- **Do Not Remove Outline**: Never use `outline: none`. Must provide a custom focus style instead.
- **Do Not Use tabindex > 0**: Avoid changing focus order. Keep DOM order logical.
- **Do Not Convey Information by Color Alone**: Accompany with icons or text.

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM](https://webaim.org/)
- [axe DevTools](https://www.deque.com/axe/)
- [A11y Project](https://www.a11yproject.com/)

### Related Skills
- `ui-component-patterns`: UI component implementation
- `responsive-design`: Responsive design

### Tags
`#accessibility` `#a11y` `#WCAG` `#ARIA` `#screen-reader` `#keyboard-navigation` `#frontend`
