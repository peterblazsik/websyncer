# Web Design Guidelines

A skill for creating accessible, well-designed web interfaces following modern best practices.

## When to Use

Use this skill when:
- Building frontend components
- Reviewing UI/UX implementations
- Checking accessibility compliance
- Creating responsive layouts
- Designing color schemes and typography

## Accessibility (WCAG 2.1 AA)

### Color Contrast

| Element | Minimum Ratio | Tool |
|---------|---------------|------|
| Normal text | 4.5:1 | WebAIM Contrast Checker |
| Large text (18px+ bold, 24px+) | 3:1 | |
| UI components | 3:1 | |
| Focus indicators | 3:1 | |

```css
/* Good contrast examples */
.text-primary { color: #1a1a1a; }     /* On white: 16:1 */
.text-secondary { color: #4a4a4a; }   /* On white: 9:1 */
.text-muted { color: #767676; }       /* On white: 4.5:1 - minimum */
```

### Keyboard Navigation

- [ ] All interactive elements focusable
- [ ] Logical tab order (no `tabindex` > 0)
- [ ] Visible focus indicators
- [ ] Skip links for main content
- [ ] No keyboard traps

```jsx
// Good: Proper button with keyboard support
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</button>

// Bad: Div pretending to be a button
<div onClick={handleClick}>Click me</div>
```

### ARIA Guidelines

```jsx
// Use semantic HTML first
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// ARIA only when needed
<div role="alert" aria-live="polite">
  {errorMessage}
</div>
```

### Form Accessibility

```jsx
// Always associate labels
<label htmlFor="email">Email address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-hint"
  aria-invalid={hasError}
/>
<span id="email-hint">We'll never share your email</span>
```

## Responsive Design

### Breakpoints (Mobile-First)

```css
/* Base: Mobile (0-639px) */
.container { padding: 1rem; }

/* sm: Tablet (640px+) */
@media (min-width: 640px) { }

/* md: Small laptop (768px+) */
@media (min-width: 768px) { }

/* lg: Desktop (1024px+) */
@media (min-width: 1024px) { }

/* xl: Large desktop (1280px+) */
@media (min-width: 1280px) { }
```

### Touch Targets

- Minimum 44x44px for touch targets
- 8px minimum spacing between targets
- Larger targets for primary actions

```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

## Typography

### Scale (1.25 ratio)

```css
:root {
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem;  /* 36px */
}
```

### Line Height

| Text Size | Line Height |
|-----------|-------------|
| Body text | 1.5-1.75 |
| Headings | 1.2-1.3 |
| UI labels | 1.25-1.5 |

### Readability

- Max line length: 65-75 characters
- Paragraph spacing: 1em minimum
- Use system fonts for performance

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  max-width: 65ch;
}
```

## Color System

### Semantic Colors

```css
:root {
  /* Brand */
  --color-primary: #FF6B2C;
  --color-primary-hover: #E55A1F;

  /* Feedback */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Neutral */
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-background: #FFFFFF;
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #F9FAFB;
    --color-text-muted: #9CA3AF;
    --color-border: #374151;
    --color-background: #111827;
  }
}
```

## Common UI Bugs to Avoid

### Layout Issues

- [ ] Content overflow on small screens
- [ ] Horizontal scroll on mobile
- [ ] Fixed elements blocking content
- [ ] Z-index stacking issues

### Interactive Issues

- [ ] Buttons without hover/active states
- [ ] Missing loading states
- [ ] No error state handling
- [ ] Disabled state not visually distinct

### Performance Issues

- [ ] Large unoptimized images
- [ ] Layout shift (CLS > 0.1)
- [ ] Slow interaction response (INP > 200ms)
- [ ] Blocking render with JS/CSS

## Component Checklist

Before shipping any component:

```markdown
## Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Sufficient color contrast
- [ ] Focus states visible

## Responsive
- [ ] Works on mobile (320px+)
- [ ] Touch targets 44px+
- [ ] No horizontal overflow

## States
- [ ] Default
- [ ] Hover
- [ ] Focus
- [ ] Active
- [ ] Disabled
- [ ] Loading
- [ ] Error

## Performance
- [ ] No layout shifts
- [ ] Images optimized
- [ ] Animations use transform/opacity
```

## Testing Tools

| Tool | Purpose |
|------|---------|
| Lighthouse | Overall audit |
| axe DevTools | Accessibility |
| WAVE | Accessibility |
| Chrome DevTools | Responsive, performance |
| VoiceOver/NVDA | Screen reader testing |
