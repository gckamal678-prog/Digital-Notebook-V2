/* =========================================================
   DIGITAL NOTEBOOK V2
   INCOME DATA ENGINE
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";

const STORAGE_KEY = "incomes";

const LEGACY_KEYS = [
    "incomes",
    "income",
    "incomeData",
    "incomeRecords",
    "incomeHistory",
    "digital_notebook_incomes"
];

const INR_RATE = 1.6;

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

function normalizeIncome(item = {}) {
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

    return {
        id,

        sourceName: String(
            item.sourceName ??
            item.source ??
            item.title ??
            ""
        ).trim(),

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

function getIncomes() {
    const result = getDataWithLegacy(
        STORAGE_KEY,
        [],
        LEGACY_KEYS
    );

    return (
        Array.isArray(result)
            ? result
            : []
    ).map(normalizeIncome);
}

function saveIncomes(incomes) {
    const normalized =
        Array.isArray(incomes)
            ? incomes.map(normalizeIncome)
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

function addIncome(data = {}) {
    const incomes = getIncomes();

    const income = normalizeIncome({
        ...data,
        id: data.id || createId(),
        createdAt:
            data.createdAt || nowISO(),
        updatedAt: nowISO()
    });

    incomes.push(income);

    saveIncomes(incomes);

    return income;
}

function updateIncome(id, data = {}) {
    const incomes = getIncomes();

    const index = incomes.findIndex(
        item =>
            String(item.id) ===
            String(id)
    );

    if (index === -1) {
        return null;
    }

    const updated = normalizeIncome({
        ...incomes[index],
        ...data,

        id: incomes[index].id,

        createdAt:
            incomes[index].createdAt,

        updatedAt: nowISO()
    });

    incomes[index] = updated;

    saveIncomes(incomes);

    return updated;
}

async function deleteIncome(id) {
    const incomes = getIncomes();

    const index = incomes.findIndex(
        item =>
            String(item.id) ===
            String(id)
    );

    if (index === -1) {
        return false;
    }

    const removed = incomes[index];

    incomes.splice(index, 1);

    saveData(
        STORAGE_KEY,
        incomes
    );

    await deleteCloudRecord(
        STORAGE_KEY,
        removed.id
    );

    scheduleSync(
        STORAGE_KEY,
        incomes
    );

    return true;
}

function getIncomeById(id) {
    return (
        getIncomes().find(
            item =>
                String(item.id) ===
                String(id)
        ) || null
    );
}

function getTotalIncome(
    incomes = getIncomes()
) {
    return incomes.reduce(
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

function getTotalIncomeNPR(
    incomes = getIncomes()
) {
    return incomes.reduce(
        (sum, item) =>
            sum + toNumber(item.npr),
        0
    );
}

function getTotalIncomeINR(
    incomes = getIncomes()
) {
    return incomes.reduce(
        (sum, item) =>
            sum + toNumber(item.inr),
        0
    );
}

function filterIncomes(
    incomes = getIncomes(),
    filters = {}
) {
    const {
        startDate,
        endDate,
        category,
        search
    } = filters;

    return incomes.filter(item => {
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
                item.sourceName,
                item.category,
                item.note,
                item.date
            ]
                .join(" ")
                .toLowerCase();

            if (!text.includes(query)) {
                return false;
            }
        }

        return true;
    });
}

function getRecentIncomes(limit = 10) {
    return [...getIncomes()]
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

function clearIncomes() {
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
    getIncomes,
    saveIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
    getIncomeById,
    getTotalIncome,
    getTotalIncomeNPR,
    getTotalIncomeINR,
    filterIncomes,
    getRecentIncomes,
    clearIncomes,
    normalizeIncome,
    toNumber
};

export default {
    STORAGE_KEY,
    getIncomes,
    saveIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
    getIncomeById,
    getTotalIncome,
    getTotalIncomeNPR,
    getTotalIncomeINR,
    filterIncomes,
    getRecentIncomes,
    clearIncomes,
    normalizeIncome,
    toNumber
};
