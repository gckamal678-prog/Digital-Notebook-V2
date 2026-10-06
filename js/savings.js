/* =========================================================
   DIGITAL NOTEBOOK V2
   SAVING DATA ENGINE

   Responsibilities:
   - Saving records
   - Local storage
   - Legacy V1 migration
   - CRUD operations
   - NPR / INR support
   - Firebase sync
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";


/* =========================================================
   STORAGE CONFIGURATION
========================================================= */

const STORAGE_KEY =
    "savings";


const LEGACY_KEYS = [

    "savings",

    "saving",

    "savingData",

    "savingRecords",

    "savingHistory",

    "digital_notebook_savings"

];


/* =========================================================
   INR RATE
========================================================= */

const INR_RATE = 1.6;


/* =========================================================
   NUMBER HELPER
========================================================= */

function toNumber(
    value
) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return 0;

}


/* =========================================================
   DATE HELPER
========================================================= */

function getToday() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   ID GENERATOR
========================================================= */

function createId() {

    return (
        "saving_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* =========================================================
   NORMALIZE SAVING RECORD
========================================================= */

function normalizeSaving(
    record
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return null;

    }


    const npr =
        toNumber(
            record.npr
        );


    const inr =
        toNumber(
            record.inr
        );


    let total =
        toNumber(
            record.total
        );


    /*
       Calculate total when it is missing.
    */

    if (
        total === 0 &&
        (
            npr !== 0 ||
            inr !== 0
        )
    ) {

        total =
            npr +
            (
                inr *
                INR_RATE
            );

    }


    /*
       Old records may use amount.
    */

    if (
        total === 0 &&
        record.amount !== undefined
    ) {

        total =
            toNumber(
                record.amount
            );

    }


    const now =
        Date.now();


    return {

        id:
            record.id ||
            createId(),


        title:
            String(
                record.title ??
                record.name ??
                ""
            ).trim(),


        category:
            String(
                record.category ??
                ""
            ).trim(),


        date:
            record.date ||
            getToday(),


        npr,

        inr,

        total,

        amount:
            total,


        note:
            String(
                record.note ??
                ""
            ).trim(),


        createdAt:
            record.createdAt ||
            now,


        updatedAt:
            now

    };

}


/* =========================================================
   GET ALL SAVINGS
========================================================= */

export function getSavings() {

    const data =
        getDataWithLegacy(
            STORAGE_KEY,
            LEGACY_KEYS,
            []
        );


    if (
        !Array.isArray(data)
    ) {

        return [];

    }


    return data
        .map(
            normalizeSaving
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   SAVE ALL SAVINGS
========================================================= */

export function saveSavings(
    savings
) {

    if (
        !Array.isArray(savings)
    ) {

        return false;

    }


    const normalized =
        savings
            .map(
                normalizeSaving
            )
            .filter(
                Boolean
            );


    const saved =
        saveData(
            STORAGE_KEY,
            normalized
        );


    if (
        saved
    ) {

        scheduleSync(
            STORAGE_KEY,
            normalized
        );

    }


    return saved;

}


/* =========================================================
   ADD SAVING
========================================================= */

export function addSaving(
    savingData = {}
) {

    const savings =
        getSavings();


    const now =
        Date.now();


    const npr =
        toNumber(
            savingData.npr
        );


    const inr =
        toNumber(
            savingData.inr
        );


    let total =
        toNumber(
            savingData.total
        );


    if (
        total === 0
    ) {

        total =
            npr +
            (
                inr *
                INR_RATE
            );

    }


    if (
        total === 0 &&
        savingData.amount !== undefined
    ) {

        total =
            toNumber(
                savingData.amount
            );

    }


    const saving = {

        id:
            savingData.id ||
            createId(),


        title:
            String(
                savingData.title ??
                savingData.name ??
                ""
            ).trim(),


        category:
            String(
                savingData.category ??
                ""
            ).trim(),


        date:
            savingData.date ||
            getToday(),


        npr,

        inr,

        total,

        amount:
            total,


        note:
            String(
                savingData.note ??
                ""
            ).trim(),


        createdAt:
            savingData.createdAt ||
            now,


        updatedAt:
            now

    };


    savings.push(
        saving
    );


    saveSavings(
        savings
    );


    return saving;

}


/* =========================================================
   UPDATE SAVING
========================================================= */

export function updateSaving(
    id,
    changes = {}
) {

    const savings =
        getSavings();


    const index =
        savings.findIndex(
            (item) =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;

    }


    const oldSaving =
        savings[index];


    const updated = {

        ...oldSaving,

        ...changes,

        id:
            oldSaving.id,


        updatedAt:
            Date.now()

    };


    const npr =
        toNumber(
            updated.npr
        );


    const inr =
        toNumber(
            updated.inr
        );


    let total =
        toNumber(
            updated.total
        );


    /*
       Recalculate when currency
       values are changed.
    */

    if (
        changes.npr !== undefined ||
        changes.inr !== undefined
    ) {

        total =
            npr +
            (
                inr *
                INR_RATE
            );

    }


    if (
        changes.amount !== undefined &&
        changes.npr === undefined &&
        changes.inr === undefined &&
        changes.total === undefined
    ) {

        total =
            toNumber(
                changes.amount
            );

    }


    updated.npr =
        npr;


    updated.inr =
        inr;


    updated.total =
        total;


    updated.amount =
        total;


    updated.title =
        String(
            updated.title ??
            ""
        ).trim();


    updated.category =
        String(
            updated.category ??
            ""
        ).trim();


    updated.note =
        String(
            updated.note ??
            ""
        ).trim();


    savings[index] =
        updated;


    saveSavings(
        savings
    );


    return updated;

}


/* =========================================================
   DELETE SAVING
========================================================= */

export function deleteSaving(
    id
) {

    const savings =
        getSavings();


    const filtered =
        savings.filter(
            (item) =>
                item.id !== id
        );


    if (
        filtered.length ===
        savings.length
    ) {

        return false;

    }


    saveSavings(
        filtered
    );


    return true;

}


/* =========================================================
   GET SAVING BY ID
========================================================= */

export function getSavingById(
    id
) {

    const savings =
        getSavings();


    return (
        savings.find(
            (item) =>
                item.id === id
        ) ||
        null
    );

}


/* =========================================================
   GET TOTAL SAVING
========================================================= */

export function getTotalSaving() {

    const savings =
        getSavings();


    return savings.reduce(
        (
            total,
            saving
        ) => {

            return (
                total +
                toNumber(
                    saving.total ??
                    saving.amount
                )
            );

        },
        0
    );

}


/* =========================================================
   GET TOTAL NPR
========================================================= */

export function getTotalSavingNPR() {

    const savings =
        getSavings();


    return savings.reduce(
        (
            total,
            saving
        ) => {

            return (
                total +
                toNumber(
                    saving.npr
                )
            );

        },
        0
    );

}


/* =========================================================
   GET TOTAL INR
========================================================= */

export function getTotalSavingINR() {

    const savings =
        getSavings();


    return savings.reduce(
        (
            total,
            saving
        ) => {

            return (
                total +
                toNumber(
                    saving.inr
                )
            );

        },
        0
    );

}


/* =========================================================
   GET SAVINGS BY DATE
========================================================= */

export function getSavingsByDate(
    date
) {

    return getSavings().filter(
        (saving) =>
            saving.date === date
    );

}


/* =========================================================
   GET SAVINGS BY CATEGORY
========================================================= */

export function getSavingsByCategory(
    category
) {

    const target =
        String(
            category || ""
        )
        .trim()
        .toLowerCase();


    return getSavings().filter(
        (saving) =>
            String(
                saving.category || ""
            )
            .trim()
            .toLowerCase() ===
            target
    );

}


/* =========================================================
   GET RECENT SAVINGS
========================================================= */

export function getRecentSavings(
    limit = 10
) {

    const count =
        Math.max(
            0,
            Number(limit) || 0
        );


    return getSavings()
        .sort(
            (
                a,
                b
            ) =>
                (
                    Number(
                        b.createdAt
                    ) || 0
                ) -
                (
                    Number(
                        a.createdAt
                    ) || 0
                )
        )
        .slice(
            0,
            count
        );

}


/* =========================================================
   CLEAR ALL SAVINGS
========================================================= */

export function clearSavings() {

    saveSavings(
        []
    );


    return true;

}


/* =========================================================
   EXPORT RATE
========================================================= */

export {
    INR_RATE
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    getSavings,

    saveSavings,

    addSaving,

    updateSaving,

    deleteSaving,

    getSavingById,

    getTotalSaving,

    getTotalSavingNPR,

    getTotalSavingINR,

    getSavingsByDate,

    getSavingsByCategory,

    getRecentSavings,

    clearSavings,

    INR_RATE

};
