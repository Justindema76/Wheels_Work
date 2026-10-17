# Wheels Design Studio

A browser-based product designer for Wheels Automotive's licence plate products. It is **production-aware**: customers can only make choices that production can actually print.

- **Live Design Studio:** https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio/
- **Admin prototype:** https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio/admin.html

> Part of the [Wheels Work](../README.md) repository. The older working build is kept in [`../Wheels-Design-Studio-WORKING-COMPLETE/`](../Wheels-Design-Studio-WORKING-COMPLETE/) for recovery and comparison.

## What it is

Wheels Design Studio began as a fix for usability and production problems in the customer designers on wheelsauto.com. It has grown into one shared design system that ties what the customer designs to real manufacturing rules.

The goal isn't only to let a customer place artwork on a product. It's to **block invalid production choices before the order reaches the art department or production.**

Supported products:

- Licence plate frames (Full Colour Digital and Screen Print)
- Lexan plate covers (Full Colour Digital and Screen Print)
- Plate signs
- Motorcycle plate covers

## Run it

There's no build step. Open `index.html` in a browser, or use the GitHub Pages link above. `index.html` is the Design Studio home page and launches each designer.

## Folder structure

```text
Wheels-Design-Studio/
├── index.html                  Design Studio home / product launcher
├── admin.html                  Admin prototype (colours, print methods, limits)
├── frame-digital.html          Plate frame – Full Colour Digital
├── frame-screen-print.html     Plate frame – Screen Print
├── lexan-digital.html          Lexan cover – Full Colour Digital
├── lexan-screen-print.html     Lexan cover – Screen Print
├── plate-sign.html             Plate sign
├── motorcycle-cover.html       Motorcycle plate cover
│
├── config/
│   ├── design-studio-config.js Shared settings loaded by every page (production email, upload limit, products)
│   └── wheels-designers-core.js Copy of the core engine (part of the in-progress split)
│
├── css/
│   ├── wheels-designers.css    Shared designer UI (all designers)
│   ├── designer-workspace.css  Designer workspace layout
│   ├── frame-workspace.css     Plate-frame-specific workspace
│   ├── font-library.css        Font picker
│   ├── lexan-colour-row.css    Lexan colour row
│   └── studio-home.css         Home page only (kept separate on purpose)
│
├── js/
│   ├── wheels-designers.js       Designer engine used by every designer page
│   ├── wheels-designers-core.js  Core pieces (ZIP export, etc.) being split out of the engine
│   ├── designer-workspace-ui.js  Shared workspace controls
│   ├── frame-workspace-ui.js     Plate-frame controls (loaded by the workspace script)
│   ├── global-colours.js         MASTER production colour palette
│   ├── global-logo-defaults.js   Shared logo defaults
│   ├── font-library.js           Font list
│   ├── screen-print-limits.js    Screen-print ink-count rules
│   └── screen-print-page-init.js Screen-print page set-up
│
└── Images/                     Plate frame artwork (LPF101–LPF104: colour, white, grey, holes)
```

The structure follows one rule:

> **Shared behaviour is written once and reused everywhere.**

Product-specific code exists only where the physical product or the production process really behaves differently. Digital and Screen Print are separate pages, but they use the same engine.

## Problems Being Solved

The original workflow exposed practical problems for customers, designers and production staff:

- Incorrect or confusing text alignment behavior
- Text moving unexpectedly when alignment changed
- Uncontrolled text resizing
- Colour options that did not match available production inks
- No strong separation between Screen Print and Full Colour Digital workflows
- No enforcement of purchased screen-print colour counts
- Duplicate product-specific logic that made maintenance difficult
- Original customer artwork being lost behind flattened design proofs
- Production teams potentially needing to request artwork again
- Limited production information accompanying submitted designs
- No centralized configuration source for common settings

## Shared Designer Architecture

A major focus of the current rebuild is removing duplicate implementations.

The designers now work toward a shared architecture where common interface elements and behavior are reused across products.

Examples include:

- Shared designer CSS
- Shared colour data
- Shared logo and text colour pickers
- Shared text controls
- Shared artwork handling
- Shared production package logic
- Shared screen-print rules

This means a common change should be made once rather than separately in every designer.

## Global Colour System

The application now uses:

```text
Wheels-Design-Studio/js/global-colours.js
```

as the master production/artwork colour source.

The intended rule is:

```text
Global Colours
      ↓
Background / Colour Dock
Logo Print Colour
Text Print Colour
Screen Print Colour Selection
```

Changing a colour value in the global palette should propagate to every control that consumes that colour.

The current palette includes named production colours such as:

- HT Process Black
- HT Process Cyan
- HT Process Magenta
- HT Process Yellow
- Grey 429 C
- Silver / Clear
- Gold / Clear
- White
- Process Blue
- Reflex Blue
- Violet C
- Purple C
- Rhodamine Red
- Rubine Red
- Orange 021 C
- Bright Orange
- Warm Red
- Fire Red
- Emerald Green (355 C)
- Green C
- Medium Yellow (116 C)
- Primrose Yellow (101 C)
- Yellow C

