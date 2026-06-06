---
title: "Dark Mode Done Right: A CSS-First Approach"
description: "How this starter implements dark mode with three layers of CSS priority — system preference, JavaScript, and pure CSS radio buttons."
date: 2026-05-10
author: admin
tags:
  - css
  - design
  - tutorial
keywords: "dark mode, CSS, prefers-color-scheme, has selector, theme toggle"
---

Most dark mode implementations fall into one of two camps: CSS-only (respects system preference but offers no toggle) or JavaScript-only (requires JS to work at all). This starter uses a three-layer approach that combines the best of both.

## The three layers

### Layer 1: System preference (lowest priority)

The base layer uses the `prefers-color-scheme` media query. This works without any JavaScript:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: oklch(15% 0.008 250);
    --fg: oklch(95% 0.005 250);
    /* ... all dark mode variables */
  }
}
```

If your operating system is set to dark mode, the site follows automatically. No JavaScript required.

### Layer 2: JavaScript data attribute (overrides system)

When a user explicitly chooses a theme via the toggle, JavaScript sets a `data-theme` attribute on `<html>` and saves the choice to `localStorage`:

```css
:root[data-theme="dark"] {
  --bg: oklch(15% 0.008 250);
  /* ... dark variables */
}

:root[data-theme="light"] {
  --bg: oklch(99% 0.002 250);
  /* ... light variables */
}
```

This overrides the system preference because attribute selectors have higher specificity than media queries in the cascade.

### Layer 3: CSS `:has()` radio check (highest priority)

The theme toggle is implemented as a pair of radio buttons. When a radio button is checked, CSS `:has()` applies the theme immediately — no JavaScript needed for the visual change:

```css
:root:has(#mode_dark:checked) {
  --bg: oklch(15% 0.008 250);
  /* ... dark variables */
}

:root:has(#mode_light:checked) {
  --bg: oklch(99% 0.002 250);
  /* ... light variables */
}
```

The `:has()` selector has the highest specificity, so it overrides both the system preference and the JavaScript attribute.

## Why radio buttons instead of a button?

Traditional theme toggles use a `<button>` that requires JavaScript to function. Our radio button approach has a key advantage: **it works without JavaScript**.

The radio inputs are visually hidden and their labels are styled as icon buttons. When a user clicks the label, the radio gets `:checked` and CSS applies the theme change via `:has()`. This happens entirely in CSS.

JavaScript only adds one thing: `localStorage` persistence across page loads. Without JS, the toggle still works on the current page — it just resets on navigation.

## Preventing flash of wrong theme

A tiny inline script in `<head>` runs before the page renders:

```js
(function() {
  try {
    var s = localStorage.getItem('complite:theme');
    if (s === 'dark' || s === 'light') {
      document.documentElement.setAttribute('data-theme', s);
    }
  } catch(_) {}
})();
```

This sets the `data-theme` attribute before any CSS is parsed, preventing a flash of the wrong theme on page load.

## The color system

All colors use `oklch()`, a perceptually uniform color space. Dark mode isn't just "invert the colors" — each variable is hand-tuned for readability:

- Background lightness drops from 99% to 15%
- Foreground lightness rises from 15% to 95%
- Accent colors shift to higher lightness for visibility on dark backgrounds
- Border and muted colors are adjusted to maintain contrast ratios

---

The result is a dark mode that works in three scenarios: system preference only (no JS), explicit toggle (with or without JS), and full JavaScript support for persistence. Each layer builds on the last without breaking the ones below it.
