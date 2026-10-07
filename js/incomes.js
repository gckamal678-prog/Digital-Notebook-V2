/* =========================================================
   DIGITAL NOTEBOOK V2
   INCOME MANAGER
========================================================= */

import {
    getDataWithLegacy,
    saveData,
    getProfileValue
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";


const STORAGE_KEY = "incomes";
const LEGACY_KEY = "digital_notebook_incomes";

const INR_RATE = 1.6;


/* =========================================================
   HELPERS
========================================================= */

function number(value) {
    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function createId() {
    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function getToday() {
    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeIncome(item = {}) {

    const npr =
        number(
            item.npr ??
            item.amountNpr ??
            0
        );

    const inr =
        number(
            item.inr ??
            item.amountInr ??
            0
        );

    const calculated =
        npr +
        (inr * INR_RATE);

    const total =
        calculated;

    return {

        id:
            item.id
                ? String(item.id)
                : createId(),

        sourceName:
            String(
                item.sourceName ??
                item.source ??
                ""
            ).trim(),

        date:
            item.date ||
            getToday(),

        npr,

        inr,

        total,

        createdAt:
            item.createdAt ||
            Date.now(),

        updatedAt:
            Date.now()
    };
}


/* =========================================================
   GET
========================================================= */

function getIncomes() {

    const data =
        getDataWithLegacy(
            STORAGE_KEY,
            LEGACY_KEY,
            []
        );

    if (
        !Array.isArray(data)
    ) {
        return [];
    }

    return data.map(
        normalizeIncome
    );
}


/* =========================================================
   SAVE ALL
========================================================= */

function saveIncomes(
    incomes
) {

    const data =
        Array.isArray(incomes)
            ? incomes.map(
                normalizeIncome
            )
            : [];

    saveData(
        STORAGE_KEY,
        data
    );

    scheduleSync(
        STORAGE_KEY,
        data
    );

    return data;
}


/* =========================================================
   ADD
========================================================= */

function addIncome(
    data
) {

    const incomes =
        getIncomes();

    const item =
        normalizeIncome(
            data
        );

    incomes.unshift(
        item
    );

    saveIncomes(
        incomes
    );

    return item;
}


/* =========================================================
   UPDATE
========================================================= */

function updateIncome(
    id,
    data
) {

    const incomes =
        getIncomes();

    const index =
        incomes.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (
        index === -1
    ) {
        return null;
    }

    const updated =
        normalizeIncome({

            ...incomes[index],

            ...data,

            id:
                incomes[index].id,

            createdAt:
                incomes[index]
                    .createdAt

        });

    incomes[index] =
        updated;

    saveIncomes(
        incomes
    );

    return updated;
}


/* =========================================================
   DELETE BY ID
========================================================= */

async function deleteIncomeById(
    id
) {

    const incomes =
        getIncomes();

    const index =
        incomes.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (
        index === -1
    ) {
        return false;
    }

    const removed =
        incomes[index];

    incomes.splice(
        index,
        1
    );

    saveData(
        STORAGE_KEY,
        incomes
    );

    try {

        await deleteCloudRecord(
            STORAGE_KEY,
            removed.id
        );

    } catch (error) {

        console.error(
            "Income delete:",
            error
        );
    }

    scheduleSync(
        STORAGE_KEY,
        incomes
    );

    return true;
}


/* =========================================================
   TOTAL
========================================================= */

function getTotalIncome(
    incomes = getIncomes()
) {

    if (
        !Array.isArray(incomes)
    ) {
        return 0;
    }

    return incomes.reduce(
        (
            total,
            item
        ) =>
            total +
            number(item.total),

        0
    );
}


/* =========================================================
   SEARCH
========================================================= */

function searchIncomes(
    query = ""
) {

    const q =
        String(query)
            .trim()
            .toLowerCase();

    if (!q) {
        return getIncomes();
    }

    return getIncomes()
        .filter(
            item =>
                item.sourceName
                    .toLowerCase()
                    .includes(q)
        );
}


/* =========================================================
   RECENT
========================================================= */

function getRecentIncomes(
    limit = 10
) {

    return getIncomes()
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        )
        .slice(
            0,
            limit
        );
}


/* =========================================================
   CLEAR
========================================================= */

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


/* =========================================================
   LIVE CALCULATION
========================================================= */

function calculateIncomeTotal() {

    const nprInput =
        document.getElementById(
            "income-amount-npr"
        );

    const inrInput =
        document.getElementById(
            "income-amount-inr"
        );

    const totalInput =
        document.getElementById(
            "income-total-calc"
        );

    if (
        !nprInput ||
        !inrInput ||
        !totalInput
    ) {
        return 0;
    }

    const npr =
        number(
            nprInput.value
        );

    const inr =
        number(
            inrInput.value
        );

    const total =
        npr +
        (
            inr *
            INR_RATE
        );

    totalInput.value =
        total.toFixed(2);

    totalInput.dataset.value =
        total.toFixed(2);

    return total;
}


/* =========================================================
   FORM STATUS
========================================================= */

function setStatus(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "income-form-status"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "form-status " +
        type;
}


/* =========================================================
   SAVE FORM
========================================================= */

async function saveIncome(
    event
) {

    if (event) {
        event.preventDefault();
    }

    const source =
        document.getElementById(
            "income-source-name"
        );

    const date =
        document.getElementById(
            "income-date"
        );

    const npr =
        document.getElementById(
            "income-amount-npr"
        );

    const inr =
        document.getElementById(
            "income-amount-inr"
        );

    const editIndex =
        document.getElementById(
            "edit-income-index"
        );

    if (
        !source ||
        !date ||
        !npr ||
        !inr
    ) {
        return false;
    }

    const sourceName =
        source.value.trim();

    const dateValue =
        date.value;

    const nprValue =
        number(npr.value);

    const inrValue =
        number(inr.value);

    const total =
        nprValue +
        (
            inrValue *
            INR_RATE
        );

    if (!sourceName) {

        setStatus(
            "Income source is required.",
            "error"
        );

        return false;
    }

    if (!dateValue) {

        setStatus(
            "Date is required.",
            "error"
        );

        return false;
    }

    if (
        nprValue <= 0 &&
        inrValue <= 0
    ) {

        setStatus(
            "Please enter NPR or INR amount.",
            "error"
        );

        return false;
    }

    const incomes =
        getIncomes();

    const index =
        editIndex
            ? editIndex.value
            : "";

    const item = {

        sourceName,

        date:
            dateValue,

        npr:
            nprValue,

        inr:
            inrValue,

        total
    };


    /* EDIT */

    if (
        index !== ""
    ) {

        const i =
            Number(index);

        if (
            Number.isInteger(i) &&
            incomes[i]
        ) {

            incomes[i] =
                normalizeIncome({

                    ...incomes[i],

                    ...item,

                    id:
                        incomes[i].id,

                    createdAt:
                        incomes[i]
                            .createdAt

                });

            saveIncomes(
                incomes
            );

            setStatus(
                "Income record updated.",
                "success"
            );
        }

    }

    /* NEW */

    else {

        incomes.unshift(
            normalizeIncome({
                ...item,
                id: createId()
            })
        );

        saveIncomes(
            incomes
        );

        setStatus(
            "Income record saved.",
            "success"
        );
    }


    resetIncomeForm();

    renderIncomePage();

    return false;
}


/* =========================================================
   RESET
========================================================= */

function resetIncomeForm() {

    const form =
        document.getElementById(
            "income-form"
        );

    const editIndex =
        document.getElementById(
            "edit-income-index"
        );

    const date =
        document.getElementById(
            "income-date"
        );

    const submit =
        document.getElementById(
            "income-submit-btn"
        );

    const cancel =
        document.getElementById(
            "income-cancel-btn"
        );

    if (form) {
        form.reset();
    }

    if (editIndex) {
        editIndex.value = "";
    }

    if (date) {
        date.value =
            getToday();
    }

    if (submit) {
        submit.textContent =
            "Save Income";
    }

    if (cancel) {
        cancel.classList.add(
            "hidden"
        );
    }

    calculateIncomeTotal();
}


/* =========================================================
   EDIT
========================================================= */

function editIncome(
    index
) {

    const incomes =
        getIncomes();

    const item =
        incomes[
            Number(index)
        ];

    if (!item) {
        return;
    }

    document.getElementById(
        "edit-income-index"
    ).value =
        index;

    document.getElementById(
        "income-source-name"
    ).value =
        item.sourceName;

    document.getElementById(
        "income-date"
    ).value =
        item.date;

    document.getElementById(
        "income-amount-npr"
    ).value =
        item.npr;

    document.getElementById(
        "income-amount-inr"
    ).value =
        item.inr;

    document.getElementById(
        "income-submit-btn"
    ).textContent =
        "Update Income";

    document.getElementById(
        "income-cancel-btn"
    ).classList.remove(
        "hidden"
    );

    calculateIncomeTotal();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   DELETE
========================================================= */

async function deleteIncome(
    index
) {

    const incomes =
        getIncomes();

    const item =
        incomes[
            Number(index)
        ];

    if (!item) {
        return;
    }

    await deleteIncomeById(
        item.id
    );

    renderIncomePage();
}


/* =========================================================
   PROFILE
========================================================= */

function getProfile() {

    return {

        name:
            getProfileValue(
                "name",
                ""
            ),

        mobile:
            getProfileValue(
                "mobile",
                ""
            ),

        email:
            getProfileValue(
                "email",
                ""
            ),

        address:
            getProfileValue(
                "address",
                ""
            ),

        avatar:
            getProfileValue(
                "avatar",
                ""
            )
    };
}


/* =========================================================
   GLOBAL BRIDGE
========================================================= */

window.calculateIncomeTotal =
    calculateIncomeTotal;

window.saveIncome =
    saveIncome;

window.resetIncomeForm =
    resetIncomeForm;

window.editIncome =
    editIncome;

window.deleteIncome =
    deleteIncome;


/* =========================================================
   PAGE RENDER CALLBACK
========================================================= */

function renderIncomePage() {

    if (
        typeof window.renderIncomes ===
        "function" &&
        window.renderIncomes !==
        renderIncomePage
    ) {
        window.renderIncomes();
    }

    const event =
        new CustomEvent(
            "incomeDataChanged"
        );

    document.dispatchEvent(
        event
    );
}


/* =========================================================
   EXPORT
========================================================= */

export {

    INR_RATE,

    getToday,

    normalizeIncome,

    getIncomes,

    saveIncomes,

    addIncome,

    updateIncome,

    deleteIncomeById,

    getTotalIncome,

    searchIncomes,

    getRecentIncomes,

    clearIncomes,

    calculateIncomeTotal,

    saveIncome,

    resetIncomeForm,

    editIncome,

    deleteIncome,

    getProfile
};


export default {

    INR_RATE,

    getToday,

    normalizeIncome,

    getIncomes,

    saveIncomes,

    addIncome,

    updateIncome,

    deleteIncomeById,

    getTotalIncome,

    searchIncomes,

    getRecentIncomes,

    clearIncomes,

    calculateIncomeTotal,

    saveIncome,

    resetIncomeForm,

    editIncome,

    deleteIncome,

    getProfile
};
