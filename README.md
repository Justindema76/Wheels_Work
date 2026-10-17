# Wheels Work

All of my design and development work for **Wheels Automotive** ([wheelsauto.com](https://wheelsauto.com)), a Canadian and US supplier of dealership products: licence plate frames, plate covers, showroom displays, signage, flags, key tags and more.

The site runs on **Adobe Commerce (Magento) 2.4.7** with three store views:

| Store view | URL | Language |
|---|---|---|
| Canada – English | `/ca-en/` | English |
| Canada – French | `/ca-fr/` | French |
| United States | `/us/` | English |

This repository holds two separate projects, plus some supporting files:

| # | Project | Folder | What it is |
|---|---|---|---|
| 1 | **Wheels Design Studio** | [`Wheels-Design-Studio/`](Wheels-Design-Studio/) | A browser-based product designer where customers design their own plate frames, plate covers and signs. It follows real production rules (print method, ink colours, imprint area). |
| 2 | **Website Redesign** | [`Website-Redesign/`](Website-Redesign/) | The redesign of wheelsauto.com: homepage sections, nav bar, category pages, and the account sign-up flow. Each section comes as paste-in code plus a browser preview. |
| 3 | Design Studio – legacy build | [`Wheels-Design-Studio-WORKING-COMPLETE/`](Wheels-Design-Studio-WORKING-COMPLETE/) | The older working version of the designers, kept for recovery and comparison. |
| 4 | Adobe Commerce module | `Wheels_DesignStudio-Adobe.zip` + `Wheels_DesignStudio_Install_Guide.pdf` | A Magento module that receives Design Studio submissions and emails them to the art department. |
| 5 | Automation | `scripts/`, `.github/workflows/` | One-off GitHub Actions that apply code-wide refactors (for example the global colour palette). |

**Live links (GitHub Pages):**

- Design Studio: https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio/
- Design Studio admin prototype: https://justindema76.github.io/Wheels_Work/Wheels-Design-Studio/admin.html
- Full homepage plan (desktop + phone): [HOMEPAGE-FINAL-PREVIEW.html](https://justindema76.github.io/Wheels_Work/Website-Redesign/Homepage/PLAN%20+%20HANDOFF/HOMEPAGE-FINAL-PREVIEW.html)
- Account sign-up preview: [SIGNUP-PREVIEW-3.html](https://justindema76.github.io/Wheels_Work/Website-Redesign/Account-Signup-Redesign/SIGNUP-PREVIEW-3.html)
- Nav bar (approved version): [NAV-5-rona-side-menu-CURRENT.html](https://justindema76.github.io/Wheels_Work/Website-Redesign/10%20NAV%20BAR/NAV-5-rona-side-menu-CURRENT.html)

---

## 1. Wheels Design Studio

> Full details: [`Wheels-Design-Studio/README.md`](Wheels-Design-Studio/README.md)

The old customer designers on wheelsauto.com let customers make orders that production couldn't actually print: the wrong ink colours, too many colours for a screen-print order, or flattened artwork with the original file lost. Design Studio is a rebuild that stops bad choices before the order is placed.

**Products:**

| Designer | Page |
|---|---|
| Licence plate frame – Full Colour Digital | `frame-digital.html` |
| Licence plate frame – Screen Print | `frame-screen-print.html` |
| Lexan plate cover – Full Colour Digital | `lexan-digital.html` |
| Lexan plate cover – Screen Print | `lexan-screen-print.html` |
| Plate sign | `plate-sign.html` |
| Motorcycle plate cover | `motorcycle-cover.html` |

**What it does:**

- **Screen Print vs Digital:** for screen print, the customer picks 1, 2 or 3 inks first, and text and logos are then limited to those inks. Digital allows the full palette.
- **One global colour palette** (`js/global-colours.js`) holds the real production inks (HT Process, Pantone such as Reflex Blue and 355 C, Silver/Gold Clear, and others). Every colour picker reads from it.
- **Shared engine:** one designer engine, one stylesheet and one set of controls serve all six designers. A fix is made once, not six times.
- **Production package:** "Download Files" creates a ZIP with the proof PNG, a production-details sheet (product, print method, inks, fonts, options) and the customer's **original uploaded artwork**.
- **Font library** of fonts commonly used in customer orders. Commercial fonts use system fallbacks; no font files are bundled.
- **Admin prototype** (`admin.html`) for managing colours, print methods and limits. The long-term plan is to back it with a real API or Magento data instead of browser storage.

Built with plain HTML, CSS and JavaScript plus a canvas renderer, with no framework and no build step.

---

## 2. Website Redesign

> Full details: [`Website-Redesign/README.md`](Website-Redesign/README.md)

I'm redesigning wheelsauto.com one section at a time. Nobody hand-edits the live theme. Each section is built from **Magento Page Builder blocks**, so the team can still swap images, products and categories without code. I then supply the CSS or code that styles those blocks.

| Area | Folder | Status |
|---|---|---|
| Homepage (8 sections) | `Website-Redesign/Homepage/` | Mostly live; the rest is ready to paste |
| Category pages | `Website-Redesign/9 CATEGORY PAGES/` | Ready |
| Nav bar / header | `Website-Redesign/10 NAV BAR/` | Approved; handed to the developer on the staging repo |
| Account sign-up | `Website-Redesign/Account-Signup-Redesign/` | Preview and slide deck for review |
| Code Studio editor | `Website-Redesign/Code-Studio-Redesign/` | Previews for the banner editor redesign (see the [Code-Studio](https://github.com/Justindema76/Code-Studio) repo) |

**Rules every section follows:**

- **One block for all 3 sites.** English and French text sit side by side in the same block with the classes `lang-en`, `lang-fr`, `lang-ca` and `lang-us`. CSS shows the right one based on the page language and store, so nobody has to maintain three copies of a block.
- **`-CODE` / `-CSS` files are pasted into Magento.** Each one starts with a comment line saying what it is and exactly where it goes.
- **`-PREVIEW` files are opened in a browser** and show the section at desktop and phone size.
- **Safari-safe CSS.** No `:has()` or `display: contents` in anything that ships.
- **Global theme overrides are kept as they are.** The existing homepage CSS also styles other rows and buttons, so new code is added beside it, never in its place.

---

## 3. Legacy Design Studio build

`Wheels-Design-Studio-WORKING-COMPLETE/` is the earlier working version: one shared CSS and JS file, separate HTML pages, ZIP download, and an "Email Design Files" button that posts the ZIP to a backend endpoint. It stays untouched so I can compare against it or recover from it while the clean version is built. Its `README.txt` explains how to wire up the email endpoint.

## 4. Adobe Commerce module

`Wheels_DesignStudio-Adobe.zip` contains a Magento 2 module (`Wheels_DesignStudio`). It provides:

- a REST endpoint (`webapi.xml`) that receives a design submission,
- admin settings (Stores → Configuration) for where submissions are emailed,
- an email template that sends the production ZIP to the art department.

The install steps are in `Wheels_DesignStudio_Install_Guide.pdf`. A developer installs it with Composer and deploys it on Adobe Commerce Cloud.

## 5. Automation

| File | What it does |
|---|---|
| `scripts/refactor-global-colours.mjs` + `refactor-global-colours.yml` | Rewrites every designer to read colours from `global-colours.js` instead of its own list. Runs on GitHub Actions and commits the result. |
| `update-screen-print-colours.yml` | Swaps the legacy build's text production sheet for a generated PDF. |

---

## How I work on this

1. Build or change a section here, with a preview, and push it to GitHub.
2. Review the preview on GitHub Pages (desktop and phone).
3. Paste the approved code into Magento myself. Theme or PHP changes go to the developer through the private staging repo (`Wheels-Staging-Justin`).
4. Older versions stay in their folders or in git history, so nothing is lost.

---

**Developer:** Justin DeMatteis. Design, front-end development and production-rule logic for Wheels Automotive.
