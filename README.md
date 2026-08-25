# Avanya — North Bengal Digital Discovery Platform

A static, dependency-free website for Avanya: a two-vertical discovery platform (Tourism + Real Estate) for North Bengal — Darjeeling, Kalimpong, Kurseong, Mirik, Dooars, Lava, and Kaffer. Plain HTML + CSS + vanilla JavaScript only. No framework, no build step, no npm, no backend, no database.

## What this is

- Multi-page static site: `index.html`, `tourism.html`, `real-estate.html`, `property.html`, `about.html`, `contact.html`, `404.html`.
- Shared design tokens and components in `css/` (`variables.css`, `base.css`, `components.css`, `styles.css`).
- All interactivity — filtering, property detail rendering, mobile nav, form validation — is vanilla JS in `js/`, with a single synthetic data file (`js/data.js`) driving both listing pages and the detail page.
- All imagery is self-contained: inline SVG placeholders (gradients + simple line-art motifs) generated per listing based on a `placeholderTheme` field. Nothing depends on an external image host or a live internet connection to render correctly.
- Google Fonts (Fraunces + Inter) are the one external dependency, loaded via `<link>` tags with solid system-font fallbacks specified in `css/variables.css` — if unreachable, the site still renders correctly with system fonts.

## Running it locally

Any static file server works. Two options:

