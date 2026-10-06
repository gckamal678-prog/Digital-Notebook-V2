/* =========================================================
   DIGITAL NOTEBOOK V2
   FIREBASE SYNC ENGINE

   Responsibilities:
   - Local → Firebase backup
   - Firebase → Local restore
   - Collection sync
   - Cloud record delete
   - Full local backup
   - User UID based data path
   - Guest-safe operation

   IMPORTANT:
   Automatic cloud restore is NOT performed here.
   Restore must be explicitly requested by the app.
========================================================= */

import {
    db,
    ref,
    get,
    set,
    update,
    remove
} from "./firebase.js";

import {
    getUserId,
    isLoggedIn
} from "./auth.js";

import {
    getData,
    saveData
} from "./storage.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const SYNC_DELAY = 1200;

let syncTimers = {};


/* =========================================================
   COLLECTION NAMES
========================================================= */

export const COLLECTIONS = {

    profile: "profile",

    incomes: "incomes",

    savings: "savings",

    transactions: "transactions",

    notes: "notes",

    settings: "settings"

};


/* =========================================================
   GET USER ROOT PATH
========================================================= */

export function getUserRootPath() {

    const userId =
        getUserId();

    if (!userId) {

        return null;

    }

    return `users/${userId}`;

}


/* =========================================================
   GET COLLECTION PATH
========================================================= */

export function getCollectionPath(
    collection
) {

    const root =
        getUserRootPath();

    if (!root) {

        return null;

    }

    return `${root}/${collection}`;

}


/* =========================================================
   CHECK CLOUD SYNC AVAILABILITY
========================================================= */

export function canSyncToCloud() {

    return isLoggedIn();

}


/* =========================================================
   SYNC ONE COLLECTION
========================================================= */

export async function syncToCloud(
    collection,
    data
) {

    const userId =
        getUserId();


    /*
       Guest mode:
       Keep working locally.
       Do not attempt private cloud write
       without a Firebase UID.
    */

    if (!userId) {

        return {
            success: false,
            skipped: true,
            reason: "not_logged_in"
        };

    }


    if (
        !collection
    ) {

        return {
            success: false,
            skipped: true,
            reason: "missing_collection"
        };

    }


    try {

        const path =
            `users/${userId}/${collection}`;

        const collectionRef =
            ref(
                db,
                path
            );


        /*
           Object collection
        */

        if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data)
        ) {

            await set(
                collectionRef,
                data
            );

        }

        /*
           Array collection
        */

        else if (
            Array.isArray(data)
        ) {

            const objectData = {};


            data.forEach(
                (item, index) => {

                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        const id =
                            item.id ||
                            String(index);

                        objectData[id] =
                            item;

                    }

                }
            );


            await set(
                collectionRef,
                objectData
            );

        }

        /*
           Empty / null
        */

        else {

            await set(
                collectionRef,
                {}
            );

        }


        return {

            success: true,

            skipped: false,

            collection,

            path

        };

    } catch (error) {

        console.error(
            "Firebase sync error:",
            error
        );


        return {

            success: false,

            skipped: false,

            collection,

            error

        };

    }

}


/* =========================================================
   SCHEDULE COLLECTION SYNC
========================================================= */

export function scheduleSync(
    collection,
    data
) {

    if (
        syncTimers[collection]
    ) {

        clearTimeout(
            syncTimers[collection]
        );

    }


    syncTimers[collection] =
        setTimeout(
            async () => {

                delete syncTimers[
                    collection
                ];


                await syncToCloud(
                    collection,
                    data
                );

            },
            SYNC_DELAY
        );

}


/* =========================================================
   READ COLLECTION FROM FIREBASE
========================================================= */

export async function getCloudCollection(
    collection
) {

    const userId =
        getUserId();


    if (!userId) {

        return null;

    }


    if (!collection) {

        return null;

    }


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `users/${userId}/${collection}`
                )
            );


        if (
            !snapshot.exists()
        ) {

            return null;

        }


        return snapshot.val();

    } catch (error) {

        console.error(
            "Firebase read error:",
            error
        );

        return null;

    }

}


/* =========================================================
   RESTORE ONE COLLECTION
   EXPLICIT ONLY
========================================================= */

