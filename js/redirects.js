/* Old-slug -> current-slug redirect map — Phase 3's static equivalent of
 * GET /redirects/resolve and the admin redirect-management endpoints
 * (API Design Sections 5.6 and 6.7, FR-URL-004).
 *
 * "Admin redirect management" -> hand-editing REDIRECTS below (the same
 * pattern as taxonomy.js and data.js — there is no admin UI in this
 * project). Empty for now since every listing on this site has always had
 * its current slug; this exists so that if/when a listing's slug is ever
 * renamed, the old URL keeps working instead of silently 404ing, without
 * anyone needing to remember to build this mechanism later under time
 * pressure.
 *
 * Each entry: { from: 'old-slug', to: 'current-slug' }. `to` is looked up
 * against js/data.js's actual listings by property-detail.js, so a typo'd
 * or stale `to` value fails safely (falls through to 404.html) rather than
 * redirecting somewhere broken — see tests/listings.test.js.
 */

(function (root) {
  'use strict';

  var REDIRECTS = [
    /* Example shape for when a listing's slug is renamed in the future:
       { from: 'old-property-slug', to: 'new-property-slug' } */
  ];

  function resolveRedirect(oldSlug) {
    if (!oldSlug) return null;
    var match = REDIRECTS.filter(function (r) { return r.from === oldSlug; })[0];
    if (!match) return null;

    var target = root.AvanyaData ? root.AvanyaData.findBySlug(match.to) : null;
    if (!target || !(root.AvanyaListingRules && root.AvanyaListingRules.isPubliclyVisible(target))) {
      return null;
    }
    return 'property.html?slug=' + encodeURIComponent(match.to);
  }

  root.AvanyaRedirects = {
    REDIRECTS: REDIRECTS,
    resolveRedirect: resolveRedirect
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
