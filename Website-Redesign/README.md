# Wheels Website Redesign

The redesign of [wheelsauto.com](https://wheelsauto.com) (Adobe Commerce 2.4.7), done one section at a time.

> Part of the [Wheels Work](../README.md) repository.

## How it works

The live theme isn't rewritten. Each section is **built from Magento Page Builder blocks** (rows, columns, banners, Products elements), so the team can still change images, products and category links in the admin without touching code. I then supply the code that styles those blocks.

**File naming:**

| Suffix | What to do with it |
|---|---|
| `-CODE.html` / `-CSS.html` / `-SCRIPT.html` | Paste into Magento. The first line of every file says what it is, which HTML Code element it goes in, and its path in this repo. |
| `-PREVIEW.html` | Open in a browser. It shows the section at desktop and phone size, side by side. |
| `*-frame.html` | Helper page that a preview loads inside its phone/desktop frames. |

**Rules every section follows:**

1. **One block for all 3 sites** (`/ca-en/`, `/ca-fr/`, `/us/`). English and French elements sit in the same column with the CSS classes `lang-en`, `lang-fr`, `lang-ca` or `lang-us`. CSS hides the wrong language based on `<html lang>`, and a small script adds a `wstore-<code>` class from the URL, so nobody maintains a separate block per language. Products elements translate on their own because names and prices come from the catalog.
2. **Safari-safe CSS:** no `:has()` and no `display: contents`.
3. **The existing global homepage CSS is never removed.** It also styles other product rows and every red Page Builder button, so new code is added beside it.
4. **Every section works on phones.** Each preview includes a 390px phone frame.

---

## Homepage

The homepage's folders are numbered top to bottom, in page order.

| # | Folder | What it is | Built from |
|---|---|---|---|
| 1 | `Homepage/1 HERO` | Top hero: a Code Studio banner slider (70% width) beside 2 featured product cards | Code Studio embed + Page Builder; class `whero` |
| 2 | `Homepage/2 SHOP BY CATEGORY` | Grid of 10 category cards, English + French | Page Builder columns; classes `wcat-*` |
| 3 | `Homepage/3 POPULAR PRODUCTS` | Compact product cards, auto-scrolling product rows with a scroll bar, "View All / Voir tout" buttons | Products element + CSS + slider script |
| 4 | `Homepage/4 SAVINGS BANNER` | "Combine them on every order" savings banner, both languages in one block | One HTML Code element |
| 5 | `Homepage/5 DEAL TILES` | Black deal tiles (4 products from a category, 2 per row on phones) | Products element; class `wdeal` |
| 6 | `Homepage/6 SITE STYLES` | Section heading font and the 1320px site width (desktop only) | Site Styles HTML Code element |
| 7 | `Homepage/7 PROMO STRIP` | 4 promo tiles, each linking to a category the team picks | Page Builder columns; classes `wpromo-*` |
| 8 | `Homepage/8 COLOUR SQUARES` | "Shop more at Wheels": 6 coloured category squares | Page Builder columns; classes `wsq-*` |

**Supporting folders:**

- `2 SHOP BY CATEGORY/MEETING OPTIONS/`: four layout options (A–D) shown in a design meeting.
- `2 SHOP BY CATEGORY/ICON OPTIONS/`: two icon styles for the category cards.
- `EARLY DESIGNS/`: the first homepage concepts (the first design with a pop-up, colour directions, "Night Lot", and a full homepage mock-up).
- `PLAN + HANDOFF/`:
  - `HOMEPAGE-FINAL-PREVIEW.html` shows the whole planned homepage, desktop and phone. [View it](https://justindema76.github.io/Wheels_Work/Website-Redesign/Homepage/PLAN%20+%20HANDOFF/HOMEPAGE-FINAL-PREVIEW.html)
  - `For Boss/Wheels-Homepage-Plan.html` is the plan summary for management.
  - `navbar-header-FOR-DEVELOPER.html` is the first header handoff for the developer.

## Category pages: `9 CATEGORY PAGES`

Subcategory cards for the category landing pages. They reuse the theme's existing `sub-category-slider` / `sub-category-card` classes, so each page needs a single paste.

## Nav bar / header: `10 NAV BAR`

Six versions of the desktop header and menu, kept side by side so they can be compared:

| File | Version |
|---|---|
| `NAV-0-first-navbar-for-developer.html` | First header handoff |
| `NAV-1-category-bar-and-mega-menu-with-promo.html` | Category bar plus a "Shop All" mega menu with a promo box |
| `NAV-2-same-with-site-font-centered.html` | Same, using the site font, centred |
| `NAV-3-home-depot-style.html` | Single-column dropdowns with category photos |
| `NAV-4-columns-no-promo.html` | 4-column mega menu, no promo |
| **`NAV-5-rona-side-menu-CURRENT.html`** | **Approved:** a "Shop All Products" button opens a menu that slides out from the left (department → subcategory → items), plus quick links, a store switcher, a My Account dropdown and company-specific links for dealer groups |

The approved version is built as real Magento theme code on the `feature/nav-redesign` branch of the private staging repo (`Wheels-Staging-Justin`), with step-by-step developer instructions. It changes desktop only; phones keep the current menu.

[View the approved nav](https://justindema76.github.io/Wheels_Work/Website-Redesign/10%20NAV%20BAR/NAV-5-rona-side-menu-CURRENT.html)

## Account sign-up: `Account-Signup-Redesign`

A redesign of the "Create an account" flow. Most Wheels customers are car dealerships, and today every employee re-types the same company details.

The new flow:

1. **Who is the account for?** Just me, a dealership, or another business.
2. **Find your dealership first:** pick the brand, then search by dealership name or address. The details fill in automatically.
3. **Join an existing company account or start a new one.** A join request goes to the company's account administrator, who approves it with a role or declines it. Accounts payable stays linked to the business.
4. **Optional email check** ("I'm new, continue" or "Check if I already have an account") with log-in and password reset.

| File | What it is |
|---|---|
| `SIGNUP-PREVIEW-3.html` | Latest clickable preview. [View it](https://justindema76.github.io/Wheels_Work/Website-Redesign/Account-Signup-Redesign/SIGNUP-PREVIEW-3.html) |
| `SIGNUP-PREVIEW-2-address.html`, `SIGNUP-PREVIEW.html` | Earlier versions |
| `SIGNUP-ALL-SCREENS.html` | Every screen on one page, inside the real wheelsauto.com header and footer, for meetings |
| `Account-Signup-Redesign.pptx` | 16-slide deck walking through the flow |

## Code Studio editor: `Code-Studio-Redesign`

Previews for the redesign of **Code Studio**, my banner builder. Wheels uses it to make the homepage hero and promo banners (source: [Justindema76/Code-Studio](https://github.com/Justindema76/Code-Studio)).

- `CODE-STUDIO-PREVIEW-1-simple.html`: a simplified editor.
- `CODE-STUDIO-PREVIEW-2-all-controls.html`: every existing control kept. Click a piece of the banner to edit it, see desktop and phone side by side, and link phone values to desktop. This is the version that was built.

## Session notes

`SESSION-NOTES-2026-10-14.md` is a working log: what was finished, what's waiting for approval, and what's next.
