/* =========================================================
   DIGITAL NOTEBOOK V2
   TRANSACTION DATA ENGINE

   Supported transaction types:
   - expense
   - receivable
   - payable
   - given
   - taken
   - repayment

   Responsibilities:
   - Transaction CRUD
   - Local storage
   - Legacy V1 migration
   - NPR / INR support
   - Firebase sync
   - Search / filtering
   - Dashboard compatibility
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";


/* =========================================================
   STORAGE CONFIGURATION
========================================================= */

const STORAGE_KEY =
    "transactions";


const LEGACY_KEYS = [

    "transactions",

    "transaction",

    "transactionData",

    "transactionRecords",

    "transactionHistory",

    "digital_notebook_transactions"

];


/* =========================================================
   INR RATE
========================================================= */

const INR_RATE = 1.6;


/* =========================================================
   SUPPORTED TYPES
========================================================= */

export const TRANSACTION_TYPES = [

    "expense",

    "receivable",

    "payable",

    "given",

    "taken",

    "repayment"

];


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
        "transaction_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* =========================================================
   NORMALIZE TRANSACTION TYPE
========================================================= */

function normalizeType(
    type
) {

    const value =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    const aliases = {

        expense:
            "expense",

        expenses:
            "expense",

        खर्च:
            "expense",


        receivable:
            "receivable",

        receive:
            "receivable",

        receivables:
            "receivable",


        payable:
            "payable",

        payables:
            "payable",


        given:
            "given",

        give:
            "given",


        taken:
            "taken",

        take:
            "taken",


        repayment:
            "repayment",

        repay:
            "repayment"

    };


    return (
        aliases[value] ||
        "expense"
    );

}


/* =========================================================
   NORMALIZE TRANSACTION RECORD
========================================================= */

