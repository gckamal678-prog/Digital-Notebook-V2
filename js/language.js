// js/language.js

import {
    saveData,
    getData
} from "./storage.js";

const translations = {

    en: {

        dashboard: "Dashboard",
        income: "Income",
        saving: "Saving",
        expense: "Expense",
        transaction: "Transaction",
        notebook: "Notebook",
        calendar: "Calendar",
        calculator: "Calculator",
        account: "Account",
        settings: "Settings",
        logout: "Logout"

    },

    ne: {

        dashboard: "ड्यासबोर्ड",
        income: "आम्दानी",
        saving: "बचत",
        expense: "खर्च",
        transaction: "लेनदेन",
        notebook: "नोटबुक",
        calendar: "क्यालेन्डर",
        calculator: "क्याल्कुलेटर",
        account: "खाता",
        settings: "सेटिङ",
        logout: "लगआउट"

    }
};

export function getLanguage() {

    const oldLanguage =
        localStorage.getItem("userLang")
        || localStorage.getItem("lang");

    if (oldLanguage === "np") {
        return "ne";
    }

    if (
        oldLanguage === "NEP"
        || oldLanguage === "ne"
    ) {
        return "ne";
    }

    if (
        oldLanguage === "EN"
        || oldLanguage === "en"
    ) {
        return "en";
    }

    return getData(
        "language",
        "en"
    );
}

export function setLanguage(language) {

    if (language !== "en" && language !== "ne") {
        language = "en";
    }

    saveData(
        "language",
        language
    );

    // V1 compatibility
    localStorage.setItem(
        "userLang",
        language === "ne" ? "np" : "en"
    );

    document.documentElement.lang =
        language === "ne"
            ? "ne"
            : "en";

    applyTranslations(language);

    return language;
}

export function translate(
    key,
    language = getLanguage()
) {

    return (
        translations[language]?.[key]
        ||
        translations.en?.[key]
        ||
        key
    );
}

export function applyTranslations(
    language = getLanguage()
) {

    document
        .querySelectorAll("[data-i18n]")
        .forEach((element) => {

            const key =
                element.dataset.i18n;

            element.textContent =
                translate(key, language);
        });
}

export { translations };
