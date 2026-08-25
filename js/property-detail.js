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

    /* A slug that resolves to a real record but isn't published must be just
       as unreachable as one that doesn't exist at all (Phase 3 exit
       criteria: draft/archived listings never appear publicly) — there is
       no admin preview mode in a static site to distinguish "not public yet"
       from "doesn't exist." If it's not found, check the redirect map before
       giving up entirely (Phase 3's redirects/resolve equivalent). */
    if (!item || !window.AvanyaListingRules.isPubliclyVisible(item)) {
      var redirectTarget = window.AvanyaRedirects ? window.AvanyaRedirects.resolveRedirect(slug) : null;
      window.location.href = redirectTarget || '404.html';
      return;
    }

    document.title = item.name + ' — ' + data.getLocationName(item.location) + ' | Avanya';
    var metaDesc = qs('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', item.description.slice(0, 155));

    /* Per-entity SEO (API Design §6.7's PATCH .../seo, re-scoped): each
       listing gets its own canonical URL and Open Graph tags set here at
       render time, rather than the page-wide generic ones in property.html's
       <head> — otherwise every listing would share one canonical URL, which
       is exactly the duplicate-content problem canonical tags exist to
       prevent. */
    var pageUrl = 'https://www.avanyatourism.example/property.html?slug=' + encodeURIComponent(item.slug);
    var canonicalEl = qs('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute('href', pageUrl);
    var ogTitle = qs('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', item.name + ' | Avanya');
    var ogDesc = qs('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', item.description.slice(0, 200));
    var ogUrl = qs('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', pageUrl);

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

    var galleryImages = window.AvanyaListingRules.getGalleryImages(item);
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

    /* enquiryType: 'stay' for every Tourism listing. For Real Estate, a
       listing offered for both Buy and Lease lets the visitor pick which
       they mean (a visible select, synced into the hidden field the form
       actually submits); a listing offered under only one transaction type
       sets it directly with no extra UI. */
    var enquiryTypeInput = qs('#enquire-type-input');
    var enquiryTypeField = qs('#enquire-type-field');
    var enquiryTypeSelect = qs('#enquire-type-select');
    if (item.module === 'tourism') {
      enquiryTypeInput.value = 'stay';
      enquiryTypeField.hidden = true;
    } else if (item.transactionType.length > 1) {
      enquiryTypeField.hidden = false;
      enquiryTypeInput.value = enquiryTypeSelect.value;
      enquiryTypeSelect.addEventListener('change', function () {
        enquiryTypeInput.value = enquiryTypeSelect.value;
      });
    } else {
      enquiryTypeInput.value = item.transactionType[0]; // 'buy' or 'lease'
      enquiryTypeField.hidden = true;
    }

    var related = window.AvanyaListingRules.findRelatedListings(item, data.ALL_LISTINGS);
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
