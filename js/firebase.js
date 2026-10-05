// js/firebase.js

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    onValue
} from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDDY_v7RHnkCTI6uyV4DNDjqoaIBGweg8c",
    authDomain: "digital-a2552.firebaseapp.com",
    projectId: "digital-a2552",
    databaseURL:
        "https://digital-a2552-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "digital-a2552.firebasestorage.app",
    messagingSenderId: "218135618179",
    appId: "1:218135618179:web:821b76920d3e5669ac31b6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export {
    ref,
    get,
    set,
    update,
    remove,
    onValue,
    onAuthStateChanged
};

export default app;
