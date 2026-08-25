/* Phase 3 (Listings) verification.
 *
 * Plain Node.js + the built-in `assert` module, no framework, no dependency.
 * Run with:
 *
 *   node tests/listings.test.js
 *
 * Loads the real js/taxonomy.js, js/listing-rules.js, js/data.js, and
 * js/redirects.js files — the exact same files the browser loads — so a
 * passing test here is a real guarantee about the live site, not a
 * divergent test-only reimplementation.
 */

'use strict';

var assert = require('assert');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));
require(path.join(__dirname, '..', 'js', 'listing-rules.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'redirects.js'));

var data = global.AvanyaData;
var listingRules = global.AvanyaListingRules;
var redirects = global.AvanyaRedirects;

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

console.log('Phase 3 — Listings tests\n');

/* ==================================================================
 * THE named, non-negotiable security test: the public/internal
 * boundary on Real Estate listings. The roadmap's own exit criteria
 * demand this be an explicit, permanent test, not a "looks right"
 * check — and calls it "the single highest-priority security
 * dependency named anywhere in this document set."
 *
 * In a real backend, this is enforced by PublicRealEstateListingDto
 * structurally excluding internal_attributes. This site has no
 * backend and no admin/public tiering at all — everything shipped in
 * js/data.js is, by definition, public, forever, to anyone who views
 * source. So the only correct static-site equivalent of "the public
 * DTO never carries this field" is: THIS FIELD MUST NOT EXIST IN THE
 * SHIPPED DATA AT ALL. There is no safe middle ground.
 * ================================================================== */
var FORBIDDEN_INTERNAL_KEYS = [
  'internalAttributes', 'internal_attributes',
  'revenueOrLeaseIncome', 'revenue_or_lease_income',
  'ownershipSellerReference', 'ownership_seller_reference',
  'ownerReference', 'owner_reference', 'ownerContact', 'sellerContact'
];

test('no Real Estate listing in js/data.js contains any internal-only field (the security-critical boundary)', function () {
  data.REAL_ESTATE_LISTINGS.forEach(function (item) {
    FORBIDDEN_INTERNAL_KEYS.forEach(function (key) {
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(item, key),
        false,
        'Listing "' + item.slug + '" has forbidden internal-only field "' + key + '" — ' +
        'this field must never exist in a statically-shipped file, since there is no server ' +
        'to keep it private. Remove it entirely; it cannot be "gated" in a static site.'
      );
    });
  });
});

test('no Tourism listing contains any internal-only field either (defense in depth)', function () {
  data.TOURISM_LISTINGS.forEach(function (item) {
    FORBIDDEN_INTERNAL_KEYS.forEach(function (key) {
      assert.strictEqual(Object.prototype.hasOwnProperty.call(item, key), false);
    });
  });
});

/* ==================================================================
 * The 10-image-per-listing cap.
 * ================================================================== */
test('getGalleryImages() never returns more than 10 images, even if a listing requests more', function () {
  var overSizedListing = { placeholderTheme: 'forest', imageCount: 15 };
  var images = listingRules.getGalleryImages(overSizedListing);
  assert.strictEqual(images.length, 10);
});

test('getGalleryImages() returns exactly the requested count when within the cap', function () {
  var listing = { placeholderTheme: 'river', imageCount: 6 };
  assert.strictEqual(listingRules.getGalleryImages(listing).length, 6);
});

test('getGalleryImages() falls back to a sensible default (4) when imageCount is unset', function () {
  var listing = { placeholderTheme: 'heritage' };
  assert.strictEqual(listingRules.getGalleryImages(listing).length, 4);
});

test('no existing listing in js/data.js declares an imageCount over the 10-image cap', function () {
  data.ALL_LISTINGS.forEach(function (item) {
    if (typeof item.imageCount === 'number') {
      assert.ok(item.imageCount <= listingRules.MAX_IMAGES_PER_LISTING, 'Listing "' + item.slug + '" declares imageCount ' + item.imageCount);
    }
  });
});

/* ==================================================================
 * Publish-state visibility — a draft/archived listing must never be
 * publicly visible.
 * ================================================================== */
test('a draft listing is excluded by getPublishedListings()', function () {
  var mixed = [
    { slug: 'a', status: 'published' },
    { slug: 'b', status: 'draft' },
    { slug: 'c', status: 'archived' },
    { slug: 'd', status: 'published' }
  ];
  var visible = listingRules.getPublishedListings(mixed).map(function (i) { return i.slug; });
  assert.deepStrictEqual(visible, ['a', 'd']);
});

test('isPubliclyVisible() rejects a listing with no status field at all (fail closed, not open)', function () {
  assert.strictEqual(listingRules.isPubliclyVisible({ slug: 'x' }), false);
});

test('every one of the 24 real listings in js/data.js is currently published', function () {
  assert.strictEqual(data.ALL_LISTINGS.length, 24);
  assert.strictEqual(listingRules.getPublishedListings(data.ALL_LISTINGS).length, 24);
});

/* ==================================================================
 * Related listings ("You May Also Like") — the documented AND
 * algorithm, verified against seeded data with hand-computed,
 * known-correct expected results (per the roadmap's own exit
 * criteria wording).
 * ================================================================== */
test('Tourism related listings: same location AND shared experience tag (both required)', function () {
  var item = data.findBySlug('darjeeling-heritage-bungalow-retreat');
  // location=darjeeling, tags=[heritage-colonial, mountain-views]
  // The only other Darjeeling Tourism listing is darjeeling-tea-garden-homestay,
  // which shares the 'mountain-views' tag -> matches (location AND tag both true).
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS).map(function (r) { return r.slug; });
  assert.deepStrictEqual(related.sort(), ['darjeeling-tea-garden-homestay']);
});