export async function restoreCollection(
    collection,
    localKey = collection
) {

    const cloudData =
        await getCloudCollection(
            collection
        );


    if (
        cloudData === null
    ) {

        return {

            success: false,

            restored: false,

            reason: "no_cloud_data"

        };

    }


    let localData;


    /*
       Firebase collections are stored
       as objects keyed by record ID.
    */

    if (
        cloudData &&
        typeof cloudData === "object" &&
        !Array.isArray(cloudData)
    ) {

        localData =
            Object.values(
                cloudData
            );

    } else {

        localData =
            cloudData;

    }


    saveData(
        localKey,
        localData
    );


    return {

        success: true,

        restored: true,

        collection,

        data: localData

    };

}


/* =========================================================
   DELETE CLOUD RECORD
========================================================= */

export async function deleteCloudRecord(
    collection,
    recordId
) {

    const userId =
        getUserId();


    if (!userId) {

        return {

            success: false,

            skipped: true,

            reason: "not_logged_in"

        };

    }


    if (
        !collection ||
        !recordId
    ) {

        return {

            success: false,

            skipped: true,

            reason: "missing_data"

        };

    }


    try {

        await remove(
            ref(
                db,
                `users/${userId}/${collection}/${recordId}`
            )
        );


        return {

            success: true

        };

    } catch (error) {

        console.error(
            "Cloud delete error:",
            error
        );


        return {

            success: false,

            error

        };

    }

}


/* =========================================================
   BACKUP LOCAL COLLECTION
========================================================= */

export async function backupLocalCollection(
    collection,
    localKey = collection
) {

    const localData =
        getData(
            localKey,
            []
        );


    return await syncToCloud(
        collection,
        localData
    );

}


/* =========================================================
   BACKUP ALL MAIN LOCAL DATA
========================================================= */

export async function backupAllLocalData() {

    const userId =
        getUserId();


    if (!userId) {

        return {

            success: false,

            skipped: true,

            reason: "not_logged_in"

        };

    }


    const data = {

        profile:
            getData(
                "profile",
                {}
            ),

        incomes:
            getData(
                "incomes",
                []
            ),

        savings:
            getData(
                "savings",
                []
            ),

        transactions:
            getData(
                "transactions",
                []
            ),

        notes:
            getData(
                "notes",
                []
            ),

        settings:
            getData(
                "settings",
                {}
            )

    };


    try {

        const rootRef =
            ref(
                db,
                `users/${userId}`
            );


        /*
           Do not replace the whole user root.
           Update only known application collections.
        */

        await update(
            rootRef,
            data
        );


        return {

            success: true,

            skipped: false,

            collections: Object.keys(
                data
            )

        };

    } catch (error) {

        console.error(
            "Full Firebase backup error:",
            error
        );


        return {

            success: false,

            skipped: false,

            error

        };

    }

}


/* =========================================================
   RESTORE ALL CLOUD DATA
   EXPLICIT ACTION ONLY
========================================================= */

export async function restoreAllCloudData() {

    const userId =
        getUserId();


    if (!userId) {

        return {

            success: false,

            restored: false,

            reason: "not_logged_in"

        };

    }


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `users/${userId}`
                )
            );


        if (
            !snapshot.exists()
        ) {

            return {

                success: false,

                restored: false,

                reason: "no_cloud_data"

            };

        }


        const cloudData =
            snapshot.val();


        const collections = [
            "incomes",
            "savings",
            "transactions",
            "notes"
        ];


        collections.forEach(
            (collection) => {

                if (
                    cloudData[
                        collection
                    ]
                ) {

                    const value =
                        cloudData[
                            collection
                        ];


                    const localValue =
                        Array.isArray(value)
                            ? value
                            : Object.values(
                                value
                            );


                    saveData(
                        collection,
                        localValue
                    );

                }

            }
        );


        if (
            cloudData.profile
        ) {

            saveData(
                "profile",
                cloudData.profile
            );

        }


        if (
            cloudData.settings
        ) {

            saveData(
                "settings",
                cloudData.settings
            );

        }


        return {

            success: true,

            restored: true,

            data: cloudData

        };

    } catch (error) {

        console.error(
            "Full cloud restore error:",
            error
        );


        return {

            success: false,

            restored: false,

            error

        };

    }

}


/* =========================================================
   EXPORT SYNC STATUS
========================================================= */

export function getSyncStatus() {

    return {

        loggedIn:
            isLoggedIn(),

        userId:
            getUserId(),

        cloudReady:
            isLoggedIn(),

        pendingCollections:
            Object.keys(
                syncTimers
            )

    };

}
