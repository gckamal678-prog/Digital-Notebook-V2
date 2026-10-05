// js/auth.js

import {
    auth,
    onAuthStateChanged
} from "./firebase.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;

    window.dispatchEvent(
        new CustomEvent("authChanged", {
            detail: user
        })
    );
});

export function getCurrentUser() {
    return currentUser || auth.currentUser;
}

export function getUserId() {
    const user = getCurrentUser();

    return user ? user.uid : null;
}

export function isLoggedIn() {
    return !!getCurrentUser();
}

export function requireAuth() {

    const user = getCurrentUser();

    if (!user) {
        window.location.href = "./index.html";
        return null;
    }

    return user;
}

export function waitForAuth() {

    return new Promise((resolve) => {

        const existingUser = auth.currentUser;

        if (existingUser) {
            resolve(existingUser);
            return;
        }

        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            }
        );
    });
}
