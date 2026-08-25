/* Global free-text search — Phase 3's static-site equivalent of GET /search
 * (BRD FR-80, API Design Section 5.7).
 *
 * The real endpoint's contract: query params ?q=&module=tourism|real_estate,
 * response is a mixed-type result list where each row carries a `resultType`
 * (location | experience | tourism_property | real_estate_property) so the
 * caller can render one unified results list. With no server, that becomes a
 * plain function search(query, opts) returning the same shape — called
 * directly by search.html instead of over HTTP.
 *
 * Searches across listing names, locations, experience tags, and
 * descriptions, matching FR-80's stated scope exactly. Case-insensitive
 * substring match (the same lightweight approach data.js's per-page filter
 * search boxes already use) — this project's Database Design Document
 * specifies a proper Postgres full-text index for the real backend; a
 * substring match is this static site's honest, un-embellished equivalent.
 */

(function (root) {
  'use strict';

  function norm(s) {
    return String(s || '').toLowerCase();
  }

  function matchesQuery(haystack, query) {
    return norm(haystack).indexOf(norm(query)) !== -1;
  }

  function searchLocations(query, taxonomy, linkTarget) {
    return taxonomy.getLocations().filter(function (loc) {
      return matchesQuery(loc.name, query);
    }).map(function (loc) {
      return {
        resultType: 'location',
        name: loc.name,
        slug: loc.slug,
        href: linkTarget + '?location=' + encodeURIComponent(loc.slug)
      };
    });
  }

  function searchExperiences(query, taxonomy) {
    return taxonomy.getExperiences().filter(function (exp) {
      return matchesQuery(exp.name, query);
    }).map(function (exp) {
      return {
        resultType: 'experience',
        name: exp.name,
        slug: exp.slug,
        href: 'tourism.html?experience=' + encodeURIComponent(exp.slug)
      };
    });
  }

  function searchListings(query, listings, resultType, listingRules, taxonomy) {
    return listingRules.getPublishedListings(listings).filter(function (item) {
      var locationName = (taxonomy.getLocationBySlug(item.location) || {}).name || '';
      var experienceNames = (item.experienceTags || []).map(function (slug) {
        return (taxonomy.getExperienceBySlug(slug) || {}).name || '';
      }).join(' ');
      /* Matches BRD FR-80's stated scope exactly: "listing names, locations,
         experiences and descriptions" — not just a listing's own name/
         description. A search for "Dooars" must find every listing located
         in Dooars even when the word "Dooars" never appears in the listing's
         own copy (a real, common case — see tests/search.test.js, which
         caught this gap when the haystack only covered name+description). */
      var haystack = [item.name, item.description, item.propertyType, locationName, experienceNames].join(' ');
      return matchesQuery(haystack, query);
    }).map(function (item) {
      return {
        resultType: resultType,
        name: item.name,
        slug: item.slug,
        propertyType: item.propertyType,
        location: item.location,
        placeholderTheme: item.placeholderTheme,
        href: 'property.html?slug=' + encodeURIComponent(item.slug)
      };
    });
  }

  /* search(query, { module }) -> array of mixed-type results.
     module: 'tourism' | 'real_estate' | undefined/empty (both, matching the
     API contract's optional ?module= param). An empty/whitespace-only query
     returns no results (matches the real endpoint's expected behaviour —
     it is not a "browse everything" call). */
  function search(query, opts) {
    opts = opts || {};
    var q = (query || '').trim();
    if (!q) return [];

    var data = root.AvanyaData;
    var taxonomy = root.AvanyaTaxonomy;
    var listingRules = root.AvanyaListingRules;
    var results = [];

    var includeTourism = !opts.module || opts.module === 'tourism';
    var includeRealEstate = !opts.module || opts.module === 'real_estate';
    /* Locations serve both verticals in this dataset — link them at whichever
       listing page the active module scope implies (tourism.html when both
       or tourism-only, real-estate.html when real-estate-only), never
       duplicated even when both modules are active. Experience tags are a
       Tourism-only concept and are only ever surfaced when Tourism is in
       scope. */
    var locationLinkTarget = includeTourism ? 'tourism.html' : 'real-estate.html';

    results = results.concat(searchLocations(q, taxonomy, locationLinkTarget));
    if (includeTourism) {
      results = results.concat(searchExperiences(q, taxonomy));
      results = results.concat(searchListings(q, data.TOURISM_LISTINGS, 'tourism_property', listingRules, taxonomy));
    }
    if (includeRealEstate) {
      results = results.concat(searchListings(q, data.REAL_ESTATE_LISTINGS, 'real_estate_property', listingRules, taxonomy));
    }

    return results;
  }

  root.AvanyaSearch = { search: search };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
