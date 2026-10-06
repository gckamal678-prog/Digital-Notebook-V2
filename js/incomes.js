/* =========================================================
   DIGITAL NOTEBOOK V2
   INCOME DATA ENGINE

   Responsibilities:
   - Income records
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
    "incomes";


const LEGACY_KEYS = [

    "incomes",

    "income",

    "incomeData",

    "incomeRecords",

    "incomeHistory",

    "digital_notebook_incomes"

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
        "income_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* =========================================================
   NORMALIZE INCOME RECORD
========================================================= */

function normalizeIncome(
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
       If total is missing,
       calculate from NPR + INR.
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
       Old V1 records may only have amount.
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


        sourceName:
            String(
                record.sourceName ??
                record.source ??
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
   GET ALL INCOMES
========================================================= */

export function getIncomes() {

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
            normalizeIncome
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   SAVE ALL INCOMES
========================================================= */

export function saveIncomes(
    incomes
) {

    if (
        !Array.isArray(incomes)
    ) {

        return false;

    }


    const normalized =
        incomes
            .map(
                normalizeIncome
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
   ADD INCOME
========================================================= */

export function addIncome(
    incomeData = {}
) {

    const incomes =
        getIncomes();


    const now =
        Date.now();


    const npr =
        toNumber(
            incomeData.npr
        );


    const inr =
        toNumber(
            incomeData.inr
        );


    let total =
        toNumber(
            incomeData.total
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
        incomeData.amount !== undefined
    ) {

        total =
            toNumber(
                incomeData.amount
            );

    }


    const income = {

        id:
            incomeData.id ||
            createId(),


        sourceName:
            String(
                incomeData.sourceName ??
                incomeData.source ??
                ""
            ).trim(),


        category:
            String(
                incomeData.category ??
                ""
            ).trim(),


        date:
            incomeData.date ||
            getToday(),


        npr,

        inr,

        total,

        amount:
            total,


        note:
            String(
                incomeData.note ??
                ""
            ).trim(),


        createdAt:
            incomeData.createdAt ||
            now,


        updatedAt:
            now

    };


    incomes.push(
        income
    );


    saveIncomes(
        incomes
    );


    return income;

}


/* =========================================================
   UPDATE INCOME
========================================================= */

export function updateIncome(
    id,
    changes = {}
) {

    const incomes =
        getIncomes();


    const index =
        incomes.findIndex(
            (item) =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;

    }


    const oldIncome =
        incomes[index];


    const updated = {

        ...oldIncome,

        ...changes,

        id:
            oldIncome.id,


        updatedAt:
            Date.now()

    };


    /*
       Recalculate total when
       NPR / INR / amount changes.
    */

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


    updated.sourceName =
        String(
            updated.sourceName ??
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


    incomes[index] =
        updated;


    saveIncomes(
        incomes
    );


    return updated;

}


/* =========================================================
   DELETE INCOME
========================================================= */

export function deleteIncome(
    id
) {

    const incomes =
        getIncomes();


    const filtered =
        incomes.filter(
            (item) =>
                item.id !== id
        );


    if (
        filtered.length ===
        incomes.length
    ) {

        return false;

    }


    saveIncomes(
        filtered
    );


    return true;

}


/* =========================================================
   GET INCOME BY ID
========================================================= */

export function getIncomeById(
    id
) {

    const incomes =
        getIncomes();


    return (
        incomes.find(
            (item) =>
                item.id === id
        ) ||
        null
    );

}


/* =========================================================
   GET TOTAL INCOME
========================================================= */

export function getTotalIncome() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            income
        ) => {

            return (
                total +
                toNumber(
                    income.total ??
                    income.amount
                )
            );

        },
        0
    );

}


/* =========================================================
   GET TOTAL NPR
========================================================= */

export function getTotalIncomeNPR() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            income
        ) => {

            return (
                total +
                toNumber(
                    income.npr
                )
            );

        },
        0
    );

}


/* =========================================================
   GET TOTAL INR
========================================================= */

export function getTotalIncomeINR() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            income
        ) => {

            return (
                total +
                toNumber(
                    income.inr
                )
            );

        },
        0
    );

}


/* =========================================================
   GET INCOMES BY DATE
========================================================= */

export function getIncomesByDate(
    date
) {

    return getIncomes().filter(
        (income) =>
            income.date === date
    );

}


/* =========================================================
   GET INCOMES BY CATEGORY
========================================================= */

export function getIncomesByCategory(
    category
) {

    const target =
        String(
            category || ""
        )
        .trim()
        .toLowerCase();


    return getIncomes().filter(
        (income) =>
            String(
                income.category || ""
            )
            .trim()
            .toLowerCase() ===
            target
    );

}


/* =========================================================
   GET RECENT INCOMES
========================================================= */

export function getRecentIncomes(
    limit = 10
) {

    const count =
        Math.max(
            0,
            Number(limit) || 0
        );


    return getIncomes()
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
   CLEAR ALL INCOMES
========================================================= */

export function clearIncomes() {

    saveIncomes(
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

    getIncomes,

    saveIncomes,

    addIncome,

    updateIncome,

    deleteIncome,

    getIncomeById,

    getTotalIncome,

    getTotalIncomeNPR,

    getTotalIncomeINR,

    getIncomesByDate,

    getIncomesByCategory,

    getRecentIncomes,

    clearIncomes,

    INR_RATE

};
