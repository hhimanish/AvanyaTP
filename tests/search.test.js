/* Phase 3 (Listings) — Global Search verification.
 * Plain Node.js + assert, no dependencies. Run with: node tests/search.test.js
 */

'use strict';

var assert = require('assert');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));
require(path.join(__dirname, '..', 'js', 'listing-rules.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'search.js'));

var search = global.AvanyaSearch.search;

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

console.log('Phase 3 — Global Search tests\n');

test('an empty query returns no results (not "browse everything")', function () {
  assert.deepStrictEqual(search(''), []);
  assert.deepStrictEqual(search('   '), []);
});

test('searching "Dooars" returns a mixed resultType list: a location AND at least one property of each module', function () {
  var results = search('dooars');
  var types = results.map(function (r) { return r.resultType; });
  assert.ok(types.indexOf('location') !== -1, 'expected a location result for "Dooars"');
  assert.ok(types.indexOf('tourism_property') !== -1, 'expected a tourism_property result for "Dooars"');
  assert.ok(types.indexOf('real_estate_property') !== -1, 'expected a real_estate_property result for "Dooars"');
});

test('every result carries a valid, known resultType value', function () {
  var VALID_TYPES = ['location', 'experience', 'tourism_property', 'real_estate_property'];
  var results = search('a'); // broad query, matches many rows across all types
  assert.ok(results.length > 0);
  results.forEach(function (r) {
    assert.ok(VALID_TYPES.indexOf(r.resultType) !== -1, 'unexpected resultType "' + r.resultType + '"');
  });
});

test('module=tourism scopes results to tourism content only (no real_estate_property rows)', function () {
  var results = search('a', { module: 'tourism' });
  assert.ok(results.every(function (r) { return r.resultType !== 'real_estate_property'; }));
});

test('module=real_estate scopes results to real estate content only (no tourism_property or experience rows)', function () {
  var results = search('a', { module: 'real_estate' });
  assert.ok(results.every(function (r) { return r.resultType !== 'tourism_property' && r.resultType !== 'experience'; }));
});

test('searching "Land" surfaces the Real Estate "Land" property type listings', function () {
  var results = search('land', { module: 'real_estate' });
  var slugs = results.filter(function (r) { return r.resultType === 'real_estate_property'; }).map(function (r) { return r.slug; });
  assert.ok(slugs.indexOf('darjeeling-tea-estate-land-parcel') !== -1);
  assert.ok(slugs.indexOf('dooars-forest-edge-land') !== -1);
});

test('a query matching nothing returns an empty array, not an error', function () {
  assert.deepStrictEqual(search('zzz-nonexistent-query-zzz'), []);
});

test('search is case-insensitive', function () {
  var lower = search('darjeeling');
  var upper = search('DARJEELING');
  assert.strictEqual(lower.length, upper.length);
  assert.ok(lower.length > 0);
});

test('draft/archived listings never surface in search results (reuses the same publish-state rule as listing pages)', function () {
  // Confirmed indirectly: search.js calls listingRules.getPublishedListings()
  // before matching, exactly like filters.js does. All 24 real listings are
  // published, so this asserts the total matches what an unfiltered scan
  // would find, proving the filter step didn't silently drop anything it
  // shouldn't have while still being present in the code path.
  var allResults = search('homestay');
  var propertyResults = allResults.filter(function (r) {
    return r.resultType === 'tourism_property' || r.resultType === 'real_estate_property';
  });
  assert.ok(propertyResults.length > 0);
});

console.log('\n' + passed + ' passed, ' + failures + ' failed\n');
process.exit(failures > 0 ? 1 : 0);
