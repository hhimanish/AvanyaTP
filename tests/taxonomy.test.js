/* Phase 2 (Core Taxonomy) verification.
 *
 * Plain Node.js + the built-in `assert` module — no test framework, no npm
 * dependency, matching this site's "no build step" requirement. Run with:
 *
 *   node tests/taxonomy.test.js
 *
 * This loads the exact same js/taxonomy.js file the website's <script> tags
 * load in the browser (it attaches to `global` here instead of `window` —
 * see the IIFE's final line in taxonomy.js), so a bug here is a real bug in
 * production, not a divergent test-only copy of the logic.
 */

'use strict';

var assert = require('assert');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));
var taxonomy = global.AvanyaTaxonomy;

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

console.log('Phase 2 — Core Taxonomy tests\n');

/* ------------------------------------------------------------------
 * Seed-data shape: matches the counts Phase 0's seed data specifies
 * (7 Locations, 5 Experiences) so a later phase can trust these numbers
 * without re-deriving them.
 * ------------------------------------------------------------------ */
test('exactly 7 published Locations exist', function () {
  assert.strictEqual(taxonomy.getLocations().length, 7);
});

test('exactly 5 published Experiences exist', function () {
  assert.strictEqual(taxonomy.getExperiences().length, 5);
});

test('Tourism Property Types match the roadmap-specified set (6 types)', function () {
  var names = taxonomy.getPropertyTypes({ verticalScope: 'tourism' }).map(function (t) { return t.name; });
  assert.deepStrictEqual(names, ['Homestay', 'Resort', 'Heritage Bungalow', 'Tea Bungalow', 'Farm Stay', 'Hotel']);
});

test('Real Estate Property Types match the roadmap-specified set (8 types)', function () {
  var names = taxonomy.getPropertyTypes({ verticalScope: 'real_estate' }).map(function (t) { return t.name; });
  assert.deepStrictEqual(names, ['Land', 'Homestay', 'Resort', 'Heritage Bungalow', 'Tea Bungalow', 'Hotel', 'Flat', 'House']);
});

/* ------------------------------------------------------------------
 * Public read accessors ("GET /locations", "GET /experiences",
 * "GET /property-types" in the API Design document's terms).
 * ------------------------------------------------------------------ */
test('getLocationBySlug returns the correct record for a known slug', function () {
  var loc = taxonomy.getLocationBySlug('dooars');
  assert.ok(loc);
  assert.strictEqual(loc.name, 'Dooars');
});

test('getLocationBySlug returns null for an unknown slug', function () {
  assert.strictEqual(taxonomy.getLocationBySlug('nonexistent-place'), null);
});

test('getExperienceBySlug returns the correct record for a known slug', function () {
  var exp = taxonomy.getExperienceBySlug('river-front');
  assert.ok(exp);
  assert.strictEqual(exp.name, 'River Front');
});

test('getLocations(verticalScope) never excludes a "both"-scoped location', function () {
  var tourismLocations = taxonomy.getLocations({ verticalScope: 'tourism' });
  var realEstateLocations = taxonomy.getLocations({ verticalScope: 'real_estate' });
  assert.strictEqual(tourismLocations.length, 7);
  assert.strictEqual(realEstateLocations.length, 7);
});

/* ------------------------------------------------------------------
 * THE key-risk test: the vertical_scope composite constraint.
 * A Tourism listing must never be able to reference a Real-Estate-only
 * property type, and vice versa. This is exactly the rule the roadmap's
 * own "Key risk" callout warns is easy to skip and expensive to catch
 * later, once Phase 3/4 listing-creation code is built on top of it.
 * ------------------------------------------------------------------ */
test('a Real-Estate-only type ("Land") is REJECTED for the tourism vertical', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('land', 'tourism'), false);
});

test('a Real-Estate-only type ("Land") is ACCEPTED for the real_estate vertical', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('land', 'real_estate'), true);
});

test('a Tourism-only type ("Farm Stay" / "farm-stay") is REJECTED for the real_estate vertical', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('farm-stay', 'real_estate'), false);
});

test('a Tourism-only type ("Farm Stay" / "farm-stay") is ACCEPTED for the tourism vertical', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('farm-stay', 'tourism'), true);
});

test('a type that exists in BOTH verticals ("Homestay") is accepted correctly for each, independently', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('homestay', 'tourism'), true);
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('homestay', 'real_estate'), true);
});

test('an unknown slug is rejected for every vertical, not just silently ignored', function () {
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('helicopter-pad', 'tourism'), false);
  assert.strictEqual(taxonomy.isPropertyTypeValidForVertical('helicopter-pad', 'real_estate'), false);
});

/* ------------------------------------------------------------------
 * Confirms the deliberate omission (API Design §5.1's documented
 * decision, applied here): no property-type-detail accessor exists,
 * because no page in this site ever needs one.
 * ------------------------------------------------------------------ */
test('no getPropertyTypeBySlug() accessor exists (deliberate omission, matches the spec)', function () {
  assert.strictEqual(typeof taxonomy.getPropertyTypeBySlug, 'undefined');
});

/* ------------------------------------------------------------------
 * Cross-check against the actual listing data every existing listing's
 * propertyType/location values resolve to a real taxonomy entry that is
 * valid for that listing's own vertical — i.e. the constraint above
 * was never silently bypassed when js/data.js's listings were authored.
 * ------------------------------------------------------------------ */
test('every existing listing in js/data.js references a property type valid for its own vertical', function () {
  var dataModule = require(path.join(__dirname, '..', 'js', 'data.js'));
  var avanyaData = global.AvanyaData;
  var bySlug = {};
  taxonomy.getPropertyTypes({ verticalScope: 'tourism' }).forEach(function (t) { bySlug[t.name] = true; });

  avanyaData.TOURISM_LISTINGS.forEach(function (item) {
    var slug = item.propertyType.toLowerCase().replace(/\s+/g, '-');
    assert.strictEqual(
      taxonomy.isPropertyTypeValidForVertical(slug, 'tourism'),
      true,
      'Tourism listing "' + item.slug + '" references invalid property type "' + item.propertyType + '"'
    );
  });

  avanyaData.REAL_ESTATE_LISTINGS.forEach(function (item) {
    var slug = item.propertyType.toLowerCase().replace(/\s+/g, '-');
    assert.strictEqual(
      taxonomy.isPropertyTypeValidForVertical(slug, 'real_estate'),
      true,
      'Real Estate listing "' + item.slug + '" references invalid property type "' + item.propertyType + '"'
    );
  });
});

test('every existing listing references a real, published location', function () {
  var avanyaData = global.AvanyaData;
  avanyaData.ALL_LISTINGS.forEach(function (item) {
    assert.ok(
      taxonomy.getLocationBySlug(item.location),
      'Listing "' + item.slug + '" references unknown location "' + item.location + '"'
    );
  });
});

console.log('\n' + passed + ' passed, ' + failures + ' failed\n');
process.exit(failures > 0 ? 1 : 0);
