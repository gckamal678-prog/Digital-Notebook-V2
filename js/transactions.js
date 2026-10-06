import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";


const STORAGE_KEY = "transactions";


/*
    Supported transaction types

    Old:
    expense
    receivable
    payable

    New:
    given
    taken
    repayment
*/

const VALID_TYPES = [
    "expense",
    "receivable",
    "payable",
    "given",
    "taken",
    "repayment"
];


function normalizeType(type) {

    const value =
        String(type || "")
            .trim()
            .toLowerCase();

    switch (value) {

        case "expense":
            return "expense";

        case "receivable":
        case "receive":
        case "receivable amount":
            return "receivable";

        case "payable":
        case "pay":
        case "payable amount":
            return "payable";

        case "given":
        case "lend":
        case "lent":
        case "gave":
            return "given";

        case "taken":
        case "borrow":
        case "borrowed":
        case "received":
            return "taken";

        case "repayment":
        case "repay":
        case "returned":
            return "repayment";

        default:
            return null;
    }
}


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
            "expense",
            "digital_notebook_transactions"
        ],
        []
    );

}


export function saveTransactions(
    transactions
) {

    const cleanTransactions =
        Array.isArray(transactions)
            ? transactions
            : [];

    saveData(
        STORAGE_KEY,
        cleanTransactions
    );

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(
            cleanTransactions
        )
    );

    return cleanTransactions;

}


export function addTransaction(
    transaction
) {

    const type =
        normalizeType(
            transaction.type
        );


    if (!type) {

        console.error(
            "Invalid transaction type:",
            transaction.type
        );

        return null;

    }


    const transactions =
        getTransactions();


    const npr =
        Number(
            transaction.npr
        ) || 0;


    const inr =
        Number(
            transaction.inr
        ) || 0;


    const total =
        transaction.total !== undefined
            ? Number(
                transaction.total
            ) || 0
            : (
                npr
                +
                (inr * 1.6)
            );


    const personName =
        transaction.personName
        ||
        transaction.person
        ||
        transaction.partyName
        ||
        "";


    const newTransaction = {

        id:
            transaction.id
            ||
            `transaction_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        type,

        personName,

        partyName:
            personName,

        partyId:
            transaction.partyId
            ||
            null,

        npr,

        inr,

        total,

        amount:
            total,

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


    if (index === -1) {
        return null;
    }


    const current =
        transactions[index];


    let type =
        current.type;


    if (
        changes.type !== undefined
    ) {

        const normalized =
            normalizeType(
                changes.type
            );


        if (!normalized) {

            console.error(
                "Invalid transaction type:",
                changes.type
            );

            return null;

        }


        type =
            normalized;

    }


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
            : (
                npr
                +
                (inr * 1.6)
            );


    const personName =
        changes.personName
        ??
        changes.person
        ??
        current.personName
        ??
        current.person
        ??
        "";


    transactions[index] = {

        ...current,

        ...changes,

        id:
            current.id,

        type,

        personName,

        partyName:
            personName,

        npr,

        inr,

        total,

        amount:
            total,

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


/*
    Total by type
*/

function getTypeTotal(
    type
) {

    const normalizedType =
        normalizeType(type);


    if (!normalizedType) {
        return 0;
    }


    const transactions =
        getTransactions();


    return transactions.reduce(
        (
            total,
            item
        ) => {

            const itemType =
                normalizeType(
                    item.type
                );


            if (
                itemType !==
                normalizedType
            ) {
                return total;
            }


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


/*
    Public totals
*/

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


/*
    Person-wise transactions
*/

export function getTransactionsByPerson(
    personName
) {

    const searchName =
        String(
            personName || ""
        )
        .trim()
        .toLowerCase();


    if (!searchName) {
        return [];
    }


    return getTransactions()
        .filter(
            item => {

                const name =
                    String(
                        item.personName
                        ||
                        item.person
                        ||
                        item.partyName
                        ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    name === searchName
                );

            }
        );

}


/*
    Group transactions by person
*/

export function getTransactionsGroupedByPerson() {

    const transactions =
        getTransactions();


    const groups = {};


    for (
        const item
        of transactions
    ) {

        const person =
            String(
                item.personName
                ||
                item.person
                ||
                item.partyName
                ||
                ""
            ).trim();


        if (!person) {
            continue;
        }


        const key =
            person.toLowerCase();


        if (!groups[key]) {

            groups[key] = {

                personName:
                    person,

                records:
                    []

            };

        }


        groups[key]
            .records
            .push(item);

    }


    return Object.values(
        groups
    );

}


/*
    Calculate all transaction totals
*/

export function getTransactionSummary() {

    const transactions =
        getTransactions();


    const summary = {

        expense: 0,

        receivable: 0,

        payable: 0,

        given: 0,

        taken: 0,

        repayment: 0,

        total: 0

    };


    for (
        const item
        of transactions
    ) {

        const type =
            normalizeType(
                item.type
            );


        const amount =
            Number(
                item.total
                ??
                item.amount
            )
            ||
            0;


        if (
            Object.prototype.hasOwnProperty
                .call(
                    summary,
                    type
                )
        ) {

            summary[type] +=
                amount;

        }


        summary.total +=
            amount;

    }


    return summary;

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
