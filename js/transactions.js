// js/transactions.js

import {
    getData,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY =
    "transactions";

const VALID_TYPES = [
    "expense",
    "receivable",
    "payable"
];


export function getTransactions() {

    return getData(
        STORAGE_KEY,
        []
    );
}


export function saveTransactions(
    transactions
) {

    saveData(
        STORAGE_KEY,
        transactions
    );

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(
            transactions
        )
    );

    return transactions;
}


export function addTransaction(
    transaction
) {

    if (
        !VALID_TYPES.includes(
            transaction.type
        )
    ) {

        console.error(
            "Invalid transaction type:",
            transaction.type
        );

        return null;
    }

    const transactions =
        getTransactions();

    const newTransaction = {

        id:
            transaction.id
            ||
            `transaction_${Date.now()}`,

        type:
            transaction.type,

        amount:
            Number(
                transaction.amount
            ) || 0,

        partyId:
            transaction.partyId
            || null,

        note:
            transaction.note
            || "",

        date:
            transaction.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            transaction.createdAt
            || Date.now(),

        updatedAt:
            Date.now()
    };

    transactions.push(
        newTransaction
    );

    saveTransactions(
        transactions
    );

    return newTransaction;
}


export function updateTransaction(
    id,
    changes
) {

    const transactions =
        getTransactions();

    const index =
        transactions.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return null;
    }

    if (
        changes.type
        &&
        !VALID_TYPES.includes(
            changes.type
        )
    ) {

        console.error(
            "Invalid transaction type:",
            changes.type
        );

        return null;
    }

    transactions[index] = {

        ...transactions[index],

        ...changes,

        amount:
            Number(
                changes.amount
                ??
                transactions[index].amount
            ) || 0,

        updatedAt:
            Date.now()
    };

    saveTransactions(
        transactions
    );

    return transactions[index];
}


export function deleteTransaction(
    id
) {

    const transactions =
        getTransactions();

    const updated =
        transactions.filter(
            item => item.id !== id
        );

    saveTransactions(
        updated
    );

    return true;
}


export function getTransactionById(
    id
) {

    const transactions =
        getTransactions();

    return (
        transactions.find(
            item => item.id === id
        )
        || null
    );
}


function convertArrayToObject(
    items
) {

    const result = {};

    for (const item of items) {

        if (!item?.id) continue;

        result[item.id] = item;
    }

    return result;
}
