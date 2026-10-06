import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY = "savings";

const INR_RATE = 1.6;


/* =========================
   SAFE NAME CORRECTION
========================= */

const SAVING_NAME_MAP = {
    "saving": "Saving",
    "savings": "Saving",
    "savng": "Saving",

    "bank saving": "Bank Saving",
    "bank savings": "Bank Saving",
    "bank savng": "Bank Saving",

    "fixed deposit": "Fixed Deposit",
    "fixed deposits": "Fixed Deposit",
    "fix deposit": "Fixed Deposit",
    "fd": "Fixed Deposit",

    "cash": "Cash",
    "gold": "Gold"
};

function correctSavingName(value) {
    const text =
        String(value || "")
            .trim()
            .replace(/\s+/g, " ");

    if (!text) {
        return "";
    }

    const key =
        text.toLowerCase();

    if (SAVING_NAME_MAP[key]) {
        return SAVING_NAME_MAP[key];
    }

    /*
     * Unknown words are NOT guessed.
     * This prevents wrong auto-correction.
     */
    return text;
}


/* =========================
   GET SAVINGS
========================= */

export function getSavings() {
    return getDataWithLegacy(
        STORAGE_KEY,
        [
            "savings",
            "saving",
            "savingData",
            "savingRecords",
            "savingHistory"
        ],
        []
    );
}


/* =========================
   SAVE SAVINGS
========================= */

export function saveSavings(savings) {

    saveData(
        STORAGE_KEY,
        savings
    );

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(
            savings
        )
    );

    return savings;
}


/* =========================
   ADD SAVING
========================= */

export function addSaving(saving) {

    const savings =
        getSavings();

    const npr =
        Number(
            saving.npr
        ) || 0;

    const inr =
        Number(
            saving.inr
        ) || 0;

    const total =
        saving.total !== undefined
            ? Number(
                saving.total
            ) || 0
            : npr + (
                inr * INR_RATE
            );

    const category =
        correctSavingName(
            saving.category
        );

    const newSaving = {

        id:
            saving.id
            ||
            `saving_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        category,

        npr,

        inr,

        total,

        amount:
            total,

        note:
            saving.note
            ||
            "",

        date:
            saving.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            saving.createdAt
            ||
            Date.now(),

        updatedAt:
            Date.now()
    };

    savings.unshift(
        newSaving
    );

    saveSavings(
        savings
    );

    return newSaving;
}


/* =========================
   UPDATE SAVING
========================= */

export function updateSaving(
    id,
    changes
) {

    const savings =
        getSavings();

    const index =
        savings.findIndex(
            item =>
                item.id === id
        );

    if (
        index === -1
    ) {
        return null;
    }

    const current =
        savings[index];

    const npr =
        changes.npr !== undefined
            ? Number(
                changes.npr
            ) || 0
            : Number(
                current.npr
            ) || 0;

    const inr =
        changes.inr !== undefined
            ? Number(
                changes.inr
            ) || 0
            : Number(
                current.inr
            ) || 0;

    const total =
        changes.total !== undefined
            ? Number(
                changes.total
            ) || 0
            : npr + (
                inr * INR_RATE
            );

    const category =
        changes.category !== undefined
            ? correctSavingName(
                changes.category
            )
            : (
                current.category || ""
            );

    savings[index] = {

        ...current,

        ...changes,

        category,

        npr,

        inr,

        total,

        amount:
            total,

        updatedAt:
            Date.now()
    };

    saveSavings(
        savings
    );

    return savings[index];
}


/* =========================
   DELETE SAVING
========================= */

export function deleteSaving(id) {

    const savings =
        getSavings();

    const updated =
        savings.filter(
            item =>
                item.id !== id
        );

    saveSavings(
        updated
    );

    return true;
}


/* =========================
   GET BY ID
========================= */

export function getSavingById(id) {

    const savings =
        getSavings();

    return (
        savings.find(
            item =>
                item.id === id
        )
        ||
        null
    );
}


/* =========================
   TOTAL SAVING
========================= */

export function getTotalSaving() {

    const savings =
        getSavings();

    return savings.reduce(
        (
            total,
            item
        ) => {

            return (
                total
                +
                (
                    Number(
                        item.total
                        ??
                        item.amount
                    )
                    ||
                    0
                )
            );

        },
        0
    );
}


/* =========================
   TOTAL NPR
========================= */

export function getTotalSavingNPR() {

    const savings =
        getSavings();

    return savings.reduce(
        (
            total,
            item
        ) => {

            return (
                total
                +
                (
                    Number(
                        item.npr
                    )
                    ||
                    0
                )
            );

        },
        0
    );
}


/* =========================
   TOTAL INR
========================= */

export function getTotalSavingINR() {

    const savings =
        getSavings();

    return savings.reduce(
        (
            total,
            item
        ) => {

            return (
                total
                +
                (
                    Number(
                        item.inr
                    )
                    ||
                    0
                )
            );

        },
        0
    );
}


/* =========================
   INR RATE
========================= */

export function getINRRate() {
    return INR_RATE;
}


/* =========================
   GROUP SAVINGS
========================= */

export function getGroupedSavings() {

    const savings =
        getSavings();

    const groups = {};

    for (
        const item
        of savings
    ) {

        const name =
            correctSavingName(
                item.category
            )
            ||
            "Other";

        const key =
            name.toLowerCase();

        if (!groups[key]) {

            groups[key] = {

                name,

                records: [],

                npr: 0,

                inr: 0,

                total: 0

            };
        }

        groups[key].records.push(
            item
        );

        groups[key].npr +=
            Number(
                item.npr
            ) || 0;

        groups[key].inr +=
            Number(
                item.inr
            ) || 0;

        groups[key].total +=
            Number(
                item.total
                ??
                item.amount
            ) || 0;
    }

    return Object.values(
        groups
    );
}


/* =========================
   ARRAY → OBJECT
========================= */

function convertArrayToObject(
    items
) {

    const result = {};

    for (
        const item
        of items
    ) {

        if (
            !item?.id
        ) {
            continue;
        }

        result[
            item.id
        ] = item;
    }

    return result;
}
