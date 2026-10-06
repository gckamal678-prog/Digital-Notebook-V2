/* =========================================================
   DIGITAL NOTEBOOK V2
   FINANCE CALCULATION ENGINE

   Transaction types:
   - expense
   - receivable
   - payable
   - given
   - taken
   - repayment

   Main calculation:

   Money In
   = Income + Receivable + Taken

   Money Out
   = Expense + Payable + Given

   Balance
   = Money In - Money Out

   Saving is kept separate.

   Balance After Saving
   = Balance - Saving

   Repayment is kept separate because its direction
   is not known automatically.
========================================================= */

import {
    getDataWithLegacy
} from "./storage.js";


/* =========================================================
   STORAGE KEYS
========================================================= */

const INCOME_KEY =
    "incomes";

const SAVING_KEY =
    "savings";

const TRANSACTION_KEY =
    "transactions";


/* =========================================================
   LEGACY KEYS
========================================================= */

const INCOME_LEGACY_KEYS = [

    "incomes",

    "income",

    "incomeData",

    "incomeRecords",

    "incomeHistory",

    "digital_notebook_incomes"

];


const SAVING_LEGACY_KEYS = [

    "savings",

    "saving",

    "savingData",

    "savingRecords",

    "savingHistory",

    "digital_notebook_savings"

];


const TRANSACTION_LEGACY_KEYS = [

    "transactions",

    "transaction",

    "transactionData",

    "transactionRecords",

    "transactionHistory",

    "digital_notebook_transactions"

];


/* =========================================================
   NUMBER NORMALIZER
========================================================= */

function toNumber(
    value
) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return 0;

}


/* =========================================================
   RECORD TOTAL
========================================================= */

function getRecordAmount(
    record
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return 0;

    }


    /*
       Preferred total
    */

    if (
        record.total !== undefined &&
        record.total !== null &&
        record.total !== ""
    ) {

        return toNumber(
            record.total
        );

    }


    /*
       Normal amount
    */

    if (
        record.amount !== undefined &&
        record.amount !== null &&
        record.amount !== ""
    ) {

        return toNumber(
            record.amount
        );

    }


    /*
       NPR only
    */

    if (
        record.npr !== undefined &&
        record.npr !== null &&
        record.npr !== ""
    ) {

        return toNumber(
            record.npr
        );

    }


    return 0;

}


/* =========================================================
   GET INCOMES
========================================================= */

export function getFinanceIncomes() {

    return getDataWithLegacy(
        INCOME_KEY,
        INCOME_LEGACY_KEYS,
        []
    );

}


/* =========================================================
   GET SAVINGS
========================================================= */

export function getFinanceSavings() {

    return getDataWithLegacy(
        SAVING_KEY,
        SAVING_LEGACY_KEYS,
        []
    );

}


/* =========================================================
   GET TRANSACTIONS
========================================================= */

export function getFinanceTransactions() {

    return getDataWithLegacy(
        TRANSACTION_KEY,
        TRANSACTION_LEGACY_KEYS,
        []
    );

}


/* =========================================================
   TOTAL INCOME
========================================================= */

export function getTotalIncome(
    incomes = getFinanceIncomes()
) {

    if (
        !Array.isArray(incomes)
    ) {

        return 0;

    }


    return incomes.reduce(
        (
            total,
            record
        ) => {

            return (
                total +
                getRecordAmount(
                    record
                )
            );

        },
        0
    );

}


/* =========================================================
   TOTAL TRANSACTION BY TYPE
========================================================= */

function getTotalByType(
    transactions,
    type
) {

    if (
        !Array.isArray(
            transactions
        )
    ) {

        return 0;

    }


    return transactions.reduce(
        (
            total,
            record
        ) => {

            if (
                !record ||
                record.type !== type
            ) {

                return total;

            }


            return (
                total +
                getRecordAmount(
                    record
                )
            );

        },
        0
    );

}


/* =========================================================
   EXPENSE
========================================================= */

export function getTotalExpense(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "expense"
    );

}


/* =========================================================
   RECEIVABLE
========================================================= */

export function getTotalReceivable(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "receivable"
    );

}


/* =========================================================
   PAYABLE
========================================================= */

export function getTotalPayable(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "payable"
    );

}


/* =========================================================
   GIVEN
========================================================= */

