/* Avanya Listing Business Rules — Phase 3 (Listings).
 *
 * The project's Technical Architecture Document states this principle explicitly:
 * "business rules stay in application code where they can be unit-tested" (as
 * opposed to being buried in a schema or, here, scattered across UI scripts).
 * This file is that application-code layer for the rules Phase 3 specifies:
 *
 *   - publish-state visibility (a draft/archived listing must never appear
 *     publicly)
 *   - the 10-image-per-listing cap
 *   - the related-listings ("You May Also Like") algorithm
 *
 * Kept separate from data.js (the content) and listings.js (the rendering) so
 * each of these rules is independently testable — see tests/listings.test.js,
 * which loads this exact file under Node, the same file the browser loads via
 * <script>, so a bug caught by the test is a bug the site actually has.
 */

(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
   * Publish-state visibility.
   *
   * Every listing in js/data.js carries a `status` field: 'published' |
   * 'draft' | 'archived' (mirroring the project's publish_state vocabulary).
   * A draft or archived listing must never appear in a public list, and must
   * not be independently viewable on its detail page either — there is no
   * admin preview mode in a static site, so "not public" has to mean "not
   * reachable at all," which is the stricter, safer reading of the original
   * requirement.
   * ---------------------------------------------------------------- */
  function isPubliclyVisible(item) {
    return !!item && item.status === 'published';
  }

  function getPublishedListings(items) {
    return (items || []).filter(isPubliclyVisible);
  }

  /* ------------------------------------------------------------------
   * The 10-image-per-listing cap.
   *
   * This site has no real per-image upload flow (no admin panel to upload
   * through), so there is no "application layer" and "database trigger"
   * pair to build in the way a real backend would. What DOES translate
   * directly: a listing's gallery must never be able to render more than 10
   * images under any circumstance, including a future content edit that
   * mistakenly sets a higher count. getGalleryImages() is that guarantee —
   * it is the one and only place gallery length is ever computed, and it
   * physically cannot return more than MAX_IMAGES_PER_LISTING regardless of
   * what a listing's data claims. See tests/listings.test.js for a listing
   * that deliberately requests 15 images and confirms only 10 are returned.
   * ---------------------------------------------------------------- */
  var MAX_IMAGES_PER_LISTING = 10;
  var DEFAULT_IMAGE_COUNT = 4;

  function getGalleryImages(item) {
    var requested = item && typeof item.imageCount === 'number' ? item.imageCount : DEFAULT_IMAGE_COUNT;
    var count = Math.max(1, Math.min(requested, MAX_IMAGES_PER_LISTING));
    var theme = item ? item.placeholderTheme : 'forest';
    var images = [];
    for (var i = 0; i < count; i++) images.push(theme);
    return images;
  }

  /* ------------------------------------------------------------------
   * Related listings ("You May Also Like" — BRD FR-38).
   *
   * Matches the documented algorithm exactly (API Design / TAD Section 6.4):
   *   - Tourism: same primary location AND at least one shared experience tag
   *   - Real Estate: same property type AND at least one overlapping
   *     transaction type (buy/lease)
   * Both exclude the current listing itself and only ever consider published
   * listings, capped at `limit` (the spec's own range is 4-6; this site
   * defaults to 4 given its smaller synthetic dataset).
   *
   * NOTE on the AND vs. OR distinction: an earlier version of this site's
   * property-detail.js used OR ("same location OR shared tag") instead of
   * AND — looser, and not what the spec documents. Phase 3's own exit
   * criteria specifically require this algorithm be verified "against seeded
   * data with a known-correct expected result set" — see
   * tests/listings.test.js, which caught and pins down this exact
   * distinction with hand-computed expected results.
   * ---------------------------------------------------------------- */
  var DEFAULT_RELATED_LIMIT = 4;

  function findRelatedListings(item, allItems, opts) {
    opts = opts || {};
    var limit = opts.limit || DEFAULT_RELATED_LIMIT;
    var pool = getPublishedListings(allItems).filter(function (other) {
      return other.slug !== item.slug && other.module === item.module;
    });

    if (item.module === 'tourism') {
      return pool.filter(function (other) {
        var sameLocation = other.location === item.location;
        var sharedTag = (other.experienceTags || []).some(function (t) {
          return (item.experienceTags || []).indexOf(t) !== -1;
        });
        return sameLocation && sharedTag;
      }).slice(0, limit);
    }

    return pool.filter(function (other) {
      var sameType = other.propertyType === item.propertyType;
      var sharedTxn = (other.transactionType || []).some(function (t) {
        return (item.transactionType || []).indexOf(t) !== -1;
      });
      return sameType && sharedTxn;
    }).slice(0, limit);
  }

  root.AvanyaListingRules = {
    MAX_IMAGES_PER_LISTING: MAX_IMAGES_PER_LISTING,
    DEFAULT_RELATED_LIMIT: DEFAULT_RELATED_LIMIT,
    isPubliclyVisible: isPubliclyVisible,
    getPublishedListings: getPublishedListings,
    getGalleryImages: getGalleryImages,
    findRelatedListings: findRelatedListings
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