The same palette is intended to drive text, logo and production colour controls rather than maintaining separate colour lists.

## Typography

The designer includes an expanded font library based on fonts commonly used in customer orders.

Examples include:

- Arial
- Helvetica
- Gotham
- Baskerville
- Bodoni
- Playfair Display
- Frutiger
- News Gothic
- Bebas
- Futura
- Space Bold
- Serpentine Bold
- Alkaria Regular
- Brush
- Impact Bold
- Ethnocentric Bold
- Eurostile

Commercial or locally installed fonts use browser/system font-family fallbacks rather than bundling unauthorized font files.

## Text and Artwork Controls

The UI is being standardized so text and logo artwork use the same shared controls wherever possible.

For example, Text Settings are structured around:

```text
Text
Font
Print Colour
Font Size
Style / Case
```

The Print Colour control reuses the same shared swatch component used for logo artwork instead of maintaining a separate text-only colour picker.

## Screen Print vs. Full Colour Digital

Digital and Screen Print are treated as separate production workflows.

### Full Colour Digital

Digital print allows the full artwork colour palette without a purchased ink-count restriction.

### Screen Print

Screen Print requires the customer to choose the number of production colours first:

- 1 Colour
- 2 Colours
- 3 Colours

The customer then selects that number of approved production inks.

Once those inks are chosen, logo and text artwork should be restricted to the selected colours.

This prevents customers from creating designs that exceed the production method they purchased.

## Original Artwork Retention

Uploaded customer artwork is retained separately from the browser-rendered proof.

The rendered PNG is used as the visual layout/proof, while the original uploaded artwork can be included in the production package so the best available source file reaches production.

## Production Package Generation

The workflow is being developed to generate a package containing information such as:

- Customer design proof
- Original uploaded artwork
- Product information
- Print method
- Selected production colours
- Typography specifications
- Product options
- Production details

Client-side ZIP generation is currently used so the browser can package design files without requiring a backend for basic testing.

## Admin / Configuration Direction

An Admin prototype exists at:

```text
Wheels-Design-Studio/admin.html
```

The long-term purpose of the Admin is to manage shared configuration instead of forcing production settings to be changed directly in code.

Examples of settings that should eventually be controlled centrally include:

- Production colours
- Available print methods
- Maximum screen-print colours
- Product availability
- Font lists and sizes
- Upload restrictions
- Product-specific production rules
- Email/submission routing

### Current limitation

GitHub Pages is a static host, so the Admin prototype cannot permanently change the public frontend for every customer by itself.

For a true shared Admin, both the Admin and storefront need to read/write the same persistent data source.

The intended architecture is:

```text
Admin
  ↓
Persistent API / Shopify or Magento data / database
  ↓
Global Design Studio configuration
  ↓
Shared designer engine
  ↓
All customer-facing designers
```

The current static build can use browser storage for testing, but a production Admin requires an API or platform-backed data store.

## Production-Aware Design Logic

Current and planned rules include:

- Product-specific print methods
- Approved production inks
- 1-, 2- and 3-colour Screen Print workflows
- Restricting text and logos to purchased inks
- Product-specific frame/background options
- Printable safe/imprint areas
- Design boundary warnings
- Object spacing and measurement tools
- Exact production selections recorded with the design

For example, a customer buying a **1 Colour Screen Print** product should select one approved ink before designing. Text and logo artwork can then be restricted to that single production colour while the original uploaded artwork remains preserved for production.

## Technical Approach

The current frontend is intentionally lightweight and browser-based:

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas-based product rendering
- Client-side artwork manipulation
- Client-side ZIP generation
- GitHub Pages for development/staging

The frontend is being structured so shared configuration can later be supplied by a real backend/API rather than remaining embedded in static JavaScript.

## Development Strategy

Older working versions are preserved separately for recovery and comparison.

The current clean application lives in:

```text
Wheels-Design-Studio/
```

Development priorities are:

1. Reuse existing shared functionality before creating anything new.
2. Keep one source of truth for shared configuration.
3. Make the smallest possible change when fixing a specific issue.
4. Keep presentation in shared CSS and behavior in shared JavaScript where practical.
5. Avoid product-specific duplication unless the production rule truly differs.
6. Preserve original customer artwork and production information.
7. Build the frontend so a real Admin/API can control it later without another major rewrite.

## Why This Project Matters

This project is more than a visual configurator.

It is designed to reduce the gap between:

**what the customer creates**

and

**what production can actually manufacture.**

The engineering challenge is translating real production constraints into an interface simple enough for a customer who is not a professional designer.

That means improving both sides of the workflow:

**Customer experience** — understandable product choices, easy positioning, immediate visual feedback and fewer opportunities to create invalid artwork.

**Production experience** — valid colours, valid print methods, retained source artwork, better specifications and fewer clarification requests.

## Current Status

Active development, refactoring and production-rule validation.

The public build is being used for testing while shared architecture, production logic and backend integration are refined.

---

**Developer:** Justin DeMatteis. This project documents the evolution of legacy product-design tools into a configurable, production-aware design platform.
