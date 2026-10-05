// js/theme.js

import {
    saveData,
    getData
} from "./storage.js";

export function getTheme() {

    return getData(
        "theme",
        localStorage.getItem("theme") || "dark"
    );
}

export function setTheme(theme) {

    if (theme !== "light" && theme !== "dark") {
        theme = "dark";
    }

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    document.documentElement.classList.toggle(
        "dark",
        theme === "dark"
    );

    saveData("theme", theme);

    // V1 compatibility
    localStorage.setItem("theme", theme);

    return theme;
}

export function toggleTheme() {

    const current = getTheme();

    return setTheme(
        current === "dark"
            ? "light"
            : "dark"
    );
}

export function initTheme() {

    const theme = getTheme();

    setTheme(theme);
}
