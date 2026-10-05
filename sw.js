// =========================================
// Digital NoteBook V2
// Service Worker
// =========================================

const CACHE_NAME = "digital-notebook-v2-1";

const APP_SHELL = [
    "./",
    "./index.html",
    "./add-income.html",
    "./add-saving.html",
    "./add-transaction.html",
    "./account.html",
    "./setting.html",
    "./notebook.html",
    "./calendar.html",
    "./calculate.html",
    "./qrscan.html",

    "./css/app.css",

    "./js/firebase.js",
    "./js/auth.js",
    "./js/storage.js",
    "./js/sync.js",
    "./js/finance.js",
    "./js/language.js",
    "./js/theme.js",
    "./js/app.js",
    "./js/incomes.js",
    "./js/savings.js",
    "./js/transactions.js",
    "./js/notes.js",

    "./manifest.json",
    "./assets/N1024.png"
];


// =========================================
// INSTALL
// =========================================

self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then((cache) => {

                    return cache.addAll(
                        APP_SHELL
                    );

                })
                .catch((error) => {

                    console.error(
                        "Service Worker cache error:",
                        error
                    );

                })

        );

        self.skipWaiting();
    }
);


// =========================================
// ACTIVATE
// =========================================

self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(

            caches
                .keys()
                .then((cacheNames) => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                (name) =>
                                    name !== CACHE_NAME
                            )
                            .map(
                                (name) =>
                                    caches.delete(name)
                            )

                    );

                })

        );

        self.clients.claim();
    }
);


// =========================================
// FETCH
// =========================================

self.addEventListener(
    "fetch",
    (event) => {

        const request =
            event.request;

        // Only handle GET requests
        if (request.method !== "GET") {
            return;
        }


        event.respondWith(

            caches.match(request)
                .then((cachedResponse) => {

                    if (cachedResponse) {

                        // Return cached app files first
                        // and refresh them in background
                        refreshCache(
                            request
                        );

                        return cachedResponse;
                    }


                    // If not cached,
                    // try the internet
                    return fetch(request)
                        .then((networkResponse) => {

                            if (
                                networkResponse &&
                                networkResponse.status === 200 &&
                                networkResponse.type !== "opaque"
                            ) {

                                const responseClone =
                                    networkResponse.clone();

                                caches
                                    .open(CACHE_NAME)
                                    .then((cache) => {

                                        cache.put(
                                            request,
                                            responseClone
                                        );

                                    });
                            }

                            return networkResponse;

                        })
                        .catch(() => {

                            // Basic offline fallback
                            if (
                                request.mode === "navigate"
                            ) {

                                return caches.match(
                                    "./index.html"
                                );
                            }

                            return new Response(
                                "Offline",
                                {
                                    status: 503,
                                    headers: {
                                        "Content-Type":
                                            "text/plain"
                                    }
                                }
                            );

                        });

                })

        );
    }
);


// =========================================
// BACKGROUND CACHE REFRESH
// =========================================

function refreshCache(request) {

    fetch(request)
        .then((response) => {

            if (
                !response ||
                response.status !== 200 ||
                response.type === "opaque"
            ) {
                return;
            }

            return caches
                .open(CACHE_NAME)
                .then((cache) => {

                    return cache.put(
                        request,
                        response
                    );

                });

        })
        .catch(() => {
            // Internet unavailable.
            // Existing cache remains usable.
        });
}


// =========================================
// MESSAGE HANDLER
// =========================================

self.addEventListener(
    "message",
    (event) => {

        if (
            event.data &&
            event.data.type ===
                "SKIP_WAITING"
        ) {

            self.skipWaiting();
        }

    }
);
