import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";


const STORAGE_KEY = "incomes";


/*
|--------------------------------------------------------------------------
| GET INCOMES
|--------------------------------------------------------------------------
*/

export function getIncomes() {

    return getDataWithLegacy(
        STORAGE_KEY,

        [
            "incomes",
            "income",
            "incomeData",
            "incomeRecords",
            "incomeHistory"
        ],

        []
    );
}


/*
|--------------------------------------------------------------------------
| SAVE INCOMES
|--------------------------------------------------------------------------
*/

export function saveIncomes(
    incomes
) {

    saveData(
        STORAGE_KEY,
        incomes
    );


    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(
            incomes
        )
    );


    return incomes;
}


/*
|--------------------------------------------------------------------------
| ADD INCOME
|--------------------------------------------------------------------------
*/

export function addIncome(
    income
) {

    const incomes =
        getIncomes();


    const npr =
        Number(
            income.npr
        ) || 0;


    const inr =
        Number(
            income.inr
        ) || 0;


    /*
     * 1 INR = 1.6 NPR
     */

    const INR_RATE = 1.6;


    let total;


    if (
        income.total !== undefined
    ) {

        total =
            Number(
                income.total
            ) || 0;

    } else {

        total =
            npr
            +
            (
                inr
                *
                INR_RATE
            );
    }


    const newIncome = {

        id:
            income.id
            ||
            `income_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        sourceName:
            income.sourceName
            ||
            income.source
            ||
            "",

        date:
            income.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        npr,

        inr,

        total,

        amount:
            total,

        category:
            income.category
            ||
            income.sourceName
            ||
            income.source
            ||
            "",

        note:
            income.note
            ||
            "",

        createdAt:
            income.createdAt
            ||
            Date.now(),

        updatedAt:
            Date.now()
    };


    incomes.unshift(
        newIncome
    );


    saveIncomes(
        incomes
    );


    return newIncome;
}


/*
|--------------------------------------------------------------------------
| UPDATE INCOME
|--------------------------------------------------------------------------
*/

export function updateIncome(
    id,
    changes
) {

    const incomes =
        getIncomes();


    const index =
        incomes.findIndex(
            item =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;
    }


    const current =
        incomes[index];


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


    const INR_RATE = 1.6;


    const total =
        changes.total !== undefined
            ? Number(
                changes.total
            ) || 0
            : npr
              +
              (
                  inr
                  *
                  INR_RATE
              );


    incomes[index] = {

        ...current,

        ...changes,

        npr,

        inr,

        total,

        amount:
            total,

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


    saveIncomes(
        incomes
    );


    return incomes[index];
}


/*
|--------------------------------------------------------------------------
| DELETE INCOME
|--------------------------------------------------------------------------
*/

export function deleteIncome(
    id
) {

    const incomes =
        getIncomes();


    const updated =
        incomes.filter(
            item =>
                item.id !== id
        );


    saveIncomes(
        updated
    );


    return true;
}


/*
|--------------------------------------------------------------------------
| GET ONE INCOME
|--------------------------------------------------------------------------
*/

export function getIncomeById(
    id
) {

    const incomes =
        getIncomes();


    return (
        incomes.find(
            item =>
                item.id === id
        )
        ||
        null
    );
}


/*
|--------------------------------------------------------------------------
| TOTAL INCOME
|--------------------------------------------------------------------------
*/

export function getTotalIncome() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            item
        ) => {

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
|--------------------------------------------------------------------------
| NPR TOTAL
|--------------------------------------------------------------------------
*/

export function getTotalIncomeNPR() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            item
        ) => {

            return (
                total
                +
                (
                    Number(
                        item.npr
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
| INR TOTAL
|--------------------------------------------------------------------------
*/

export function getTotalIncomeINR() {

    const incomes =
        getIncomes();


    return incomes.reduce(
        (
            total,
            item
        ) => {

            return (
                total
                +
                (
                    Number(
                        item.inr
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
