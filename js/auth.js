/* =========================================================
   DIGITAL NOTEBOOK V2
   AUTHENTICATION ENGINE

   Handles:
   - Email / Password Sign Up
   - Email / Password Login
   - Logout
   - Current user
   - UID
   - Auth state
   - Email verification
   - Auth waiting
   - Guest mode
========================================================= */

import {
    auth,
    onAuthStateChanged
} from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


/* =========================================================
   AUTH STATE
========================================================= */

let currentUser = null;

let authReady = false;

let authReadyPromise;


/* =========================================================
   AUTH READY
========================================================= */

authReadyPromise =
    new Promise(
        (resolve) => {

            onAuthStateChanged(
                auth,
                (user) => {

                    currentUser =
                        user || null;

                    authReady =
                        true;

                    resolve(
                        currentUser
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "authChanged",
                            {
                                detail:
                                    currentUser
                            }
                        )
                    );

                }
            );

        }
    );


/* =========================================================
   CURRENT USER
========================================================= */

export function getCurrentUser() {

    return (
        currentUser ||
        auth.currentUser ||
        null
    );

}


/* =========================================================
   USER ID
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
   USER EMAIL
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
   DISPLAY NAME
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
   PHOTO URL
========================================================= */

export function getUserPhotoURL() {

    const user =
        getCurrentUser();


    if (!user) {

        return "";

    }


    return user.photoURL || "";

}


/* =========================================================
   LOGIN CHECK
========================================================= */

export function isLoggedIn() {

    return !!getCurrentUser();

}


/* =========================================================
   AUTH READY CHECK
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
   WAIT FOR USER
========================================================= */

export async function waitForUser() {

    const user =
        await waitForAuth();


    return user || null;

}


/* =========================================================
   SIGN UP
========================================================= */

export async function signUp(
    email,
    password,
    displayName = ""
) {

    const cleanEmail =
        String(
            email || ""
        )
        .trim()
        .toLowerCase();


    const cleanPassword =
        String(
            password || ""
        );


    const cleanName =
        String(
            displayName || ""
        )
        .trim();


    if (!cleanEmail) {

        throw new Error(
            "Please enter your email address."
        );

    }


    if (!cleanPassword) {

        throw new Error(
            "Please enter your password."
        );

    }


    if (
        cleanPassword.length <
        6
    ) {

        throw new Error(
            "Password must be at least 6 characters."
        );

    }


    try {

        const result =
            await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                cleanPassword
            );


        const user =
            result.user;


        /*
           Save display name if provided.
        */

        if (cleanName) {

            await updateProfile(
                user,
                {
                    displayName:
                        cleanName
                }
            );

        }


        /*
           Send verification email.
        */

        try {

            await sendEmailVerification(
                user
            );

        } catch (verificationError) {

            console.warn(
                "Verification email could not be sent:",
                verificationError
            );

        }


        currentUser =
            user;


        return user;

    } catch (error) {

        throw createAuthError(
            error
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

export async function signIn(
    email,
    password
) {

    const cleanEmail =
        String(
            email || ""
        )
        .trim()
        .toLowerCase();


    const cleanPassword =
        String(
            password || ""
        );


    if (!cleanEmail) {

        throw new Error(
            "Please enter your email address."
        );

    }


    if (!cleanPassword) {

        throw new Error(
            "Please enter your password."
        );

    }


    try {

        const result =
            await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                cleanPassword
            );


        currentUser =
            result.user;


        return result.user;

    } catch (error) {

        throw createAuthError(
            error
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

export async function signOut() {

    try {

        await firebaseSignOut(
            auth
        );


        currentUser =
            null;


        return true;

    } catch (error) {

        throw createAuthError(
            error
        );

    }

}


/* =========================================================
   SEND VERIFICATION EMAIL
========================================================= */

export async function resendVerificationEmail() {

    const user =
        getCurrentUser();


    if (!user) {

        throw new Error(
            "Please login first."
        );

    }


    if (user.emailVerified) {

        return true;

    }


    try {

        await sendEmailVerification(
            user
        );


        return true;

    } catch (error) {

        throw createAuthError(
            error
        );

    }

}


/* =========================================================
   CHECK EMAIL VERIFIED
========================================================= */

export function isEmailVerified() {

    const user =
        getCurrentUser();


    if (!user) {

        return false;

    }


    return !!user.emailVerified;

}


/* =========================================================
   REFRESH USER
========================================================= */

export async function refreshUser() {

    const user =
        getCurrentUser();


    if (!user) {

        return null;

    }


    try {

        await user.reload();

        currentUser =
            auth.currentUser ||
            user;


        return currentUser;

    } catch (error) {

        throw createAuthError(
            error
        );

    }

}


/* =========================================================
   AUTH USER DATA
========================================================= */

export function getAuthUserData() {

    const user =
        getCurrentUser();


    if (!user) {

        return {

            loggedIn: false,

            uid: null,

            email: "",

            displayName: "",

            photoURL: "",

            emailVerified: false

        };

    }


    return {

        loggedIn: true,

        uid:
            user.uid ||
            null,

        email:
            user.email ||
            "",

        displayName:
            user.displayName ||
            "",

        photoURL:
            user.photoURL ||
            "",

        emailVerified:
            !!user.emailVerified

    };

}


/* =========================================================
   USER CHANGE LISTENER
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
                event.detail ||
                null
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
   AUTH ERROR HANDLER
========================================================= */

function createAuthError(
    error
) {

    const code =
        error?.code ||
        "";


    let message =
        "Authentication failed. Please try again.";


    switch (code) {

        case "auth/invalid-email":

            message =
                "Please enter a valid email address.";

            break;


        case "auth/user-not-found":

            message =
                "No account found with this email.";

            break;


        case "auth/wrong-password":

        case "auth/invalid-credential":

            message =
                "Email or password is incorrect.";

            break;


        case "auth/email-already-in-use":

            message =
                "An account already exists with this email.";

            break;


        case "auth/weak-password":

            message =
                "Password must be at least 6 characters.";

            break;


        case "auth/too-many-requests":

            message =
                "Too many attempts. Please try again later.";

            break;


        case "auth/network-request-failed":

            message =
                "Network error. Please check your internet connection.";

            break;


        case "auth/user-disabled":

            message =
                "This
