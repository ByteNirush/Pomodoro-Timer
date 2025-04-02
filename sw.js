const CACHE_NAME = 'pomodoro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/sounds/start.mp3',
    '/sounds/pause.mp3',
    '/sounds/complete.mp3',
    '/sounds/reset.mp3',
    // Music files
    '/music/focus/focus1.mp3',
    '/music/focus/focus2.mp3',
    '/music/focus/focus3.mp3',
    '/music/relax/relax1.mp3',
    '/music/relax/relax2.mp3',
    '/music/relax/relax3.mp3',
    '/music/nature/nature1.mp3',
    '/music/nature/nature2.mp3',
    '/music/nature/nature3.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(error => {
                        console.error('Fetch failed:', error);
                        return new Response('Offline mode is not available for this resource');
                    });
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 