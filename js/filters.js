/* Generic filter controller shared by tourism.html and real-estate.html.
   Reads filter UI state, mirrors it into the URL query string (shareable/bookmarkable),
   and re-renders the grid via listings.js — no page reload. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function readParams() {
    return new URLSearchParams(window.location.search);
  }

  function writeParams(params) {
    var qsStr = params.toString();
    var newUrl = window.location.pathname + (qsStr ? '?' + qsStr : '');
    window.history.replaceState({}, '', newUrl);
  }

  function textMatches(item, query) {
    if (!query) return true;
    var haystack = (item.name + ' ' + item.description + ' ' + item.propertyType).toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  /* Phase 2 (Core Taxonomy): populate a filter <select>'s options directly from
     js/taxonomy.js rather than relying on the hand-written <option> tags already
     in the HTML — this is what keeps the filter UI and the taxonomy's single
     source of truth from ever silently drifting apart. The existing static
     <option> markup stays in the HTML as a no-JS fallback (progressive
     enhancement), and is fully replaced once this runs. `allLabel` is the
     "All Zones" / "All Types" placeholder option, preserved at the top. */
  function populateSelect(select, allLabel, options) {
    if (!select) return;
    var current = select.value;
    select.innerHTML = '';
    var allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = allLabel;
    select.appendChild(allOption);
    options.forEach(function (opt) {
      var el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      select.appendChild(el);
    });
    if (current) select.value = current;
  }

  function populateLocationSelect(select) {
    populateSelect(select, 'All Zones', window.AvanyaTaxonomy.getLocations().map(function (l) {
      return { value: l.slug, label: l.name };
    }));
  }

  function populatePropertyTypeSelect(select, verticalScope) {
    populateSelect(select, 'All Types', window.AvanyaTaxonomy.getPropertyTypes({ verticalScope: verticalScope }).map(function (t) {
      return { value: t.name, label: t.name };
    }));
  }

  /* ---------------- Tourism page ---------------- */
  function initTourism() {
    var grid = qs('#listing-grid');
    var emptyState = qs('#empty-state');
    var resultsCount = qs('#results-count');
    var locationSelect = qs('#filter-location');
    var typeSelect = qs('#filter-type');
    var searchInput = qs('#filter-search');
    var experienceChips = qsa('.experience-chip');
    var resetBtn = qs('#filter-reset');
    if (!grid || document.body.dataset.page !== 'tourism') return;

    var data = window.AvanyaData.TOURISM_LISTINGS;

    populateLocationSelect(locationSelect);
    populatePropertyTypeSelect(typeSelect, 'tourism');

    function state() {
      var activeExperiences = experienceChips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
        .map(function (c) { return c.dataset.value; });
      return {
        location: locationSelect.value,
        type: typeSelect.value,
        q: searchInput.value.trim(),
        experience: activeExperiences
      };
    }

    function applyFromUrl() {
      var params = readParams();
      if (params.get('location')) locationSelect.value = params.get('location');
      if (params.get('type')) typeSelect.value = params.get('type');
      if (params.get('q')) searchInput.value = params.get('q');
      var exp = params.get('experience');
      if (exp) {
        var active = exp.split(',');
        experienceChips.forEach(function (c) {
          c.setAttribute('aria-pressed', active.indexOf(c.dataset.value) !== -1 ? 'true' : 'false');
        });
      }
    }

    function filterData(s) {
      return window.AvanyaListingRules.getPublishedListings(data).filter(function (item) {
        if (s.location && item.location !== s.location) return false;
        if (s.type && item.propertyType !== s.type) return false;
        if (s.experience.length && !s.experience.every(function (tag) { return item.experienceTags.indexOf(tag) !== -1; })) return false;
        if (!textMatches(item, s.q)) return false;
        return true;
      });
    }

    function render() {
      var s = state();
      var params = new URLSearchParams();
      if (s.location) params.set('location', s.location);
      if (s.type) params.set('type', s.type);
      if (s.q) params.set('q', s.q);
      if (s.experience.length) params.set('experience', s.experience.join(','));
      writeParams(params);

      var results = filterData(s);
      var hasResults = window.AvanyaListings.renderGrid(grid, results);
      emptyState.hidden = hasResults;
      grid.hidden = !hasResults;
      resultsCount.textContent = results.length + (results.length === 1 ? ' stay found' : ' stays found');
    }

    applyFromUrl();
    render();

    locationSelect.addEventListener('change', render);
    typeSelect.addEventListener('change', render);
    searchInput.addEventListener('input', debounce(render, 200));
    experienceChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var pressed = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        render();
      });
    });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        locationSelect.value = '';
        typeSelect.value = '';
        searchInput.value = '';
        experienceChips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        render();
      });
    }
  }

  /* ---------------- Real Estate page ---------------- */
  function initRealEstate() {
    var grid = qs('#listing-grid');
    var emptyState = qs('#empty-state');
    var resultsCount = qs('#results-count');
    var locationSelect = qs('#filter-location');
    var typeSelect = qs('#filter-type');
    var txnSelect = qs('#filter-transaction');
    var searchInput = qs('#filter-search');
    var minPriceInput = qs('#filter-min-price');
    var maxPriceInput = qs('#filter-max-price');
    var resetBtn = qs('#filter-reset');
    if (!grid || document.body.dataset.page !== 'real-estate') return;

    var data = window.AvanyaData.REAL_ESTATE_LISTINGS;

    populateLocationSelect(locationSelect);
    populatePropertyTypeSelect(typeSelect, 'real_estate');

    function state() {
      return {
        location: locationSelect.value,
        type: typeSelect.value,
        txn: txnSelect.value,
        q: searchInput.value.trim(),
        min: minPriceInput.value ? Number(minPriceInput.value) : null,
        max: maxPriceInput.value ? Number(maxPriceInput.value) : null
      };
    }

    function applyFromUrl() {
      var params = readParams();
      if (params.get('location')) locationSelect.value = params.get('location');
      if (params.get('type')) typeSelect.value = params.get('type');
      if (params.get('txn')) txnSelect.value = params.get('txn');
      if (params.get('q')) searchInput.value = params.get('q');
      if (params.get('min')) minPriceInput.value = params.get('min');
      if (params.get('max')) maxPriceInput.value = params.get('max');
    }

    function filterData(s) {
      return window.AvanyaListingRules.getPublishedListings(data).filter(function (item) {
        if (s.location && item.location !== s.location) return false;
        if (s.type && item.propertyType !== s.type) return false;
        if (s.txn && item.transactionType.indexOf(s.txn) === -1) return false;
        if (s.min !== null && item.priceValue < s.min) return false;
        if (s.max !== null && item.priceValue > s.max) return false;
        if (!textMatches(item, s.q)) return false;
        return true;
      });
    }

    function render() {
      var s = state();
      var params = new URLSearchParams();
      if (s.location) params.set('location', s.location);
      if (s.type) params.set('type', s.type);
      if (s.txn) params.set('txn', s.txn);
      if (s.q) params.set('q', s.q);
      if (s.min !== null) params.set('min', String(s.min));
      if (s.max !== null) params.set('max', String(s.max));
      writeParams(params);

      var results = filterData(s);
      var hasResults = window.AvanyaListings.renderGrid(grid, results);
      emptyState.hidden = hasResults;
      grid.hidden = !hasResults;
      resultsCount.textContent = results.length + (results.length === 1 ? ' property found' : ' properties found');
    }

    applyFromUrl();
    render();

    [locationSelect, typeSelect, txnSelect].forEach(function (el) { el.addEventListener('change', render); });
    searchInput.addEventListener('input', debounce(render, 200));
    minPriceInput.addEventListener('input', debounce(render, 300));
    maxPriceInput.addEventListener('input', debounce(render, 300));
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        locationSelect.value = '';
        typeSelect.value = '';
        txnSelect.value = '';
        searchInput.value = '';
        minPriceInput.value = '';
        maxPriceInput.value = '';
        render();
      });
    }
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      clearTimeout(timer);
      var args = arguments;
      timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTourism();
    initRealEstate();
  });
})();
