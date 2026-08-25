/* Analytics & Conversion Tracking — Phase 7 (Polish, Analytics & Phase-2-Ready
 * Features). Implements TAD §5.8's typed event taxonomy and BRD §19's
 * KPI-tracking requirement via Google Tag Manager, with Consent Mode v2
 * defaults declared safely before anything else runs.
 *
 * Ships with EMPTY IDs by default — matching this project's established
 * pattern everywhere else (contact details, Formspree ID): a placeholder
 * that no-ops rather than firing real events against a real analytics
 * property. Nothing here reaches Google/Meta's servers until a real GTM
 * container ID is supplied below.
 *
 * IMPORTANT, stated honestly: this file cannot be verified against a real
 * GA4/Meta dashboard from this environment — that requires the business's
 * own GTM/GA4/Meta Business accounts and a live (non-localhost) deployment,
 * neither of which exist here. What CAN be and WAS verified: the mechanism
 * itself — every event in the taxonomy below actually pushes the correct
 * shape to window.dataLayer at the correct moment (page view, click,
 * form interaction) — see tests/analytics.test.js for the taxonomy check
 * and this project's README for the live-browser dataLayer verification
 * performed. Once a real GTM_CONTAINER_ID is supplied, GTM's own Preview
 * mode (the tool this file is designed to work with, unmodified) is how a
 * human confirms live delivery — that step is a launch prerequisite the
 * business must perform themselves with real credentials.
 */

(function (root) {
  'use strict';

  /* ---- Configuration — replace before launch (see README) ---- */
  var GTM_CONTAINER_ID = ''; // e.g. 'GTM-XXXXXXX' — leave empty to keep analytics fully inert
  var META_PIXEL_ID = ''; // e.g. '1234567890123456' — leave empty to skip Meta Pixel entirely

  root.dataLayer = root.dataLayer || [];
  function gtag() { root.dataLayer.push(arguments); }

  /* Consent Mode v2 defaults, declared before any tag fires. This is the
   * direct fix for the exact risk this phase's roadmap entry names — "a
   * Consent Mode misconfiguration blocking events" — except the more
   * dangerous failure mode is the opposite of what that phrase suggests:
   * an *undeclared* default doesn't block anything, it lets every tag fire
   * ungoverned. Declaring 'denied' explicitly is the safe, honest default
   * a real cookie-consent banner would later update to 'granted' once a
   * visitor actually consents. This project does not yet have that banner
   * built (a real gap, stated plainly in the README) — so today, even once
   * a real GTM ID is supplied, analytics_storage stays denied until that
   * banner exists. Shipping this default now means the day the banner is
   * added, there is no separate "wire up Consent Mode" task left undone.
   */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  function injectScript(src) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  }

  var hasDom = typeof document !== 'undefined';

  if (GTM_CONTAINER_ID && hasDom) {
    gtag('js', new Date());
    gtag('config', GTM_CONTAINER_ID);
    injectScript('https://www.googletagmanager.com/gtm.js?id=' + GTM_CONTAINER_ID);

    document.addEventListener('DOMContentLoaded', function () {
      var noscriptEl = document.createElement('noscript');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_CONTAINER_ID;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscriptEl.appendChild(iframe);
      document.body.insertBefore(noscriptEl, document.body.firstChild);
    });
  }

  if (META_PIXEL_ID && hasDom) {
    /* Standard Meta Pixel base code, loaded only when a real ID is supplied. */
    (function (f, b, e, v) {
      if (f.fbq) return;
      var n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      var t = b.createElement(e); t.async = true; t.src = v;
      var s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(root, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    root.fbq('init', META_PIXEL_ID);
    root.fbq('track', 'PageView');
  }

  /* ---------------------------------------------------------------------
   * Event taxonomy (TAD §5.8) — the exact, complete list. Every call site
   * in this codebase must use one of these names; tests/analytics.test.js
   * asserts the taxonomy itself matches the spec, so a typo'd event name
   * anywhere in the site would still push *a* dataLayer event, just not
   * one any dashboard configured against the real taxonomy would recognise
   * — this list is the single source of truth call sites are meant to
   * copy from, not re-type.
   * ------------------------------------------------------------------- */
  var EVENT_TAXONOMY = [
    'tourism_view', 'realestate_view', 'property_view',
    'phone_click', 'whatsapp_click', 'email_click',
    'enquiry_start', 'enquiry_submit', 'travel_plan_submit',
    'buy_click', 'lease_click'
  ];

  function track(eventName, params) {
    params = params || {};
    var payload = { event: eventName };
    Object.keys(params).forEach(function (k) { payload[k] = params[k]; });
    root.dataLayer.push(payload);
    if (!GTM_CONTAINER_ID && root.console && root.console.debug) {
      /* No container configured: log clearly so a developer can see events
         firing correctly during local testing without this ever reaching
         a real analytics property. */
      console.debug('[Avanya Analytics — no GTM container configured, not sent anywhere real]', eventName, params);
    }
  }

  function trackPageView(eventName, params) {
    if (EVENT_TAXONOMY.indexOf(eventName) === -1) return;
    if (hasDom && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { track(eventName, params); });
    } else {
      track(eventName, params);
    }
  }

  /* Contact-channel click tracking (phone_click/whatsapp_click/email_click)
     via one delegated listener — works site-wide against every tel:/wa.me/
     mailto: link (header, footer, sticky bar, property action bar, contact
     page) without needing each of those links individually instrumented. */
  if (hasDom) {
    document.addEventListener('DOMContentLoaded', function () {
      document.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a[href]') : null;
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (href.indexOf('tel:') === 0) track('phone_click', { link_url: href });
        else if (href.indexOf('https://wa.me') === 0 || href.indexOf('http://wa.me') === 0) track('whatsapp_click', { link_url: href });
        else if (href.indexOf('mailto:') === 0) track('email_click', { link_url: href });
      });
    });
  }

  root.AvanyaAnalytics = {
    EVENT_TAXONOMY: EVENT_TAXONOMY,
    track: track,
    trackPageView: trackPageView
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
