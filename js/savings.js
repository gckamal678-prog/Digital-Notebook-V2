// js/savings.js

import {
    getData,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY = "savings";


export function getSavings() {

    return getData(
        STORAGE_KEY,
        []
    );
}


export function saveSavings(savings) {

    saveData(
        STORAGE_KEY,
        savings
    );

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(savings)
    );

    return savings;
}


export function addSaving(saving) {

    const savings = getSavings();

    const newSaving = {

        id:
            saving.id
            ||
            `saving_${Date.now()}`,

        amount:
            Number(saving.amount) || 0,

        category:
            saving.category || "",

        note:
            saving.note || "",

        date:
            saving.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            saving.createdAt
            || Date.now(),

        updatedAt:
            Date.now()
    };

    savings.push(newSaving);

    saveSavings(savings);

    return newSaving;
}


export function updateSaving(
    id,
    changes
) {

    const savings = getSavings();

    const index =
        savings.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return null;
    }

    savings[index] = {

        ...savings[index],

        ...changes,

        amount:
            Number(
                changes.amount
                ??
                savings[index].amount
            ) || 0,

        updatedAt:
            Date.now()
    };

    saveSavings(savings);

    return savings[index];
}


export function deleteSaving(id) {

    const savings = getSavings();

    const updated =
        savings.filter(
            item => item.id !== id
        );

    saveSavings(updated);

    return true;
}


export function getSavingById(id) {

    const savings = getSavings();

    return (
        savings.find(
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
