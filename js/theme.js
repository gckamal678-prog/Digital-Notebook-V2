/* =========================================================
   DIGITAL NOTEBOOK V2
   THEME ENGINE

   V2 Design:
   - Dark theme is the default
   - Dark theme is the main application appearance
   - Theme preference is stored locally
   - Safe for every page
========================================================= */

import {
    getSetting,
    saveSetting
} from "./storage.js";


/* =========================================================
   CONSTANTS
========================================================= */

const THEME_KEY =
    "theme";


const DARK_THEME =
    "dark";


/* =========================================================
   NORMALIZE THEME
========================================================= */

function normalizeTheme(
    theme
) {

    const value =
        String(
            theme || ""
        )
        .trim()
        .toLowerCase();


    /*
       V2 currently uses dark
       as the standard application theme.
    */

    if (
        value === DARK_THEME
    ) {

        return DARK_THEME;

    }


    return DARK_THEME;

}


/* =========================================================
   GET CURRENT THEME
========================================================= */

export function getTheme() {

    const savedTheme =
        getSetting(
            THEME_KEY,
            DARK_THEME
        );


    return normalizeTheme(
        savedTheme
    );

}


/* =========================================================
   APPLY THEME
========================================================= */

export function applyTheme(
    theme = DARK_THEME
) {

    const currentTheme =
        normalizeTheme(
            theme
        );


    document.documentElement
        .setAttribute(
            "data-theme",
            currentTheme
        );


    document.body
        ?.setAttribute(
            "data-theme",
            currentTheme
        );


    /*
       Keep compatibility with
       older V1 CSS selectors.
    */

    document.documentElement
        .classList
        .add("dark");


    document.body
        ?.classList
        .add("dark");


    return currentTheme;

}


/* =========================================================
   SET THEME
========================================================= */

export function setTheme(
    theme = DARK_THEME
) {

    const currentTheme =
        applyTheme(
            theme
        );


    saveSetting(
        THEME_KEY,
        currentTheme
    );


    return currentTheme;

}


/* =========================================================
   INITIALIZE THEME
========================================================= */

export function initTheme() {

    const theme =
        getTheme();


    return applyTheme(
        theme
    );

}


/* =========================================================
   CHECK DARK THEME
========================================================= */

export function isDarkTheme() {

    return (
        getTheme() ===
        DARK_THEME
    );

}


/* =========================================================
   TOGGLE THEME
=========================================================

   V2 keeps dark as the standard theme.
   This function remains available so older/newer
   pages do not break if they call it.
========================================================= */

export function toggleTheme() {

    return setTheme(
        DARK_THEME
    );

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    getTheme,

    applyTheme,

    setTheme,

    initTheme,

    isDarkTheme,

    toggleTheme

};
