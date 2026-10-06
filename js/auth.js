/* =========================================================
   DIGITAL NOTEBOOK V2
   AUTHENTICATION ENGINE

   Handles:
   - Current user
   - Login state
   - User UID
   - Auth state events
   - Auth waiting
   - Future Email/Password integration
========================================================= */

import {
    auth,
    onAuthStateChanged
} from "./firebase.js";


/* =========================================================
   CURRENT USER
========================================================= */

let currentUser = null;

let authReady = false;

let authReadyPromise;


/* =========================================================
   AUTH READY PROMISE
========================================================= */

authReadyPromise =
    new Promise((resolve) => {

        onAuthStateChanged(
            auth,
            (user) => {

                currentUser = user;

                authReady = true;

                resolve(user);

                window.dispatchEvent(
                    new CustomEvent(
                        "authChanged",
                        {
                            detail: user
                        }
                    )
                );

            }
        );

    });


/* =========================================================
   GET CURRENT USER
========================================================= */

export function getCurrentUser() {

    return (
        currentUser ||
        auth.currentUser ||
        null
    );

}


/* =========================================================
   GET USER UID
========================================================= */

export function getUserId() {

    const user =
        getCurrentUser();

    if (!user) {
        return null;
    }

    return user.uid;

}


/* =========================================================
   GET USER EMAIL
========================================================= */

export function getUserEmail() {

    const user =
        getCurrentUser();

    if (!user) {
        return "";
    }

    return user.email || "";

}


/* =========================================================
   GET DISPLAY NAME
========================================================= */

export function getUserDisplayName() {

    const user =
        getCurrentUser();

    if (!user) {
        return "";
    }

    return user.displayName || "";

}


/* =========================================================
   CHECK LOGIN
========================================================= */

export function isLoggedIn() {

    return !!getCurrentUser();

}


/* =========================================================
   CHECK AUTH INITIALIZATION
========================================================= */

export function isAuthReady() {

    return authReady;

}


/* =========================================================
   WAIT FOR AUTH
========================================================= */

export async function waitForAuth() {

    if (authReady) {
        return getCurrentUser();
    }

    return await authReadyPromise;

}


/* =========================================================
   WAIT UNTIL USER IS LOGGED IN
========================================================= */

export async function waitForUser() {

    const user =
        await waitForAuth();

    return user || null;

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

export function onUserChanged(
    callback
) {

    if (
        typeof callback !==
        "function"
    ) {
        return () => {};
    }

    const handler =
        (event) => {

            callback(
                event.detail || null
            );

        };

    window.addEventListener(
        "authChanged",
        handler
    );


    return () => {

        window.removeEventListener(
            "authChanged",
            handler
        );

    };

}


/* =========================================================
   REQUIRE AUTH

   This function is NOT automatically called.
   It will be used only on pages that need login.
========================================================= */

export function requireAuth() {

    const user =
        getCurrentUser();

    if (!user) {

        return null;

    }

    return user;

}


/* =========================================================
   AUTH USER SUMMARY
========================================================= */

export function getAuthUserData() {

    const user =
        getCurrentUser();

    if (!user) {

        return {
            loggedIn: false,
            uid: null,
            email: "",
            displayName: ""
        };

    }


    return {

        loggedIn: true,

        uid:
            user.uid || null,

        email:
            user.email || "",

        displayName:
            user.displayName || "",

        photoURL:
            user.photoURL || "",

        emailVerified:
            !!user.emailVerified

    };

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    getCurrentUser,
    getUserId,
    getUserEmail,
    getUserDisplayName,

    isLoggedIn,
    isAuthReady,

    waitForAuth,
    waitForUser,

    onUserChanged,

    requireAuth,

    getAuthUserData

};
