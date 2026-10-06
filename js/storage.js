/* =========================================================
   DIGITAL NOTEBOOK V2
   LOCAL STORAGE ENGINE

   Responsibilities:
   - Local data storage
   - Local data reading
   - Legacy V1 migration support
   - Profile/settings values
   - Storage information
   - Safe JSON handling

   Firebase sync is handled separately by sync.js
========================================================= */


/* =========================================================
   V2 STORAGE PREFIX
========================================================= */

const PREFIX =
    "digital_notebook_v2_";


/* =========================================================
   INTERNAL KEY BUILDER
========================================================= */

function makeKey(key) {

    return (
        PREFIX +
        String(key)
    );

}


/* =========================================================
   SAVE DATA
========================================================= */

export function saveData(
    key,
    data
) {

    try {

        localStorage.setItem(
            makeKey(key),
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Storage save error:",
            error
        );

        return false;

    }

}


/* =========================================================
   GET DATA
========================================================= */

export function getData(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(
                makeKey(key)
            );


        if (raw === null) {

            return fallback;

        }


        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "Storage read error:",
            error
        );

        return fallback;

    }

}


/* =========================================================
   REMOVE DATA
========================================================= */

export function removeData(
    key
) {

    try {

        localStorage.removeItem(
            makeKey(key)
        );

        return true;

    } catch (error) {

        console.error(
            "Storage remove error:",
            error
        );

        return false;

    }

}


/* =========================================================
   CHECK DATA EXISTS
========================================================= */

export function hasData(
    key
) {

    return (
        localStorage.getItem(
            makeKey(key)
        ) !== null
    );

}


/* =========================================================
   READ OLD V1 KEY
========================================================= */

function readOldKey(
    key
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (raw === null) {

            return null;

        }


        try {

            return JSON.parse(raw);

        } catch {

            return raw;

        }

    } catch (error) {

        console.warn(
            "Legacy storage read error:",
            key,
            error
        );

        return null;

    }

}


/* =========================================================
   GET DATA WITH LEGACY MIGRATION
========================================================= */

export function getDataWithLegacy(
    key,
    legacyKeys = [],
    fallback = []
) {

    const v2Data =
        getData(
            key,
            null
        );


    if (
        v2Data !== null &&
        v2Data !== undefined
    ) {

        return v2Data;

    }


    for (
        const legacyKey
        of legacyKeys
    ) {

        const oldData =
            readOldKey(
                legacyKey
            );


        if (
            oldData !== null &&
            oldData !== undefined
        ) {

            saveData(
                key,
                oldData
            );

            return oldData;

        }

    }


    return fallback;

}


/* =========================================================
   PROFILE VALUE
========================================================= */

export function getProfileValue(
    key,
    fallback = ""
) {

    const v2Value =
        getData(
            key,
            null
        );


    if (
        v2Value !== null &&
        v2Value !== undefined
    ) {

        return v2Value;

    }


    const oldValue =
        localStorage.getItem(
            key
        );


    if (
        oldValue !== null &&
        oldValue !== undefined
    ) {

        saveData(
            key,
            oldValue
        );

        return oldValue;

    }


    return fallback;

}


/* =========================================================
   SAVE PROFILE VALUE
========================================================= */

export function saveProfileValue(
    key,
    value
) {

    saveData(
        key,
        value
    );


    /*
       Keep legacy key temporarily
       for compatibility with older V1 pages.
    */

    try {

        if (
            value === null ||
            value === undefined
        ) {

            localStorage.removeItem(
                key
            );

        } else {

            localStorage.setItem(
                key,
                String(value)
            );

        }

    } catch (error) {

        console.warn(
            "Legacy profile save failed:",
            error
        );

    }

}


/* =========================================================
   REMOVE PROFILE VALUE
========================================================= */

export function removeProfileValue(
    key
) {

    removeData(key);

    try {

        localStorage.removeItem(
            key
        );

    } catch (error) {

        console.warn(
            "Legacy profile remove failed:",
            error
        );

    }

}


/* =========================================================
   GET SETTINGS VALUE
========================================================= */

export function getSetting(
    key,
    fallback = null
) {

    return getData(
        `setting_${key}`,
        fallback
    );

}


/* =========================================================
   SAVE SETTINGS VALUE
========================================================= */

export function saveSetting(
    key,
    value
) {

    return saveData(
        `setting_${key}`,
        value
    );

}


/* =========================================================
   REMOVE SETTINGS VALUE
========================================================= */

export function removeSetting(
    key
) {

    return removeData(
        `setting_${key}`
    );

}


/* =========================================================
   CLEAR ALL V2 DATA
========================================================= */

export function clearV2Data() {

    const keys = [];


    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);


        if (
            key &&
            key.startsWith(
                PREFIX
            )
        ) {

            keys.push(key);

        }

    }


    keys.forEach(
        (key) => {

            try {

                localStorage.removeItem(
                    key
                );

            } catch (error) {

                console.warn(
                    "Storage clear error:",
                    key,
                    error
                );

            }

        }
    );


    return true;

}


/* =========================================================
   GET ALL V2 KEYS
========================================================= */

export function getV2Keys() {

    const keys = [];


    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);


        if (
            key &&
            key.startsWith(
                PREFIX
            )
        ) {

            keys.push(
                key.replace(
                    PREFIX,
                    ""
                )
            );

        }

    }


    return keys;

}


/* =========================================================
   GET ALL V2 DATA
========================================================= */

export function getAllV2Data() {

    const result = {};

    const keys =
        getV2Keys();


    keys.forEach(
        (key) => {

            result[key] =
                getData(
                    key,
                    null
                );

        }
    );


    return result;

}


/* =========================================================
   STORAGE INFORMATION
========================================================= */

export function getStorageInfo() {

    const result = {

        v2: {},

        legacy: {}

    };


    /*
       V2 data
    */

    const v2Keys =
        getV2Keys();


    v2Keys.forEach(
        (key) => {

            result.v2[key] =
                getData(
                    key,
                    null
                );

        }
    );


    /*
       Legacy data
    */

    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);


        if (
            !key ||
            key.startsWith(
                PREFIX
            )
        ) {

            continue;

        }


        const value =
            localStorage.getItem(
                key
            );


        if (
            value === null
        ) {

            continue;

        }


        try {

            result.legacy[key] =
                JSON.parse(value);

        } catch {

            /*
               Keep simple text values too.
            */

            result.legacy[key] =
                value;

        }

    }


    return result;

}


/* =========================================================
   EXPORT STORAGE PREFIX
========================================================= */

export {
    PREFIX
};