1. **Quickest**: open `index.html` directly in a browser. Note that opening via `file://` can break `fetch()`-based JavaScript (the enquiry form's submission logic) in some browsers due to CORS/file-protocol restrictions — the rest of the site (nav, filtering, property detail rendering) works fine over `file://`, but to properly test the enquiry form, use a local server instead.
2. **Recommended, for full testing including the enquiry form**: run a local static server from this folder, e.g. `npx serve .` (or any static server of your choice — Python's `python -m http.server`, VS Code's Live Server extension, etc.), then open the printed `localhost` URL.

There is no build step, no `package.json`, and no `node_modules` — this is intentional and should stay that way.

## Deploying

Point Vercel, Netlify, or GitHub Pages at this folder as a **static site**:

- **Vercel**: New Project → Framework Preset: "Other" → no build command → output directory: `.` (repo root).
- **Netlify**: New site from Git → Build command: (leave blank) → Publish directory: `.` (repo root). Or just drag-and-drop this folder into Netlify's manual deploy.
- **GitHub Pages**: point Pages at the repo root (or this folder if it's a subfolder of a larger repo) on the branch you deploy from.

No environment variables, no server process, no database — the only "backend" behavior (the enquiry form) is handled entirely by Formspree (see below).

## Before Launch: Connect the Enquiry Form

The enquiry form on `contact.html` and the short enquiry form on `property.html` both POST to a placeholder Formspree endpoint: `https://formspree.io/f/YOUR_FORM_ID`. To make it live:

1. Go to [formspree.io](https://formspree.io) and sign up for a free account using the Avanya business email.
2. Create a new form in the Formspree dashboard.
3. Copy the form endpoint ID it gives you (it looks like `xxxxwxyz` — the part after `/f/` in your unique endpoint URL).
4. Replace `YOUR_FORM_ID` in the `action="https://formspree.io/f/YOUR_FORM_ID"` attribute in **both** `contact.html` and `property.html` with that real ID.
5. Formspree will send a confirmation email after your **first test submission** — you must click the confirmation link in that email before the form will reliably deliver submissions. Submit a real test enquiry from the live site and confirm it before relying on the form for real leads.

The form already does client-side validation (required fields, phone/email format, a required consent checkbox) and calls `fetch()` with `Accept: application/json` so it can show a success/error state without a page reload — none of that needs to change when you plug in the real form ID.

## Placeholder values that MUST be replaced before launch

These are marked with `<!-- TODO -->` comments directly in the HTML/JS wherever they appear:

| Placeholder | Current value | Found in |
|---|---|---|
| WhatsApp number | `919999999999` (used in `https://wa.me/919999999999` links) | Header, footer, mobile sticky bar, property action bar on every page; also built dynamically in `js/property-detail.js` |
| Phone number | `+919999999999` (used in `tel:+919999999999` links) | Header mobile nav, footer, mobile sticky bar, property action bar, contact page |
| Business email | `enquiries@avanyatourism.example` (used in `mailto:` links) | Footer (every page), contact page, property action bar |
| Formspree form ID | `YOUR_FORM_ID` in `action="https://formspree.io/f/YOUR_FORM_ID"` | `contact.html`, `property.html` |
| Canonical/OG URLs | `https://www.avanyatourism.example/...` | `<link rel="canonical">` and `og:url` in every page's `<head>` |
| All listing content | 24 synthetic listings (14 Tourism + 10 Real Estate) in `js/data.js` | Names, descriptions, highlights, and prices are illustrative, not real inventory |
| Homepage testimonial quote | Clearly labelled as an illustrative, unverified placeholder quote | `index.html`, "why Avanya" quote block |
| All property photography | CSS-gradient / inline-SVG placeholders keyed by a `placeholderTheme` field (`forest`, `river`, `tea-garden`, `heritage`) | `js/listings.js` (`placeholderSVG`), used on every card, gallery, and thumbnail |

## What's real vs. placeholder — full picture

**Real and working as shipped:**
- All page structure, navigation, and internal linking.
- Client-side filtering on `tourism.html` (location, property type, experience tags, free-text search) and `real-estate.html` (location, property type, buy/lease, min/max price, free-text search) — filters update the URL query string live so filtered views are shareable/bookmarkable, and re-render without a page reload.
- `property.html`'s slug-driven rendering, gallery/lightbox, attribute grid, highlights, and "You May Also Like" related panel — all computed client-side from `js/data.js`.
- The enquiry form's client-side validation and success/error UI (the network call itself needs a real Formspree ID — see above).
- The WhatsApp/Call/Email quick-action links — they are real `<a>` tags with working `wa.me` / `tel:` / `mailto:` protocols; they just point at obviously-fake placeholder contact details right now.
- Responsive layout (tested at ~360px, ~768px, ~1024px, ~1440px design targets) including a real, working mobile-only sticky Call/WhatsApp/Enquire bar below 768px.
- Dark mode via `prefers-color-scheme`, with tokens also exposed as a `[data-theme="dark"]` override for a future manual toggle if one is added later.

**Explicitly placeholder / not real:**
- All 24 listings (names, descriptions, prices, highlights) — synthetic content for demonstration, not actual Avanya inventory.
- All photography — inline-SVG gradient placeholders, not real property photos.
- WhatsApp number, phone number, business email, Formspree form ID — see table above.
- The homepage testimonial — explicitly labelled illustrative, not a real guest/buyer review.

## Known structural limitation (documented, not a bug)

There is no server-side includes mechanism in a pure static site, so the shared header, footer, mobile nav, and sticky bar are repeated by careful copy-paste across all 7 HTML pages rather than being defined once. Every internal link and contact placeholder was kept consistent across pages by hand at the time of writing. If this site grows past ~10–15 pages, it would be worth introducing either a static-site generator (e.g. Eleventy) or a tiny partial-include build step — deliberately out of scope for now, per the brief's "no build step" requirement.

Similarly, `sitemap.xml` lists `property.html` once as a physical page rather than enumerating each `?slug=` value as a separate URL, since those are client-side query parameters on one file, not distinct crawlable URLs under this architecture. A future move to per-listing static pages (via a build step) would let each slug get its own sitemap entry and improve individual-listing SEO.

## Roadmap note: Phase 1 (Auth & RBAC) — deliberately not built

The project's original Implementation Roadmap specified a "Phase 1 — Auth & RBAC": JWT access/refresh tokens, Argon2 password hashing, and a five-role RBAC matrix enforced by backend guards. That phase exists to protect an **admin panel** backed by a **database of admin accounts** — neither of which exists in this build. The project was deliberately re-scoped to a zero-backend, zero-database static site (no admin panel, no CRM), so there is nothing for authentication or role-based access control to protect.

Building JWT/RBAC infrastructure with no admin surface behind it would be pure speculative complexity — real server-side auth also cannot exist without persistent storage (refresh-token rotation state, account records), which directly contradicts the "zero database" requirement. If an admin/content-management need arises later, this phase should be revisited then, scoped against whatever real backend is introduced at that time — not built ahead of that need.

This site is otherwise complete and launch-ready pending the placeholder replacements listed above.

## Design decisions

- **Palette**: deep forest green (`--color-forest`, `#1f4d3a`) as primary, a teal river blue (`--color-river`, `#2e6e7e`) as the link/secondary accent, warm gold/amber (`--color-gold`, `#c08a2e`) as the highlight accent, cream (`--color-cream`, `#faf6ee`) as the base background, and charcoal (`--color-charcoal`, `#2b2b26`) as body text — six tokens total, used consistently everywhere, with a full dark-mode token swap in `css/variables.css`.
- **Typography**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (a serif display face with real editorial weight) for all headings, [Inter](https://fonts.google.com/specimen/Inter) for body text — loaded via Google Fonts `<link>` tags with `serif`/`sans-serif` system fallback stacks specified in `variables.css`.
- **Grid**: CSS Grid-based listing cards, 1 column on mobile, 2 on tablet (≥640px), 3 on desktop (≥1024px), 4 on very wide screens (≥1400px).
- **Motion**: restrained — hover lift on cards/buttons, a smooth mobile-menu slide, no autoplay carousels or gratuitous animation.
