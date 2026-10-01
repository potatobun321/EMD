---
description: Coding, branding, and architecture guidelines for the VISHWAM web platform
globs: web/**/*.html, web/**/*.css, web/**/*.js, *.html, css/**/*.css, js/**/*.js
alwaysApply: true
---

# VISHWAM Project Guidelines

1. **Brand Identity & Embargo Rules (STRICT):**
   - **MANDATORY**: Do NOT introduce or expose any mentions of "JAI Conclave" across active public pages. The platform must be strictly branded as **VISHWAM — The Global Dialogue Forum** (*"In Dialogue, We Discover Destiny"*).
   - Keep `councils.html` dormant / redirected as documented in `JAI_CONCLAVE_RESTORATION_GUIDE.md`.
   - Any residual mentions of JAI Conclave in public copy (e.g. partner descriptions or cards) should be harmonized to "VISHWAM Initiatives", "VISHWAM Annual Summit", or "VISHWAM Youth Dialogues".

2. **Active Public Navigation:**
   - The standardized top navigation across all public pages is:
     1. **Home** (`index.html`)
     2. **About** (`about.html`)
     3. **Events** (`journey.html`)
     4. **Forums** (`forums.html`)
     5. **E-Magazine** (`magazine.html`)
     6. **Gallery** (`gallery.html`)
     7. **Write for Us** (`write-for-us.html`)
     8. **Join Us** (`join.html`)
     9. **Contact** (`contact.html`)
   - Do NOT add `councils.html` to `#nav-links` or `.footer-links` until explicitly instructed.

3. **Performance & Asset Integrity:**
   - Use relative or verified asset paths (`assets/global/logo.png`, `assets/...`) instead of broken absolute root links (`/assets/logo.png`).
   - Use `loading="lazy"` on below-the-fold images and `loading="eager"` on hero banners.
   - Maintain responsive layouts across mobile (max-width: 768px), tablet, and desktop viewports.

4. **Design System & Aesthetics:**
   - Use standard CSS custom properties (`var(--color-navy)`, `var(--color-orange)`, `var(--color-navy-dark)`) from `style-v5.css`.
   - Maintain crisp typography hierarchy and enforce max-width readable constraints (`max-width: 780px`) on long body copy.
