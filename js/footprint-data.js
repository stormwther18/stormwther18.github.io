/* ---------------------------------------------------------------------------
   Footprint data — the only file you need to edit to add a place or photos.

   One entry per place. A place is somewhere you have set foot, not a trip:
   `first` is the first time you went and is used only for ordering, it is
   never shown on the page, so a place you keep going back to still gets one
   pin and one entry.

   Fields
     name     the label on the map pin. On the Chinese mainland this is the
              province or municipality — there are too many cities to pin one
              by one. Everywhere else it is a city, or a region when several
              cities are one point at world scale (Kyushu, Setouchi).
     country  ISO-3166 alpha-3 — shades the country/region on the map, picks
              the flag, and feeds the countries/regions count. A new country
              also needs its flag in assets/flags/ and a line in the FLAG
              table in js/footprint.js.
     lat/lon  decimal degrees, north/east positive
     first    "YYYY-MM", first visit; ordering only, not displayed
     note     one short line, optional, shown when the pin is selected
     intro    optional single line, shown under the filter chip when the place
              is selected. Keep it short enough to stay on one line; most
              places do not need one at all. Never use an em dash here or in
              a caption.
     base     set true on the one place you are based in — it gets a larger
              star pin and extra clearance from its neighbours
     photos   [{ src, w, h, caption?, date? }]  w/h are the file's real pixel
              dimensions — the gallery solves row heights from them, so they
              matter. `date` ("YYYY-MM") is per photo and groups the gallery
              by year; it falls back to `first` when omitted.

   Photos go in assets/img/footprint/. Long edge 1600px, WebP, under 300 KB,
   named like 2024-08-xian-01.webp

   Every place gets its own pin — there is no clustering. Pins that would
   sit on top of each other are nudged a few pixels apart so all of them
   stay visible and clickable; where cities are genuinely the same spot on a
   world map, use one entry with a region name and list the cities in `note`
   (see Kyushu and Setouchi below).
--------------------------------------------------------------------------- */

