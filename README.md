# Wheels Design Studio

A browser-based, production-aware product customization system for automotive licence plate products.

**Live Design Studio:** https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio-WORKING-COMPLETE/plate-design-studio-page.html

**Admin Prototype:** https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio-WORKING-COMPLETE/admin.html

> This repository documents an active redesign and development project. The original design tools are preserved separately while the new system is developed and tested.

## Project Overview

Wheels Design Studio began as an effort to correct usability problems in existing customer-facing product designers. The project expanded into a reusable design system that connects the customer design experience with real production requirements.

Rather than allowing customers to create artwork that cannot be manufactured, the goal is to make production rules part of the design experience itself.

The system currently supports multiple automotive products through shared HTML, CSS and JavaScript architecture, including:

- Licence Plate Frames
- Lexan Plate Covers
- Plate Signs
- Motorcycle Plate Covers

## Problems Being Solved

The original workflow exposed several practical problems for both customers and production staff:

- Incorrect left/right text alignment behavior
- Text moving unexpectedly when alignment changed
- Text resizing unpredictably
- Customer colour choices that did not match production stock colours
- No clear separation between Screen Print and Full Colour Digital production
- Customer logos being reduced to flattened proofs instead of retaining original artwork
- Designers potentially needing to request customer artwork a second time
- Limited production information accompanying submitted designs
- Repeated product-specific code that made maintenance harder
- No centralized way to manage production rules

## What I Built / Am Building

### Shared multi-product architecture

The designers were refactored toward a shared architecture instead of maintaining duplicate CSS and JavaScript for every product.

### Direct object positioning

Customers can position text and artwork directly on the product rather than relying on problematic alignment controls.

### Snapping and visual guides

Objects can snap to horizontal and vertical centers with visual crosshair guides, making accurate placement easier without requiring professional design software knowledge.

### Controlled typography

Text sizing is handled through defined font-size controls rather than uncontrolled drag-resizing. This produces more predictable customer designs and more useful production specifications.

### Screen Print vs. Full Colour Digital

The system distinguishes between production methods so the interface can enforce the rules appropriate to each process.

### Production stock colour system

Screen-print colour choices are based on supplied production stock colours rather than arbitrary web colours. The working palette includes named Process, Pantone and specialty inks such as Process Blue, Reflex Blue, Violet C, Rhodamine Red, Rubine Red, Orange 021 C, Warm Red, Emerald Green 355 C and others.

### Original artwork retention

Uploaded customer artwork is retained separately from the browser-rendered design proof so production can receive the best source artwork supplied by the customer.

### Production package generation

The design workflow is being developed to generate a production package containing:

- Customer design proof (PNG)
- Original uploaded artwork
- Production information PDF
- Product and print-method information
- Selected production colours
- Typography specifications
- Relevant product options

### Configuration / admin architecture

A Design Studio Admin prototype has been introduced to move production settings out of hard-coded application logic. The long-term architecture allows product rules, stock colours, print methods, font sizes, email routing and other settings to be managed centrally.

## Production-Aware Design Logic

A major focus of this project is preventing invalid artwork before it reaches a designer.

Current and planned rules include:

- Product-specific print methods
- Approved screen-print stock inks
- 1-, 2- and 3-colour screen-print workflows
- Locking text and artwork to the inks purchased by the customer
- Product-specific frame/background colours
- Printable safe/imprint areas
- Preventing artwork from exceeding manufacturable boundaries
- Recording exact production selections in the final work order

For example, a customer purchasing a **1 Colour Screen Print** product should select one approved ink before designing. Text and logo treatments can then be constrained to that ink while the customer's original uploaded artwork remains preserved for production.

## Technical Approach

The current frontend is intentionally lightweight and browser-based:

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas-based product rendering
- Client-side artwork manipulation
- Client-side ZIP generation
- GitHub Pages for development/staging deployment

The project is being structured so the frontend can later consume configuration from a Magento/backend API instead of embedding production settings directly in JavaScript.

## Backend Direction

The intended production architecture is:

**Magento/Admin → Design Studio configuration API → Shared browser designer → Production submission endpoint**

This would allow administrators to change production settings without requiring code changes, including:

- Available print methods
- Stock ink colours
- Maximum imprint colours
- Product availability
- Font sizes
- Upload restrictions
- Production email routing
- Product-specific design rules

## Development Strategy

The original tools are intentionally preserved in `Plate-Cover-Designer/`.

The active redesigned system is maintained separately in:

`Wheels-Design-Studio-WORKING-COMPLETE/`

This allows the new application to be developed, deployed and tested without overwriting the original implementation.

## Why This Project Matters

This is more than a visual configurator. The project is designed to reduce the gap between **what a customer creates** and **what production can manufacture**.

The core engineering challenge is translating manufacturing constraints into an interface that remains simple enough for a customer who is not a designer.

That means solving both sides of the workflow:

**Customer experience** — easy positioning, understandable choices, immediate visual feedback.

**Production experience** — valid colours, valid print methods, retained source artwork, usable specifications and fewer clarification requests.

## Current Status

Active development and production-rule validation.

The current public build is being used for testing and stakeholder feedback while additional production logic is defined and implemented.

---

### Developer

**Justin DeMatteis**

This repository is part of my development portfolio and documents the evolution of the project from legacy product-design tools into a configurable, production-aware design platform.
