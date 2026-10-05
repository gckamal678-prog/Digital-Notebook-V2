// js/app.js

import {
    waitForAuth,
    getCurrentUser
} from "./auth.js";

import {
    initTheme
} from "./theme.js";

import {
    getLanguage,
    applyTranslations
} from "./language.js";

async function startApp() {

    // Theme
    initTheme();

    // Language
    const language =
        getLanguage();

    applyTranslations(language);

    // Auth
    const user =
        await waitForAuth();

    if (user) {

        console.log(
            "Digital Notebook V2:",
            user.uid
        );

    } else {

        console.log(
            "Digital Notebook V2: Guest"
        );
    }

    // App ready event
    window.dispatchEvent(
        new CustomEvent(
            "digitalNotebookReady",
            {
                detail: {
                    user:
                        getCurrentUser()
                }
            }
        )
    );
}

startApp();
// =========================================
// SERVICE WORKER
// =========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("./sw.js")
                .then((registration) => {

                    console.log(
                        "Service Worker registered:",
                        registration.scope
                    );

                })
                .catch((error) => {

                    console.error(
                        "Service Worker registration failed:",
                        error
                    );

                });

        }
    );
}
