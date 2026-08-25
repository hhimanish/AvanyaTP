#!/usr/bin/env node
/* Generates llms.txt — the emerging convention (llmstxt.org) for a short,
 * Markdown table-of-contents file that points an LLM at a site's real pages
 * instead of making it guess from a crawl. Companion to
 * scripts/generate-sitemap.js: same idea (derive real page URLs from
 * js/taxonomy.js and js/data.js instead of hand-listing them, so the two
 * files can't silently drift as locations/listings change), different
 * audience — sitemap.xml is for traditional crawlers/indexers, llms.txt is
 * specifically for LLM tools that read it directly rather than crawling.
 *
 * Run with: node scripts/generate-llms-txt.js
 */

'use strict';

var fs = require('fs');
var path = require('path');

require(path.join(__dirname, '..', 'js', 'taxonomy.js'));

var taxonomy = global.AvanyaTaxonomy;

var BASE_URL = 'https://www.avanyatourism.example';

var corePages = [
  { title: 'Home', loc: '/index.html', desc: 'Avanya\'s homepage — an overview of both discovery verticals and all seven North Bengal zones.' },
  { title: 'Tourism', loc: '/tourism.html', desc: 'Browse and filter all published Tourism stays (homestays, resorts, heritage bungalows, tea bungalows, farm stays, hotels) across North Bengal.' },
  { title: 'Real Estate', loc: '/real-estate.html', desc: 'Browse and filter all published Real Estate listings (land, homestays, resorts, bungalows, hotels, flats, houses) available to buy or lease across North Bengal.' },
  { title: 'Search', loc: '/search.html', desc: 'Free-text search across Tourism stays, Real Estate listings, zones, and experience tags.' },
  { title: 'Plan a Custom Trip', loc: '/travel-plan.html', desc: 'Request a hand-picked North Bengal itinerary by submitting travel dates, group size, and interests.' },
  { title: 'About', loc: '/about.html', desc: 'Avanya\'s story, mission, and the seven North Bengal zones it operates in.' },
  { title: 'Contact', loc: '/contact.html', desc: 'Send Avanya a general enquiry, or reach the team directly by WhatsApp, phone, or email.' },
  { title: 'North Bengal', loc: '/north-bengal.html', desc: 'All seven North Bengal zones Avanya covers, each linking to its Tourism stays and Real Estate listings.' },
  { title: 'Things to Do', loc: '/things-to-do.html', desc: 'Browse North Bengal by experience — mountain views, tea-garden stays, river-front, wildlife/forest, heritage & colonial — each linking to matching Tourism stays.' }
];

var locationPages = taxonomy.getLocations().map(function (loc) {
  return {
    title: 'Tourism in ' + loc.name,
    loc: '/tourism.html?location=' + loc.slug,
    desc: 'Tourism stays filtered to ' + loc.name + ', North Bengal.'
  };
});

function section(title, pages) {
  return '## ' + title + '\n\n' +
    pages.map(function (p) {
      return '- [' + p.title + '](' + BASE_URL + p.loc + '): ' + p.desc;
    }).join('\n') + '\n';
}

var content = '# Avanya\n\n' +
  '> Avanya is a North Bengal-focused discovery platform for Tourism stays and Real Estate — Darjeeling, Kalimpong, Kurseong, Mirik, Dooars, Lava, and Paren. Discovery only: no online bookings or payments; every listing links to a direct enquiry (WhatsApp, call, or email).\n\n' +
  section('Core Pages', corePages) + '\n' +
  section('Tourism by Zone', locationPages) + '\n' +
  '## Notes\n\n' +
  '- All 24 published listings (14 Tourism, 10 Real Estate) each have their own static page at /property/<slug>.html — see /sitemap.xml for the full, machine-generated list of every individual listing URL; this file intentionally lists page *categories*, not all 24 listings by name, matching the convention\'s "table of contents" purpose rather than duplicating the sitemap.\n' +
  '- Listing content (names, descriptions, prices) is illustrative synthetic data for this build, not live Avanya inventory — see README.md.\n';

var outPath = path.join(__dirname, '..', 'llms.txt');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Wrote ' + outPath + ' (' + corePages.length + ' core pages + ' + locationPages.length + ' location views).');