function normalizeTransaction(
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
       Calculate total from NPR + INR.
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
       Old V1 records may only
       have amount.
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


        type:
            normalizeType(
                record.type
            ),


        title:
            String(
                record.title ??
                record.name ??
                ""
            ).trim(),


        personName:
            String(
                record.personName ??
                record.partyName ??
                record.person ??
                ""
            ).trim(),


        partyName:
            String(
                record.partyName ??
                record.personName ??
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
                record.description ??
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
   GET ALL TRANSACTIONS
========================================================= */

export function getTransactions() {

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
            normalizeTransaction
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   SAVE ALL TRANSACTIONS
========================================================= */

export function saveTransactions(
    transactions
) {

    if (
        !Array.isArray(
            transactions
        )
    ) {

        return false;

    }


    const normalized =
        transactions
            .map(
                normalizeTransaction
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
   ADD TRANSACTION
========================================================= */

export function addTransaction(
    transactionData = {}
) {

    const transactions =
        getTransactions();


    const now =
        Date.now();


    const npr =
        toNumber(
            transactionData.npr
        );


    const inr =
        toNumber(
            transactionData.inr
        );


    let total =
        toNumber(
            transactionData.total
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
        transactionData.amount !== undefined
    ) {

        total =
            toNumber(
                transactionData.amount
            );

    }


    const type =
        normalizeType(
            transactionData.type
        );


    const transaction = {

        id:
            transactionData.id ||
            createId(),


        type,


        title:
            String(
                transactionData.title ??
                transactionData.name ??
                ""
            ).trim(),


        personName:
            String(
                transactionData.personName ??
                transactionData.partyName ??
                ""
            ).trim(),


        partyName:
            String(
                transactionData.partyName ??
                transactionData.personName ??
                ""
            ).trim(),


        category:
            String(
                transactionData.category ??
                ""
            ).trim(),


        date:
            transactionData.date ||
            getToday(),


        npr,

        inr,

        total,

        amount:
            total,


        note:
            String(
                transactionData.note ??
                transactionData.description ??
                ""
            ).trim(),


        createdAt:
            transactionData.createdAt ||
            now,


        updatedAt:
            now

    };


    transactions.push(
        transaction
    );


    saveTransactions(
        transactions
    );


    return transaction;

}


/* =========================================================
   UPDATE TRANSACTION
========================================================= */

export function updateTransaction(
    id,
    changes = {}
) {

    const transactions =
        getTransactions();


    const index =
        transactions.findIndex(
            (item) =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;

    }


    const oldTransaction =
        transactions[index];


    const updated = {

        ...oldTransaction,

        ...changes,

        id:
            oldTransaction.id,


        updatedAt:
            Date.now()

    };


    /*
       Normalize type.
    */

    updated.type =
        normalizeType(
            updated.type
        );


    /*
       Recalculate currency values.
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


    updated.title =
        String(
            updated.title ??
            ""
        ).trim();


    updated.personName =
        String(
            updated.personName ??
            updated.partyName ??
            ""
        ).trim();


    updated.partyName =
        String(
            updated.partyName ??
            updated.personName ??
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


    transactions[index] =
        updated;


    saveTransactions(
        transactions
    );


    return updated;

}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

export async function deleteTransaction(
    id
) {

    const transactions =
        getTransactions();


    const exists =
        transactions.some(
            (item) =>
                item.id === id
        );


    if (!exists) {

        return false;

    }


    const filtered =
        transactions.filter(
            (item) =>
                item.id !== id
        );


    saveTransactions(
        filtered
    );


    /*
       If user is logged in,
       also remove the cloud record.

       Guest mode safely skips this.
    */

    try {

        await deleteCloudRecord(
            STORAGE_KEY,
            id
        );

    } catch (error) {

        console.warn(
            "Cloud transaction delete skipped:",
            error
        );

    }


    return true;

}


/* =========================================================
   GET TRANSACTION BY ID
========================================================= */

export function getTransactionById(
    id
) {

    const transactions =
        getTransactions();


    return (
        transactions.find(
            (item) =>
                item.id === id
        ) ||
        null
    );

}


/* =========================================================
   GET TRANSACTIONS BY TYPE
========================================================= */

export function getTransactionsByType(
    type
) {

    const target =
        normalizeType(
            type
        );


    return getTransactions().filter(
        (transaction) =>
            transaction.type === target
    );

}


/* =========================================================
   TOTAL BY TYPE
========================================================= */

export function getTotalByType(
    type
) {

    return getTransactionsByType(
        type
    ).reduce(
        (
            total,
            transaction
        ) => {

            return (
                total +
                toNumber(
                    transaction.total ??
                    transaction.amount
                )
            );

        },
        0
    );

}


/* =========================================================
   TOTAL EXPENSE
========================================================= */

export function getTotalExpense() {

    return getTotalByType(
        "expense"
    );

}


/* =========================================================
   TOTAL RECEIVABLE
========================================================= */

export function getTotalReceivable() {

    return getTotalByType(
        "receivable"
    );

}


/* =========================================================
   TOTAL PAYABLE
========================================================= */

export function getTotalPayable() {

    return getTotalByType(
        "payable"
    );

}


/* =========================================================
   TOTAL GIVEN
========================================================= */

export function getTotalGiven() {

    return getTotalByType(
        "given"
    );

}


/* =========================================================
   TOTAL TAKEN
========================================================= */

export function getTotalTaken() {

    return getTotalByType(
        "taken"
    );

}


/* =========================================================
   TOTAL REPAYMENT
========================================================= */

export function getTotalRepayment() {

    return getTotalByType(
        "repayment"
    );

}


/* =========================================================
   TOTAL NPR
========================================================= */

export function getTotalTransactionNPR() {

    return getTransactions().reduce(
        (
            total,
            transaction
        ) => {

            return (
                total +
                toNumber(
                    transaction.npr
                )
            );

        },
        0
    );

}


/* =========================================================
   TOTAL INR
========================================================= */

export function getTotalTransactionINR() {

    return getTransactions().reduce(
        (
            total,
            transaction
        ) => {

            return (
                total +
                toNumber(
                    transaction.inr
                )
            );

        },
        0
    );

}


/* =========================================================
   GET TRANSACTIONS BY DATE
========================================================= */

export function getTransactionsByDate(
    date
) {

    return getTransactions().filter(
        (transaction) =>
            transaction.date === date
    );

}


/* =========================================================
   GET TRANSACTIONS BY PERSON
========================================================= */

export function getTransactionsByPerson(
    personName
) {

    const target =
        String(
            personName || ""
        )
        .trim()
        .toLowerCase();


    return getTransactions().filter(
        (transaction) => {

            const person =
                String(
                    transaction.personName ||
                    transaction.partyName ||
                    ""
                )
                .trim()
                .toLowerCase();


            return (
                person === target
            );

        }
    );

}


/* =========================================================
   SEARCH TRANSACTIONS
========================================================= */

export function searchTransactions(
    query
) {

    const target =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();


    if (!target) {

        return getTransactions();

    }


    return getTransactions().filter(
        (transaction) => {

            const text = [

                transaction.type,

                transaction.title,

                transaction.personName,

                transaction.partyName,

                transaction.category,

                transaction.note,

                transaction.date,

                transaction.amount,

                transaction.total

            ]
            .join(" ")
            .toLowerCase();


            return text.includes(
                target
            );

        }
    );

}


/* =========================================================
   GET RECENT TRANSACTIONS
========================================================= */

export function getRecentTransactions(
    limit = 10
) {

    const count =
        Math.max(
            0,
            Number(limit) || 0
        );


    return getTransactions()
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
   GET TRANSACTION SUMMARY
========================================================= */

export function getTransactionSummary() {

    return {

        expense:
            getTotalExpense(),

        receivable:
            getTotalReceivable(),

        payable:
            getTotalPayable(),

        given:
            getTotalGiven(),

        taken:
            getTotalTaken(),

        repayment:
            getTotalRepayment()

    };

}


/* =========================================================
   CLEAR ALL TRANSACTIONS
========================================================= */

export function clearTransactions() {

    saveTransactions(
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

    TRANSACTION_TYPES,

    getTransactions,

    saveTransactions,

    addTransaction,

    updateTransaction,

    deleteTransaction,

    getTransactionById,

    getTransactionsByType,

    getTotalByType,

    getTotalExpense,

    getTotalReceivable,

    getTotalPayable,

    getTotalGiven,

    getTotalTaken,

    getTotalRepayment,

    getTotalTransactionNPR,

    getTotalTransactionINR,

    getTransactionsByDate,

    getTransactionsByPerson,

    searchTransactions,

    getRecentTransactions,

    getTransactionSummary,

    clearTransactions,

    INR_RATE

};
