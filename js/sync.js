/* =========================================================
   DIGITAL NOTEBOOK V2
   CLOUD SYNC ENGINE
   Firebase Realtime Database
========================================================= */

import {
    db,
    ref,
    get,
    set,
    remove
} from "./firebase.js";

import {
    isLoggedIn,
    getUserId
} from "./auth.js";

import {
    getData,
    saveData,
    getProfileValue,
    saveProfileValue,
    getSetting,
    saveSetting
} from "./storage.js";


/* =========================================================
   COLLECTIONS
========================================================= */

const COLLECTIONS = {
    profile: "profile",
    incomes: "incomes",
    savings: "savings",
    transactions: "transactions",
    notes: "notes",
    settings: "settings"
};


/* =========================================================
   USER PATH
========================================================= */

function getUserPath() {
    const uid = getUserId();

    if (!uid) {
        return null;
    }

    return `users/${uid}`;
}


/* =========================================================
   COLLECTION PATH
========================================================= */

function getCollectionPath(collection) {
    const userPath = getUserPath();

    if (!userPath) {
        return null;
    }

    if (!COLLECTIONS[collection]) {
        return null;
    }

    return `${userPath}/${COLLECTIONS[collection]}`;
}


/* =========================================================
   ARRAY → OBJECT
   Firebase Realtime Database friendly format
========================================================= */

function arrayToObject(items) {
    if (!Array.isArray(items)) {
        return {};
    }

    const result = {};

    items.forEach((item, index) => {
        if (!item) {
            return;
        }

        const id =
            item.id !== undefined &&
            item.id !== null &&
            String(item.id).trim() !== ""
                ? String(item.id)
                : String(index);

        result[id] = item;
    });

    return result;
}


/* =========================================================
   OBJECT → ARRAY
========================================================= */

function objectToArray(data) {
    if (!data || typeof data !== "object") {
        return [];
    }

    return Object.entries(data).map(([key, value]) => {
        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            return {
                id:
                    value.id !== undefined &&
                    value.id !== null
                        ? value.id
                        : key,
                ...value
            };
        }

        return {
            id: key,
            value
        };
    });
}


/* =========================================================
   PROFILE LOCAL DATA
========================================================= */

function getLocalProfile() {
    return {
        name:
            getProfileValue("name", "") || "",

        email:
            getProfileValue("email", "") || "",

        address:
            getProfileValue("address", "") || "",

        mobile:
            getProfileValue("mobile", "") || "",

        avatar:
            getProfileValue("avatar", "") || ""
    };
}


/* =========================================================
   SETTINGS LOCAL DATA
========================================================= */

function getLocalSettings() {
    return {
        theme:
            getSetting("theme", "dark") || "dark",

        language:
            getSetting("language", "en") || "en",

        balance_privacy:
            getSetting(
                "balance_privacy",
                false
            )
    };
}


/* =========================================================
   RESTORE PROFILE LOCALLY
========================================================= */

function restoreLocalProfile(profile) {
    if (!profile || typeof profile !== "object") {
        return false;
    }

    const fields = [
        "name",
        "email",
        "address",
        "mobile",
        "avatar"
    ];

    fields.forEach((field) => {
        if (
            Object.prototype.hasOwnProperty.call(
                profile,
                field
            )
        ) {
            saveProfileValue(
                field,
                profile[field] ?? ""
            );
        }
    });

    return true;
}


/* =========================================================
   RESTORE SETTINGS LOCALLY
========================================================= */

function restoreLocalSettings(settings) {
    if (!settings || typeof settings !== "object") {
        return false;
    }

    Object.entries(settings).forEach(
        ([key, value]) => {
            saveSetting(key, value);
        }
    );

    return true;
}


/* =========================================================
   SYNC ONE COLLECTION
========================================================= */

async function syncToCloud(
    collection,
    data
) {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    const path =
        getCollectionPath(collection);

    if (!path) {
        return {
            success: false,
            reason: "invalid_collection"
        };
    }

    let cloudData = data;

    /*
       Arrays are converted into Firebase objects.
    */
    if (Array.isArray(data)) {
        cloudData = arrayToObject(data);
    }

    /*
       Profile and settings remain objects.
    */
    if (
        collection === "profile" ||
        collection === "settings"
    ) {
        if (
            !cloudData ||
            typeof cloudData !== "object" ||
            Array.isArray(cloudData)
        ) {
            cloudData = {};
        }
    }

    try {
        await set(
            ref(db, path),
            cloudData
        );

        return {
            success: true,
            collection,
            path
        };
    } catch (error) {
        console.error(
            "Cloud sync failed:",
            error
        );

        return {
            success: false,
            collection,
            error
        };
    }
}


/* =========================================================
   SCHEDULED SYNC
   Small debounce to prevent repeated writes
========================================================= */

const syncTimers = {};


function scheduleSync(
    collection,
    data,
    delay = 500
) {
    if (!isLoggedIn()) {
        return;
    }

    if (syncTimers[collection]) {
        clearTimeout(
            syncTimers[collection]
        );
    }

    syncTimers[collection] =
        setTimeout(async () => {
            await syncToCloud(
                collection,
                data
            );

            delete syncTimers[collection];
        }, delay);
}


