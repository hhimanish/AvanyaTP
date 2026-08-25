/* north-bengal.html: renders one card per Location from js/taxonomy.js (never
   hand-duplicated), each linking to that location's filtered Tourism view,
   with a real combined Tourism + Real Estate listing count from js/data.js. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }

  var LOCATION_THEME = {
    darjeeling: 'heritage', kalimpong: 'forest', kurseong: 'tea-garden',
    mirik: 'river', dooars: 'forest', lava: 'heritage', paren: 'tea-garden'
  };

  function cardHTML(loc, tourismCount, realEstateCount) {
    var href = 'tourism.html?location=' + encodeURIComponent(loc.slug);
    var countLabel = tourismCount + (tourismCount === 1 ? ' stay' : ' stays') +
      (realEstateCount ? ', ' + realEstateCount + (realEstateCount === 1 ? ' property' : ' properties') : '');
    return '' +
      '<article class="listing-card">' +
      '<a href="' + href + '" class="card-media" aria-label="' + loc.name + '">' +
      window.AvanyaListings.placeholderSVG(LOCATION_THEME[loc.slug] || 'forest', loc.name, { alt: loc.name + ' — North Bengal location' }) +
      '</a>' +
      '<div class="card-body">' +
      '<h3><a href="' + href + '">' + loc.name + '</a></h3>' +
      '<div class="card-location"><span>' + countLabel + '</span></div>' +
      '</div>' +
      '<div class="card-cta">' +
      '<a class="btn btn-outline btn-block btn-sm" href="' + href + '">Tourism in ' + loc.name + '</a>' +
      '<a class="btn btn-ghost btn-block btn-sm" href="real-estate.html?location=' + encodeURIComponent(loc.slug) + '">Real Estate in ' + loc.name + '</a>' +
      '</div>' +
      '</article>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = qs('#location-grid');
    if (!grid || !window.AvanyaTaxonomy || !window.AvanyaData) return;

    var locations = window.AvanyaTaxonomy.getLocations();
    var data = window.AvanyaData;

    grid.innerHTML = locations.map(function (loc) {
      var tourismCount = data.TOURISM_LISTINGS.filter(function (item) { return item.location === loc.slug; }).length;
      var realEstateCount = data.REAL_ESTATE_LISTINGS.filter(function (item) { return item.location === loc.slug; }).length;
      return cardHTML(loc, tourismCount, realEstateCount);
    }).join('');
  });
})();