test('Tourism related listings: same location alone is NOT enough without a shared tag (AND, not OR)', function () {
  var item = data.findBySlug('kurseong-colonial-tea-bungalow');
  // location=kurseong, tags=[tea-garden-stays, heritage-colonial]
  // The only other Kurseong listing, kurseong-misty-ridge-homestay, has tags
  // [mountain-views] — same location but NO shared tag, so under strict AND
  // logic it must be excluded. (Under the old, incorrect OR logic this would
  // have wrongly matched on location alone.)
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS);
  assert.deepStrictEqual(related, []);
});

test('Real Estate related listings: same property type AND overlapping transaction type (both required)', function () {
  var item = data.findBySlug('dooars-forest-edge-land');
  // propertyType=Land, transactionType=[buy, lease]
  // Other Land listings: darjeeling-tea-estate-land-parcel (buy) and
  // kalimpong-hillside-plot (buy, lease) — both share type=Land AND at least
  // one overlapping transaction type -> both match.
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS).map(function (r) { return r.slug; });
  assert.deepStrictEqual(related.sort(), ['darjeeling-tea-estate-land-parcel', 'kalimpong-hillside-plot'].sort());
});

test('related listings never include the item itself', function () {
  var item = data.findBySlug('mirik-lakeview-hotel');
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS);
  assert.ok(related.every(function (r) { return r.slug !== item.slug; }));
});

test('related listings never cross modules (a Tourism listing never recommends a Real Estate one)', function () {
  var item = data.findBySlug('dooars-riverside-forest-resort');
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS);
  assert.ok(related.every(function (r) { return r.module === item.module; }));
});

/* ==================================================================
 * Redirects (GET /redirects/resolve equivalent).
 * ================================================================== */
test('resolveRedirect() returns null for a slug with no redirect entry', function () {
  assert.strictEqual(redirects.resolveRedirect('never-existed-slug'), null);
});

test('resolveRedirect() returns null (never throws) for a null/empty slug', function () {
  assert.strictEqual(redirects.resolveRedirect(null), null);
  assert.strictEqual(redirects.resolveRedirect(''), null);
});

console.log('\n' + passed + ' passed, ' + failures + ' failed\n');
process.exit(failures > 0 ? 1 : 0);
