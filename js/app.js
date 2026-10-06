/* =========================================================
   DIGITAL NOTEBOOK V2
   MAIN APP ENGINE

   Handles:
   - Theme initialization
   - Language initialization
   - Firebase Auth readiness
   - Guest mode
   - Global app ready event
   - Global auth change event
========================================================= */

import {
    waitForAuth,
    getAuthUserData,
    onUserChanged
} from "./auth.js";

import {
    initTheme
} from "./theme.js";

import {
    initLanguage
} from "./language.js";


/* =========================================================
   APP STATE
========================================================= */

let appReady =
    false;

let appReadyPromise = null;


/* =========================================================
   APP READY EVENT
========================================================= */

function dispatchAppReady(
    user
) {

    window.dispatchEvent(
        new CustomEvent(
            "digitalNotebookReady",
            {
                detail: {
                    user: user || null,
                    auth: getAuthUserData()
                }
            }
        )
    );

}


/* =========================================================
   APP AUTH EVENT
========================================================= */

function handleUserChanged(
    user
) {

    window.dispatchEvent(
        new CustomEvent(
            "digitalNotebookAuthChanged",
            {
                detail: {
                    user: user || null,
                    auth: getAuthUserData()
                }
            }
        )
    );

}


/* =========================================================
   INITIALIZE APP
========================================================= */

export async function initApp() {

    /*
       Prevent duplicate initialization.
    */

    if (appReady) {

        return {
            ready: true,
            user:
                getAuthUserData()
        };

    }


    if (appReadyPromise) {

        return await appReadyPromise;

    }


    appReadyPromise =
        (async () => {

            /* -----------------------------------------
               1. Theme
            ----------------------------------------- */

            try {

                initTheme();

            } catch (error) {

                console.error(
                    "Theme initialization failed:",
                    error
                );

            }


            /* -----------------------------------------
               2. Language
            ----------------------------------------- */

            try {

                initLanguage();

            } catch (error) {

                console.error(
                    "Language initialization failed:",
                    error
                );

            }


            /* -----------------------------------------
               3. Wait for Firebase Auth
            ----------------------------------------- */

            let user = null;

            try {

                user =
                    await waitForAuth();

            } catch (error) {

                console.error(
                    "Auth initialization failed:",
                    error
                );

            }


            /* -----------------------------------------
               4. Mark App Ready
            ----------------------------------------- */

            appReady =
                true;


            /* -----------------------------------------
               5. Dispatch Ready Event
            ----------------------------------------- */

            dispatchAppReady(
                user
            );


            return {

                ready: true,

                user:
                    user || null,

                auth:
                    getAuthUserData()

            };

        })();


    return await appReadyPromise;

}


/* =========================================================
   WAIT FOR APP
========================================================= */

export async function waitForApp() {

    if (appReady) {

        return {
            ready: true,
            user:
                getAuthUserData()
        };

    }


    return await initApp();

}


/* =========================================================
   APP READY CHECK
========================================================= */

export function isAppReady() {

    return appReady;

}


/* =========================================================
   CURRENT APP USER
========================================================= */

export function getAppUser() {

    return (
        getAuthUserData()
    );

}


/* =========================================================
   GUEST MODE CHECK
========================================================= */

export function isGuestMode() {

    return !(
        getAuthUserData()
            .loggedIn
    );

}


/* =========================================================
   AUTH CHANGE LISTENER
========================================================= */

const stopAuthListener =
    onUserChanged(
        (user) => {

            handleUserChanged(
                user
            );

        }
    );


/* =========================================================
   AUTO INITIALIZATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initApp();

        },
        {
            once: true
        }
    );

} else {

    initApp();

}


/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Digital Notebook error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    (event) => {

        console.error(
            "Digital Notebook promise error:",
            event.reason
        );

    }
);


/* =========================================================
   CLEANUP
========================================================= */

export function destroyAppListeners() {

    if (
        typeof stopAuthListener ===
        "function"
    ) {

        stopAuthListener();

    }

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    initApp,

    waitForApp,

    isAppReady,

    getAppUser,

    isGuestMode,

    destroyAppListeners

};