export function getTotalGiven(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "given"
    );

}


/* =========================================================
   TAKEN
========================================================= */

export function getTotalTaken(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "taken"
    );

}


/* =========================================================
   REPAYMENT
========================================================= */

export function getTotalRepayment(
    transactions =
        getFinanceTransactions()
) {

    return getTotalByType(
        transactions,
        "repayment"
    );

}


/* =========================================================
   TOTAL SAVING
========================================================= */

export function getTotalSaving(
    savings = getFinanceSavings()
) {

    if (
        !Array.isArray(savings)
    ) {

        return 0;

    }


    return savings.reduce(
        (
            total,
            record
        ) => {

            return (
                total +
                getRecordAmount(
                    record
                )
            );

        },
        0
    );

}


/* =========================================================
   MONEY IN
========================================================= */

export function getMoneyIn(
    incomes,
    transactions
) {

    const totalIncome =
        getTotalIncome(
            incomes
        );

    const totalReceivable =
        getTotalReceivable(
            transactions
        );

    const totalTaken =
        getTotalTaken(
            transactions
        );


    return (
        totalIncome +
        totalReceivable +
        totalTaken
    );

}


/* =========================================================
   MONEY OUT
========================================================= */

export function getMoneyOut(
    transactions
) {

    const totalExpense =
        getTotalExpense(
            transactions
        );

    const totalPayable =
        getTotalPayable(
            transactions
        );

    const totalGiven =
        getTotalGiven(
            transactions
        );


    return (
        totalExpense +
        totalPayable +
        totalGiven
    );

}


/* =========================================================
   BALANCE
========================================================= */

export function getBalance(
    incomes,
    transactions
) {

    const moneyIn =
        getMoneyIn(
            incomes,
            transactions
        );

    const moneyOut =
        getMoneyOut(
            transactions
        );


    return (
        moneyIn -
        moneyOut
    );

}


/* =========================================================
   BALANCE AFTER SAVING
========================================================= */

export function getBalanceAfterSaving(
    incomes,
    transactions,
    savings
) {

    const balance =
        getBalance(
            incomes,
            transactions
        );

    const saving =
        getTotalSaving(
            savings
        );


    return (
        balance -
        saving
    );

}


/* =========================================================
   COMPLETE FINANCIAL SUMMARY
========================================================= */

export function calculateFinance(
    incomes = getFinanceIncomes(),
    transactions =
        getFinanceTransactions(),
    savings =
        getFinanceSavings()
) {

    const totalIncome =
        getTotalIncome(
            incomes
        );

    const totalExpense =
        getTotalExpense(
            transactions
        );

    const totalReceivable =
        getTotalReceivable(
            transactions
        );

    const totalPayable =
        getTotalPayable(
            transactions
        );

    const totalGiven =
        getTotalGiven(
            transactions
        );

    const totalTaken =
        getTotalTaken(
            transactions
        );

    const totalRepayment =
        getTotalRepayment(
            transactions
        );

    const totalSaving =
        getTotalSaving(
            savings
        );


    const moneyIn =
        totalIncome +
        totalReceivable +
        totalTaken;


    const moneyOut =
        totalExpense +
        totalPayable +
        totalGiven;


    const balance =
        moneyIn -
        moneyOut;


    const balanceAfterSaving =
        balance -
        totalSaving;


    return {

        totalIncome,

        totalExpense,

        totalReceivable,

        totalPayable,

        totalGiven,

        totalTaken,

        totalRepayment,

        totalSaving,

        moneyIn,

        moneyOut,

        balance,

        balanceAfterSaving

    };

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

export function formatMoney(
    amount,
    currency = "NPR"
) {

    const value =
        toNumber(
            amount
        );


    try {

        return new Intl.NumberFormat(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(value);

    } catch {

        return value.toFixed(2);

    }

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    calculateFinance,

    getFinanceIncomes,
    getFinanceSavings,
    getFinanceTransactions,

    getTotalIncome,
    getTotalExpense,

    getTotalReceivable,
    getTotalPayable,

    getTotalGiven,
    getTotalTaken,

    getTotalRepayment,
    getTotalSaving,

    getMoneyIn,
    getMoneyOut,

    getBalance,
    getBalanceAfterSaving,

    formatMoney

};