window.FOOTPRINT = {

  demo: false,

  // Extra countries/regions to shade without placing a pin (layovers etc.)
  countries: [],

  places: [
    /* --- Chinese mainland: provinces and municipalities, not cities.
           These carry no photos by choice — pins only. -------------------- */
    { name: 'Shanghai',  country: 'CHN', lat: 31.23, lon: 121.47, first: '2022-09', base: true, photos: [] },
    { name: 'Anhui',     country: 'CHN', lat: 31.82, lon: 117.23, first: '2023-01', note: 'Hefei', photos: [] },
    { name: 'Zhejiang',  country: 'CHN', lat: 30.27, lon: 120.16, first: '2023-03', photos: [] },
    { name: 'Guangdong', country: 'CHN', lat: 23.13, lon: 113.26, first: '2023-10', photos: [] },
    { name: 'Liaoning',  country: 'CHN', lat: 38.91, lon: 121.61, first: '2023-12', note: 'Dalian', photos: [] },
    { name: 'Hunan',     country: 'CHN', lat: 28.23, lon: 112.94, first: '2024-02', note: 'Changsha', photos: [] },
    { name: 'Hubei',     country: 'CHN', lat: 30.59, lon: 114.31, first: '2024-02', note: 'Wuhan', photos: [] },
    { name: 'Jiangsu',   country: 'CHN', lat: 32.06, lon: 118.80, first: '2024-04', note: 'Nanjing', photos: [] },
    { name: 'Hainan',    country: 'CHN', lat: 19.50, lon: 109.90, first: '2024-05', note: 'Sanya · Haikou', photos: [] },
    { name: 'Shaanxi',   country: 'CHN', lat: 34.34, lon: 108.94, first: '2024-08', note: 'Xi’an', photos: [] },
    { name: 'Beijing',   country: 'CHN', lat: 39.90, lon: 116.41, first: '2025-09', photos: [] },
    { name: 'Chongqing', country: 'CHN', lat: 29.56, lon: 106.55, first: '2025-12', photos: [] },

    /* --- Hong Kong & Macau ------------------------------------------- */
    { name: 'Hong Kong',  country: 'HKG', lat: 22.32, lon: 114.17, first: '2023-10', photos: [] },
    { name: 'Macau',      country: 'MAC', lat: 22.19, lon: 113.54, first: '2024-04', photos: [] },

    /* --- Southeast Asia ---------------------------------------------- */
    { name: 'Singapore',      country: 'SGP', lat:  1.35, lon: 103.82, first: '2024-03', photos: [] },
    { name: 'Kuala Lumpur',   country: 'MYS', lat:  3.14, lon: 101.69, first: '2024-03', photos: [] },
    { name: 'Bangkok',        country: 'THA', lat: 13.76, lon: 100.50, first: '2024-07', photos: [] },
    { name: 'Phuket',         country: 'THA', lat:  7.88, lon:  98.39, first: '2024-07', photos: [] },

    /* --- Korea & Japan ------------------------------------------------ */
    { name: 'Jeju',      country: 'KOR', lat: 33.50, lon: 126.53, first: '2024-01', photos: [] },
    { name: 'Kyushu',    country: 'JPN', lat: 33.30, lon: 130.20, first: '2024-09', note: 'Fukuoka · Saga · Nagasaki', photos: [] },
    { name: 'Tokyo', country: 'JPN', lat: 35.68, lon: 139.69, first: '2024-12',
      note: 'Yokohama · Kamakura · Mount Fuji',
      intro: 'To me, Tokyo is what a thriving city looks like.',
      photos: [
        { src: 'assets/img/footprint/2024-12-tokyo-tower.webp', w: 1200, h: 1600, date: '2024-12',
          caption: 'From Tokyo Tower, a few minutes before sunset.' },
        { src: 'assets/img/footprint/2024-12-tokyo-ginkgo.webp', w: 1200, h: 1600, date: '2024-12',
          caption: 'The ginkgo avenue at the University of Tokyo, past its peak and mostly underfoot.' },
        { src: 'assets/img/footprint/2024-12-kamakura-fuji.webp', w: 1200, h: 1600, date: '2024-12',
          caption: 'Fuji over the beach at Kamakura, late in the afternoon.' }
      ] },
    { name: 'Osaka',     country: 'JPN', lat: 34.69, lon: 135.50, first: '2025-03', note: 'Kobe', photos: [] },
    { name: 'Shirahama', country: 'JPN', lat: 33.68, lon: 135.34, first: '2025-03', note: 'Wakayama',
      photos: [
        { src: 'assets/img/footprint/2025-03-shirahama.webp', w: 1200, h: 1600, date: '2025-03' }
      ] },
    { name: 'Tottori',   country: 'JPN', lat: 35.54, lon: 134.23, first: '2025-03', note: 'Sand dunes',
      photos: [
        { src: 'assets/img/footprint/2025-03-tottori-dunes.webp', w: 1600, h: 1200, date: '2025-03' }
      ] },
    { name: 'Setouchi', country: 'JPN', lat: 34.46, lon: 133.99, first: '2025-03',
      note: 'Okayama · Takamatsu · island hopping',
      intro: 'Islands in the Inland Sea with art across them, and a quiet, unhurried few days.',
      photos: [
        { src: 'assets/img/footprint/2025-05-naoshima-pumpkin.webp', w: 1200, h: 1600, date: '2025-05',
          caption: 'Yayoi Kusama\u2019s yellow pumpkin, at the end of the pier on Naoshima.' },
        { src: 'assets/img/footprint/2025-05-naoshima-sign.webp', w: 1200, h: 1600, date: '2025-05',
          caption: 'Driftwood spelling out the island\u2019s name, on the sea wall at Naoshima.' },
        { src: 'assets/img/footprint/2025-05-setouchi-ferry.webp', w: 1200, h: 1600, date: '2025-05' }
      ] },
    { name: 'Ishigaki',  country: 'JPN', lat: 24.34, lon: 124.16, first: '2025-08', note: 'Okinawa', photos: [] },

    /* --- Australia ---------------------------------------------------- */
    { name: 'Melbourne', country: 'AUS', lat: -37.81, lon: 144.96, first: '2025-11',
      photos: [
        { src: 'assets/img/footprint/2025-11-melbourne-skyline.webp', w: 1200, h: 1600, date: '2025-11' }
      ] },
    { name: 'Sydney', country: 'AUS', lat: -33.87, lon: 151.21, first: '2025-11',
      intro: 'A beautiful harbour city that recalls Hong Kong, except the water here opens out instead of closing in.',
      photos: [
        { src: 'assets/img/footprint/2025-11-sydney-jacaranda.webp', w: 1050, h: 1400, date: '2025-11' },
        { src: 'assets/img/footprint/2025-11-sydney-opera-house.webp', w: 1600, h: 1200, date: '2025-11' },
        { src: 'assets/img/footprint/2025-11-sydney-harbour-bridge.webp', w: 1600, h: 1200, date: '2025-11' },
        { src: 'assets/img/footprint/2025-11-sydney-bridge-walk.webp', w: 1200, h: 1600, date: '2025-11',
          caption: 'From the walkway, halfway across the Harbour Bridge.' }
      ] },
    { name: 'Tasmania', country: 'AUS', lat: -42.88, lon: 147.33, first: '2025-11',
      note: 'Stanley · Smithton · Hobart',
      photos: [
        { src: 'assets/img/footprint/2025-11-stanley-godfreys-beach.webp', w: 1200, h: 1600, date: '2025-11' },
        { src: 'assets/img/footprint/2025-11-smithton-sunset.webp', w: 1200, h: 1600, date: '2025-11' },
        { src: 'assets/img/footprint/2025-11-hobart-verandah.webp', w: 1200, h: 1600, date: '2025-11' }
      ] },

    /* --- Europe & North Africa ---------------------------------------- */
    { name: 'Helsinki',       country: 'FIN', lat: 60.17, lon:  24.94, first: '2026-06', photos: [] },
    { name: 'Barcelona',      country: 'ESP', lat: 41.39, lon:   2.17, first: '2026-06', photos: [] },
    { name: 'Madrid',         country: 'ESP', lat: 40.42, lon:  -3.70, first: '2026-06', photos: [] },
    { name: 'Andalusia',      country: 'ESP', lat: 37.39, lon:  -5.99, first: '2026-06', photos: [] },
    { name: 'Gibraltar',      country: 'GIB', lat: 36.14, lon:  -5.35, first: '2026-06', photos: [] },
    { name: 'Porto',          country: 'PRT', lat: 41.16, lon:  -8.63, first: '2026-06', photos: [] },
    { name: 'Lisbon',         country: 'PRT', lat: 38.72, lon:  -9.14, first: '2026-06', photos: [] },
    { name: 'Tangier',        country: 'MAR', lat: 35.78, lon:  -5.81, first: '2026-06', photos: [] }
  ]
};
