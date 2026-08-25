# Avanya — North Bengal Digital Discovery Platform

A static, dependency-free website for Avanya: a two-vertical discovery platform (Tourism + Real Estate) for North Bengal — Darjeeling, Kalimpong, Kurseong, Mirik, Dooars, Lava, and Kaffer. Plain HTML + CSS + vanilla JavaScript only. No framework, no npm dependency, no server, no database. Small standalone Node scripts (`scripts/*.js`) are used purely for one-time/repeatable static-file generation (sitemap, `llms.txt`, per-listing pages) — never a runtime build step, never a project dependency.

## What this is

- Multi-page static site: `index.html`, `tourism.html`, `real-estate.html`, `property/<slug>.html` (24 generated pages, one per listing), `property.html` (legacy-URL redirect shim), `search.html`, `travel-plan.html`, `about.html`, `contact.html`, `404.html`.
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
| Formspree form ID | `YOUR_FORM_ID` in `action="https://formspree.io/f/YOUR_FORM_ID"` | `contact.html`, `travel-plan.html`, every generated `property/<slug>.html` (24 files — re-run `node scripts/generate-property-pages.js` after updating the ID in the generator script, or find-and-replace across the generated files directly) |
| GTM container ID | `GTM_CONTAINER_ID = ''` (empty — analytics fully inert until set) | `js/analytics.js` — the one place to edit; every page picks it up automatically |
| Meta Pixel ID | `META_PIXEL_ID = ''` (empty — Pixel not loaded until set) | `js/analytics.js` |
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

**Update (Phase 3):** `sitemap.xml` is no longer hand-written — `scripts/generate-sitemap.js` regenerates it from `js/data.js`. **Update (Phase 5):** the per-listing entries now point at each listing's real static file (`/property/<slug>.html`) rather than a `?slug=` query string on one shared page — see the Phase 5 section below for why that distinction turned out to matter far more than just tidiness (31 URLs total as of this commit: 7 static pages + 24 listings). Run `node scripts/generate-sitemap.js` after adding, removing, or unpublishing a listing, and commit the regenerated file.

## Roadmap note: Phase 9 (Launch Readiness) — go/no-go verdict: **NO-GO**, three concrete blockers

Phase 9 is verification only — no new code, per its own scope. Spot-checked (not re-run from scratch) against every prior phase's Definition of Done: all 68 tests across 5 suites still pass, zero regressions since Phase 7; a fresh homepage load throws no console errors. The BRD's Go-Live Checklist, gone through line by line:

**Backend/Admin items (secure RBAC login, listing CRUD, image management, tag management, enquiry-status tracking) — N/A**, unchanged from Phases 1/6: no admin panel exists in this project by deliberate design, so these have no live status to check.

**Marketing & Technical items:**

| Item | Status |
|---|---|
| SEO metadata / structured data | ✅ Done (Phase 5) — per-page meta, JSON-LD, sitemap, `llms.txt`, AI-crawler `robots.txt` policy |
| Mobile responsiveness | ✅ Done (Phase 5/7) — 40-check cross-device sweep, zero failures |
| Basic accessibility | ✅ Done (Phase 7) — 100/100 Lighthouse/axe-core on 3 audited pages |
| Scalable architecture | ✅ Inherent — static site on a CDN (Vercel/Netlify) scales without configuration |
| HTTPS | ⚠️ Not verified — Vercel provisions TLS automatically on both its default domain and any custom domain, but I have no live production URL to check against from this environment |
| GA4 / Search Console / Meta Pixel | ❌ **Blocker** — `js/analytics.js` is wired and unit-tested, but ships with empty IDs; nothing fires until real IDs are supplied and verified against live dashboards (a launch prerequisite stated in Phase 7, still open) |
| Spam-protected forms | ⚠️ Partial — consent checkbox + client-side validation are real; Formspree's own spam filtering/reCAPTCHA is available but not confirmed enabled (requires the business's Formspree dashboard) |
| Image optimisation | ⚠️ N/A as scoped — all imagery is generated inline SVG, not photographs; real property photography (whenever supplied) will need its own optimisation pass, out of this build's scope |
| Regular backups | ⚠️ Different mechanism, same intent — there's no database to schedule backups for; git history *is* this project's content backup, and every commit is push+recoverable |

**DNS cutover / TLS on the production domain — cannot be verified from this environment.** I don't have the live Vercel URL or a connected custom domain to check `curl -I` against. If you share it, I'll verify HTTPS and redirect behaviour directly.

**Content audit — the single biggest go/no-go blocker.** All 7 Locations, 5 Experiences, and 24 listings are still the synthetic placeholder data seeded in Phase 0 (explicitly documented as illustrative throughout this README). BRD §21's rule against non-genuine content means **launch cannot proceed with this data as-is** — every listing's name, description, price, and photography needs to be replaced with real Avanya inventory before this goes live to real visitors.

### Recorded decision: **NO-GO**

