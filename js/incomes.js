// js/incomes.js

import {
    getData,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY = "incomes";


// Get all income records
export function getIncomes() {

    return getData(
        STORAGE_KEY,
        []
    );
}


// Save all income records
export function saveIncomes(incomes) {

    saveData(
        STORAGE_KEY,
        incomes
    );

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(incomes)
    );

    return incomes;
}


// Add new income
export function addIncome(income) {

    const incomes = getIncomes();

    const npr =
        Number(income.npr) || 0;

    const inr =
        Number(income.inr) || 0;

    const INR_RATE = 1.6;

    const total =
        income.total !== undefined
            ? Number(income.total) || 0
            : npr + (inr * INR_RATE);


    const newIncome = {

        id:
            income.id
            ||
            `income_${Date.now()}`,

        sourceName:
            income.sourceName
            || "",

        date:
            income.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        npr,

        inr,

        total,

        // V2-compatible fields
        amount: total,

        category:
            income.category
            || income.sourceName
            || "",

        note:
            income.note
            || "",

        createdAt:
            income.createdAt
            || Date.now(),

        updatedAt:
            Date.now()
    };


    incomes.unshift(
        newIncome
    );

    saveIncomes(incomes);

    return newIncome;
}


// Update income
export function updateIncome(
    id,
    changes
) {

    const incomes = getIncomes();

    const index =
        incomes.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return null;
    }


    const current =
        incomes[index];


    const npr =
        changes.npr !== undefined
            ? Number(changes.npr) || 0
            : Number(current.npr) || 0;


    const inr =
        changes.inr !== undefined
            ? Number(changes.inr) || 0
            : Number(current.inr) || 0;


    const INR_RATE = 1.6;


    const total =
        changes.total !== undefined
            ? Number(changes.total) || 0
            : npr + (inr * INR_RATE);


    incomes[index] = {

        ...current,

        ...changes,

        npr,

        inr,

        total,

        amount: total,

        category:
            changes.category
            ??
            current.category
            ??
            current.sourceName
            ??
            "",

        updatedAt:
            Date.now()
    };


    saveIncomes(incomes);

    return incomes[index];
}


// Delete income
export function deleteIncome(id) {

    const incomes = getIncomes();

    const updated =
        incomes.filter(
            item => item.id !== id
        );

    saveIncomes(updated);

    return true;
}


// Get one income
export function getIncomeById(id) {

    const incomes = getIncomes();

    return (
        incomes.find(
            item => item.id === id
        )
        || null
    );
}


// Convert array to Firebase object
function convertArrayToObject(items) {

    const result = {};

    for (const item of items) {

        if (!item?.id) {
            continue;
        }

        result[item.id] = item;
    }

    return result;
}
