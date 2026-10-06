import {
    getIncomes
} from "./incomes.js";

import {
    getSavings
} from "./savings.js";

import {
    getTransactions
} from "./transactions.js";


const INR_RATE = 1.6;


/*
    Calculate complete financial summary.

    Income:
        + Income

    Expense:
        - Expense

    Receivable:
        + Receivable

    Payable:
        - Payable

    Given:
        - Given

    Taken:
        + Taken

    Repayment:
        Repayment is kept separately.
        It is NOT automatically added/subtracted
        because repayment direction can vary.
*/


export function calculateFinance(
    incomes = getIncomes(),
    transactions = getTransactions(),
    savings = getSavings()
) {

    let totalIncome = 0;

    let totalExpense = 0;

    let totalReceivable = 0;

    let totalPayable = 0;

    let totalGiven = 0;

    let totalTaken = 0;

    let totalRepayment = 0;

    let totalSaving = 0;


    /*
        INCOME
    */

    for (
        const item
        of incomes
    ) {

        const amount =
            getIncomeAmount(
                item
            );

        totalIncome +=
            amount;

    }


    /*
        SAVING
    */

    for (
        const item
        of savings
    ) {

        const amount =
            Number(
                item.amount
            ) || 0;

        totalSaving +=
            amount;

    }


    /*
        TRANSACTIONS
    */

    for (
        const item
        of transactions
    ) {

        const amount =
            getTransactionAmount(
                item
            );


        const type =
            normalizeTransactionType(
                item.type
            );


        switch (type) {

            case "expense":

                totalExpense +=
                    amount;

                break;


            case "receivable":

                totalReceivable +=
                    amount;

                break;


            case "payable":

                totalPayable +=
                    amount;

                break;


            case "given":

                totalGiven +=
                    amount;

                break;


            case "taken":

                totalTaken +=
                    amount;

                break;


            case "repayment":

                totalRepayment +=
                    amount;

                break;

        }

    }


    /*
        CURRENT BALANCE

        Money coming in:
            Income
            Receivable
            Taken

        Money going out:
            Expense
            Payable
            Given

        Repayment is separate because
        "Repayment" alone does not tell
        whether money was received or paid.
    */

    const balance =
        (
            totalIncome
            +
            totalReceivable
            +
            totalTaken
        )
        -
        (
            totalExpense
            +
            totalPayable
            +
            totalGiven
        );


    /*
        MONEY FLOW
    */

    const moneyIn =
        totalIncome
        +
        totalReceivable
        +
        totalTaken;


    const moneyOut =
        totalExpense
        +
        totalPayable
        +
        totalGiven;


    /*
        NET AFTER SAVING

        Saving is treated separately from
        transaction balance.
    */

    const balanceAfterSaving =
        balance
        -
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


/*
    Income amount

    New income records normally have:
        total

    Older records may have:
        amount

    If only NPR + INR exists,
    calculate from those.
*/

function getIncomeAmount(
    item
) {

    if (
        item.total !== undefined
    ) {

        return (
            Number(
                item.total
            ) || 0
        );

    }


    if (
        item.amount !== undefined
    ) {

        return (
            Number(
                item.amount
            ) || 0
        );

    }


    const npr =
        Number(
            item.npr
        ) || 0;


    const inr =
        Number(
            item.inr
        ) || 0;


    return (
        npr
        +
        (inr * INR_RATE)
    );

}


/*
    Transaction amount

    New records:
        total

    Old records:
        amount

    Older records may also contain:
        npr
        inr
*/

function getTransactionAmount(
    item
) {

    if (
        item.total !== undefined
    ) {

        return (
            Number(
                item.total
            ) || 0
        );

    }


    if (
        item.amount !== undefined
    ) {

        return (
            Number(
                item.amount
            ) || 0
        );

    }


    const npr =
        Number(
            item.npr
        ) || 0;


    const inr =
        Number(
            item.inr
        ) || 0;


    return (
        npr
        +
        (inr * INR_RATE)
    );

}


/*
    Normalize old and new type names.
*/

function normalizeTransactionType(
    type
) {

    const value =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    switch (value) {

        case "expense":

            return "expense";


        case "receivable":
        case "receive":

            return "receivable";


        case "payable":
        case "pay":

            return "payable";


        case "given":
        case "give":
        case "gave":
        case "lent":
        case "lend":

            return "given";


        case "taken":
        case "take":
        case "took":
        case "borrowed":
        case "borrow":

            return "taken";


        case "repayment":
        case "repay":
        case "returned":

            return "repayment";


        default:

            return null;

    }

}


/*
    Individual helpers
*/

export function getTotalIncome() {

    return calculateFinance()
        .totalIncome;

}


export function getTotalExpense() {

    return calculateFinance()
        .totalExpense;

}


export function getTotalReceivable() {

    return calculateFinance()
        .totalReceivable;

}


export function getTotalPayable() {

    return calculateFinance()
        .totalPayable;

}


export function getTotalGiven() {

    return calculateFinance()
        .totalGiven;

}


export function getTotalTaken() {

    return calculateFinance()
        .totalTaken;

}


export function getTotalRepayment() {

    return calculateFinance()
        .totalRepayment;

}


export function getTotalSaving() {

    return calculateFinance()
        .totalSaving;

}


export function getBalance() {

    return calculateFinance()
        .balance;

}


export function getBalanceAfterSaving() {

    return calculateFinance()
        .balanceAfterSaving;

}


export function getMoneyIn() {

    return calculateFinance()
        .moneyIn;

}


export function getMoneyOut() {

    return calculateFinance()
        .moneyOut;

}
