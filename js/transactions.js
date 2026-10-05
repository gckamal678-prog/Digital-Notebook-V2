import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";


const STORAGE_KEY = "transactions";


const VALID_TYPES = [
    "expense",
    "receivable",
    "payable"
];


/*
|--------------------------------------------------------------------------
| GET TRANSACTIONS
|--------------------------------------------------------------------------
*/

export function getTransactions() {

    return getDataWithLegacy(
        STORAGE_KEY,

        [
            "transactions",
            "transaction",
            "transactionData",
            "transactionRecords",
            "transactionHistory",
            "expenses",
            "expense"
        ],

        []
    );
}


/*
|--------------------------------------------------------------------------
| SAVE TRANSACTIONS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| ADD TRANSACTION
|--------------------------------------------------------------------------
*/

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
            `transaction_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        type:
            transaction.type,

        amount:
            Number(
                transaction.amount
            ) || 0,

        partyId:
            transaction.partyId
            ||
            null,

        partyName:
            transaction.partyName
            ||
            transaction.person
            ||
            "",

        category:
            transaction.category
            ||
            "",

        note:
            transaction.note
            ||
            "",

        date:
            transaction.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            transaction.createdAt
            ||
            Date.now(),

        updatedAt:
            Date.now()
    };


    transactions.unshift(
        newTransaction
    );


    saveTransactions(
        transactions
    );


    return newTransaction;
}


/*
|--------------------------------------------------------------------------
| UPDATE TRANSACTION
|--------------------------------------------------------------------------
*/

export function updateTransaction(
    id,
    changes
) {

    const transactions =
        getTransactions();


    const index =
        transactions.findIndex(
            item =>
                item.id === id
        );


    if (
        index === -1
    ) {

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


    const current =
        transactions[index];


    transactions[index] = {

        ...current,

        ...changes,

        amount:
            Number(
                changes.amount
                ??
                current.amount
            ) || 0,

        updatedAt:
            Date.now()
    };


    saveTransactions(
        transactions
    );


    return transactions[index];
}


/*
|--------------------------------------------------------------------------
| DELETE TRANSACTION
|--------------------------------------------------------------------------
*/

export function deleteTransaction(
    id
) {

    const transactions =
        getTransactions();


    const updated =
        transactions.filter(
            item =>
                item.id !== id
        );


    saveTransactions(
        updated
    );


    return true;
}


/*
|--------------------------------------------------------------------------
| GET ONE TRANSACTION
|--------------------------------------------------------------------------
*/

export function getTransactionById(
    id
) {

    const transactions =
        getTransactions();


    return (
        transactions.find(
            item =>
                item.id === id
        )
        ||
        null
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL EXPENSE
|--------------------------------------------------------------------------
*/

export function getTotalExpense() {

    return getTypeTotal(
        "expense"
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL RECEIVABLE
|--------------------------------------------------------------------------
*/

export function getTotalReceivable() {

    return getTypeTotal(
        "receivable"
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL PAYABLE
|--------------------------------------------------------------------------
*/

export function getTotalPayable() {

    return getTypeTotal(
        "payable"
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL BY TYPE
|--------------------------------------------------------------------------
*/

function getTypeTotal(
    type
) {

    const transactions =
        getTransactions();


    return transactions.reduce(
        (
            total,
            item
        ) => {

            if (
                item.type !== type
            ) {

                return total;
            }


            return (
                total
                +
                (
                    Number(
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


/*
|--------------------------------------------------------------------------
| ARRAY → FIREBASE OBJECT
|--------------------------------------------------------------------------
*/

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