Three concrete, actionable blockers, not vague concerns:
1. **Replace all synthetic listing content** in `js/data.js` with real inventory, then re-run `node scripts/generate-property-pages.js`, `node scripts/generate-sitemap.js`, and `node scripts/generate-llms-txt.js`.
2. **Replace the 38 files' worth of placeholder values** (WhatsApp/phone/email, Formspree form ID, GTM/Meta Pixel IDs) — every one is marked `<!-- TODO -->` or documented in the placeholder table above; none require code changes, only real values.
3. **Enable Formspree's spam protection** and **set up a free uptime monitor** (Phase 8's note) against the live domain.

Everything code-side — every phase's actual implementation, every test, every verified behaviour — is real and launch-ready. What's blocking is exclusively real-world business inputs this codebase cannot supply itself, exactly the kind of gap this phase exists to surface rather than paper over.

## Roadmap note: Phase 8 (Hardening & Infrastructure) — deliberately not built

Phase 8 is, in full, AWS production infrastructure: Terraform-provisioned VPC/ECS Fargate/RDS PostgreSQL Multi-AZ, an OIDC-based CI/CD pipeline deploying to it, CloudWatch logging/alerting, an RDS backup-restore drill, and an AWS WAF rate-based rule. Every exit criterion assumes a real AWS account, a real database, and real compute to hardened — none of which exist in this project, same category as Phase 1 (Auth/RBAC) and Phase 6 (Admin Panel): a zero-database, zero-backend static site has no server to harden, no database to back up, and no VPC to secure.

