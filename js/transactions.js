/* =========================================================
   DIGITAL NOTEBOOK V2
   TRANSACTION DATA ENGINE
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";

const STORAGE_KEY = "transactions";

const LEGACY_KEYS = [
    "transactions",
    "transaction",
    "transactionData",
    "transactionRecords",
    "transactionHistory",
    "digital_notebook_transactions"
];

const INR_RATE = 1.6;

const TRANSACTION_TYPES = [
    "expense",
    "receivable",
    "payable",
    "given",
    "taken",
    "repayment"
];

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );
}

function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const number = Number(
        String(value)
            .replace(/,/g, "")
            .trim()
    );

    return Number.isFinite(number)
        ? number
        : 0;
}

function nowISO() {
    return new Date().toISOString();
}

function normalizeType(type) {
    const value =
        String(type ?? "")
            .trim()
            .toLowerCase();

    const aliases = {
        expense: "expense",
        खर्च: "expense",

        receivable: "receivable",
        receive: "receivable",

        payable: "payable",
        pay: "payable",

        given: "given",

        taken: "taken",

        repayment: "repayment",
        repay: "repayment"
    };

    return (
        aliases[value] ||
        "expense"
    );
}

function normalizeTransaction(
    item = {}
) {
    const id =
        item.id !== undefined &&
        item.id !== null &&
        String(item.id).trim() !== ""
            ? String(item.id)
            : createId();

    const npr = toNumber(
        item.npr ??
        item.amount ??
        item.total
    );

    const inr =
        item.inr !== undefined &&
        item.inr !== null &&
        item.inr !== ""
            ? toNumber(item.inr)
            : npr / INR_RATE;

    const total =
        item.total !== undefined &&
        item.total !== null &&
        item.total !== ""
            ? toNumber(item.total)
            : npr;

    const person =
        String(
            item.personName ??
            item.partyName ??
            ""
        ).trim();

    return {
        id,

        type:
            normalizeType(
                item.type
            ),

        title: String(
            item.title ??
            item.name ??
            ""
        ).trim(),

        personName: person,
        partyName: person,

        category: String(
            item.category ?? ""
        ).trim(),

        date:
            item.date ||
            new Date().toISOString().slice(0, 10),

        npr,
        inr,
        total,
        amount: total,

        note: String(
            item.note ?? ""
        ).trim(),

        createdAt:
            item.createdAt ||
            nowISO(),

        updatedAt:
            item.updatedAt ||
            nowISO()
    };
}

function getTransactions() {
    const result = getDataWithLegacy(
        STORAGE_KEY,
        [],
        LEGACY_KEYS
    );

    return (
        Array.isArray(result)
            ? result
            : []
    ).map(
        normalizeTransaction
    );
}

function saveTransactions(
    transactions
) {
    const normalized =
        Array.isArray(transactions)
            ? transactions.map(
                normalizeTransaction
            )
            : [];

    saveData(
        STORAGE_KEY,
        normalized
    );

    scheduleSync(
        STORAGE_KEY,
        normalized
    );

    return normalized;
}

function addTransaction(
    data = {}
) {
    const transactions =
        getTransactions();

    const transaction =
        normalizeTransaction({
            ...data,

            id:
                data.id ||
                createId(),

            createdAt:
                data.createdAt ||
                nowISO(),

            updatedAt:
                nowISO()
        });

    transactions.push(
        transaction
    );

    saveTransactions(
        transactions
    );

    return transaction;
}

function updateTransaction(
    id,
    data = {}
) {
    const transactions =
        getTransactions();

    const index =
        transactions.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return null;
    }

    const updated =
        normalizeTransaction({
            ...transactions[index],
            ...data,

            id:
                transactions[index].id,

            createdAt:
                transactions[index]
                    .createdAt,

            updatedAt:
                nowISO()
        });

    transactions[index] =
        updated;

    saveTransactions(
        transactions
    );

    return updated;
}

async function deleteTransaction(
    id
) {
    const transactions =
        getTransactions();

    const index =
        transactions.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return false;
    }

    const removed =
        transactions[index];

    transactions.splice(
        index,
        1
    );

    saveData(
        STORAGE_KEY,
        transactions
    );

    await deleteCloudRecord(
        STORAGE_KEY,
        removed.id
    );

    scheduleSync(
        STORAGE_KEY,
        transactions
    );

    return true;
}

function getTransactionById(id) {
    return (
        getTransactions().find(
            item =>
                String(item.id) ===
                String(id)
        ) || null
    );
}

function getTransactionsByType(
    type,
    transactions = getTransactions()
) {
    const normalized =
        normalizeType(type);

    return transactions.filter(
        item =>
            normalizeType(
                item.type
            ) === normalized
    );
}

function getTotalByType(
    type,
    transactions = getTransactions()
) {
    return getTransactionsByType(
        type,
        transactions
    ).reduce(
        (sum, item) =>
            sum +
            toNumber(
                item.total ??
                item.amount ??
                item.npr
            ),
        0
    );
}

function getTotalNPR(
    transactions = getTransactions()
) {
    return transactions.reduce(
        (sum, item) =>
            sum + toNumber(item.npr),
        0
    );
}

function getTotalINR(
    transactions = getTransactions()
) {
    return transactions.reduce(
        (sum, item) =>
            sum + toNumber(item.inr),
        0
    );
}

function filterTransactions(
    transactions = getTransactions(),
    filters = {}
) {
    const {
        type,
        startDate,
        endDate,
        personName,
        search,
        category
    } = filters;

    return transactions.filter(
        item => {
            if (
                type &&
                normalizeType(item.type) !==
                normalizeType(type)
            ) {
                return false;
            }

            if (
                startDate &&
                item.date < startDate
            ) {
                return false;
            }

            if (
                endDate &&
                item.date > endDate
            ) {
                return false;
            }

            if (
                personName &&
                !String(
                    item.personName
                )
                    .toLowerCase()
                    .includes(
                        String(
                            personName
                        ).toLowerCase()
                    )
            ) {
                return false;
            }

            if (
                category &&
                item.category !== category
            ) {
                return false;
            }

            if (search) {
                const query =
                    String(search)
                        .toLowerCase()
                        .trim();

                const text = [
                    item.title,
                    item.personName,
                    item.partyName,
                    item.category,
                    item.note,
                    item.type,
                    item.date
                ]
                    .join(" ")
                    .toLowerCase();

                if (
                    !text.includes(query)
                ) {
                    return false;
                }
            }

            return true;
        }
    );
}

function searchTransactions(
    query,
    transactions = getTransactions()
) {
    return filterTransactions(
        transactions,
        { search: query }
    );
}

function getTransactionsByDate(
    date,
    transactions = getTransactions()
) {
    return transactions.filter(
        item =>
            item.date === date
    );
}

function getRecentTransactions(
    limit = 10
) {
    return [...getTransactions()]
        .sort(
            (a, b) =>
                new Date(
                    b.date || b.createdAt
                ) -
                new Date(
                    a.date || a.createdAt
                )
        )
        .slice(0, limit);
}

function getTransactionSummary(
    transactions = getTransactions()
) {
    return {
        expense:
            getTotalByType(
                "expense",
                transactions
            ),

        receivable:
            getTotalByType(
                "receivable",
                transactions
            ),

        payable:
            getTotalByType(
                "payable",
                transactions
            ),

        given:
            getTotalByType(
                "given",
                transactions
            ),

        taken:
            getTotalByType(
                "taken",
                transactions
            ),

        repayment:
            getTotalByType(
                "repayment",
                transactions
            )
    };
}

function clearTransactions() {
    saveData(
        STORAGE_KEY,
        []
    );

    scheduleSync(
        STORAGE_KEY,
        []
    );

    return true;
}

export {
    STORAGE_KEY,
    TRANSACTION_TYPES,
    getTransactions,
    saveTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsByType,
    getTotalByType,
    getTotalNPR,
    getTotalINR,
    filterTransactions,
    searchTransactions,
    getTransactionsByDate,
    getRecentTransactions,
    getTransactionSummary,
    clearTransactions,
    normalizeTransaction,
    normalizeType,
    toNumber
};

export default {
    STORAGE_KEY,
    TRANSACTION_TYPES,
    getTransactions,
    saveTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getTransactionsByType,
    getTotalByType,
    getTotalNPR,
    getTotalINR,
    filterTransactions,
    searchTransactions,
    getTransactionsByDate,
    getRecentTransactions,
    getTransactionSummary,
    clearTransactions,
    normalizeTransaction,
    normalizeType,
    toNumber
};
