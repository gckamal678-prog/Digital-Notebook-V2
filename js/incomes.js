// js/incomes.js

import {
    getData,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY = "incomes";


export function getIncomes() {

    return getData(
        STORAGE_KEY,
        []
    );
}


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


export function addIncome(income) {

    const incomes = getIncomes();

    const newIncome = {

        id:
            income.id
            ||
            `income_${Date.now()}`,

        amount:
            Number(income.amount) || 0,

        category:
            income.category || "",

        note:
            income.note || "",

        date:
            income.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            income.createdAt
            || Date.now(),

        updatedAt:
            Date.now()
    };

    incomes.push(newIncome);

    saveIncomes(incomes);

    return newIncome;
}


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

    incomes[index] = {

        ...incomes[index],

        ...changes,

        amount:
            Number(
                changes.amount
                ??
                incomes[index].amount
            ) || 0,

        updatedAt:
            Date.now()
    };

    saveIncomes(incomes);

    return incomes[index];
}


export function deleteIncome(id) {

    const incomes = getIncomes();

    const updated =
        incomes.filter(
            item => item.id !== id
        );

    saveIncomes(updated);

    return true;
}


export function getIncomeById(id) {

    const incomes = getIncomes();

    return (
        incomes.find(
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
