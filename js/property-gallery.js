/* Interactivity for the statically-generated property/<slug>.html pages
   (scripts/generate-property-pages.js). The gallery markup, badges, attribute
   grid, highlights, and related panel are already baked into the HTML at
   generation time — this script only wires up the two pieces that still need
   to react to a click after load, the same behaviour js/property-detail.js's
   render() used to provide from scratch on every page load:

     1. Gallery thumbnail click -> swap the main image, and main-image click
        -> open the lightbox (both regenerated via js/listings.js's
        placeholderSVG so the alt text stays correct per-index, exactly like
        the old render() did).
     2. The Real Estate "Buying / Leasing" select (only present when a
        listing supports both transaction types) -> keep the hidden
        enquiryType input in sync, same as before.

   Reads which listing it's on from #gallery-main's data-slug attribute
   (baked in at generation time) rather than a ?slug= URL param, since these
   pages no longer have one. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function initGallery() {
    var mainGallery = qs('#gallery-main');
    var thumbsEl = qs('#gallery-thumbs');
    if (!mainGallery || !thumbsEl || !mainGallery.dataset.slug) return;

    var data = window.AvanyaData;
    var listingRules = window.AvanyaListingRules;
    var listings = window.AvanyaListings;
    if (!data || !listingRules || !listings) return;

    var item = data.findBySlug(mainGallery.dataset.slug);
    if (!item) return;

    var galleryImages = listingRules.getGalleryImages(item);

    function qsaThumbButtons() { return qsa('button', thumbsEl); }

    function setMain(index) {
      mainGallery.innerHTML = listings.placeholderSVG(galleryImages[index], item.name, {
        hideTitle: true,
        alt: item.name + ' gallery image ' + (index + 1) + ' of ' + galleryImages.length + ' (placeholder)'
      });
      qsaThumbButtons().forEach(function (btn, i) {
        btn.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    qsaThumbButtons().forEach(function (btn) {
      btn.addEventListener('click', function () { setMain(Number(btn.dataset.index)); });
    });

    mainGallery.addEventListener('click', function () {
      var overlay = qs('#lightbox-overlay');
      if (!overlay) return;
      var current = qsaThumbButtons().filter(function (b) { return b.getAttribute('aria-current') === 'true'; })[0];
      var idx = current ? Number(current.dataset.index) : 0;
      qs('#lightbox-content').innerHTML = listings.placeholderSVG(galleryImages[idx], item.name, {
        hideTitle: true,
        alt: item.name + ' enlarged gallery image (placeholder)'
      });
      overlay.classList.add('open');
    });
  }

  function initEnquiryTypeSync() {
    var select = qs('#enquire-type-select');
    var input = qs('#enquire-type-input');
    if (!select || !input) return;
    select.addEventListener('change', function () {
      input.value = select.value;
      /* buy_click / lease_click (TAD §5.8): fires when a visitor expresses
         buy-vs-lease intent on a dual-transaction-type listing — the
         single-transaction-type case (hidden input set once at generation
         time, no select shown) has no comparable "click" to track, since
         there's no choice being made. */
      if (window.AvanyaAnalytics && (select.value === 'buy' || select.value === 'lease')) {
        window.AvanyaAnalytics.track(select.value + '_click', { slug: qs('#gallery-main') ? qs('#gallery-main').dataset.slug : undefined });
      }
    });
  }

  function trackPropertyView() {
    var mainGallery = qs('#gallery-main');
    if (!mainGallery || !mainGallery.dataset.slug || !window.AvanyaAnalytics || !window.AvanyaData) return;
    var item = window.AvanyaData.findBySlug(mainGallery.dataset.slug);
    if (!item) return;
    window.AvanyaAnalytics.track('property_view', { slug: item.slug, module: item.module, property_type: item.propertyType });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initGallery();
    initEnquiryTypeSync();
    trackPropertyView();
  });
})();
