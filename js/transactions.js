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
    "payable",
    "given",
    "taken",
    "repayment"
];


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
            `transaction_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        type:
            transaction.type,

        amount:
            Number(
                transaction.amount
            ) || 0,

        npr:
            Number(
                transaction.npr
            ) || 0,

        inr:
            Number(
                transaction.inr
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

        dueDate:
            transaction.dueDate
            ||
            "",

        status:
            transaction.status
            ||
            "pending",

        relatedId:
            transaction.relatedId
            ||
            null,

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
            changes.amount !== undefined
                ? Number(
                    changes.amount
                ) || 0
                : Number(
                    current.amount
                ) || 0,

        npr:
            changes.npr !== undefined
                ? Number(
                    changes.npr
                ) || 0
                : Number(
                    current.npr
                ) || 0,

        inr:
            changes.inr !== undefined
                ? Number(
                    changes.inr
                ) || 0
                : Number(
                    current.inr
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
            item =>
                item.id !== id
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
            item =>
                item.id === id
        )
        ||
        null
    );

}


export function getTotalExpense() {

    return getTypeTotal(
        "expense"
    );

}


export function getTotalReceivable() {

    return getTypeTotal(
        "receivable"
    );

}


export function getTotalPayable() {

    return getTypeTotal(
        "payable"
    );

}


export function getTotalGiven() {

    return getTypeTotal(
        "given"
    );

}


export function getTotalTaken() {

    return getTypeTotal(
        "taken"
    );

}


export function getTotalRepayment() {

    return getTypeTotal(
        "repayment"
    );

}


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


export function getPersonTransactions(
    personName
) {

    const transactions =
        getTransactions();


    const target =
        normalizeName(
            personName
        );


    return transactions.filter(
        item =>
            normalizeName(
                item.partyName
            ) === target
    );

}


export function getPersonBalance(
    personName
) {

    const records =
        getPersonTransactions(
            personName
        );


    let balance = 0;


    for (
        const item
        of records
    ) {

        const amount =
            Number(
                item.amount
            ) || 0;


        if (
            item.type === "receivable"
            ||
            item.type === "given"
        ) {

            balance += amount;

        }


        if (
            item.type === "payable"
            ||
            item.type === "taken"
        ) {

            balance -= amount;

        }


        if (
            item.type === "repayment"
        ) {

            balance -= amount;

        }

    }


    return balance;

}


function normalizeName(
    name
) {

    return String(
        name || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();

}


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
