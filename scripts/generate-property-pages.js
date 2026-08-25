#!/usr/bin/env node
/* Generates a real, standalone static HTML file per published listing at
 * property/<slug>.html — the AI-crawler-visibility fix documented in the
 * project brief this script was written against: GPTBot, ClaudeBot, and
 * PerplexityBot do not execute JavaScript, so a listing whose name,
 * description, and gallery only ever existed as JS-rendered content injected
 * into an empty <div id="listing-grid"> (or, on the old property.html, an
 * empty #detail-title showing "Loading property…") was functionally
 * invisible to them. This script bakes that same content directly into the
 * HTML response at generation time instead, using the exact same rendering
 * logic (js/property-detail.js's attribute-grid/badges shape,
 * js/listings.js's placeholderSVG gallery generator and cardHTML-equivalent
 * related cards, js/listing-rules.js's gallery cap and related-listings
 * algorithm) so the baked markup is never a second, drifting reimplementation
 * of what the browser already renders — it's the same functions, called at
 * build time instead of page-load time.
 *
 * Run with: node scripts/generate-property-pages.js
 *
 * property.html itself is kept only as a thin client-side redirect for old
 * ?slug= links/bookmarks (see js/property-detail.js) — it is not regenerated
 * by this script and carries no listing content of its own any more.
 */

'use strict';

var fs = require('fs');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));
require(path.join(__dirname, '..', 'js', 'listing-rules.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'listings.js'));

var taxonomy = global.AvanyaTaxonomy;
var data = global.AvanyaData;
var listingRules = global.AvanyaListingRules;
var listings = global.AvanyaListings;

var BASE_URL = 'https://www.avanyatourism.example';
var OUT_DIR = path.join(__dirname, '..', 'property');

function escapeXml(s) { return listings.escapeXml(s); }

function truncate(str, maxLen) {
  var s = String(str || '');
  if (s.length <= maxLen) return s;
  var cut = s.slice(0, maxLen);
  var lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return cut.trim() + '…';
}

/* Same shape as js/property-detail.js's attributeGridHTML() — kept in sync by
   hand since one runs under Node at build time and the other in the browser
   at runtime for the legacy redirect shim's... actually the shim no longer
   renders anything, but property-gallery.js and this script both still read
   from the same taxonomy/data/listing-rules functions, so a divergence here
   would only ever be a copy-paste mistake, not a data-source mismatch. */
function attributeGridHTML(item) {
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

function badgesHTML(item) {
  var badges = '<span class="tag-chip">' + escapeXml(item.propertyType) + '</span>';
  if (item.module === 'real-estate') {
    badges += item.transactionType.map(function (t) {
      return '<span class="tag-chip tag-price">' + (t === 'buy' ? 'Buy' : 'Lease') + '</span>';
    }).join('');
  } else {
    badges += item.experienceTags.map(function (t) {
      return '<span class="tag-chip">' + escapeXml(data.getExperienceTagName(t)) + '</span>';
    }).join('');
  }
  return badges;
}

function galleryThumbsHTML(item, galleryImages) {
  return galleryImages.map(function (theme, i) {
    return '<button type="button" data-index="' + i + '" aria-current="' + (i === 0 ? 'true' : 'false') + '" aria-label="Show gallery image ' + (i + 1) + '">' +
      listings.placeholderSVG(theme, item.name, { hideTitle: true, alt: '' }) +
      '</button>';
  }).join('');
}

/* Related-listing cards. Deliberately not js/listings.js's cardHTML() here:
   that function links via AvanyaListings.detailUrl(), which is site-root-
   relative ("property/<slug>.html") — correct from every other page, but
   this page IS already inside property/, so a related listing's page is a
   same-directory link ("<slug>.html"), not "property/<slug>.html" again. */
function relatedCardHTML(item) {
  var locationName = data.getLocationName(item.location);
  var url = encodeURIComponent(item.slug) + '.html';
  var badge = item.module === 'tourism'
    ? '<span class="card-badge">' + escapeXml(item.propertyType) + '</span>'
    : '<span class="card-badge' + (item.transactionType.indexOf('buy') === -1 ? ' badge-lease' : '') + '">' +
      (item.transactionType.length > 1 ? 'Buy / Lease' : (item.transactionType[0] === 'buy' ? 'Buy' : 'Lease')) + '</span>';

  return '' +
    '<article class="listing-card">' +
    '<a href="' + url + '" class="card-media" aria-label="' + escapeXml(item.name) + '">' +
    badge +
    listings.placeholderSVG(item.placeholderTheme, item.name, { alt: item.name + ' — ' + locationName + ' placeholder image' }) +
    '</a>' +
    '<div class="card-body">' +
    '<h3><a href="' + url + '">' + escapeXml(item.name) + '</a></h3>' +
    '<div class="card-location">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
    '<span>' + escapeXml(locationName) + '</span></div>' +
    '</div>' +
    '<div class="card-cta"><a class="btn btn-outline btn-block btn-sm" href="' + url + '">View Details</a></div>' +
    '</article>';
}

/* JSON-LD. Only ever emits fields the listing's real data actually supports
   — no fabricated priceRange, aggregateRating, or review data (the project's
   own no-fabrication rule — see the "Honest by design" value on about.html). */
function structuredDataJSON(item, locationName, canonicalUrl, ogImageUrl) {
  var main = item.module === 'tourism'
    ? {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        name: item.name,
        description: item.description,
        url: canonicalUrl,
        image: ogImageUrl,
        address: {
          '@type': 'PostalAddress',
          addressLocality: locationName,
          addressCountry: 'IN'
        }
      }
    : {
        /* RealEstateListing is not a real schema.org type as of this
           writing — Product is the defensible, real type here, framed with
           an Offer carrying the listing's actual indicative price. */
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.name,
        description: item.description,
        category: item.propertyType,
        url: canonicalUrl,
        image: ogImageUrl,
        offers: {
          '@type': 'Offer',
          price: item.priceValue,
          priceCurrency: 'INR',
          url: canonicalUrl
        }
      };

  var breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL + '/index.html' },
      {
        '@type': 'ListItem',
        position: 2,
        name: item.module === 'tourism' ? 'Tourism' : 'Real Estate',
        item: BASE_URL + '/' + (item.module === 'tourism' ? 'tourism.html' : 'real-estate.html')
      },
      { '@type': 'ListItem', position: 3, name: item.name, item: canonicalUrl }
    ]
  };

  return '<script type="application/ld+json">' + JSON.stringify(main) + '</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(breadcrumb) + '</script>';
}

