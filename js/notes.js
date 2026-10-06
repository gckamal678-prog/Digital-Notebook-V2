/* =========================================================
   DIGITAL NOTEBOOK V2
   NOTES DATA ENGINE

   Responsibilities:
   - Notes CRUD
   - Local storage
   - Legacy V1 migration
   - Firebase sync
   - Search
   - Category filtering
   - Date filtering
========================================================= */

import {
    getDataWithLegacy,
    saveData
} from "./storage.js";

import {
    scheduleSync,
    deleteCloudRecord
} from "./sync.js";


/* =========================================================
   STORAGE CONFIGURATION
========================================================= */

const STORAGE_KEY =
    "notes";


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


/* =========================================================
   DATE HELPER
========================================================= */

function getToday() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   ID GENERATOR
========================================================= */

function createId() {

    return (
        "note_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* =========================================================
   NORMALIZE NOTE
========================================================= */

function normalizeNote(
    record
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return null;

    }


    const now =
        Date.now();


    return {

        id:
            record.id ||
            createId(),


        title:
            String(
                record.title ??
                record.heading ??
                record.name ??
                ""
            ).trim(),


        content:
            String(
                record.content ??
                record.text ??
                record.note ??
                record.description ??
                ""
            ),


        category:
            String(
                record.category ??
                ""
            ).trim(),


        date:
            record.date ||
            getToday(),


        pinned:
            !!record.pinned,


        createdAt:
            record.createdAt ||
            now,


        updatedAt:
            record.updatedAt ||
            record.createdAt ||
            now

    };

}


/* =========================================================
   GET ALL NOTES
========================================================= */

export function getNotes() {

    const data =
        getDataWithLegacy(
            STORAGE_KEY,
            LEGACY_KEYS,
            []
        );


    if (
        !Array.isArray(data)
    ) {

        return [];

    }


    return data
        .map(
            normalizeNote
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   SAVE ALL NOTES
========================================================= */

export function saveNotes(
    notes
) {

    if (
        !Array.isArray(notes)
    ) {

        return false;

    }


    const normalized =
        notes
            .map(
                normalizeNote
            )
            .filter(
                Boolean
            );


    const saved =
        saveData(
            STORAGE_KEY,
            normalized
        );


    if (
        saved
    ) {

        scheduleSync(
            STORAGE_KEY,
            normalized
        );

    }


    return saved;

}


/* =========================================================
   ADD NOTE
========================================================= */

export function addNote(
    noteData = {}
) {

    const notes =
        getNotes();


    const now =
        Date.now();


    const note = {

        id:
            noteData.id ||
            createId(),


        title:
            String(
                noteData.title ??
                noteData.heading ??
                noteData.name ??
                ""
            ).trim(),


        content:
            String(
                noteData.content ??
                noteData.text ??
                noteData.note ??
                ""
            ),


        category:
            String(
                noteData.category ??
                ""
            ).trim(),


        date:
            noteData.date ||
            getToday(),


        pinned:
            !!noteData.pinned,


        createdAt:
            noteData.createdAt ||
            now,


        updatedAt:
            now

    };


    notes.push(
        note
    );


    saveNotes(
        notes
    );


    return note;

}


/* =========================================================
   UPDATE NOTE
========================================================= */

export function updateNote(
    id,
    changes = {}
) {

    const notes =
        getNotes();


    const index =
        notes.findIndex(
            (item) =>
                item.id === id
        );


    if (
        index === -1
    ) {

        return null;

    }


    const oldNote =
        notes[index];


    const updated = {

        ...oldNote,

        ...changes,

        id:
            oldNote.id,


        updatedAt:
            Date.now()

    };


    updated.title =
        String(
            updated.title ??
            ""
        ).trim();


    updated.content =
        String(
            updated.content ??
            ""
        );


    updated.category =
        String(
            updated.category ??
            ""
        ).trim();


    updated.pinned =
        !!updated.pinned;


    notes[index] =
        updated;


    saveNotes(
        notes
    );


    return updated;

}


/* =========================================================
   DELETE NOTE
========================================================= */

export async function deleteNote(
    id
) {

    const notes =
        getNotes();


    const exists =
        notes.some(
            (item) =>
                item.id === id
        );


    if (!exists) {

        return false;

    }


    const filtered =
        notes.filter(
            (item) =>
                item.id !== id
        );


    saveNotes(
        filtered
    );


    /*
       Remove cloud copy when
       user is logged in.

       Guest mode safely skips it.
    */

    try {

        await deleteCloudRecord(
            STORAGE_KEY,
            id
        );

    } catch (error) {

        console.warn(
            "Cloud note delete skipped:",
            error
        );

    }


    return true;

}


/* =========================================================
   GET NOTE BY ID
========================================================= */

export function getNoteById(
    id
) {

    const notes =
        getNotes();


    return (
        notes.find(
            (item) =>
                item.id === id
        ) ||
        null
    );

}


/* =========================================================
   GET NOTES BY CATEGORY
========================================================= */

export function getNotesByCategory(
    category
) {

    const target =
        String(
            category || ""
        )
        .trim()
        .toLowerCase();


    if (!target) {

        return getNotes();

    }


    return getNotes().filter(
        (note) =>
            String(
                note.category || ""
            )
            .trim()
            .toLowerCase() ===
            target
    );

}


/* =========================================================
   GET NOTES BY DATE
========================================================= */

export function getNotesByDate(
    date
) {

    return getNotes().filter(
        (note) =>
            note.date === date
    );

}


/* =========================================================
   GET PINNED NOTES
========================================================= */

export function getPinnedNotes() {

    return getNotes().filter(
        (note) =>
            note.pinned === true
    );

}


/* =========================================================
   SEARCH NOTES
========================================================= */

export function searchNotes(
    query
) {

    const target =
        String(
            query || ""
        )
        .trim()
        .toLowerCase();


    if (!target) {

        return getNotes();

    }


    return getNotes().filter(
        (note) => {

            const text = [

                note.title,

                note.content,

                note.category,

                note.date

            ]
            .join(" ")
            .toLowerCase();


            return text.includes(
                target
            );

        }
    );

}


/* =========================================================
   GET RECENT NOTES
========================================================= */

export function getRecentNotes(
    limit = 10
) {

    const count =
        Math.max(
            0,
            Number(limit) || 0
        );


    return getNotes()
        .sort(
            (
                a,
                b
            ) =>
                (
                    Number(
                        b.updatedAt
                    ) || 0
                ) -
                (
                    Number(
                        a.updatedAt
                    ) || 0
                )
        )
        .slice(
            0,
            count
        );

}


/* =========================================================
   GET NOTE CATEGORIES
========================================================= */

export function getNoteCategories() {

    const categories =
        getNotes()
            .map(
                (note) =>
                    note.category
            )
            .filter(
                (category) =>
                    !!category
            );


    return [
        ...new Set(
            categories
        )
    ];

}


/* =========================================================
   PIN / UNPIN NOTE
========================================================= */

export function toggleNotePin(
    id
) {

    const note =
        getNoteById(
            id
        );


    if (!note) {

        return null;

    }


    return updateNote(
        id,
        {
            pinned:
                !note.pinned
        }
    );

}


/* =========================================================
   CLEAR ALL NOTES
========================================================= */

export function clearNotes() {

    saveNotes(
        []
    );


    return true;

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {

    getNotes,

    saveNotes,

    addNote,

    updateNote,

    deleteNote,

    getNoteById,

    getNotesByCategory,

    getNotesByDate,

    getPinnedNotes,

    searchNotes,

    getRecentNotes,

    getNoteCategories,

    toggleNotePin,

    clearNotes

};
