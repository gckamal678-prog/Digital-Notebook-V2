// js/finance.js

export function calculateFinance(
    incomes = [],
    transactions = [],
    savings = []
) {

    let totalIncome = 0;
    let totalExpense = 0;
    let totalReceivable = 0;
    let totalPayable = 0;
    let totalSaving = 0;

    for (const item of incomes) {

        const amount =
            Number(item.amount) || 0;

        totalIncome += amount;
    }

    for (const item of savings) {

        const amount =
            Number(item.amount) || 0;

        totalSaving += amount;
    }

    for (const item of transactions) {

        const amount =
            Number(item.amount) || 0;

        switch (item.type) {

            case "expense":
                totalExpense += amount;
                break;

            case "receivable":
                totalReceivable += amount;
                break;

            case "payable":
                totalPayable += amount;
                break;

            default:

                console.warn(
                    "Unknown transaction type:",
                    item.type,
                    item
                );

                break;
        }
    }

    const balance =
        (totalIncome + totalReceivable)
        -
        (totalExpense + totalPayable);

    return {

        totalIncome,

        totalExpense,

        totalReceivable,

        totalPayable,

        totalSaving,

        balance
    };
}
