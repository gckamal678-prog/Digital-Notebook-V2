import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";


const STORAGE_KEY = "savings";


/*
|--------------------------------------------------------------------------
| GET SAVINGS
|--------------------------------------------------------------------------
*/

export function getSavings() {

    return getDataWithLegacy(
        STORAGE_KEY,

        [
            "savings",
            "saving",
            "savingData",
            "savingRecords",
            "savingHistory"
        ],

        []
    );
}


/*
|--------------------------------------------------------------------------
| SAVE SAVINGS
|--------------------------------------------------------------------------
*/

export function saveSavings(
    savings
) {

    saveData(
        STORAGE_KEY,
        savings
    );


    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(
            savings
        )
    );


    return savings;
}


/*
|--------------------------------------------------------------------------
| ADD SAVING
|--------------------------------------------------------------------------
*/

export function addSaving(
    saving
) {

    const savings =
        getSavings();


    const newSaving = {

        id:
            saving.id
            ||
            `saving_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        amount:
            Number(
                saving.amount
            ) || 0,

        category:
            saving.category
            ||
            "",

        note:
            saving.note
            ||
            "",

        date:
            saving.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        createdAt:
            saving.createdAt
            ||
            Date.now(),

        updatedAt:
            Date.now()
    };


    savings.unshift(
        newSaving
    );


    saveSavings(
        savings
    );


    return newSaving;
}


/*
|--------------------------------------------------------------------------
| UPDATE SAVING
|--------------------------------------------------------------------------
*/

export function updateSaving(
    id,
    changes
) {

    const savings =
        getSavings();


    const index =
        savings.findIndex(
            item =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;
    }


    const current =
        savings[index];


    savings[index] = {

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


    saveSavings(
        savings
    );


    return savings[index];
}


/*
|--------------------------------------------------------------------------
| DELETE SAVING
|--------------------------------------------------------------------------
*/

export function deleteSaving(
    id
) {

    const savings =
        getSavings();


    const updated =
        savings.filter(
            item =>
                item.id !== id
        );


    saveSavings(
        updated
    );


    return true;
}


/*
|--------------------------------------------------------------------------
| GET ONE SAVING
|--------------------------------------------------------------------------
*/

export function getSavingById(
    id
) {

    const savings =
        getSavings();


    return (
        savings.find(
            item =>
                item.id === id
        )
        ||
        null
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL SAVING
|--------------------------------------------------------------------------
*/

export function getTotalSaving() {

    const savings =
        getSavings();


    return savings.reduce(
        (
            total,
            item
        ) => {

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
