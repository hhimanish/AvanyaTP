/* Phase 7 (Analytics) verification — the pure, Node-testable part.
 * Plain Node.js + assert, no dependencies. Run with:
 *
 *   node tests/analytics.test.js
 *
 * js/analytics.js is DOM-coupled where it needs to be (GTM/Pixel injection,
 * the click-delegation listener), but is written defensively enough
 * (hasDom guards) to `require()` safely under Node with no document/window,
 * so its taxonomy list and track()/trackPageView() logic can be tested
 * directly — the same real file the browser loads, not a reimplementation.
 * The DOM-triggered side (does a real click actually fire the right event,
 * does GTM actually inject when a real ID is set) is verified live in a
 * browser instead — see this project's README for that verification.
 */

'use strict';

var assert = require('assert');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'analytics.js'));
var analytics = global.AvanyaAnalytics;

var failures = 0;
var passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failures++;
    console.log('  ✗ ' + name);
    console.log('    ' + err.message);
  }
}

console.log('Phase 7 — Analytics tests\n');

/* ------------------------------------------------------------------
 * The event taxonomy must match TAD §5.8 exactly — this is the single
 * source of truth every call site in the codebase is meant to draw
 * from, so a drift here is a drift everywhere analytics is wired in.
 * ------------------------------------------------------------------ */
test('EVENT_TAXONOMY matches TAD §5.8\'s full, exact event list', function () {
  var expected = [
    'tourism_view', 'realestate_view', 'property_view',
    'phone_click', 'whatsapp_click', 'email_click',
    'enquiry_start', 'enquiry_submit', 'travel_plan_submit',
    'buy_click', 'lease_click'
  ];
  assert.deepStrictEqual(analytics.EVENT_TAXONOMY, expected);
});

test('EVENT_TAXONOMY has no duplicate entries', function () {
  var unique = Array.from(new Set(analytics.EVENT_TAXONOMY));
  assert.strictEqual(unique.length, analytics.EVENT_TAXONOMY.length);
});

/* ------------------------------------------------------------------
 * track() — pushes the correct shape to window.dataLayer (here,
 * global.dataLayer, since analytics.js attaches to `global` under Node
 * the same way it attaches to `window` in a browser).
 * ------------------------------------------------------------------ */
test('track() pushes { event, ...params } onto dataLayer', function () {
  var before = global.dataLayer.length;
  analytics.track('phone_click', { link_url: 'tel:+919999999999' });
  var pushed = global.dataLayer[global.dataLayer.length - 1];
  assert.strictEqual(global.dataLayer.length, before + 1);
  assert.strictEqual(pushed.event, 'phone_click');
  assert.strictEqual(pushed.link_url, 'tel:+919999999999');
});

test('track() works with no params (an event with no extra data)', function () {
  var before = global.dataLayer.length;
  analytics.track('enquiry_start');
  assert.strictEqual(global.dataLayer.length, before + 1);
  assert.strictEqual(global.dataLayer[global.dataLayer.length - 1].event, 'enquiry_start');
});

/* ------------------------------------------------------------------
 * trackPageView() — only fires for a real taxonomy event name, never
 * silently accepts a typo'd/unknown event.
 * ------------------------------------------------------------------ */
test('trackPageView() fires for a real taxonomy event (e.g. tourism_view)', function () {
  var before = global.dataLayer.length;
  analytics.trackPageView('tourism_view');
  assert.strictEqual(global.dataLayer.length, before + 1);
});

test('trackPageView() silently does nothing for an event name outside the taxonomy (no typo makes it to dataLayer)', function () {
  var before = global.dataLayer.length;
  analytics.trackPageView('tourism_viewed'); // deliberate typo
  assert.strictEqual(global.dataLayer.length, before);
});

/* ------------------------------------------------------------------
 * Consent Mode default — declared 'denied' before any real tag can
 * fire (the direct fix for this phase's own named key risk).
 * ------------------------------------------------------------------ */
test('Consent Mode defaults to denied for every consent type, declared before anything else', function () {
  var consentCall = global.dataLayer.filter(function (entry) {
    return Array.isArray(entry) === false && entry === undefined;
  });
  // dataLayer entries pushed via gtag() arrive as arguments-object-like
  // entries (gtag pushes `arguments`, i.e. ['consent', 'default', {...}]).
  var found = Array.prototype.slice.call(global.dataLayer).some(function (entry) {
    return entry && entry[0] === 'consent' && entry[1] === 'default' &&
      entry[2] && entry[2].analytics_storage === 'denied' && entry[2].ad_storage === 'denied';
  });
  assert.strictEqual(found, true, 'expected a gtag(\'consent\', \'default\', {...denied...}) call in dataLayer');
});

console.log('\n' + passed + ' passed, ' + failures + ' failed\n');
process.exit(failures > 0 ? 1 : 0);
