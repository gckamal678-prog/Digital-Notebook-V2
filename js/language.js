/* =========================================================
   DIGITAL NOTEBOOK V2
   LANGUAGE ENGINE

   V2 Language Rule:
   - English = en
   - Nepali = ne
   - Dashboard card labels can switch ENG / NEP
   - Other UI text is NOT automatically translated
   - Language preference is stored locally
========================================================= */

import {
    getSetting,
    saveSetting
} from "./storage.js";


/* =========================================================
   CONSTANTS
========================================================= */

const LANGUAGE_KEY =
    "language";

const ENGLISH =
    "en";

const NEPALI =
    "ne";


/* =========================================================
   LANGUAGE TEXT
========================================================= */

const translations = {

    en: {

        totalIncome:
            "Total Income",

        totalExpense:
            "Total Expense",

        totalSaving:
            "Total Saving",

        receivable:
            "Receivable",

        payable:
            "Payable",

        given:
            "Given",

        taken:
            "Taken",

        repayment:
            "Repayment",

        balance:
            "Balance"

    },


    ne: {

        totalIncome:
            "कुल आम्दानी",

        totalExpense:
            "कुल खर्च",

        totalSaving:
            "कुल बचत",

        receivable:
            "लिनुपर्ने",

        payable:
            "दिनुपर्ने",

        given:
            "दिएको",

        taken:
            "लिएको",

        repayment:
            "फिर्ता",

        balance:
            "ब्यालेन्स"

    }

};


/* =========================================================
   NORMALIZE LANGUAGE
========================================================= */

function normalizeLanguage(
    language
) {

    const value =
        String(
            language || ""
        )
        .trim()
        .toLowerCase();


    /*
       Older V1 code may have used "np".
       Convert it to the V2 standard "ne".
    */

    if (
        value === "np" ||
        value === "ne" ||
        value === "nepali"
    ) {

        return NEPALI;

    }


    return ENGLISH;

}


/* =========================================================
   GET CURRENT LANGUAGE
========================================================= */

export function getLanguage() {

    const savedLanguage =
        getSetting(
            LANGUAGE_KEY,
            ENGLISH
        );


    return normalizeLanguage(
        savedLanguage
    );

}


/* =========================================================
   SET LANGUAGE
========================================================= */

export function setLanguage(
    language
) {

    const currentLanguage =
        normalizeLanguage(
            language
        );


    saveSetting(
        LANGUAGE_KEY,
        currentLanguage
    );


    return currentLanguage;

}


/* =========================================================
   GET TRANSLATION
========================================================= */

export function t(
    key,
    language = getLanguage()
) {

    const currentLanguage =
        normalizeLanguage(
            language
        );


    return (
        translations[currentLanguage]?.[key] ??
        translations[ENGLISH]?.[key] ??
        key
    );

}


/* =========================================================
   GET DASHBOARD CARD LABELS
========================================================= */

export function getDashboardCardLabels(
    language = getLanguage()
) {

    const currentLanguage =
        normalizeLanguage(
            language
        );


    return {

        totalIncome:
            t(
                "totalIncome",
                currentLanguage
            ),

        totalExpense:
            t(
                "totalExpense",
                currentLanguage
            ),

        totalSaving:
            t(
                "totalSaving",
                currentLanguage
            ),

        receivable:
            t(
                "receivable",
                currentLanguage
            ),

        payable:
            t(
                "payable",
                currentLanguage
            ),

        given:
            t(
                "given",
                currentLanguage
            ),

        taken:
            t(
                "taken",
                currentLanguage
            ),

        repayment:
            t(
                "repayment",
                currentLanguage
            ),

        balance:
            t(
                "balance",
                currentLanguage
            )

    };

}


/* =========================================================
   APPLY DASHBOARD CARD LANGUAGE
========================================================= */

export function applyDashboardLanguage(
    language = getLanguage()
) {

    const labels =
        getDashboardCardLabels(
            language
        );


    const cardLabels =
        document.querySelectorAll(
            ".card-label"
        );


    cardLabels.forEach(
        (element) => {

            const key =
                element.dataset.key;


            if (
                key &&
                labels[key]
            ) {

                element.textContent =
                    labels[key];

            }

        }
    );


    return labels;

}


/* =========================================================
   INITIALIZE LANGUAGE
========================================================= */

export function initLanguage() {

    const language =
        getLanguage();


    /*
       Only dashboard card labels
       are updated automatically.
    */

    applyDashboardLanguage(
        language
    );


    return language;

}


/* =========================================================
   TOGGLE ENGLISH / NEPALI
========================================================= */

export function toggleLanguage() {

    const current =
        getLanguage();


    const next =
        current === ENGLISH
            ? NEPALI
            : ENGLISH;


    setLanguage(
        next
    );


    applyDashboardLanguage(
        next
    );


    return next;

}


/* =========================================================
   CHECK LANGUAGE
========================================================= */

export function isNepali() {

    return (
        getLanguage() ===
        NEPALI
    );

}


export function isEnglish() {

    return (
        getLanguage() ===
        ENGLISH
    );

}


/* =========================================================
   GET AVAILABLE LANGUAGES
========================================================= */

export function getAvailableLanguages() {

    return [

        {
            code: ENGLISH,
            name: "English"
        },

        {
            code: NEPALI,
            name: "नेपाली"
        }

    ];

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    getLanguage,

    setLanguage,

    t,

    getDashboardCardLabels,

    applyDashboardLanguage,

    initLanguage,

    toggleLanguage,

    isNepali,

    isEnglish,

    getAvailableLanguages

};
