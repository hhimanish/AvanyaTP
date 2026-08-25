/* Mobile hamburger toggle, active-link highlighting, and lightbox close handling.
   The mobile sticky bar itself is pure CSS (see components.css .sticky-bar); this
   file just wires the hamburger open/close state. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function initHamburger() {
    var toggle = qs('.hamburger');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    qsa('.mobile-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function highlightActiveLink() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    qsa('.nav-links a, .mobile-nav a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var linkPage = href.split('?')[0].split('/').pop();
      if (linkPage === current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initLightbox() {
    var overlay = qs('#lightbox-overlay');
    if (!overlay) return;
    var closeBtn = qs('.lightbox-close', overlay);
    function close() { overlay.classList.remove('open'); }
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    highlightActiveLink();
    initLightbox();
  });
})();
