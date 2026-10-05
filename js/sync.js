// js/sync.js

import {
    db,
    ref,
    get,
    update
} from "./firebase.js";

import {
    getUserId
} from "./auth.js";

import {
    saveData
} from "./storage.js";

let syncTimer = null;

export async function syncToCloud(
    collection,
    data
) {

    const userId = getUserId();

    if (!userId) {

        console.warn(
            "Cloud sync skipped: user not logged in."
        );

        return false;
    }

    try {

        const path =
            `users/${userId}/${collection}`;

        await update(
            ref(db, path),
            data
        );

        return true;

    } catch (error) {

        console.error(
            "Cloud sync error:",
            error
        );

        return false;
    }
}

export function scheduleSync(
    collection,
    data
) {

    clearTimeout(syncTimer);

    syncTimer = setTimeout(
        async () => {

            await syncToCloud(
                collection,
                data
            );

        },
        1500
    );
}

export async function restoreFromCloud() {

    const userId = getUserId();

    if (!userId) {
        return null;
    }

    try {

        const snapshot =
            await get(
                ref(db, `users/${userId}`)
            );

        if (!snapshot.exists()) {
            return null;
        }

        const cloudData =
            snapshot.val();

        if (cloudData.incomes) {

            saveData(
                "incomes",
                Object.values(
                    cloudData.incomes
                )
            );
        }

        if (cloudData.savings) {

            saveData(
                "savings",
                Object.values(
                    cloudData.savings
                )
            );
        }

        if (cloudData.transactions) {

            saveData(
                "transactions",
                Object.values(
                    cloudData.transactions
                )
            );
        }

        if (cloudData.notes) {

            saveData(
                "notes",
                Object.values(
                    cloudData.notes
                )
            );
        }

        return cloudData;

    } catch (error) {

        console.error(
            "Cloud restore error:",
            error
        );

        return null;
    }
}
