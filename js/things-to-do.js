/* things-to-do.html: renders one card per Experience tag from js/taxonomy.js
   (never hand-duplicated), each linking to the matching filtered Tourism
   view, with a real count of how many published stays actually carry that
   tag — pulled from js/data.js, not a guessed/static number. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }

  function cardHTML(exp, count) {
    var href = 'tourism.html?experience=' + encodeURIComponent(exp.slug);
    return '' +
      '<article class="listing-card">' +
      '<a href="' + href + '" class="card-media" aria-label="' + exp.name + '">' +
      window.AvanyaListings.placeholderSVG(experienceTheme(exp.slug), exp.name, { alt: exp.name + ' — North Bengal experience' }) +
      '</a>' +
      '<div class="card-body">' +
      '<h3><a href="' + href + '">' + exp.name + '</a></h3>' +
      '<div class="card-location"><span>' + count + (count === 1 ? ' stay' : ' stays') + ' tagged</span></div>' +
      '</div>' +
      '<div class="card-cta"><a class="btn btn-outline btn-block btn-sm" href="' + href + '">Explore ' + exp.name + '</a></div>' +
      '</article>';
  }

  /* Reuses the same four placeholder themes listings already use — picked
     per experience so the grid isn't visually monotone, not tied to any
     real per-experience imagery (there isn't any). */
  function experienceTheme(slug) {
    var map = {
      'mountain-views': 'forest',
      'tea-garden-stays': 'tea-garden',
      'river-front': 'river',
      'wildlife-forest': 'forest',
      'heritage-colonial': 'heritage'
    };
    return map[slug] || 'forest';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = qs('#experience-grid');
    if (!grid || !window.AvanyaTaxonomy || !window.AvanyaData) return;

    var experiences = window.AvanyaTaxonomy.getExperiences();
    var tourismListings = window.AvanyaData.TOURISM_LISTINGS;

    grid.innerHTML = experiences.map(function (exp) {
      var count = tourismListings.filter(function (item) {
        return item.experienceTags.indexOf(exp.slug) !== -1;
      }).length;
      return cardHTML(exp, count);
    }).join('');
  });
})();
