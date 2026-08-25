/* travel-plan.html: renders the Interests chip group from js/taxonomy.js's
   Experience tags (never hand-duplicated in the HTML), and keeps the hidden
   #tp-interests-input field in sync as chips are toggled, so
   js/enquiry-form.js's generic FormData submission picks it up like any
   other field with no special-casing needed. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }

  document.addEventListener('DOMContentLoaded', function () {
    var group = qs('#tp-interests-group');
    var input = qs('#tp-interests-input');
    if (!group || !window.AvanyaTaxonomy) return;

    var experiences = window.AvanyaTaxonomy.getExperiences();
    group.innerHTML = experiences.map(function (exp) {
      return '<button type="button" class="filter-chip interest-chip" data-value="' + exp.slug + '" aria-pressed="false">' + exp.name + '</button>';
    }).join('');

    function syncInput() {
      var active = Array.prototype.slice.call(group.querySelectorAll('.interest-chip'))
        .filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
        .map(function (c) { return c.dataset.value; });
      input.value = active.join(',');
    }

    group.querySelectorAll('.interest-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var pressed = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        syncInput();
      });
    });
  });
})();
