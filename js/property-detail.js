/* property.html is now a thin redirect shim, not a renderer. Every listing's
   real content is baked into a static file at property/<slug>.html by
   scripts/generate-property-pages.js — that's what crawlers and visitors are
   meant to land on. This script's only remaining job: read the legacy
   ?slug= query string, resolve it exactly the way the old render() did
   (publish-state check, then the redirect map, then 404), and forward the
   browser to the real page. No DOM to build, so no content lives here. */

(function () {
  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function redirect() {
    var data = window.AvanyaData;
    var slug = getSlug();
    var item = slug ? data.findBySlug(slug) : null;

    if (item && window.AvanyaListingRules.isPubliclyVisible(item)) {
      window.location.href = window.AvanyaListings.detailUrl(item.slug);
      return;
    }

    var redirectTarget = window.AvanyaRedirects ? window.AvanyaRedirects.resolveRedirect(slug) : null;
    window.location.href = redirectTarget || '404.html';
  }

  document.addEventListener('DOMContentLoaded', redirect);
})();