function enquiryFieldsHTML(item) {
  var typeFieldHidden = true;
  var selectHTML = '';
  var initialEnquiryType;

  if (item.module === 'tourism') {
    initialEnquiryType = 'stay';
  } else if (item.transactionType.length > 1) {
    typeFieldHidden = false;
    initialEnquiryType = 'buy';
    selectHTML = '<select id="enquire-type-select">' +
      '<option value="buy">Buying</option>' +
      '<option value="lease">Leasing</option>' +
      '</select>';
  } else {
    initialEnquiryType = item.transactionType[0]; // 'buy' or 'lease'
  }

  return '' +
    '<input type="hidden" name="propertySlug" id="enquire-slug-input" value="' + escapeXml(item.slug) + '">' +
    '<input type="hidden" name="module" id="enquire-module-input" value="' + escapeXml(item.module) + '">' +
    '<div class="form-field" id="enquire-type-field"' + (typeFieldHidden ? ' hidden' : '') + '>' +
    '<label for="enquire-type-select">I\'m interested in</label>' +
    (selectHTML || '<select id="enquire-type-select"><option value="buy">Buying</option><option value="lease">Leasing</option></select>') +
    '</div>' +
    '<input type="hidden" name="enquiryType" id="enquire-type-input" value="' + escapeXml(initialEnquiryType) + '">';
}

