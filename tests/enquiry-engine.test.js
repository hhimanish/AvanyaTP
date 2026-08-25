/* Phase 4 (Enquiry Engine) verification.
 * Plain Node.js + assert, no dependencies. Run with:
 *
 *   node tests/enquiry-engine.test.js
 *
 * Loads the real js/taxonomy.js, js/listing-rules.js, js/data.js, and
 * js/enquiry-engine.js — the same files the browser loads.
 *
 * NOTE on scope: js/enquiry-form.js (the DOM-wiring layer — form submission,
 * the fetch() call, the fallback-on-failure UI) is deliberately NOT loaded
 * here. It touches `document` and `fetch` directly and has no dependency
 * this project is willing to add (jsdom, etc.) to fake a DOM under Node. It
 * is verified instead by running the real site through a live local server
 * and exercising the form in an actual browser — see this phase's README
 * section for what was checked that way and why a Node unit test isn't the
 * right tool for it.
 */

'use strict';

var assert = require('assert');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));
require(path.join(__dirname, '..', 'js', 'listing-rules.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'enquiry-engine.js'));

var data = global.AvanyaData;
var taxonomy = global.AvanyaTaxonomy;
var engine = global.AvanyaEnquiryEngine;

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

console.log('Phase 4 — Enquiry Engine tests\n');

/* ==================================================================
 * Lead reference ID format — AVN-T-YYYYMMDD-### / AVN-R-YYYYMMDD-###.
 * ================================================================== */
var fixedDate = new Date(2026, 7, 27); // 27 Aug 2026 (month is 0-indexed)

test('generateLeadId produces AVN-T-YYYYMMDD-### for the tourism module', function () {
  var id = engine.generateLeadId('tourism', fixedDate);
  assert.match(id, /^AVN-T-20260827-\d{3}$/);
});

test('generateLeadId produces AVN-R-YYYYMMDD-### for the real_estate module', function () {
  var id = engine.generateLeadId('real_estate', fixedDate);
  assert.match(id, /^AVN-R-20260827-\d{3}$/);
});

test('generateLeadId also accepts the data layer\'s "real-estate" spelling (hyphenated)', function () {
  var id = engine.generateLeadId('real-estate', fixedDate);
  assert.match(id, /^AVN-R-20260827-\d{3}$/);
});

test('generateLeadId defaults to the Tourism (T) prefix for an unrecognised/missing module (general enquiries)', function () {
  var id = engine.generateLeadId(null, fixedDate);
  assert.match(id, /^AVN-T-20260827-\d{3}$/);
});

test('two consecutive calls produce different reference numbers (not a static placeholder)', function () {
  var a = engine.generateLeadId('tourism', fixedDate);
  var b = engine.generateLeadId('tourism', fixedDate);
  // Not a strict guarantee (see the honest limitation documented in
  // enquiry-engine.js), but any real bug would make every id identical,
  // which this at least catches.
  var allSame = true;
  for (var i = 0; i < 20; i++) {
    if (engine.generateLeadId('tourism', fixedDate) !== a) { allSame = false; break; }
  }
  assert.strictEqual(allSame, false, 'generateLeadId returned the same id 20 times in a row — the random suffix is broken');
});

/* ==================================================================
 * Consent enforcement — matches API Design §7.4's documented 422
 * VALIDATION_ERROR shape exactly.
 * ================================================================== */
test('validateConsent rejects consent: false with the documented error shape', function () {
  var result = engine.validateConsent({ consent: false });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors[0].field, 'consent');
  assert.strictEqual(result.errors[0].issue, 'Consent to the Privacy Policy is required to submit an enquiry.');
});

test('validateConsent rejects a missing consent field entirely', function () {
  var result = engine.validateConsent({});
  assert.strictEqual(result.valid, false);
});

test('validateConsent rejects a truthy-but-not-strictly-true consent value ("yes", 1, etc.)', function () {
  assert.strictEqual(engine.validateConsent({ consent: 'yes' }).valid, false);
  assert.strictEqual(engine.validateConsent({ consent: 1 }).valid, false);
});

test('validateConsent accepts consent: true', function () {
  var result = engine.validateConsent({ consent: true });
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

/* ==================================================================
 * listing_snapshot — denormalised at submission time.
 * ================================================================== */
test('buildListingSnapshot captures name/location/propertyType/module for a real Tourism listing', function () {
  var item = data.findBySlug('dooars-riverside-forest-resort');
  var snapshot = engine.buildListingSnapshot(item, taxonomy);
  assert.strictEqual(snapshot.slug, 'dooars-riverside-forest-resort');
  assert.strictEqual(snapshot.name, 'Murti Riverside Forest Resort');
  assert.strictEqual(snapshot.location, 'Dooars');
  assert.strictEqual(snapshot.propertyType, 'Resort');
  assert.strictEqual(snapshot.module, 'tourism');
});

test('buildListingSnapshot captures the same shape for a Real Estate listing', function () {
  var item = data.findBySlug('kalimpong-hillside-plot');
  var snapshot = engine.buildListingSnapshot(item, taxonomy);
  assert.strictEqual(snapshot.name, 'Durpin Hillside Residential Plot');
  assert.strictEqual(snapshot.location, 'Kalimpong');
});

test('buildListingSnapshot returns null when there is no listing context (a general Contact-page enquiry)', function () {
  assert.strictEqual(engine.buildListingSnapshot(null, taxonomy), null);
});

/* ==================================================================
 * UTM attribution capture (FR-AN-007).
 * ================================================================== */
test('captureUtmParams reads utm_source/medium/campaign from a query string', function () {
  var utm = engine.captureUtmParams('?utm_source=google&utm_medium=cpc&utm_campaign=dooars-oct');
  assert.deepStrictEqual(utm, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'dooars-oct' });
});

test('captureUtmParams omits keys that are absent rather than including them as empty strings', function () {
  var utm = engine.captureUtmParams('?utm_source=google');
  assert.deepStrictEqual(utm, { utm_source: 'google' });
});

test('captureUtmParams returns an empty object for a query string with no UTM params', function () {
  assert.deepStrictEqual(engine.captureUtmParams('?foo=bar'), {});
  assert.deepStrictEqual(engine.captureUtmParams(''), {});
});

/* ==================================================================
 * Full payload assembly.
 * ================================================================== */
test('buildEnquiryPayload assembles module, enquiryType, a leadId, consent, and listingSnapshot together', function () {
  var item = data.findBySlug('mirik-lakeview-hotel');
  var payload = engine.buildEnquiryPayload(
    { module: 'tourism', enquiryType: 'stay', consent: true },
    { listingItem: item, taxonomy: taxonomy, search: '?utm_source=google', now: fixedDate }
  );
  assert.strictEqual(payload.module, 'tourism');
  assert.strictEqual(payload.enquiryType, 'stay');
  assert.match(payload.leadId, /^AVN-T-20260827-\d{3}$/);
  assert.strictEqual(payload.consent, true);
  assert.strictEqual(payload.listingSnapshot.name, 'Sumendu Lakeview Hotel');
  assert.strictEqual(payload.utm_source, 'google');
});

test('buildEnquiryPayload defaults enquiryType to "general" when unspecified (the Contact-page case)', function () {
  var payload = engine.buildEnquiryPayload({ module: null, consent: true }, {});
  assert.strictEqual(payload.enquiryType, 'general');
  assert.strictEqual(payload.listingSnapshot, null);
});

test('buildEnquiryPayload treats a checkbox\'s "on" string value as true (real <form> behaviour)', function () {
  var payload = engine.buildEnquiryPayload({ consent: 'on' }, {});
  assert.strictEqual(payload.consent, true);
});

test('buildEnquiryPayload treats a missing consent field as false, never silently true', function () {
  var payload = engine.buildEnquiryPayload({}, {});
  assert.strictEqual(payload.consent, false);
});

console.log('\n' + passed + ' passed, ' + failures + ' failed\n');
process.exit(failures > 0 ? 1 : 0);
