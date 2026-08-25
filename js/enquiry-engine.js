/* Universal Enquiry Engine — Phase 4's static-site equivalent of POST
 * /enquiries and POST /travel-plans (API Design Sections 5.4/6.5/7.4,
 * Database Design Section 4.4).
 *
 * The real spec is a backend endpoint: it validates, persists a row, mints a
 * server-assigned sequential lead_id, denormalises a listing_snapshot, and
 * emits an async notification event. With no backend and no database, this
 * project's actual "enquiry engine" is Formspree — it receives the POST,
 * stores the submission, and emails Avanya. What THIS file provides is
 * everything the real spec describes that Formspree itself has no concept
 * of: the module/enquiryType vocabulary, consent enforcement matching the
 * documented error shape, a human-readable lead reference id, and the
 * listing_snapshot capture — assembled here and attached to the Formspree
 * submission as extra fields, so the record Avanya actually receives in
 * their inbox carries the same structure the spec describes, even though
 * nothing server-side enforces it.
 *
 * Kept separate from js/enquiry-form.js (DOM wiring) so all of this is
 * testable under plain Node — see tests/enquiry-engine.test.js.
 */

(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
   * Lead reference ID — AVN-T-YYYYMMDD-### (Tourism) / AVN-R-YYYYMMDD-###
   * (Real Estate), matching the Database Design Document's format exactly.
   *
   * Honest limitation, stated here rather than silently glossed over: the
   * real spec's lead_id is assigned by a database sequence, so two leads on
   * the same day are guaranteed distinct. This client-generated version has
   * no shared counter to draw from (there is no database), so the trailing
   * three digits are randomised instead of sequential. It is a real,
   * correctly-formatted reference the visitor can quote when following up —
   * not a guarantee of global uniqueness the way a real sequence is. Good
   * enough for its actual purpose here (a human reference number), not
   * presented as more than that.
   * ------------------------------------------------------------------ */
  function generateLeadId(module, date) {
    var prefix = module === 'real_estate' || module === 'real-estate' ? 'AVN-R' : 'AVN-T';
    var d = date || new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var suffix = String(Math.floor(Math.random() * 900) + 100); // 3 digits, 100-999
    return prefix + '-' + yyyy + mm + dd + '-' + suffix;
  }

  /* ------------------------------------------------------------------
   * Consent enforcement, matching API Design §7.4's documented 422
   * VALIDATION_ERROR shape exactly (field name, issue text) — so even
   * though nothing server-side can actually reject this request with a
   * real 422, the error a visitor sees and the error the spec documents
   * are the same one, verified by test rather than left to drift.
   * ------------------------------------------------------------------ */
  function validateConsent(payload) {
    if (payload && payload.consent === true) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: [{
        field: 'consent',
        issue: 'Consent to the Privacy Policy is required to submit an enquiry.'
      }]
    };
  }

  /* ------------------------------------------------------------------
   * listing_snapshot — denormalised name/location/type captured at
   * submission time (Database Design §4.4's listing_snapshot column),
   * so the enquiry record remains meaningful even if the listing it
   * referenced is later edited or unpublished. Returns null when there
   * is no listing context (a general Contact-page enquiry, or a Custom
   * Travel Plan) — matching the real schema's nullable column exactly.
   * ------------------------------------------------------------------ */
  function buildListingSnapshot(item, taxonomy) {
    if (!item) return null;
    var location = taxonomy.getLocationBySlug(item.location);
    return {
      slug: item.slug,
      name: item.name,
      location: location ? location.name : item.location,
      propertyType: item.propertyType,
      module: item.module
    };
  }

  /* ------------------------------------------------------------------
   * UTM attribution capture (FR-AN-007) — read once at submission time
   * from the current page's URL, same fields the real enquiries table
   * carries (source, utm_source, utm_medium, utm_campaign).
   * ------------------------------------------------------------------ */
  function captureUtmParams(searchString) {
    var params = new URLSearchParams(searchString || '');
    var result = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
      var value = params.get(key);
      if (value) result[key] = value;
    });
    return result;
  }

  /* ------------------------------------------------------------------
   * Assembles the full enquiry payload the way the real /enquiries
   * request body is documented (API Design §7.4): module, enquiryType,
   * a generated leadId, consent, an (optional) listingSnapshot, and any
   * captured UTM attribution. `fields` is the plain form field values
   * already collected from the DOM by enquiry-form.js.
   * ------------------------------------------------------------------ */
  function buildEnquiryPayload(fields, opts) {
    opts = opts || {};
    var module = fields.module || null;
    var payload = {
      module: module,
      enquiryType: fields.enquiryType || 'general',
      leadId: generateLeadId(module, opts.now),
      consent: fields.consent === true || fields.consent === 'on' || fields.consent === 'true',
      submittedAt: (opts.now || new Date()).toISOString()
    };
    if (opts.listingItem && opts.taxonomy) {
      payload.listingSnapshot = buildListingSnapshot(opts.listingItem, opts.taxonomy);
    } else {
      payload.listingSnapshot = null;
    }
    var utm = captureUtmParams(opts.search);
    Object.keys(utm).forEach(function (key) { payload[key] = utm[key]; });
    return payload;
  }

  root.AvanyaEnquiryEngine = {
    generateLeadId: generateLeadId,
    validateConsent: validateConsent,
    buildListingSnapshot: buildListingSnapshot,
    captureUtmParams: captureUtmParams,
    buildEnquiryPayload: buildEnquiryPayload
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