/* =========================================================
   GET CLOUD COLLECTION
========================================================= */

async function getCloudCollection(
    collection
) {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    const path =
        getCollectionPath(collection);

    if (!path) {
        return {
            success: false,
            reason: "invalid_collection"
        };
    }

    try {
        const snapshot =
            await get(
                ref(db, path)
            );

        if (!snapshot.exists()) {
            return {
                success: true,
                exists: false,
                data:
                    collection === "profile" ||
                    collection === "settings"
                        ? {}
                        : []
            };
        }

        const data =
            snapshot.val();

        if (
            collection === "profile" ||
            collection === "settings"
        ) {
            return {
                success: true,
                exists: true,
                data:
                    data &&
                    typeof data === "object"
                        ? data
                        : {}
            };
        }

        return {
            success: true,
            exists: true,
            data: objectToArray(data)
        };

    } catch (error) {
        console.error(
            "Cloud read failed:",
            error
        );

        return {
            success: false,
            collection,
            error
        };
    }
}


/* =========================================================
   RESTORE ONE COLLECTION
========================================================= */

async function restoreCollection(
    collection
) {
    const result =
        await getCloudCollection(
            collection
        );

    if (!result.success) {
        return result;
    }

    if (
        collection === "profile"
    ) {
        restoreLocalProfile(
            result.data
        );

        return {
            success: true,
            collection,
            data: result.data
        };
    }

    if (
        collection === "settings"
    ) {
        restoreLocalSettings(
            result.data
        );

        return {
            success: true,
            collection,
            data: result.data
        };
    }

    await saveData(
        collection,
        result.data
    );

    return {
        success: true,
        collection,
        data: result.data
    };
}


/* =========================================================
   DELETE ONE CLOUD RECORD
========================================================= */

async function deleteCloudRecord(
    collection,
    recordId
) {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    if (
        !recordId &&
        recordId !== 0
    ) {
        return {
            success: false,
            reason: "missing_record_id"
        };
    }

    const path =
        getCollectionPath(
            collection
        );

    if (!path) {
        return {
            success: false,
            reason: "invalid_collection"
        };
    }

    try {
        await remove(
            ref(
                db,
                `${path}/${String(recordId)}`
            )
        );

        return {
            success: true,
            collection,
            recordId
        };

    } catch (error) {
        console.error(
            "Cloud delete failed:",
            error
        );

        return {
            success: false,
            collection,
            recordId,
            error
        };
    }
}


/* =========================================================
   BACKUP ONE LOCAL COLLECTION
========================================================= */

async function backupLocalCollection(
    collection
) {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    if (
        collection === "profile"
    ) {
        return syncToCloud(
            "profile",
            getLocalProfile()
        );
    }

    if (
        collection === "settings"
    ) {
        return syncToCloud(
            "settings",
            getLocalSettings()
        );
    }

    const data =
        getData(
            collection,
            []
        );

    return syncToCloud(
        collection,
        Array.isArray(data)
            ? data
            : []
    );
}


/* =========================================================
   BACKUP ALL LOCAL DATA
   EXPLICIT USER ACTION ONLY
========================================================= */

async function backupAllLocalData() {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    const results = {};

    const collections = [
        "profile",
        "incomes",
        "savings",
        "transactions",
        "notes",
        "settings"
    ];

    for (
        const collection
        of collections
    ) {
        results[collection] =
            await backupLocalCollection(
                collection
            );
    }

    const failed =
        Object.values(results)
            .some(
                (result) =>
                    !result ||
                    result.success !== true
            );

    return {
        success: !failed,
        results
    };
}


/* =========================================================
   RESTORE ALL CLOUD DATA
   EXPLICIT USER ACTION ONLY
========================================================= */

async function restoreAllCloudData() {
    if (!isLoggedIn()) {
        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };
    }

    const results = {};

    const collections = [
        "profile",
        "incomes",
        "savings",
        "transactions",
        "notes",
        "settings"
    ];

    for (
        const collection
        of collections
    ) {
        results[collection] =
            await restoreCollection(
                collection
            );
    }

    const failed =
        Object.values(results)
            .some(
                (result) =>
                    !result ||
                    result.success !== true
            );

    return {
        success: !failed,
        results
    };
}


/* =========================================================
   SYNC STATUS
========================================================= */

function getSyncStatus() {
    const loggedIn =
        isLoggedIn();

    return {
        loggedIn,
        uid:
            loggedIn
                ? getUserId()
                : null,

        mode:
            loggedIn
                ? "cloud"
                : "local",

        cloudSyncAvailable:
            loggedIn
    };
}


/* =========================================================
   EXPORT
========================================================= */

export {
    COLLECTIONS,

    getUserPath,
    getCollectionPath,

    syncToCloud,
    scheduleSync,

    getCloudCollection,
    restoreCollection,

    deleteCloudRecord,

    backupLocalCollection,
    backupAllLocalData,

    restoreAllCloudData,

    getSyncStatus
};


export default {
    COLLECTIONS,

    getUserPath,
    getCollectionPath,

    syncToCloud,
    scheduleSync,

    getCloudCollection,
    restoreCollection,

    deleteCloudRecord,

    backupLocalCollection,
    backupAllLocalData,

    restoreAllCloudData,

    getSyncStatus
};
