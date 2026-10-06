/* =========================================================
   DIGITAL NOTEBOOK V2
   FIREBASE FOUNDATION
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDDY_v7RHnkCTI6uyV4D4VNDjqoaIBgWeg8",
    authDomain: "digital-a2552.firebaseapp.com",
    projectId: "digital-a2552",

    databaseURL:
        "https://digital-a2552-default-rtdb.asia-southeast1.firebasedatabase.app",

    storageBucket:
        "digital-a2552.firebasestorage.app",

    messagingSenderId:
        "218135618179",

    appId:
        "1:218135618179:web:821b76920d3e5669ac31b6"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const firebaseApp =
    initializeApp(firebaseConfig);


/* =========================================================
   FIREBASE AUTH
========================================================= */

const auth =
    getAuth(firebaseApp);


/* =========================================================
   FIREBASE REALTIME DATABASE
========================================================= */

const db =
    getDatabase(firebaseApp);


/* =========================================================
   EXPORT FIREBASE SERVICES
========================================================= */

export {
    firebaseApp,

    auth,
    db,

    ref,
    get,
    set,
    update,
    remove,
    onValue,

    onAuthStateChanged
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default firebaseApp;
