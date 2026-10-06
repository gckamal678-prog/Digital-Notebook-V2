/* =========================================================
   DIGITAL NOTEBOOK V2
   NOTEBOOK DATA ENGINE
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";

const STORAGE_KEY = "notes";

const LEGACY_KEYS = [
    "notes",
    "note",
    "notebook",
    "notebooks",
    "noteData",
    "notesData",
    "noteRecords",
    "noteHistory",
    "digital_notebook_notes"
];

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );
}

function nowISO() {
    return new Date().toISOString();
}

function normalizeBoolean(value) {
    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    ) {
        return true;
    }

    return false;
}

function normalizeNote(item = {}) {
    const id =
        item.id !== undefined &&
        item.id !== null &&
        String(item.id).trim() !== ""
            ? String(item.id)
            : createId();

    return {
        id,

        title: String(
            item.title ??
            item.name ??
            ""
        ).trim(),

        content: String(
            item.content ??
            item.text ??
            item.note ??
            ""
        ),

        category: String(
            item.category ?? ""
        ).trim(),

        date:
            item.date ||
            new Date().toISOString().slice(0, 10),

        pinned:
            normalizeBoolean(
                item.pinned ??
                item.isPinned
            ),

        createdAt:
            item.createdAt ||
            nowISO(),

        updatedAt:
            item.updatedAt ||
            nowISO()
    };
}

function getNotes() {
    const result = getDataWithLegacy(
        STORAGE_KEY,
        [],
        LEGACY_KEYS
    );

    return (
        Array.isArray(result)
            ? result
            : []
    ).map(normalizeNote);
}

function saveNotes(notes) {
    const normalized =
        Array.isArray(notes)
            ? notes.map(normalizeNote)
            : [];

    saveData(
        STORAGE_KEY,
        normalized
    );

    scheduleSync(
        STORAGE_KEY,
        normalized
    );

    return normalized;
}

function addNote(data = {}) {
    const notes = getNotes();

    const note = normalizeNote({
        ...data,

        id:
            data.id ||
            createId(),

        createdAt:
            data.createdAt ||
            nowISO(),

        updatedAt:
            nowISO()
    });

    notes.push(note);

    saveNotes(notes);

    return note;
}

function updateNote(
    id,
    data = {}
) {
    const notes = getNotes();

    const index =
        notes.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return null;
    }

    const updated =
        normalizeNote({
            ...notes[index],
            ...data,

            id:
                notes[index].id,

            createdAt:
                notes[index].createdAt,

            updatedAt:
                nowISO()
        });

    notes[index] =
        updated;

    saveNotes(notes);

    return updated;
}

async function deleteNote(id) {
    const notes = getNotes();

    const index =
        notes.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return false;
    }

    const removed =
        notes[index];

    notes.splice(
        index,
        1
    );

    saveData(
        STORAGE_KEY,
        notes
    );

    await deleteCloudRecord(
        STORAGE_KEY,
        removed.id
    );

    scheduleSync(
        STORAGE_KEY,
        notes
    );

    return true;
}

function getNoteById(id) {
    return (
        getNotes().find(
            item =>
                String(item.id) ===
                String(id)
        ) || null
    );
}

function filterNotes(
    notes = getNotes(),
    filters = {}
) {
    const {
        category,
        search,
        pinned,
        startDate,
        endDate
    } = filters;

    return notes.filter(item => {
        if (
            category &&
            item.category !== category
        ) {
            return false;
        }

        if (
            pinned !== undefined &&
            Boolean(item.pinned) !==
            Boolean(pinned)
        ) {
            return false;
        }

        if (
            startDate &&
            item.date < startDate
        ) {
            return false;
        }

        if (
            endDate &&
            item.date > endDate
        ) {
            return false;
        }

        if (search) {
            const query =
                String(search)
                    .toLowerCase()
                    .trim();

            const text = [
                item.title,
                item.content,
                item.category,
                item.date
            ]
                .join(" ")
                .toLowerCase();

            if (
                !text.includes(query)
            ) {
                return false;
            }
        }

        return true;
    });
}

function searchNotes(
    query,
    notes = getNotes()
) {
    return filterNotes(
        notes,
        { search: query }
    );
}

function getRecentNotes(
    limit = 10
) {
    return [...getNotes()]
        .sort(
            (a, b) =>
                new Date(
                    b.updatedAt ||
                    b.date ||
                    b.createdAt
                ) -
                new Date(
                    a.updatedAt ||
                    a.date ||
                    a.createdAt
                )
        )
        .slice(0, limit);
}

function getPinnedNotes() {
    return getNotes()
        .filter(
            note => note.pinned
        )
        .sort(
            (a, b) =>
                new Date(
                    b.updatedAt
                ) -
                new Date(
                    a.updatedAt
                )
        );
}

function toggleNotePin(id) {
    const notes = getNotes();

    const index =
        notes.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (index === -1) {
        return null;
    }

    notes[index] =
        normalizeNote({
            ...notes[index],

            pinned:
                !notes[index].pinned,

            updatedAt:
                nowISO()
        });

    saveNotes(notes);

    return notes[index];
}

function getNoteCategories(
    notes = getNotes()
) {
    return [
        ...new Set(
            notes
                .map(
                    note =>
                        note.category
                )
                .filter(Boolean)
        )
    ];
}

function getNotesByDate(
    date,
    notes = getNotes()
) {
    return notes.filter(
        note =>
            note.date === date
    );
}

function clearNotes() {
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

export {
    STORAGE_KEY,
    getNotes,
    saveNotes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    filterNotes,
    searchNotes,
    getRecentNotes,
    getPinnedNotes,
    toggleNotePin,
    getNoteCategories,
    getNotesByDate,
    clearNotes,
    normalizeNote
};

export default {
    STORAGE_KEY,
    getNotes,
    saveNotes,
    addNote,
    updateNote,
    deleteNote,
    getNoteById,
    filterNotes,
    searchNotes,
    getRecentNotes,
    getPinnedNotes,
    toggleNotePin,
    getNoteCategories,
    getNotesByDate,
    clearNotes,
    normalizeNote
};
