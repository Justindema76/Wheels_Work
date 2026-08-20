# Wheels Design Studio

This folder is the clean application workspace for the Wheels design tools.

## Entry point
- `index.html` — Design Studio home / product launcher

## Designer pages
- `frame-digital.html`
- `frame-screen-print.html`
- `lexan-digital.html`
- `lexan-screen-print.html`
- `plate-sign.html`
- `motorcycle-cover.html`

## Shared code
- `css/wheels-designers.css` — shared designer UI styles
- `js/wheels-designers.js` — shared designer engine
- `js/global-logo-defaults.js` — shared logo defaults
- `js/screen-print-limits.js` — screen-print production colour rules
- `js/screen-print-page-init.js` — screen-print page initialization

## Home page
- `css/studio-home.css` — home page only; intentionally separate from designer CSS

## Structure rule
Shared behaviour belongs in shared files. Product-specific code should only exist when the product genuinely behaves differently. Digital and Screen Print are separate pages but reuse the same designer engine.