function pageHTML(item) {
  var locationName = data.getLocationName(item.location);
  var backHref = item.module === 'tourism' ? '../tourism.html' : '../real-estate.html';
  var backLabel = item.module === 'tourism' ? 'Tourism' : 'Real Estate';
  var canonicalUrl = BASE_URL + '/property/' + encodeURIComponent(item.slug) + '.html';
  var ogImageUrl = BASE_URL + '/assets/og-image-placeholder.svg';
  var metaDescription = truncate(item.description, 155);
  var ogDescription = truncate(item.description, 200);
  var galleryImages = listingRules.getGalleryImages(item);
  var whatsappMsg = encodeURIComponent('Hi Avanya, I\'m interested in ' + item.name + ' (' + locationName + '). Could you share more details?');
  var related = listingRules.findRelatedListings(item, data.ALL_LISTINGS);

  var relatedSectionHTML = related.length
    ? '<section class="related-panel" id="related-panel">' +
      '<h2>You May Also Like</h2>' +
      '<div class="listing-grid" id="related-grid">' + related.map(relatedCardHTML).join('') + '</div>' +
      '</section>'
    : '';

  return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>' + escapeXml(item.name + ' — ' + locationName + ' | Avanya') + '</title>\n' +
'<meta name="description" content="' + escapeXml(metaDescription) + '">\n' +
'<link rel="canonical" href="' + canonicalUrl + '">\n' +
'<meta property="og:title" content="' + escapeXml(item.name + ' | Avanya') + '">\n' +
'<meta property="og:description" content="' + escapeXml(ogDescription) + '">\n' +
'<meta property="og:type" content="website">\n' +
'<meta property="og:image" content="' + ogImageUrl + '">\n' +
'<meta property="og:url" content="' + canonicalUrl + '">\n' +
'<meta name="twitter:card" content="summary_large_image">\n' +
'<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="../css/styles.css">\n' +
structuredDataJSON(item, locationName, canonicalUrl, ogImageUrl) + '\n' +
'</head>\n' +
'<body>\n' +
'<a class="skip-link" href="#main-content">Skip to main content</a>\n' +
'\n' +
'<header class="site-header">\n' +
'  <div class="container">\n' +
'    <a href="../index.html" class="brand">\n' +
'      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1f4d3a"/><path d="M2 22 L10 10 L15 17 L20 8 L30 22 Z" fill="#c08a2e" opacity="0.9"/><path d="M0 25c3 0 3 3 6 3s3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" stroke="#2e6e7e" stroke-width="2" fill="none" stroke-linecap="round"/></svg>\n' +
'      <span>Avanya<span class="tagline">North Bengal Discovery</span></span>\n' +
'    </a>\n' +
'    <nav class="main-nav" aria-label="Primary">\n' +
'      <ul class="nav-links">\n' +
'        <li><a href="../index.html">Home</a></li>\n' +
'        <li><a href="../tourism.html">Tourism</a></li>\n' +
'        <li><a href="../real-estate.html">Real Estate</a></li>\n' +
'        <li><a href="../about.html">About</a></li>\n' +
'        <li><a href="../contact.html">Contact</a></li>\n' +
'      </ul>\n' +
'      <div class="nav-actions">\n' +
'        <a class="icon-link desktop-only" href="../search.html" aria-label="Search Avanya">\n' +
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>\n' +
'        </a>\n' +
'        <a class="icon-link desktop-only" href="https://wa.me/919999999999" aria-label="Chat with Avanya on WhatsApp">\n' +
'          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.7A8 8 0 1 1 8.6 20L3 21Z"/></svg>\n' +
'        </a>\n' +
'        <a class="btn btn-primary btn-sm" href="../contact.html">Enquire Now</a>\n' +
'        <button class="hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-nav">\n' +
'          <span></span><span></span><span></span>\n' +
'        </button>\n' +
'      </div>\n' +
'    </nav>\n' +
'  </div>\n' +
'  <div class="mobile-nav" id="mobile-nav">\n' +
'    <a href="../index.html">Home</a>\n' +
'    <a href="../tourism.html">Tourism</a>\n' +
'    <a href="../real-estate.html">Real Estate</a>\n' +
'    <a href="../about.html">About</a>\n' +
'    <a href="../contact.html">Contact</a>\n' +
'    <div class="nav-cta-row">\n' +
'      <a class="btn btn-outline btn-sm btn-block" href="tel:+919999999999">Call</a>\n' +
'      <a class="btn btn-primary btn-sm btn-block" href="https://wa.me/919999999999">WhatsApp</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</header>\n' +
'\n' +
'<main id="main-content">\n' +
'  <section class="section-tight">\n' +
'    <div class="container">\n' +
'      <p class="breadcrumb"><a href="../index.html">Home</a> / <a href="' + backHref + '">' + backLabel + '</a> / <span>' + escapeXml(item.name) + '</span></p>\n' +
'\n' +
'      <div class="gallery-main" id="gallery-main" data-slug="' + escapeXml(item.slug) + '">' +
listings.placeholderSVG(galleryImages[0], item.name, { hideTitle: true, alt: item.name + ' gallery image 1 of ' + galleryImages.length + ' (placeholder)' }) +
'</div>\n' +
'      <div class="gallery-thumbs" id="gallery-thumbs">' + galleryThumbsHTML(item, galleryImages) + '</div>\n' +
'\n' +
'      <div class="detail-layout" style="margin-top: var(--sp-8);">\n' +
'        <div>\n' +
'          <div class="detail-header">\n' +
'            <h1>' + escapeXml(item.name) + '</h1>\n' +
'            <div class="card-location" style="margin-top: var(--sp-2);">\n' +
'              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>\n' +
'              <span>' + escapeXml(locationName) + '</span>\n' +
'            </div>\n' +
'            <div class="detail-badges">' + badgesHTML(item) + '</div>\n' +
'          </div>\n' +
'\n' +
'          <p>' + escapeXml(item.description) + '</p>\n' +
'\n' +
'          <div class="attribute-grid">' + attributeGridHTML(item) + '</div>\n' +
'\n' +
'          <h2>Highlights</h2>\n' +
'          <ul class="highlight-list">' + item.highlights.map(function (h) {
  return '<li>' + checkIconSVG() + '<span>' + escapeXml(h) + '</span></li>';
}).join('') + '</ul>\n' +
'        </div>\n' +
'\n' +
'        <aside class="sidebar-card">\n' +
'          <h3>Interested in this property?</h3>\n' +
'          <p>Reach out directly, or send a quick enquiry and our team will get back to you.</p>\n' +
'          <div class="action-bar">\n' +
'            <a class="btn btn-primary btn-block" href="https://wa.me/919999999999?text=' + whatsappMsg + '">\n' +
'              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.7A8 8 0 1 1 8.6 20L3 21Z"/></svg>\n' +
'              WhatsApp Us\n' +
'            </a>\n' +
'            <a class="btn btn-outline btn-block" href="tel:+919999999999">\n' +
'              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4c0 1-1 2-2 2C10 21 3 14 3 7c0-1 1-2 2-2Z"/></svg>\n' +
'              Call Us\n' +
'            </a>\n' +
'            <a class="btn btn-outline btn-block" href="mailto:enquiries@avanyatourism.example">\n' +
'              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>\n' +
'              Email Us\n' +
'            </a>\n' +
'          </div>\n' +
'\n' +
'          <hr style="margin: var(--sp-5) 0; border: none; border-top: 1px solid var(--color-border);">\n' +
'\n' +
'          <h4 style="margin-bottom: var(--sp-3);">Quick Enquiry — <span id="enquiry-context-name">' + escapeXml(item.name) + '</span></h4>\n' +
'          <!-- TODO: replace YOUR_FORM_ID with the real Formspree endpoint ID before launch -->\n' +
'          <form class="enquiry-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">\n' +
            enquiryFieldsHTML(item) + '\n' +
'            <div class="form-grid">\n' +
'              <div class="form-field">\n' +
'                <label for="pf-name">Name</label>\n' +
'                <input type="text" id="pf-name" name="name" required>\n' +
'                <span class="field-error" role="alert"></span>\n' +
'              </div>\n' +
'              <div class="form-field">\n' +
'                <label for="pf-phone">Phone</label>\n' +
'                <input type="tel" id="pf-phone" name="phone" data-phone-check="true" required>\n' +
'                <span class="field-error" role="alert"></span>\n' +
'              </div>\n' +
'              <div class="form-field">\n' +
'                <label for="pf-email">Email</label>\n' +
'                <input type="email" id="pf-email" name="email" required>\n' +
'                <span class="field-error" role="alert"></span>\n' +
'              </div>\n' +
'              <div class="form-field">\n' +
'                <label for="pf-message">Message</label>\n' +
'                <textarea id="pf-message" name="message" rows="3" required></textarea>\n' +
'                <span class="field-error" role="alert"></span>\n' +
'              </div>\n' +
'              <div class="form-field consent-field">\n' +
'                <input type="checkbox" id="pf-consent" name="consent" required>\n' +
'                <label for="pf-consent">I consent to be contacted about my enquiry.</label>\n' +
'                <span class="field-error" role="alert"></span>\n' +
'              </div>\n' +
'            </div>\n' +
'            <button type="submit" class="btn btn-primary btn-block" style="margin-top: var(--sp-4);">Send Enquiry</button>\n' +
'            <div class="form-status" role="status"></div>\n' +
'          </form>\n' +
'        </aside>\n' +
'      </div>\n' +
'\n' +
      relatedSectionHTML + '\n' +
'    </div>\n' +
'  </section>\n' +
'</main>\n' +
'\n' +
'<div class="lightbox-overlay" id="lightbox-overlay">\n' +
'  <div class="lightbox-content" id="lightbox-content"></div>\n' +
'  <button type="button" class="lightbox-close" aria-label="Close enlarged image">\n' +
'    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>\n' +
'  </button>\n' +
'</div>\n' +
'\n' +
'<footer class="site-footer">\n' +
'  <div class="container">\n' +
'    <div class="footer-grid">\n' +
'      <div class="footer-brand">\n' +
'        <div class="brand">\n' +
'          <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#c08a2e"/><path d="M2 22 L10 10 L15 17 L20 8 L30 22 Z" fill="#123328"/></svg>\n' +
'          <span>Avanya</span>\n' +
'        </div>\n' +
'        <p>North Bengal’s digital discovery platform for tourism stays and real estate.</p>\n' +
'        <div class="quick-actions">\n' +
'          <a class="icon-link" href="https://wa.me/919999999999" aria-label="WhatsApp Avanya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.7A8 8 0 1 1 8.6 20L3 21Z"/></svg></a>\n' +
'          <a class="icon-link" href="tel:+919999999999" aria-label="Call Avanya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4c0 1-1 2-2 2C10 21 3 14 3 7c0-1 1-2 2-2Z"/></svg></a>\n' +
'          <a class="icon-link" href="mailto:enquiries@avanyatourism.example" aria-label="Email Avanya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>\n' +
'        </div>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Explore</h4>\n' +
'        <ul>\n' +
'          <li><a href="../tourism.html">Tourism</a></li>\n' +
'          <li><a href="../real-estate.html">Real Estate</a></li>\n' +
'          <li><a href="../about.html">About Avanya</a></li>\n' +
'          <li><a href="../contact.html">Contact</a></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Locations</h4>\n' +
'        <ul>\n' +
'          <li><a href="../tourism.html?location=darjeeling">Darjeeling</a></li>\n' +
'          <li><a href="../tourism.html?location=kalimpong">Kalimpong</a></li>\n' +
'          <li><a href="../tourism.html?location=dooars">Dooars</a></li>\n' +
'          <li><a href="../tourism.html?location=mirik">Mirik</a></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'      <div>\n' +
'        <h4>Contact</h4>\n' +
'        <ul>\n' +
'          <li><a href="https://wa.me/919999999999">WhatsApp: +91 99999 99999</a></li>\n' +
'          <li><a href="tel:+919999999999">Call: +91 99999 99999</a></li>\n' +
'          <li><a href="mailto:enquiries@avanyatourism.example">enquiries@avanyatourism.example</a></li>\n' +
'        </ul>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="footer-bottom">\n' +
'      <span>&copy; 2026 Avanya. All rights reserved. Discovery platform only — no online bookings or payments are processed.</span>\n' +
'      <span>Placeholder contact details shown — see README.md before launch.</span>\n' +
'    </div>\n' +
'  </div>\n' +
'</footer>\n' +
'\n' +
'<div class="sticky-bar" aria-label="Quick contact">\n' +
'  <ul>\n' +
'    <li><a href="tel:+919999999999"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4c0 1-1 2-2 2C10 21 3 14 3 7c0-1 1-2 2-2Z"/></svg>Call</a></li>\n' +
'    <li><a href="https://wa.me/919999999999"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.7A8 8 0 1 1 8.6 20L3 21Z"/></svg>WhatsApp</a></li>\n' +
'    <li><a href="../contact.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>Enquire</a></li>\n' +
'  </ul>\n' +
'</div>\n' +
'\n' +
'<script src="../js/taxonomy.js"></script>\n' +
'<script src="../js/listing-rules.js"></script>\n' +
'<script src="../js/data.js"></script>\n' +
'<script src="../js/listings.js"></script>\n' +
'<script src="../js/enquiry-engine.js"></script>\n' +
'<script src="../js/enquiry-form.js"></script>\n' +
'<script src="../js/nav.js"></script>\n' +
'<script src="../js/property-gallery.js"></script>\n' +
'</body>\n' +
'</html>\n';
}

function main() {
  var listingsToGenerate = listingRules.getPublishedListings(data.ALL_LISTINGS);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  listingsToGenerate.forEach(function (item) {
    var outPath = path.join(OUT_DIR, item.slug + '.html');
    fs.writeFileSync(outPath, pageHTML(item), 'utf8');
  });

  console.log('Generated ' + listingsToGenerate.length + ' static property pages into ' + OUT_DIR +
    ' (' + listingsToGenerate.filter(function (i) { return i.module === 'tourism'; }).length + ' Tourism, ' +
    listingsToGenerate.filter(function (i) { return i.module === 'real-estate'; }).length + ' Real Estate).');
}

main();
