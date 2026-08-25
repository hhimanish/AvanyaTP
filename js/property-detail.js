/* Reads ?slug= from the URL, looks up the listing in data.js (tourism or real estate),
   renders the detail page, and renders a small "related" panel. Redirects to 404.html
   if the slug is missing or not found. */

(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function escapeXml(s) { return window.AvanyaListings.escapeXml(s); }

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function findRelated(item, all) {
    if (item.module === 'tourism') {
      return all.filter(function (other) {
        if (other.slug === item.slug || other.module !== 'tourism') return false;
        var sameLocation = other.location === item.location;
        var sharedTag = other.experienceTags.some(function (t) { return item.experienceTags.indexOf(t) !== -1; });
        return sameLocation || sharedTag;
      }).slice(0, 3);
    }
    return all.filter(function (other) {
      if (other.slug === item.slug || other.module !== 'real-estate') return false;
      var sameType = other.propertyType === item.propertyType;
      var sharedTxn = other.transactionType.some(function (t) { return item.transactionType.indexOf(t) !== -1; });
      return sameType || sharedTxn;
    }).slice(0, 3);
  }

  function attributeGridHTML(item, data) {
    var attrs = [
      { label: 'Location', value: data.getLocationName(item.location) },
      { label: 'Property Type', value: item.propertyType }
    ];
    if (item.module === 'tourism') {
      attrs.push({ label: 'Best For', value: item.experienceTags.map(data.getExperienceTagName).join(', ') });
    } else {
      attrs.push({ label: 'Transaction', value: item.transactionType.map(function (t) { return t === 'buy' ? 'Buy' : 'Lease'; }).join(' / ') });
      attrs.push({ label: 'Indicative Price', value: item.priceLabel });
    }
    return attrs.map(function (a) {
      return '<div class="attribute-item"><div class="label">' + a.label + '</div><div class="value">' + escapeXml(a.value) + '</div></div>';
    }).join('');
  }

  function checkIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
  }

  function render() {
    var data = window.AvanyaData;
    var listings = window.AvanyaListings;
    var slug = getSlug();
    var item = slug ? data.findBySlug(slug) : null;

    if (!item) {
      window.location.href = '404.html';
      return;
    }

    document.title = item.name + ' — ' + data.getLocationName(item.location) + ' | Avanya';
    var metaDesc = qs('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', item.description.slice(0, 155));

    qs('#detail-breadcrumb-current').textContent = item.name;
    var backLink = qs('#detail-breadcrumb-back');
    backLink.href = item.module === 'tourism' ? 'tourism.html' : 'real-estate.html';
    backLink.textContent = item.module === 'tourism' ? 'Tourism' : 'Real Estate';

    qs('#detail-title').textContent = item.name;
    qs('#detail-location').textContent = data.getLocationName(item.location);
    qs('#detail-description').textContent = item.description;

    var badgesEl = qs('#detail-badges');
    var badges = '<span class="tag-chip">' + item.propertyType + '</span>';
    if (item.module === 'real-estate') {
      badges += item.transactionType.map(function (t) {
        return '<span class="tag-chip tag-price">' + (t === 'buy' ? 'Buy' : 'Lease') + '</span>';
      }).join('');
    } else {
      badges += item.experienceTags.map(function (t) {
        return '<span class="tag-chip">' + data.getExperienceTagName(t) + '</span>';
      }).join('');
    }
    badgesEl.innerHTML = badges;

    qs('#detail-attributes').innerHTML = attributeGridHTML(item, data);

    qs('#detail-highlights').innerHTML = item.highlights.map(function (h) {
      return '<li>' + checkIconSVG() + '<span>' + escapeXml(h) + '</span></li>';
    }).join('');

    var galleryImages = [item.placeholderTheme, item.placeholderTheme, item.placeholderTheme, item.placeholderTheme];
    var mainGallery = qs('#gallery-main');
    var thumbsEl = qs('#gallery-thumbs');

    function setMain(index) {
      mainGallery.innerHTML = listings.placeholderSVG(galleryImages[index], item.name, {
        hideTitle: true,
        alt: item.name + ' gallery image ' + (index + 1) + ' of ' + galleryImages.length + ' (placeholder)'
      });
      qsaThumbButtons().forEach(function (btn, i) {
        btn.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }
    function qsaThumbButtons() { return Array.prototype.slice.call(thumbsEl.querySelectorAll('button')); }

    thumbsEl.innerHTML = galleryImages.map(function (theme, i) {
      return '<button type="button" data-index="' + i + '" aria-current="false" aria-label="Show gallery image ' + (i + 1) + '">' +
        listings.placeholderSVG(theme, item.name, { hideTitle: true, alt: '' }) + '</button>';
    }).join('');
    qsaThumbButtons().forEach(function (btn) {
      btn.addEventListener('click', function () { setMain(Number(btn.dataset.index)); });
    });
    setMain(0);

    mainGallery.addEventListener('click', function () {
      var overlay = qs('#lightbox-overlay');
      if (!overlay) return;
      var current = qsaThumbButtons().filter(function (b) { return b.getAttribute('aria-current') === 'true'; })[0];
      var idx = current ? Number(current.dataset.index) : 0;
      qs('#lightbox-content').innerHTML = listings.placeholderSVG(galleryImages[idx], item.name, { hideTitle: true, alt: item.name + ' enlarged gallery image (placeholder)' });
      overlay.classList.add('open');
    });

    var whatsappMsg = encodeURIComponent('Hi Avanya, I\'m interested in ' + item.name + ' (' + data.getLocationName(item.location) + '). Could you share more details?');
    qs('#action-whatsapp').href = 'https://wa.me/919999999999?text=' + whatsappMsg;
    qs('#enquire-slug-input').value = item.slug;
    qs('#enquire-module-input').value = item.module;
    qs('#enquiry-context-name').textContent = item.name;

    var related = findRelated(item, data.ALL_LISTINGS);
    var relatedSection = qs('#related-panel');
    var relatedGrid = qs('#related-grid');
    if (related.length) {
      listings.renderGrid(relatedGrid, related);
      relatedSection.hidden = false;
    } else {
      relatedSection.hidden = true;
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();
