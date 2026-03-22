const CACHE_NAME = 'moodgrid-v3';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Sulphur+Point:wght@300;400;700&family=Noto+Sans+TC:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
  './badges/Collection-01.svg',
  './badges/Collection-02.svg',
  './badges/Collection-03.svg',
  './badges/Collection-04.svg',
  './badges/Collection-05.svg',
  './badges/Collection-06.svg',
  './badges/Collection-07.svg',
  './badges/Collection-08.svg',
  './badges/Collection-09.svg',
  './badges/Collection-10.svg',
  './badges/Collection-11.svg',
  './badges/Collection-12.svg',
  './badges/Collection-13.svg',
  './badges/Collection-14.svg',
  './badges/Collection-15.svg',
  './badges/Collection-16.svg',
  './badges/Collection-17.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Notion API / Cloudflare Worker — 永遠走網路，不快取
  if (url.hostname.includes('workers.dev') || url.hostname.includes('notion.so')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // Google Fonts — network first，失敗才用快取
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 其他資源 — cache first，沒有才走網路
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});
