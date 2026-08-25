/* Avanya static data layer.
   Pattern: everything attached to `window.AvanyaData` (no ES modules) so every
   page can load this with a plain <script> tag, including when opened via file://. */

(function (root) {
  /* Phase 2 (Core Taxonomy): Locations, Experience tags, and Property Types are no
     longer defined here — they live in js/taxonomy.js, the single canonical source,
     loaded before this file on every page. This file derives its LOCATIONS/
     EXPERIENCE_TAGS/TOURISM_TYPES/REAL_ESTATE_TYPES from it below, purely for
     backward-compatible shape (listings.js and property-detail.js already read
     data.getLocationName()/data.getExperienceTagName() and expect these arrays to
     exist on window.AvanyaData) — there is exactly one place taxonomy data is
     actually authored now, not three. */
  var taxonomy = root.AvanyaTaxonomy;

  var LOCATIONS = taxonomy.getLocations().map(function (l) {
    return { slug: l.slug, name: l.name };
  });

  var EXPERIENCE_TAGS = taxonomy.getExperiences().map(function (e) {
    return { slug: e.slug, name: e.name };
  });

  var TOURISM_TYPES = taxonomy.getPropertyTypes({ verticalScope: 'tourism' }).map(function (t) { return t.name; });
  var REAL_ESTATE_TYPES = taxonomy.getPropertyTypes({ verticalScope: 'real_estate' }).map(function (t) { return t.name; });

  var TOURISM_LISTINGS = [
    {
      slug: 'darjeeling-heritage-bungalow-retreat',
      module: 'tourism',
      name: 'Windermere Ridge Heritage Bungalow',
      location: 'darjeeling',
      propertyType: 'Heritage Bungalow',
      experienceTags: ['heritage-colonial', 'mountain-views'],
      placeholderTheme: 'heritage',
      description: 'A restored colonial-era bungalow perched on a Darjeeling ridge, with wraparound verandahs, wood-fired fireplaces, and unbroken views of the Kanchenjunga range. Original teak floors and a working library room preserve the estate’s early-1900s character.',
      highlights: [
        'Uninterrupted Kanchenjunga sunrise view from the verandah',
        'Original 1920s teak interiors, restored not replaced',
        'In-house Darjeeling tea tasting room',
        'Short walk to the Mall Road heritage circuit'
      ]
    },
    {
      slug: 'darjeeling-tea-garden-homestay',
      module: 'tourism',
      name: 'Selim Hill Tea Garden Homestay',
      location: 'darjeeling',
      propertyType: 'Homestay',
      experienceTags: ['tea-garden-stays', 'mountain-views'],
      placeholderTheme: 'tea-garden',
      description: 'A family-run homestay set inside a working second-flush tea garden above Darjeeling town. Guests wake to pluckers moving through the rows and can join a guided walk through the factory next door.',
      highlights: [
        'Rooms open directly onto the tea garden',
        'Guided factory-floor tea processing walk',
        'Home-cooked Nepali-Bengali meals included',
        'Bonfire evenings with garden-grown tea'
      ]
    },
    {
      slug: 'kalimpong-hillside-resort',
      module: 'tourism',
      name: 'Deolo Hillside Resort',
      location: 'kalimpong',
      propertyType: 'Resort',
      experienceTags: ['mountain-views'],
      placeholderTheme: 'forest',
      description: 'A terraced hillside resort near Deolo Hill with pine-facing cottages, a landscaped garden, and an open-air deck built for long mountain evenings. A quieter, less crowded alternative to Darjeeling’s busier viewpoints.',
      highlights: [
        'Terraced cottages facing the Deolo pine ridge',
        'Open-air sundeck with valley views',
        'Flower-nursery walking trail on-site',
        'Bonfire and live acoustic evenings on request'
      ]
    },
    {
      slug: 'kalimpong-orchid-farm-stay',
      module: 'tourism',
      name: 'Relli Valley Orchid Farm Stay',
      location: 'kalimpong',
      propertyType: 'Farm Stay',
      experienceTags: ['tea-garden-stays'],
      placeholderTheme: 'tea-garden',
      description: 'A working orchid and cardamom farm in the Relli valley, offering simple cottage stays and hands-on time in the nursery. A good fit for slow travellers who want to understand the region’s agriculture, not just view it.',
      highlights: [
        'Hands-on orchid nursery sessions',
        'Farm-to-table meals from the property’s own kitchen garden',
        'Cardamom plantation walk with the farm owner',
        'River access a short walk downhill'
      ]
    },
    {
      slug: 'kurseong-colonial-tea-bungalow',
      module: 'tourism',
      name: 'Makaibari Colonial Tea Bungalow',
      location: 'kurseong',
      propertyType: 'Tea Bungalow',
      experienceTags: ['tea-garden-stays', 'heritage-colonial'],
      placeholderTheme: 'heritage',
      description: 'A planter’s bungalow within a historic Kurseong tea estate, still run alongside an active factory. High ceilings, a preserved study, and estate-grown tea served on the same lawns where it was first planted a century ago.',
      highlights: [
        'Stay inside a functioning tea estate',
        'Factory visit included in every stay',
        'Preserved planter-era furniture and study',
        'Estate lawns open for private evening tea service'
      ]
    },
    {
      slug: 'kurseong-misty-ridge-homestay',
      module: 'tourism',
      name: 'Dow Hill Misty Ridge Homestay',
      location: 'kurseong',
      propertyType: 'Homestay',
      experienceTags: ['mountain-views'],
      placeholderTheme: 'forest',
      description: 'A small family homestay near Dow Hill’s forested ridge, known locally for the low cloud that settles over the property most mornings. Simple rooms, a wood-stove common area, and walking access to the Eagle’s Crag viewpoint.',
      highlights: [
        'Five-minute walk to Eagle’s Crag viewpoint',
        'Wood-stove common room for cold evenings',
        'Guided forest walks through Dow Hill',
        'Home-cooked meals with a set daily menu'
      ]
    },
    {
      slug: 'mirik-lakeview-hotel',
      module: 'tourism',
      name: 'Sumendu Lakeview Hotel',
      location: 'mirik',
      propertyType: 'Hotel',
      experienceTags: ['river-front', 'mountain-views'],
      placeholderTheme: 'river',
      description: 'A mid-size hotel directly overlooking Mirik’s Sumendu Lake, with a boardwalk-facing restaurant and rooms designed around the water view. A practical base for groups wanting comfort without a remote homestay setup.',
      highlights: [
        'Lake-facing rooms with private balconies',
        'On-site restaurant overlooking the boardwalk',
        'Walkable to Mirik’s orange orchards',
        'Group and family room configurations available'
      ]
    },
    {
      slug: 'mirik-pinewood-homestay',
      module: 'tourism',
      name: 'Pinewood Ridge Homestay',
      location: 'mirik',
      propertyType: 'Homestay',
      experienceTags: ['mountain-views'],
      placeholderTheme: 'forest',
      description: 'A quiet pine-forest homestay above Mirik town, run by a retired schoolteacher couple who host small groups. Long uninterrupted views and a genuinely slow pace, away from the lake-side crowds.',
      highlights: [
        'Pine-forest setting away from the main lake crowd',
        'Small-group only, maximum 4 rooms',
        'Home library and board games in the common room',
        'Guided sunrise walk to a nearby ridge point'
      ]
    },
    {
      slug: 'dooars-riverside-forest-resort',
      module: 'tourism',
      name: 'Murti Riverside Forest Resort',
      location: 'dooars',
      propertyType: 'Resort',
      experienceTags: ['river-front', 'wildlife-forest'],
      placeholderTheme: 'river',
      description: 'A forest-edge resort on the banks of the Murti river, bordering the Gorumara buffer zone. Cottages are raised on stilts facing the riverbed, with guided jeep safaris arranged directly through the property.',
      highlights: [
        'Cottages raised directly above the riverbed',
        'Gorumara buffer-zone jeep safaris arranged on-site',
        'River-facing bonfire deck',
        'Birding walks with a local naturalist guide'
      ]
    },
    {
      slug: 'dooars-jungle-camp-homestay',
      module: 'tourism',
      name: 'Chapramari Jungle Camp Homestay',
      location: 'dooars',
      propertyType: 'Homestay',
      experienceTags: ['wildlife-forest'],
      placeholderTheme: 'forest',
      description: 'A simple, community-run camp-style homestay on the edge of Chapramari forest, built and staffed by a local village collective. Basic comforts, genuine forest proximity, and direct income to the host community.',
      highlights: [
        'Run by a local village collective, not a chain operator',
        'Direct edge-of-forest location',
        'Community-guided nature walks',
        'Elephant-corridor awareness briefing included'
      ]
    },
    {
      slug: 'lava-monastery-view-homestay',
      module: 'tourism',
      name: 'Lava Monastery View Homestay',
      location: 'lava',
      propertyType: 'Homestay',
      experienceTags: ['mountain-views', 'heritage-colonial'],
      placeholderTheme: 'heritage',
      description: 'A wood-and-stone homestay facing the Kagyu monastery at Lava, with prayer-flag-lined pathways and views into the Neora Valley. Mornings often start with the monastery’s horns carrying across the hillside.',
      highlights: [
        'Direct view of the Lava Kagyu monastery',
        'Short walk to the Neora Valley National Park gate',
        'Wood-stove heated rooms',
        'Optional monastery morning-prayer visit'
      ]
    },
    {
      slug: 'lava-cloud-forest-resort',
      module: 'tourism',
      name: 'Neora Cloud Forest Resort',
      location: 'lava',
      propertyType: 'Resort',
      experienceTags: ['wildlife-forest', 'mountain-views'],
      placeholderTheme: 'forest',
      description: 'A small resort bordering Neora Valley National Park’s dense cloud forest, built with minimal footprint and elevated walkways connecting the cottages. Known for red panda sighting briefings from the resident naturalist.',
      highlights: [
        'Elevated walkways minimise forest-floor impact',
        'Resident naturalist runs daily briefings',
        'Direct boundary with Neora Valley National Park',
        'Cloud-forest canopy views from every cottage'
      ]
    },
    {
      slug: 'kaffer-birding-farm-stay',
      module: 'tourism',
      name: 'Kaffer Birding Farm Stay',
      location: 'kaffer',
      propertyType: 'Farm Stay',
      experienceTags: ['wildlife-forest', 'tea-garden-stays'],
      placeholderTheme: 'tea-garden',
      description: 'A small organic farm and known birding spot near Kaffer, popular with serious birders chasing the region’s high-altitude species list. Simple rooms, farm produce meals, and a resident guide with a decades-long local list.',
      highlights: [
        'Resident birding guide with a 300+ species local list',
        'Organic farm produce used in every meal',
        'Quiet, low-traffic viewpoint rarely on standard itineraries',
        'Basic but warm rooms, wood-stove heated'
      ]
    },
    {
      slug: 'kaffer-hilltop-heritage-bungalow',
      module: 'tourism',
      name: 'Kaffer Hilltop Heritage Bungalow',
      location: 'kaffer',
      propertyType: 'Heritage Bungalow',
      experienceTags: ['heritage-colonial'],
      placeholderTheme: 'heritage',
      description: 'A restored forest-department era bungalow on Kaffer’s highest point, once used by touring foresters and now opened to guests in small numbers. Simple, dignified interiors and one of the widest panoramas in the region.',
      highlights: [
        'Former forest-department inspection bungalow',
        'Widest panoramic viewpoint in the Kaffer belt',
        'Limited to two rooms for privacy',
        'Caretaker-cooked regional meals on request'
      ]
    }
  ];

  var REAL_ESTATE_LISTINGS = [
    {
      slug: 'darjeeling-tea-estate-land-parcel',
      module: 'real-estate',
      name: 'Ging Valley Tea Estate Land Parcel',
      location: 'darjeeling',
      propertyType: 'Land',
      transactionType: ['buy'],
      priceLabel: '₹ 1.8 Cr onwards',
      priceValue: 18000000,
      placeholderTheme: 'forest',
      description: 'A titled land parcel bordering an established tea estate in the Ging valley, with existing road access and a gentle south-facing slope. Suited to a private residence or a small boutique-stay development, subject to hill-area clearances.',
      highlights: [
        'South-facing slope with existing motorable access',
        'Bordered by an established tea estate',
        'Clear title, hill-area land-use rules apply',
        'Suitable for residence or small boutique-stay development'
      ]
    },
    {
      slug: 'darjeeling-colonial-bungalow-for-sale',
      module: 'real-estate',
      name: 'Jalapahar Colonial Bungalow',
      location: 'darjeeling',
      propertyType: 'Heritage Bungalow',
      transactionType: ['buy'],
      priceLabel: '₹ 4.2 Cr',
      priceValue: 42000000,
      placeholderTheme: 'heritage',
      description: 'A five-bedroom colonial bungalow on Jalapahar ridge with original stone masonry and a walled garden. Requires sympathetic restoration but retains its structural core, roofline, and most original fittings.',
      highlights: [
        'Five bedrooms across two floors',
        'Original stone masonry and roofline intact',
        'Walled garden with mature rhododendron cover',
        'Restoration-ready, structurally sound core'
      ]
    },
    {
      slug: 'kalimpong-hillside-plot',
      module: 'real-estate',
      name: 'Durpin Hillside Residential Plot',
      location: 'kalimpong',
      propertyType: 'Land',
      transactionType: ['buy', 'lease'],
      priceLabel: '₹ 65 L (buy) / ₹ 45,000 mo (lease)',
      priceValue: 6500000,
      placeholderTheme: 'forest',
      description: 'A residential-zoned plot near Durpin Hill available either for outright purchase or long-term lease, with municipal road frontage and existing water connection. Flat building pad already cut into the slope.',
      highlights: [
        'Available for purchase or long-term lease',
        'Municipal road frontage with water connection',
        'Building pad already levelled',
        'Durpin Hill monastery visible from the plot'
      ]
    },
    {
      slug: 'kalimpong-family-house',
      module: 'real-estate',
      name: 'Deolo Road Family House',
      location: 'kalimpong',
      propertyType: 'House',
      transactionType: ['buy'],
      priceLabel: '₹ 1.1 Cr',
      priceValue: 11000000,
      placeholderTheme: 'forest',
      description: 'A three-bedroom independent house on Deolo Road with a private garden and covered parking for two vehicles. Recently repainted and re-roofed, move-in ready for a family or a small guesthouse conversion.',
      highlights: [
        'Three bedrooms, independent standalone house',
        'Private garden and two-vehicle covered parking',
        'Recently re-roofed and repainted',
        'Zoning permits residential or small guesthouse use'
      ]
    },
    {
      slug: 'kurseong-tea-bungalow-lease',
      module: 'real-estate',
      name: 'Ambootia Tea Bungalow, Long Lease',
      location: 'kurseong',
      propertyType: 'Tea Bungalow',
      transactionType: ['lease'],
      priceLabel: '₹ 90,000 / month',
      priceValue: 90000,
      placeholderTheme: 'tea-garden',
      description: 'A tea-estate bungalow available on long-term lease within an operating Kurseong garden, suited to a hospitality operator or a long-stay private tenant. Estate maintenance and security included in the lease terms.',
      highlights: [
        'Long-term lease within an operating tea garden',
        'Estate-provided maintenance and security',
        'Suited to hospitality operators or long-stay tenants',
        'Furnished planter-style interiors included'
      ]
    },
    {
      slug: 'mirik-lakeview-flat',
      module: 'real-estate',
      name: 'Sumendu View Residency Flat',
      location: 'mirik',
      propertyType: 'Flat',
      transactionType: ['buy'],
      priceLabel: '₹ 48 L',
      priceValue: 4800000,
      placeholderTheme: 'river',
      description: 'A two-bedroom flat in a small low-rise residency overlooking Mirik lake, in a building with four total units and shared rooftop access. A practical entry point into Mirik property ownership without land-title complexity.',
      highlights: [
        'Two-bedroom flat with lake-facing balcony',
        'Low-rise building, four units total',
        'Shared rooftop terrace access',
        'Simpler flat-title transaction, no land conversion needed'
      ]
    },
    {
      slug: 'dooars-riverside-resort-property',
      module: 'real-estate',
      name: 'Murti Riverside Resort Property',
      location: 'dooars',
      propertyType: 'Resort',
      transactionType: ['buy'],
      priceLabel: '₹ 3.6 Cr',
      priceValue: 36000000,
      placeholderTheme: 'river',
      description: 'An operating eight-cottage resort property on the Murti riverbank, sold as a running business with existing staff, safari-operator tie-ups, and forward bookings. A turnkey entry into Dooars hospitality.',
      highlights: [
        'Sold as a running business with existing bookings',
        'Eight cottages, riverbank frontage',
        'Existing safari-operator tie-ups transfer with sale',
        'Staff retention possible on new ownership'
      ]
    },
    {
      slug: 'dooars-forest-edge-land',
      module: 'real-estate',
      name: 'Chalsa Forest-Edge Land',
      location: 'dooars',
      propertyType: 'Land',
      transactionType: ['buy', 'lease'],
      priceLabel: '₹ 95 L (buy) / ₹ 60,000 mo (lease)',
      priceValue: 9500000,
      placeholderTheme: 'forest',
      description: 'Forest-edge land near Chalsa suitable for a low-density stay development, available for either purchase or lease. Elephant-corridor proximity means construction plans require additional wildlife-department review.',
      highlights: [
        'Available for purchase or lease terms',
        'Suited to low-density stay development',
        'Elephant-corridor proximity requires wildlife review',
        'Existing boundary fencing and access track'
      ]
    },
    {
      slug: 'lava-hill-homestay-property',
      module: 'real-estate',
      name: 'Lava Hillside Homestay Property',
      location: 'lava',
      propertyType: 'Homestay',
      transactionType: ['buy'],
      priceLabel: '₹ 1.4 Cr',
      priceValue: 14000000,
      placeholderTheme: 'heritage',
      description: 'A six-room operating homestay property near Lava monastery, sold with fixtures, furnishings, and an existing guest-review history. Suited to a buyer wanting to step directly into hospitality operation.',
      highlights: [
        'Six operating guest rooms, sold with furnishings',
        'Existing guest-review and booking history',
        'Walking distance to Lava monastery',
        'Wood-stove heating throughout, already installed'
      ]
    },
    {
      slug: 'kaffer-boutique-hotel-lease',
      module: 'real-estate',
      name: 'Kaffer Boutique Hotel, Operator Lease',
      location: 'kaffer',
      propertyType: 'Hotel',
      transactionType: ['lease'],
      priceLabel: '₹ 1,25,000 / month',
      priceValue: 125000,
      placeholderTheme: 'tea-garden',
      description: 'A twelve-room boutique hotel building available on operator lease, positioned along Kaffer’s main viewpoint road. Owner is seeking an experienced hospitality operator rather than a passive tenant.',
      highlights: [
        'Twelve rooms, positioned on the main viewpoint road',
        'Owner prefers an experienced hospitality operator',
        'Existing commercial-use permissions in place',
        'On-site staff quarters included in the lease'
      ]
    }
  ];

  var ALL_LISTINGS = TOURISM_LISTINGS.concat(REAL_ESTATE_LISTINGS);

  function getLocationName(slug) {
    var loc = LOCATIONS.filter(function (l) { return l.slug === slug; })[0];
    return loc ? loc.name : slug;
  }

  function getExperienceTagName(slug) {
    var tag = EXPERIENCE_TAGS.filter(function (t) { return t.slug === slug; })[0];
    return tag ? tag.name : slug;
  }

  function findBySlug(slug) {
    return ALL_LISTINGS.filter(function (item) { return item.slug === slug; })[0] || null;
  }

  root.AvanyaData = {
    LOCATIONS: LOCATIONS,
    EXPERIENCE_TAGS: EXPERIENCE_TAGS,
    TOURISM_TYPES: TOURISM_TYPES,
    REAL_ESTATE_TYPES: REAL_ESTATE_TYPES,
    TOURISM_LISTINGS: TOURISM_LISTINGS,
    REAL_ESTATE_LISTINGS: REAL_ESTATE_LISTINGS,
    ALL_LISTINGS: ALL_LISTINGS,
    getLocationName: getLocationName,
    getExperienceTagName: getExperienceTagName,
    findBySlug: findBySlug
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