What's real and already true, no new work needed:
- **"CI/CD reaches production with no manual step, zero-downtime deploy"** — already satisfied. This repo's `git push` → Vercel's GitHub integration → live deploy pipeline has been in place since Phase 0, and Vercel's deployment model is atomic (a new deploy fully builds and passes health checks before traffic cuts over) — the same zero-downtime guarantee this exit criterion asks for, without ECS/Terraform to provide it.
- **Anti-spam on the enquiry endpoint** — there's no backend endpoint of ours to put a WAF rule in front of; the enquiry form posts directly to Formspree, a third-party service outside this project's infrastructure. Formspree's own dashboard has built-in spam filtering (and an optional reCAPTCHA integration) — enabling that is the honest, actually-available equivalent of a WAF rate-based rule here, and is a real, concrete pre-launch recommendation, not something this codebase can configure itself.
- **Uptime monitoring** — a free synthetic monitor (e.g. UptimeRobot, StatusCake, or Vercel's own built-in Analytics/uptime features) checking the homepage is the honest equivalent of the CloudWatch synthetic check this phase asks for. This requires the business's own account to set up — flagged as a concrete launch-readiness task, not fabricated as already done.

What has no equivalent at all, stated plainly: centralised logging with correlation IDs, RDS backup/restore, and infrastructure-as-code drift detection all require a real backend and database to exist first. If a real backend is ever introduced (the same trigger point named in Phase 6's note), Phase 8 is where that backend's own production hardening would begin — not something to simulate against a static site today.

## Roadmap note: Phase 7 (Polish, Analytics & Phase-2-Ready Features)

Phase 7 asks for analytics/conversion tracking, a real accessibility pass, a full-site cross-device re-verification, and a documentation-only check that BRD §26's Phase 2 features can be added later without breaking anything already built. All four had real, substantive work — this phase found and fixed two more genuine bugs on top of building the analytics layer from nothing.

### Analytics & conversion tracking — built from scratch, verified as far as this environment allows

`js/analytics.js` implements TAD §5.8's exact event taxonomy (`tourism_view`, `realestate_view`, `property_view`, `phone_click`, `whatsapp_click`, `email_click`, `enquiry_start`, `enquiry_submit`, `travel_plan_submit`, `buy_click`, `lease_click`) via Google Tag Manager, with Google Consent Mode v2 defaults (`denied` for every consent type) declared before anything else runs — the direct fix for this phase's own named key risk ("a Consent Mode misconfiguration blocking events"), except the more dangerous failure mode is the opposite of what that phrase suggests: an *undeclared* default doesn't block anything, it lets every tag fire ungoverned. Ships with **empty IDs by default**, matching this project's established placeholder pattern everywhere else — nothing reaches Google's or Meta's servers until real IDs are supplied (see the placeholder table below).

**Wired into the real site, not just written**: `phone_click`/`whatsapp_click`/`email_click` fire site-wide via one delegated click listener (works against every `tel:`/`wa.me`/`mailto:` link automatically — header, footer, sticky bar, property pages — no per-link instrumentation needed); `tourism_view`/`realestate_view` fire on those pages' load; `property_view` fires on every generated listing page with its slug/module/type; `enquiry_start` fires on first form interaction, `enquiry_submit` (and, additionally, `travel_plan_submit` for the Custom Travel Plan form specifically) fire **only on genuine submission success** — verified live by deliberately triggering the Formspree-placeholder-ID failure path and confirming `enquiry_submit` correctly does *not* fire, so a failed submission can never look like a conversion; `buy_click`/`lease_click` fire when a visitor picks a transaction type on a dual-listing's Buy/Lease selector.

**Verified**: 7 unit tests (`tests/analytics.test.js`) lock down the taxonomy and `track()`/`trackPageView()`/Consent-Mode-default logic under Node; every event above was also confirmed live in a browser by inspecting `window.dataLayer` directly after the triggering interaction — a real, current data point, not a guess.

**What genuinely cannot be verified from this environment, stated honestly rather than glossed over**: this phase's own exit criteria ask for GA4/Search Console/Meta Pixel confirmed firing on a live non-localhost dashboard — that requires the business's own real GTM/GA4/Meta accounts and a live deployed URL, neither of which exist here. Once real IDs are in place (see the placeholder table) and the site is live, GTM's own Preview mode is the tool this file is built to work with unmodified — that verification step is a genuine launch prerequisite for the business to perform themselves, the same way Docker verification was left to the user in Phase 0.

**A real gap, stated plainly**: there is no cookie-consent banner in this project, so `analytics_storage` stays `denied` even after a real GTM ID is added — meaning GA4 will not meaningfully track visitors until a real consent-management banner exists and updates that default to `granted`. Building a full CMP wasn't in scope for this phase; flagged here as a concrete pre-launch task, not silently left for someone to discover later.

### Accessibility pass — found and fixed two more genuine, site-wide bugs

Ran real Lighthouse (axe-core-based) accessibility audits against the homepage, a property detail page, and `contact.html` (the enquiry form screen this phase's exit criteria specifically names). Found:
- **A heading-order violation on every single page**: the footer's three column headings ("Explore", "Locations", "Contact") were `<h4>`, immediately after the page's `<h1>`/`<h2>` content with no `<h3>` in between — a WCAG heading-hierarchy skip present since Phase 0, just first caught here. Fixed across all 33 files (every hand-authored page plus the property-page generator template, regenerated).
- Re-ran after fixing: **Accessibility 100/100** on all three pages (homepage, a property page, contact.html).

### Full-site cross-device sweep — found and fixed a real, previously-undetected layout bug

Phase 5 verified cross-device behaviour on a handful of representative pages. This phase's own scope calls for repeating that "across the full built site," so all 10 unique page templates (home, tourism, real-estate, property detail, search, travel-plan, contact, about, 404) were checked at all four breakpoints (~360/768/1024/1440px) — 40 checks total, found one real failure:

**`real-estate.html`'s price-range filter overflowed its row at ~1024px** — the min/max price inputs (100px each) plus a separator need ~220px, but the shared `.filter-field` container only guaranteed a 160px minimum width, so at this specific viewport width the field's content silently pushed past the page edge instead of wrapping to a new line (a classic flexbox gotcha: `flex-wrap` decides wrapping based on an item's flex-basis, not its actual rendered content width, so overflow past a too-small min-width doesn't trigger a wrap). Fixed with a dedicated `.filter-field-price-range { min-width: 230px; }` rule. Re-verified with all 40 checks passing clean.

**A verification note worth recording**: confirming this fix took three attempts before it was trustworthy — the first two "confirmations" were false positives from this specific sandbox's aggressive per-origin browser HTTP caching (a `<link>` stylesheet kept serving a stale cached copy across full page navigations and even new tabs, despite `curl` confirming the server itself was serving the corrected file). Only running the check against a completely fresh port (eliminating any shared cache key) gave a trustworthy result. Documented here because it's a real lesson for anyone re-running this project's local verification steps: if a CSS fix doesn't seem to take effect after a normal reload, don't trust it or distrust it on a cached tab — verify against a fresh origin/port before concluding either way.

### BRD §26 Phase 2 readiness — a documentation-only check, no new code

Per this phase's explicit scope ("confirms the door is open, it does not walk through it"), for each BRD §26 Phase 2 item:

| Phase 2 feature | Extends without a breaking change via | Notes |
|---|---|---|
| **Advanced filters** | New fields on plain listing objects in `js/data.js` (no schema to migrate) + a new predicate in `filters.js`'s `filterData()` | Already proven extensible — Phase 2's taxonomy refactor is exactly this pattern already exercised once |
| **Testimonials** | A new `js/testimonials.js` data module, same shape as `js/taxonomy.js`/`js/data.js` | "Moderation" → hand-editing the file before committing, the same content-publish pattern Phase 6 documented for everything else |
| **Blog/content hub** | A new `scripts/generate-article-pages.js`, copying `scripts/generate-property-pages.js`'s exact static-generation pattern | The per-listing static-page approach (Phase 5) is a direct, already-proven template |
| **Related-property engine refinement** | `js/listing-rules.js`'s `findRelatedListings()` — a single, already-isolated pure function | Phase 3 already separated this logic from rendering/data concerns specifically so it could change independently |
| **Investment-analytics fields** (Real Estate) | New fields on real-estate listing objects + new attribute-grid rows in the property-page generator | If any such field is genuinely internal-only, it follows the same denylist-tested pattern Phase 3 established for `internal_attributes` |
| **Admin KPI dashboard** | The `dataLayer` events this phase just wired up | This phase's analytics work isn't just for Google's dashboards — it's the same event stream a future real KPI dashboard would consume, whenever a real backend exists to build one against |
| **Partner dashboards** | *No extension path exists in this codebase* | Stated honestly rather than force-fit: this requires real partner accounts/auth, which is exactly the backend/database this project has deliberately excluded since Phase 1. Whatever backend eventually gets introduced to build a real admin panel (Phase 6) is what this would extend from — not anything in the current static site |

## Roadmap note: Phase 5 (Public Frontend) — the SSR/ISR requirement forced a real architecture fix

Phase 5 asks for the visitor-facing UI (already substantially built across Phases 0–4) plus SSR/ISR rendering, full SEO/structured-data/AI-crawler verification, cross-device testing, and a Lighthouse pass. Most of the visitor journeys already existed; this phase's real work was verification — and verification found a genuine, significant architecture bug.

**The finding: this site was invisible to AI answer engines.** `curl`-ing `tourism.html` and `property.html?slug=...` (exactly how GPTBot/ClaudeBot/PerplexityBot actually fetch a page — they do not execute JavaScript) showed an empty `<div id="listing-grid">` and a `<title>`/`<h1>` that literally said "Property Details | Avanya" / "Loading property…". Every listing's real content was being injected by client-side JS after load — the opposite of what TAD §5.9.1 assumes ("SSR/ISR means this architecture already gets AI-crawler visibility for free"). That claim was written for a real Next.js SSR site; a client-rendered static site is exactly the failure case TAD §5.9.1 itself warns about.

**The fix, not just the diagnosis.** `scripts/generate-property-pages.js` (Node, same style as the existing `generate-sitemap.js` — run manually, no build pipeline) generates a real, complete static HTML file per published listing at `property/<slug>.html`, with the listing's name/description/gallery/highlights/related-listings/JSON-LD **baked directly into the HTML at generation time** — not rendered by JS on load. Verified with the exact test that matters: `curl http://localhost:5500/property/darjeeling-heritage-bungalow-retreat.html | grep '<title>\|<h1'` now returns the real listing name, not a loading placeholder. Interactivity (gallery lightbox, thumbnail switching, the Buy/Lease select for dual-transaction Real Estate listings, the enquiry form) still works exactly as before via the same shared JS files — only *where the initial content comes from* changed. Old `property.html?slug=X` links still work via a client-side redirect (`property.html` is now a thin shim, `noindex`'d since no crawler needs to reach it — the real, indexable URL is always `property/<slug>.html`); the security-critical `internal_attributes` boundary from Phase 3 was re-verified intact on every generated page.

**Trade-off, stated plainly**: `tourism.html` and `real-estate.html`'s own listing grids are still JS-rendered and still invisible to non-JS crawlers — only individual listing pages were fixed. This was a deliberate scope decision (the highest AI-citation value is a specific property being cited, which the per-listing pages now solve) rather than an oversight; re-architecting the filterable hub pages into static pre-rendered output isn't practical (every filter combination is a distinct state) and would conflict with FR-URL-005's own rule that filtered views should canonicalize to the unfiltered page, not be separately indexed.

**Also built, previously missing entirely:**
- **`robots.txt`** — was a bare `Allow: /`; now implements TAD §5.9.2's full named policy (retrieval/citation crawlers allowed, training crawlers allowed by default for this non-proprietary site, `Google-Extended`/`Applebot-Extended` training-opt-out tokens disallowed, undocumented crawlers like Bytespider disallowed). The exact xAI/Grok crawler user-agent token couldn't be confirmed reliably — left as an explicit, commented TODO rather than a guess.
- **`llms.txt`** — didn't exist; now generated by `scripts/generate-llms-txt.js`, listing real pages with honest one-line descriptions and an explicit note that listing content is synthetic.
- **Structured data (JSON-LD)** — didn't exist anywhere on the site; now `Organization`+`WebSite` on the homepage, `BreadcrumbList` matching each page's actual visible breadcrumb, and per-listing `LodgingBusiness` (Tourism) / `Product`+`Offer` (Real Estate — `RealEstateListing` isn't a confidently-verified schema.org type, so `Product` was used instead) on every generated property page. No fabricated `priceRange`, ratings, or review data anywhere — only fields the real listing data actually supports, per this project's own standing rule against inventing numbers with no backing.

**Cross-Device & Responsive Verification (Development Environment §8.5) — done for real, not spot-checked**, since this phase's own roadmap entry names "looks right on a laptop screen" as the most likely way this kind of work quietly fails. Tested at all four named breakpoints (~360/768/1024/1440px) via the browser tool's actual viewport resizing, not just visual judgment:
- **Found and fixed a real bug**: the mobile sticky Call/WhatsApp/Enquire bar used `@media (max-width: 768px)` — inclusive of 768px itself, so it stayed visible exactly at the tablet breakpoint where the spec says it must disappear. Fixed to `max-width: 767px`, then re-verified (a browser-cache false-negative during testing was caught and ruled out by injecting the freshly-fetched CSS directly and re-checking, rather than trusting a possibly-stale reading).
- No horizontal scroll and no unreachable controls confirmed at any of the four breakpoints, on both a listing page and a generated property page.
- Grid columns confirmed switching correctly (1 → 2 → 3 → 4 as width increases) and the desktop nav/hamburger swap confirmed at the correct breakpoint.

**Lighthouse, run for real** (`npx lighthouse`, ephemeral — not added as a project dependency) against a live local server: homepage scored Performance 87 / Accessibility 100 / Best Practices 100 / SEO 100; a property detail page initially scored Accessibility 96 — Lighthouse caught two genuine, **pre-existing, site-wide** accessibility bugs (not introduced by this phase, just first caught here): the brand logo link's `aria-label="Avanya home"` didn't contain its own visible text content (WCAG 2.5.3 Label in Name — fixed by removing the redundant aria-label across all 34 files, including the page generator's template), and breadcrumb links relied on color alone with no underline (fixed in `css/components.css`). Re-ran after fixing: **Accessibility 100 / Best Practices 100 / SEO 100** on the property page too. Performance sits at 86, LCP ~3.3s — reasonable for a headless-Chrome-against-`localhost` measurement fetching Google Fonts over the network each run; no formal Lighthouse CI performance budget file was added, consistent with this project's "no build step" stance, but the numbers above are a real, current data point, not a guess.

Run `node scripts/generate-property-pages.js` after adding/editing/unpublishing any listing (then `node scripts/generate-sitemap.js` and `node scripts/generate-llms-txt.js` to keep those in sync) — these three scripts must be re-run together whenever `js/data.js` changes; none of them run automatically.

## Roadmap note: Phase 4 (Enquiry Engine) — Formspree IS this project's backend

Phase 4 specifies POST /enquiries, POST /travel-plans, an async SES notification worker, and a full admin lead-management API (list/detail/update/bulk-update/export/DPDP-erasure). Re-scoped honestly:

**What this project's "enquiry engine" actually is.** There is no database and no server to persist a lead, so Formspree — already wired up since Phase 0 — genuinely *is* the equivalent of `POST /enquiries`: it receives the submission, stores it, and emails Avanya. Everything below is what Phase 4 adds on top of that plain form-to-email pipe to make it actually match the spec's real behaviour, not just its email-notification side effect.

**`js/enquiry-engine.js`** (new, plain-function, fully unit-tested — `tests/enquiry-engine.test.js`, 19 tests) assembles what the real request body would carry: `module` (tourism/real_estate), `enquiryType` (stay/buy/lease/travel_plan/general — previously the form only ever sent a meaningless `general-enquiry` string, now fixed), a formatted `AVN-T-YYYYMMDD-###` / `AVN-R-YYYYMMDD-###` lead reference id, and a denormalised `listingSnapshot` (name/location/type) captured at submission time exactly like Database Design §4.4's `listing_snapshot` column. **Stated honestly**: the real spec's `lead_id` comes from a database sequence, guaranteeing uniqueness; this client-generated version uses a random 3-digit suffix since there's no shared counter to draw from — a real, correctly-formatted reference for the visitor to quote, not a guaranteed-unique identifier the way a real one is.

**Consent enforcement, for real.** `validateConsent()` rejects anything other than `consent: true` with the exact error text API Design §7.4 documents ("Consent to the Privacy Policy is required to submit an enquiry."), as a deliberate second check behind the HTML `required` attribute — verified live in a browser by removing the `required` attribute and confirming the JS check still catches it (a browser that mishandled `required` would otherwise let an unconsented submission through).

**The key risk this phase's roadmap entry names — an async notification path that fails silently — got a real fix, not just a test.** Formspree's actual email delivery is outside this site's control, but the submission call itself failing (network issue, Formspree outage, or literally the still-placeholder `YOUR_FORM_ID` before launch) previously just showed an apology and the visitor's message was gone. Now the `.catch()` path shows an immediate WhatsApp/email continuation, pre-filled with the visitor's name and message, so a failed submission never silently loses a lead. **Verified live**: submitted the contact form against the placeholder Formspree ID (which genuinely 404s), confirmed the fallback UI appeared with a correctly pre-filled `wa.me` link containing the visitor's actual message.

**The Custom Travel Plan form — genuinely missing, now built.** `travel-plan.html` + `js/travel-plan.js` (BRD §16.3, API Design §5.4's stated "POST /travel-plans sets enquiryType server-side" exception): trip dates, group size, an Interests chip group rendered live from `js/taxonomy.js`'s Experience tags (never hand-duplicated), and a hardcoded (non-editable) `enquiryType=travel_plan` hidden field — the static equivalent of the server setting it, since the visitor has no field to override. Linked from `tourism.html`'s hero.

**Real Estate enquiries now ask Buy or Lease when it's ambiguous.** A listing offered under only one transaction type sets `enquiryType` directly (verified live for both `buy`-only and `lease`-only listings); a listing offered under both shows a small select the visitor picks from, synced live into the hidden field the form submits (verified live: changing the select updates the hidden value immediately).

**Admin lead management (GET/PATCH/bulk-update/export/DPDP-erasure) does not apply — same treatment as Phase 1.** There's no database to query or admin panel to build it into. The closest honest equivalent: Formspree's own dashboard already lets Avanya view, mark, and export every submission (satisfying FR-49's "no lead should be permanently trapped" in spirit), and deleting a submission there is the manual, human-operated equivalent of the DPDP right-to-erasure endpoint — exactly how a small team without a CRM would actually handle an erasure request in practice.

**RBAC-scoped admin behaviour (Property Manager's `assignedTo=self` scoping, Content/Marketing Manager's read-only PATCH restriction) does not apply**, for the same reason Phase 1 doesn't: there is no admin panel, no roles, and no authenticated actor to scope anything to.

Run `node tests/enquiry-engine.test.js` (19 tests, all passing) for the pure-logic layer. The DOM-coupled layer (`js/enquiry-form.js` itself — the actual submit handler, fetch call, and fallback UI) is deliberately **not** unit-tested under Node — it touches `document`/`fetch` directly and this project doesn't want a jsdom dependency just to fake that. It was instead verified against a live local server: consent bypass attempt, successful-path lead reference display, and the fetch-failure fallback UI were all exercised in an actual browser, which is what caught the "form only sent an approach-vocabulary-mismatched `module` value" issue described above in the first place.

## Roadmap note: Phase 3 (Listings) — the security-critical boundary, and what "no backend" really means for it

Phase 3 specifies Tourism/Real Estate Properties (public search/filter/detail + admin CRUD), a Media module (S3 presign/register, 10-image cap), related listings, global search, and an SEO module (sitemap/robots/redirects). Re-scoped:

**The single highest-priority security dependency, taken seriously.** The roadmap flags the public/internal DTO split on Real Estate listings (Revenue/Lease-Income, Ownership/Seller Reference must stay admin-only) as the most important thing in the entire document set. In a real backend, that's enforced by a `PublicRealEstateListingDto` that structurally excludes those fields. **A static site has no server, so there is no "admin can see it, public can't" tier possible at all** — everything in `js/data.js` ships to every visitor, forever, visible via view-source. The only correct equivalent is stricter than the original: **those fields must never exist in this dataset, period.** `tests/listings.test.js` enforces this permanently with a named test checking every listing against a denylist of forbidden field names (`internalAttributes`, `revenueOrLeaseIncome`, `ownershipSellerReference`, etc.) — exactly the kind of test the roadmap says "should stay in the suite permanently, not be treated as a one-time verification."

**A real correctness bug found and fixed while implementing this phase.** The related-listings ("You May Also Like") logic that shipped in Phase 0 used OR (same location *or* shared experience tag) — but the spec documents AND (same location *and* at least one shared tag). Moved the algorithm into `js/listing-rules.js` and fixed it to match the spec exactly, with a test proving the distinction matters: `kurseong-colonial-tea-bungalow`'s only same-location neighbor shares no experience tag, so under the correct AND logic its related panel is legitimately empty — under the old OR logic it would have wrongly shown a mismatched result.

**Publish-state visibility, built for real.** Every listing now carries a `status: 'published'` field (`js/listing-rules.js`'s `isPubliclyVisible()`/`getPublishedListings()`). `filters.js` and `search.js` both filter through it before anything reaches the UI — a draft or archived listing (none exist in the current 24, but the mechanism is real and tested with synthetic draft/archived items in `tests/listings.test.js`) can never appear publicly.

**The 10-image cap**, translated honestly: there's no upload flow to enforce it against (no admin panel), so `getGalleryImages()` is a hard ceiling instead — it physically cannot return more than 10 images regardless of what a listing's data claims, tested directly (`tests/listings.test.js`) against a listing that requests 15.

**Global search — genuinely new, not previously built.** `js/search.js` + `search.html` implement the `GET /search` contract's shape (`?q=&module=`, mixed `resultType` results across locations/experiences/tourism/real-estate) as a plain function instead of an endpoint. Found and fixed a real gap while testing it: the first version only matched a listing's own name/description, missing "Dooars" searches for listings whose copy never uses that word — FR-80 explicitly requires matching on location too. Wired into the header nav (search icon, all 8 pages) and 404.html's recovery link, which previously pointed at `contact.html` under a misleading "Search / Contact Us" label with no actual search behind it.

**Redirects** (`js/redirects.js`, `GET /redirects/resolve`'s equivalent): an empty, ready-to-use old-slug → new-slug map, checked by `property-detail.js` before falling back to 404 — so a future slug rename doesn't silently break existing links. Admin management → hand-editing the array, same pattern as taxonomy.js.

**Sitemap, regenerated for real.** `scripts/generate-sitemap.js` (run with `node scripts/generate-sitemap.js` after any listing changes) now produces a genuine per-listing sitemap — all 24 published properties get their own `?slug=` URL entry, closing a limitation Phase 0 had explicitly flagged. Filtered listing-page views and Location/Experience taxonomy pages are deliberately still excluded, matching the project's own canonical-URL rule (a filtered view should canonicalize to the unfiltered page, not be separately indexed) and the fact that no dedicated Location/Experience detail pages exist.

**robots.txt's "environment-aware" requirement doesn't apply.** The real spec calls for a disallow-all robots.txt in non-production environments. This project has exactly one deployment target (a single static push to Vercel/Netlify, no separate staging build), so there is no environment to be aware of — `robots.txt` is authored directly for production and left as-is.

**Media/S3 presign-register doesn't apply.** There is no upload flow anywhere in this project (no admin panel to upload through) — every image is a generated inline-SVG placeholder. The 10-image cap above is the one piece of that module's intent that still means something here.

**Per-entity SEO**, made real rather than assumed: `property-detail.js` now sets a distinct canonical URL and Open Graph tags per listing at render time (previously every listing shared one generic canonical tag on `property.html` — a real duplicate-content problem, now fixed).

Run the Phase 3 test suites with `node tests/listings.test.js` and `node tests/search.test.js` (42 tests total across all three phases' suites, all passing as of this commit). As with Phase 2, this phase was verified against a live local server (not just by tracing logic by hand) — that's what caught the search-matching gap above.

## Roadmap note: Phase 2 (Core Taxonomy) — implemented as static data, not an API

The original Implementation Roadmap's Phase 2 specifies "Locations, Experiences, and Property Types — full admin CRUD plus public read endpoints," including the `vertical_scope` constraint (a Tourism listing can never reference a Real-Estate-only property type, and vice versa). Re-scoped to this zero-backend site:

- **`js/taxonomy.js`** is now the single canonical source for all three — 7 Locations, 5 Experience tags, and 14 Property Types (6 Tourism-scoped, 8 Real-Estate-scoped, per the roadmap's own category lists). It replaces three previously-duplicated copies of this data (in `data.js`, and hand-written `<option>` markup in `tourism.html`/`real-estate.html`).
- "Admin CRUD" → hand-editing the arrays in `taxonomy.js` (there's no UI for it — building one would mean building the admin panel this project deliberately doesn't have).
- "Public read endpoints" → the accessor functions at the bottom of `taxonomy.js` (`getLocations()`, `getExperiences()`, `getPropertyTypes()`, etc.), called directly by other scripts instead of over HTTP. `tourism.html`/`real-estate.html`'s filter dropdowns are now populated dynamically from these functions at page load, so the taxonomy and the filter UI can never silently drift apart again.
- The `vertical_scope` constraint is a real, callable function — `isPropertyTypeValidForVertical(slug, verticalScope)` — and is covered by a dedicated test in `tests/taxonomy.test.js` (run with `node tests/taxonomy.test.js`, no dependencies) proving it rejects a Real-Estate-only type ("Land") for Tourism and vice versa, plus a cross-check that every one of the site's 24 existing listings actually respects it.
- Per the API Design document's own stated decision (reproduced here deliberately): there is **no** `getPropertyTypeBySlug()` accessor — no page in this site needs a property-type detail view, so none was added. Confirmed by a test.
- **Bug found and fixed during this phase's verification**: `initTourism()` and `initRealEstate()` in `filters.js` both keyed off `#listing-grid`, an ID present on both `tourism.html` and `real-estate.html` — so on `tourism.html`, the real-estate initializer also ran and crashed reading fields (`#filter-transaction`, min/max price) that don't exist on that page. This was pre-existing (not introduced by Phase 2) but had never been caught because the site had only been verified by hand-tracing logic, never actually run in a live browser. Fixed by tagging each page's `<body>` with `data-page="tourism"` / `data-page="real-estate"` and gating each initializer on it. Caught by running the site through a real local server and checking the browser console — worth remembering for future phases.

## Roadmap note: Phase 6 (Admin Panel UI) — deliberately not built

The roadmap's Phase 6 is, in full, an internal staff tool: content-management CRUD screens, a lead/enquiry dashboard with bulk actions and CSV export, a DPDP right-to-erasure control, staff/role management, and role-scoped navigation across five admin roles. Every one of those is an admin panel backed by a database and real authentication — precisely what Phase 1 already established doesn't exist in this project and won't be built ahead of an actual need.

Phase 5 (Public Frontend) had substantial real work behind its re-scoping because the *visitor-facing* site genuinely existed already and needed real fixes (the AI-crawler rendering gap, structured data, accessibility). Phase 6 has no equivalent: there is no honest static-site translation of "a secure, role-gated internal dashboard," because a client-side-only admin panel isn't a lesser version of the real thing — it's actively worse than having none. Anyone could view-source past a JS-only login gate; a "Property Manager can only see their assigned Real Estate listings" restriction enforced only in the browser is not a restriction at all. Building that would be security theatre, not a smaller admin panel.

What already substitutes for each piece of Phase 6's intent, honestly, without a backend:
- **Content management** → hand-editing `js/data.js`, `js/taxonomy.js`, `js/redirects.js` directly in source control, the same pattern used since Phase 2. A `git commit` *is* this project's publish action.
- **Lead/enquiry management** (list, status, export, erasure) → Formspree's own dashboard (Phase 4's documented equivalent) — view, export, and delete submissions there.
- **SEO Metadata editing** → the per-page `<title>`/`<meta description>`/canonical/OG tags are already hand-authored (static pages) or generated (`property/<slug>.html`, via `scripts/generate-property-pages.js`) directly in the files; there's no separate metadata layer to expose a UI over.
- **Staff/role management** → doesn't apply; there are no staff accounts, because there's no login.

If a real admin need ever arises — multiple non-technical people needing to publish listings without touching code — that's the point to introduce an actual backend (even a minimal one, e.g. a headless CMS or a small serverless API with real auth) and revisit this phase against it, not to retrofit a fake one now.

## Roadmap note: Phase 1 (Auth & RBAC) — deliberately not built

The project's original Implementation Roadmap specified a "Phase 1 — Auth & RBAC": JWT access/refresh tokens, Argon2 password hashing, and a five-role RBAC matrix enforced by backend guards. That phase exists to protect an **admin panel** backed by a **database of admin accounts** — neither of which exists in this build. The project was deliberately re-scoped to a zero-backend, zero-database static site (no admin panel, no CRM), so there is nothing for authentication or role-based access control to protect.

Building JWT/RBAC infrastructure with no admin surface behind it would be pure speculative complexity — real server-side auth also cannot exist without persistent storage (refresh-token rotation state, account records), which directly contradicts the "zero database" requirement. If an admin/content-management need arises later, this phase should be revisited then, scoped against whatever real backend is introduced at that time — not built ahead of that need.

This site is otherwise complete and launch-ready pending the placeholder replacements listed above.

## Design decisions

- **Palette**: deep forest green (`--color-forest`, `#1f4d3a`) as primary, a teal river blue (`--color-river`, `#2e6e7e`) as the link/secondary accent, warm gold/amber (`--color-gold`, `#c08a2e`) as the highlight accent, cream (`--color-cream`, `#faf6ee`) as the base background, and charcoal (`--color-charcoal`, `#2b2b26`) as body text — six tokens total, used consistently everywhere, with a full dark-mode token swap in `css/variables.css`.
- **Typography**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (a serif display face with real editorial weight) for all headings, [Inter](https://fonts.google.com/specimen/Inter) for body text — loaded via Google Fonts `<link>` tags with `serif`/`sans-serif` system fallback stacks specified in `variables.css`.
- **Grid**: CSS Grid-based listing cards, 1 column on mobile, 2 on tablet (≥640px), 3 on desktop (≥1024px), 4 on very wide screens (≥1400px).
- **Motion**: restrained — hover lift on cards/buttons, a smooth mobile-menu slide, no autoplay carousels or gratuitous animation.
- **Logo**: the real Avanya Tourism mark (`assets/logo-icon.png`) — cropped from the full brand lockup supplied by the business, background removed, resized for web use. Replaced the placeholder inline-SVG mountain glyph used in the header and footer since Phase 0. Brand text is now "Avanya Tourism" (previously "Avanya") to match.
- **Footer "Discover" column** replaced the old "Locations" column (which hardcoded only 4 of the 7 real locations — Darjeeling/Kalimpong/Dooars/Mirik — as dead-end static links). It now points to two new real pages generated from the same taxonomy/data single-source-of-truth as everywhere else in the site — `things-to-do.html` (one card per Experience tag in `js/taxonomy.js`, each with a real tagged-listing count from `js/data.js`, rendered by `js/things-to-do.js`) and `north-bengal.html` (one card per Location, each with real combined Tourism+Real Estate counts and two CTAs, rendered by `js/north-bengal.js`) — plus `blog.html`, an honest "coming soon" placeholder (marked `noindex`, excluded from `llms.txt`) rather than fabricated posts, matching this project's standing anti-fabrication rule. All 9 hand-authored pages, the `scripts/generate-property-pages.js` template (and thus all 24 generated property pages), `scripts/generate-sitemap.js`, and `scripts/generate-llms-txt.js` were updated together so the new pages are real, linked, and discoverable everywhere, not just from the two new pages themselves.
