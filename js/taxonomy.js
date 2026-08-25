/* Avanya Core Taxonomy — Locations, Experiences, Property Types.
   This is Phase 2 of the project's Implementation Roadmap, re-scoped to a static,
   zero-backend site: the roadmap specifies "Locations/Experiences/Property Types
   modules — full admin CRUD plus public read endpoints." With no server and no
   database, that becomes:
     - "the database"        -> this file, the single canonical source of the taxonomy
     - "admin CRUD"           -> hand-editing the arrays below (there is no UI for it;
                                 that would require the admin panel this project does
                                 not have)
     - "public read endpoints"-> the accessor functions at the bottom, called directly
                                 from other scripts instead of over HTTP

   Every other script (data.js, filters.js, listings.js, property-detail.js) should
   read Locations/Experiences/Property Types from here, not maintain its own copy —
   this is what the roadmap calls "real, stable taxonomy... instead of stub data."

   Runs as a plain IIFE (no ES modules, no bundler) so it works with a bare <script>
   tag, including when a page is opened via file://. It attaches to `window` in a
   browser and to `global` under Node (used only by the test script in tests/), so
   the exact same file is what both the site and its test suite load. */

(function (root) {
  'use strict';

  /* ---------------------------------------------------------------------
   * Locations — matches the project's 7 confirmed North Bengal locations.
   * verticalScope: 'tourism' | 'real_estate' | 'both' — mirrors the Database
   * Design Document's locations.vertical_scope column exactly. All seven are
   * 'both' here because every location in this dataset already has both
   * Tourism and Real Estate listings attached to it (see js/data.js).
   * ------------------------------------------------------------------- */
  var LOCATIONS = [
    { id: 'loc-darjeeling', slug: 'darjeeling', name: 'Darjeeling', verticalScope: 'both', status: 'published', sortOrder: 1 },
    { id: 'loc-kalimpong', slug: 'kalimpong', name: 'Kalimpong', verticalScope: 'both', status: 'published', sortOrder: 2 },
    { id: 'loc-kurseong', slug: 'kurseong', name: 'Kurseong', verticalScope: 'both', status: 'published', sortOrder: 3 },
    { id: 'loc-mirik', slug: 'mirik', name: 'Mirik', verticalScope: 'both', status: 'published', sortOrder: 4 },
    { id: 'loc-dooars', slug: 'dooars', name: 'Dooars', verticalScope: 'both', status: 'published', sortOrder: 5 },
    { id: 'loc-lava', slug: 'lava', name: 'Lava', verticalScope: 'both', status: 'published', sortOrder: 6 },
    { id: 'loc-paren', slug: 'paren', name: 'Paren', verticalScope: 'both', status: 'published', sortOrder: 7 }
  ];

  /* ---------------------------------------------------------------------
   * Experiences — Tourism-only tags. Real Estate listings never carry these
   * (matching the Database Design Document's property_experiences join,
   * which only ever links to tourism_properties).
   * ------------------------------------------------------------------- */
  var EXPERIENCES = [
    { id: 'exp-mountain-views', slug: 'mountain-views', name: 'Mountain Views', status: 'published', sortOrder: 1 },
    { id: 'exp-tea-garden-stays', slug: 'tea-garden-stays', name: 'Tea Garden Stays', status: 'published', sortOrder: 2 },
    { id: 'exp-river-front', slug: 'river-front', name: 'River Front', status: 'published', sortOrder: 3 },
    { id: 'exp-wildlife-forest', slug: 'wildlife-forest', name: 'Wildlife & Forest', status: 'published', sortOrder: 4 },
    { id: 'exp-heritage-colonial', slug: 'heritage-colonial', name: 'Heritage & Colonial', status: 'published', sortOrder: 5 }
  ];

  /* ---------------------------------------------------------------------
   * Property Types — admin-managed taxonomy, scoped per vertical.
   *
   * This replaces what an earlier draft of the schema modelled as a
   * hard-coded ENUM (see the Technical Architecture Document's own v1.1
   * audit-fix note on exactly this point: "Property types are now modelled
   * the same way Locations and Experiences already were... [not] a hard-
   * coded ENUM"). The real-world consequence that decision protects against:
   * "Heritage Bungalow" is a genuinely different, independent taxonomy entry
   * for Tourism vs. Real Estate — same name, same slug, but two distinct
   * rows distinguished by verticalScope (mirroring the Database Design
   * Document's UNIQUE(vertical_scope, slug) constraint on property_types).
   * A Tourism listing must never be able to reference a Real-Estate-only
   * type (e.g. "Land") and vice versa — see isPropertyTypeValidForVertical()
   * below, and tests/taxonomy.test.js for the dedicated constraint test.
   * ------------------------------------------------------------------- */
  var PROPERTY_TYPES = [
    { id: 'pt-t-homestay', slug: 'homestay', name: 'Homestay', verticalScope: 'tourism', isActive: true, sortOrder: 1 },
    { id: 'pt-t-resort', slug: 'resort', name: 'Resort', verticalScope: 'tourism', isActive: true, sortOrder: 2 },
    { id: 'pt-t-heritage-bungalow', slug: 'heritage-bungalow', name: 'Heritage Bungalow', verticalScope: 'tourism', isActive: true, sortOrder: 3 },
    { id: 'pt-t-tea-bungalow', slug: 'tea-bungalow', name: 'Tea Bungalow', verticalScope: 'tourism', isActive: true, sortOrder: 4 },
    { id: 'pt-t-farm-stay', slug: 'farm-stay', name: 'Farm Stay', verticalScope: 'tourism', isActive: true, sortOrder: 5 },
    { id: 'pt-t-hotel', slug: 'hotel', name: 'Hotel', verticalScope: 'tourism', isActive: true, sortOrder: 6 },

    { id: 'pt-r-land', slug: 'land', name: 'Land', verticalScope: 'real_estate', isActive: true, sortOrder: 1 },
    { id: 'pt-r-homestay', slug: 'homestay', name: 'Homestay', verticalScope: 'real_estate', isActive: true, sortOrder: 2 },
    { id: 'pt-r-resort', slug: 'resort', name: 'Resort', verticalScope: 'real_estate', isActive: true, sortOrder: 3 },
    { id: 'pt-r-heritage-bungalow', slug: 'heritage-bungalow', name: 'Heritage Bungalow', verticalScope: 'real_estate', isActive: true, sortOrder: 4 },
    { id: 'pt-r-tea-bungalow', slug: 'tea-bungalow', name: 'Tea Bungalow', verticalScope: 'real_estate', isActive: true, sortOrder: 5 },
    { id: 'pt-r-hotel', slug: 'hotel', name: 'Hotel', verticalScope: 'real_estate', isActive: true, sortOrder: 6 },
    { id: 'pt-r-flat', slug: 'flat', name: 'Flat', verticalScope: 'real_estate', isActive: true, sortOrder: 7 },
    { id: 'pt-r-house', slug: 'house', name: 'House', verticalScope: 'real_estate', isActive: true, sortOrder: 8 }
  ];

  /* ---------------------------- Accessors -------------------------------
   * These stand in for the API Design document's public GET endpoints
   * (GET /locations, GET /experiences, GET /property-types). Each mirrors
   * that endpoint's filtering behaviour (?verticalScope=...) and its
   * "published only" default, since a real public endpoint would never
   * return draft/inactive rows by default either. */

  function getLocations(opts) {
    opts = opts || {};
    return LOCATIONS
      .filter(function (l) { return l.status === 'published'; })
      .filter(function (l) { return !opts.verticalScope || l.verticalScope === opts.verticalScope || l.verticalScope === 'both'; })
      .slice()
      .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function getLocationBySlug(slug) {
    return LOCATIONS.filter(function (l) { return l.slug === slug; })[0] || null;
  }

  function getExperiences() {
    return EXPERIENCES
      .filter(function (e) { return e.status === 'published'; })
      .slice()
      .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  function getExperienceBySlug(slug) {
    return EXPERIENCES.filter(function (e) { return e.slug === slug; })[0] || null;
  }

  function getPropertyTypes(opts) {
    opts = opts || {};
    return PROPERTY_TYPES
      .filter(function (t) { return t.isActive; })
      .filter(function (t) { return !opts.verticalScope || t.verticalScope === opts.verticalScope; })
      .slice()
      .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }

  /* No getPropertyTypeBySlug() / property-type detail accessor, deliberately.
     The project's API Design document states this explicitly for the
     equivalent GET /property-types/:slug endpoint: "deliberately absent —
     no screen in the Wireframe/User Flow Specification renders a
     property-type detail page; the list endpoint above is all the filter UI
     ... needs." The same reasoning applies here — this site's filter
     dropdowns only ever need the list, never a single type's detail, so no
     such accessor is provided. Confirmed by tests/taxonomy.test.js. */

  /* The vertical_scope constraint (Database Design Document §8) as a callable
     check: is this property-type slug valid for use by a listing in this
     vertical? Because property_types are scoped per vertical with
     UNIQUE(vertical_scope, slug), "land" only exists as a real_estate row —
     asking whether "land" is valid for 'tourism' must return false, not
     throw and not silently pass. */
  function isPropertyTypeValidForVertical(propertyTypeSlug, verticalScope) {
    return PROPERTY_TYPES.some(function (t) {
      return t.slug === propertyTypeSlug && t.verticalScope === verticalScope && t.isActive;
    });
  }

  root.AvanyaTaxonomy = {
    LOCATIONS: LOCATIONS,
    EXPERIENCES: EXPERIENCES,
    PROPERTY_TYPES: PROPERTY_TYPES,
    getLocations: getLocations,
    getLocationBySlug: getLocationBySlug,
    getExperiences: getExperiences,
    getExperienceBySlug: getExperienceBySlug,
    getPropertyTypes: getPropertyTypes,
    isPropertyTypeValidForVertical: isPropertyTypeValidForVertical
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
