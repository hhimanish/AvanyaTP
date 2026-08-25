/* Shared listing-card rendering, used by tourism.html and real-estate.html
   (and reused by property-detail.js/property-gallery.js for gallery/related
   placeholders, and by scripts/generate-property-pages.js under Node to bake
   the same gallery placeholders into the static property/*.html pages). */

(function (root) {
  var THEME_COLORS = {
    forest: ['#1f4d3a', '#123328'],
    river: ['#2e6e7e', '#123339'],
    'tea-garden': ['#3c7a4f', '#1e4d2b'],
    heritage: ['#8a5f18', '#5c3f10']
  };

  function themeGradientId(theme) {
    return 'grad-' + theme;
  }

  /* Builds a self-contained inline-SVG placeholder: gradient background + a simple
     line-art motif (mountains / river / tea rows / bungalow roofline) matched to theme.
     No external image dependency, renders correctly offline. */
  function placeholderSVG(theme, title, opts) {
    opts = opts || {};
    var colors = THEME_COLORS[theme] || THEME_COLORS.forest;
    var gid = themeGradientId(theme) + '-' + Math.random().toString(36).slice(2, 8);
    var motif = '';

    if (theme === 'forest') {
      motif = '<path d="M0 140 L60 70 L100 105 L160 40 L220 100 L280 60 L300 140 Z" fill="rgba(255,255,255,0.14)"/>' +
        '<path d="M0 150 L50 100 L90 130 L150 75 L210 130 L260 95 L300 150 Z" fill="rgba(255,255,255,0.22)"/>';
    } else if (theme === 'river') {
      motif = '<path d="M0 90 L60 40 L130 95 L200 45 L300 90 L300 150 L0 150 Z" fill="rgba(255,255,255,0.14)"/>' +
        '<path d="M0 130 C 60 110, 100 150, 160 125 S 260 105, 300 130 L300 150 L0 150 Z" fill="rgba(255,255,255,0.28)"/>';
    } else if (theme === 'tea-garden') {
      motif = '<path d="M0 150 Q 30 120 60 150 Q 90 120 120 150 Q 150 120 180 150 Q 210 120 240 150 Q 270 120 300 150 Z" fill="rgba(255,255,255,0.2)"/>' +
        '<path d="M0 135 Q 30 110 60 135 Q 90 110 120 135 Q 150 110 180 135 Q 210 110 240 135 Q 270 110 300 135 L300 150 L0 150 Z" fill="rgba(255,255,255,0.14)"/>';
    } else {
      motif = '<rect x="110" y="70" width="80" height="60" fill="rgba(255,255,255,0.18)"/>' +
        '<path d="M100 70 L150 40 L200 70 Z" fill="rgba(255,255,255,0.26)"/>' +
        '<rect x="140" y="95" width="20" height="35" fill="rgba(10,16,13,0.25)"/>';
    }

    var titleText = opts.hideTitle ? '' :
      '<text x="20" y="128" font-family="Georgia, serif" font-size="15" fill="rgba(255,255,255,0.92)">' + escapeXml(title) + '</text>';

    return '<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + escapeXml(opts.alt || title) + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + colors[0] + '"/><stop offset="100%" stop-color="' + colors[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="300" height="150" fill="url(#' + gid + ')"/>' +
      motif + titleText +
      '</svg>';
  }

  function escapeXml(str) {
    return String(str).replace(/[<>&"']/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function locationIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  }

  /* detailUrl() is also used directly by scripts/generate-property-pages.js
     (Node) and js/search.js so the "link to a listing's detail page" rule
     lives in exactly one place. Static file per listing (property/<slug>.html),
     not a property.html?slug= query string — see docs/ (Task 1/2 of the
     AI-crawler-visibility fix): a raw-HTML-only crawler never executes the JS
     that used to render this page's content from the query string. */
  function detailUrl(slug) {
    return 'property/' + encodeURIComponent(slug) + '.html';
  }

  function cardHTML(item) {
    var data = root.AvanyaData;
    var locationName = data.getLocationName(item.location);
    var url = detailUrl(item.slug);
    var badges = '';
    var tags = '';

    if (item.module === 'tourism') {
      badges = '<span class="card-badge">' + item.propertyType + '</span>';
      tags = item.experienceTags.map(function (tagSlug) {
        return '<span class="tag-chip">' + data.getExperienceTagName(tagSlug) + '</span>';
      }).join('');
    } else {
      var txnLabel = item.transactionType.length > 1 ? 'Buy / Lease' : (item.transactionType[0] === 'buy' ? 'Buy' : 'Lease');
      var badgeClass = item.transactionType.indexOf('buy') === -1 ? ' badge-lease' : '';
      badges = '<span class="card-badge' + badgeClass + '">' + txnLabel + '</span>';
      tags = '<span class="tag-chip">' + item.propertyType + '</span>' +
        '<span class="tag-chip tag-price">' + item.priceLabel + '</span>';
    }

    return '' +
      '<article class="listing-card">' +
      '<a href="' + url + '" class="card-media" aria-label="' + escapeXml(item.name) + '">' +
      badges +
      placeholderSVG(item.placeholderTheme, item.name, { alt: item.name + ' — ' + locationName + ' placeholder image' }) +
      '</a>' +
      '<div class="card-body">' +
      '<h3><a href="' + url + '">' + escapeXml(item.name) + '</a></h3>' +
      '<div class="card-location">' + locationIconSVG() + '<span>' + locationName + '</span></div>' +
      '<div class="card-tags">' + tags + '</div>' +
      '</div>' +
      '<div class="card-cta"><a class="btn btn-outline btn-block btn-sm" href="' + url + '">View Details</a></div>' +
      '</article>';
  }

  function renderGrid(container, items) {
    if (!items.length) {
      container.innerHTML = '';
      return false;
    }
    container.innerHTML = items.map(cardHTML).join('');
    return true;
  }

  root.AvanyaListings = {
    placeholderSVG: placeholderSVG,
    cardHTML: cardHTML,
    renderGrid: renderGrid,
    detailUrl: detailUrl,
    escapeXml: escapeXml
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
