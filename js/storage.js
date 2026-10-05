const PREFIX = "digital_notebook_v2_";

/*
|--------------------------------------------------------------------------
| V2 STORAGE
|--------------------------------------------------------------------------
*/

export function saveData(key, data) {
    try {
        localStorage.setItem(
            PREFIX + key,
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


export function getData(
    key,
    fallback = null
) {

    try {

        const raw =
            localStorage.getItem(
                PREFIX + key
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


export function removeData(key) {

    localStorage.removeItem(
        PREFIX + key
    );
}


export function hasData(key) {

    return (
        localStorage.getItem(
            PREFIX + key
        ) !== null
    );
}


/*
|--------------------------------------------------------------------------
| OLD V1 STORAGE
|--------------------------------------------------------------------------
*/

function readOldKey(key) {

    try {

        const raw =
            localStorage.getItem(key);

        if (raw === null) {
            return null;
        }

        return JSON.parse(raw);

    } catch (error) {

        console.warn(
            "Old storage read error:",
            key,
            error
        );

        return null;
    }
}


/*
|--------------------------------------------------------------------------
| GET DATA WITH V1 FALLBACK
|--------------------------------------------------------------------------
*/

export function getDataWithLegacy(
    key,
    legacyKeys = [],
    fallback = []
) {

    // First check V2
    const v2Data =
        getData(
            key,
            null
        );

    if (
        v2Data !== null
        &&
        v2Data !== undefined
    ) {

        return v2Data;
    }


    // Then check old V1 keys
    for (
        const legacyKey
        of legacyKeys
    ) {

        const oldData =
            readOldKey(
                legacyKey
            );

        if (
            oldData !== null
            &&
            oldData !== undefined
        ) {

            // Copy old data into V2
            saveData(
                key,
                oldData
            );

            return oldData;
        }
    }


    return fallback;
}


/*
|--------------------------------------------------------------------------
| PROFILE HELPERS
|--------------------------------------------------------------------------
*/

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
        v2Value !== null
        &&
        v2Value !== undefined
    ) {

        return v2Value;
    }


    const oldValue =
        localStorage.getItem(
            key
        );

    if (
        oldValue !== null
        &&
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


export function saveProfileValue(
    key,
    value
) {

    saveData(
        key,
        value
    );

    // V1 compatibility
    try {

        localStorage.setItem(
            key,
            value
        );

    } catch (error) {

        console.warn(
            "Legacy profile save failed:",
            error
        );
    }
}


/*
|--------------------------------------------------------------------------
| CLEAR V2 DATA
|--------------------------------------------------------------------------
*/

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
            key
            &&
            key.startsWith(
                PREFIX
            )
        ) {

            keys.push(key);
        }
    }


    keys.forEach(
        key => {

            localStorage.removeItem(
                key
            );
        }
    );
}


/*
|--------------------------------------------------------------------------
| STORAGE DEBUG
|--------------------------------------------------------------------------
*/

export function getStorageInfo() {

    const result = {
        v2: {},
        legacy: {}
    };


    // V2
    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);

        if (
            key
            &&
            key.startsWith(
                PREFIX
            )
        ) {

            result.v2[
                key.replace(
                    PREFIX,
                    ""
                )
            ] =
                getData(
                    key.replace(
                        PREFIX,
                        ""
                    ),
                    null
                );
        }
    }


    // Legacy
    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);

        if (
            !key
            ||
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
            value
            &&
            (
                value.startsWith("[")
                ||
                value.startsWith("{")
            )
        ) {

            try {

                result.legacy[key] =
                    JSON.parse(value);

            } catch {
                // Ignore non-JSON values
            }
        }
    }


    return result;
}
