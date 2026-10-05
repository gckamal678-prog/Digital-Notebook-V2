// js/storage.js

const PREFIX = "digital_notebook_v2_";

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

export function getData(key, fallback = null) {

    try {

        const raw = localStorage.getItem(
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

    return localStorage.getItem(
        PREFIX + key
    ) !== null;
}

export function clearV2Data() {

    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key && key.startsWith(PREFIX)) {
            keys.push(key);
        }
    }

    keys.forEach((key) => {
        localStorage.removeItem(key);
    });
}
