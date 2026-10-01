---
name: frontend-design-system
description: >-
  UI component specs, styling conventions, color palettes, and responsive layouts
  for the VISHWAM web platform.
---

# Frontend Design System (VISHWAM)

---

## 1. Brand Tokens & Color Palette

```css
:root {
  /* Brand Core */
  --color-navy: #0b192c;
  --color-navy-dark: #060e18;
  --color-navy-light: #1e293b;
  --color-orange: #ff6b35;
  --color-orange-hover: #e85a24;
  --color-gold: #d97706;
  
  /* Neutrals & Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  --border-subtle: #e2e8f0;
  --border-card: #cbd5e1;
  
  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;
  
  /* Elevation & Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(11,25,44,0.08);
  --shadow-lg: 0 10px 25px rgba(11,25,44,0.12);
  --shadow-hover: 0 16px 36px rgba(11,25,44,0.16);
  
  /* Transitions */
  --transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Reusable UI Components

### A. Feature & Council Cards
* Elevated cards with subtle borders, smooth hover lifts (`transform: translateY(-4px)`), and rounded corners (`border-radius: 12px` to `16px`).
* Accent badges with micro-padding and bold uppercase typography.

### B. Interactive Buttons
* **Primary Button:** Orange background (`--color-orange`), white text, bold font, subtle glow on hover.
* **Secondary / Outline Button:** Navy border or white border on dark hero, transparent background, solid fill on hover.

### C. Modals & Drawers
* Backdrop blur (`backdrop-filter: blur(8px)`).
* Smooth slide-up/fade-in transitions.
