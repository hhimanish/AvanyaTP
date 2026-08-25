/* search.html controller: reads ?q=&module= from the URL (mirroring
   GET /search's real query params), mirrors UI state back into the URL so a
   search is shareable/bookmarkable (the same pattern filters.js already uses
   on the listing pages), and renders window.AvanyaSearch's mixed-resultType
   results without a page reload. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function escapeXml(s) { return window.AvanyaListings.escapeXml(s); }

  var RESULT_TYPE_LABEL = {
    location: 'Zone',
    experience: 'Experience',
    tourism_property: 'Tourism Stay',
    real_estate_property: 'Real Estate'
  };

  function resultCardHTML(r) {
    var badgeClass = r.resultType === 'real_estate_property' ? ' badge-lease' : '';
    var meta = '';
    if (r.resultType === 'tourism_property' || r.resultType === 'real_estate_property') {
      meta = '<div class="card-location">' + window.AvanyaData.getLocationName(r.location) + ' — ' + r.propertyType + '</div>';
    }
    return '' +
      '<article class="listing-card search-result-card">' +
      '<div class="card-body">' +
      '<span class="card-badge' + badgeClass + '">' + RESULT_TYPE_LABEL[r.resultType] + '</span>' +
      '<h3><a href="' + escapeXml(r.href) + '">' + escapeXml(r.name) + '</a></h3>' +
      meta +
      '</div>' +
      '</article>';
  }

  function init() {
    var input = qs('#search-q');
    var moduleSelect = qs('#search-module');
    var resultsEl = qs('#search-results');
    var countEl = qs('#search-results-count');
    var emptyEl = qs('#search-empty-state');
    if (!input) return;

    function writeParams(q, module) {
      var params = new URLSearchParams();
      if (q) params.set('q', q);
      if (module) params.set('module', module);
      var qsStr = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qsStr ? '?' + qsStr : ''));
    }

    function render() {
      var q = input.value.trim();
      var module = moduleSelect.value;
      writeParams(q, module);

      if (!q) {
        resultsEl.innerHTML = '';
        emptyEl.hidden = true;
        countEl.textContent = 'Start typing to search';
        return;
      }

      var results = window.AvanyaSearch.search(q, { module: module });
      if (!results.length) {
        resultsEl.innerHTML = '';
        emptyEl.hidden = false;
        countEl.textContent = '0 results for “' + q + '”';
        return;
      }

      emptyEl.hidden = true;
      countEl.textContent = results.length + (results.length === 1 ? ' result' : ' results') + ' for “' + q + '”';
      resultsEl.innerHTML = results.map(resultCardHTML).join('');
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get('q')) input.value = params.get('q');
    if (params.get('module')) moduleSelect.value = params.get('module');

    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 200);
    });
    moduleSelect.addEventListener('change', render);

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
