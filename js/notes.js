// js/notes.js

import {
    getData,
    saveData
} from "./storage.js";

import {
    scheduleSync
} from "./sync.js";

const STORAGE_KEY = "notes";

export function getNotes() {
    return getData(STORAGE_KEY, []);
}

export function saveNotes(notes) {
    saveData(STORAGE_KEY, notes);

    scheduleSync(
        STORAGE_KEY,
        convertArrayToObject(notes)
    );

    return notes;
}

export function addNote(note) {

    const notes = getNotes();

    const newNote = {

        id:
            note.id
            ||
            `note_${Date.now()}`,

        title:
            note.title || "",

        content:
            note.content || "",

        category:
            note.category || "general",

        priority:
            note.priority || "normal",

        completed:
            note.completed === true,

        date:
            note.date
            ||
            new Date()
                .toISOString()
                .split("T")[0],

        reminder:
            note.reminder || "",

        createdAt:
            note.createdAt
            || Date.now(),

        updatedAt:
            Date.now()
    };

    notes.unshift(newNote);

    saveNotes(notes);

    return newNote;
}

export function updateNote(
    id,
    changes
) {

    const notes = getNotes();

    const index =
        notes.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return null;
    }

    notes[index] = {

        ...notes[index],

        ...changes,

        updatedAt:
            Date.now()
    };

    saveNotes(notes);

    return notes[index];
}

export function deleteNote(id) {

    const notes = getNotes();

    const updated =
        notes.filter(
            item => item.id !== id
        );

    saveNotes(updated);

    return true;
}

export function getNoteById(id) {

    const notes = getNotes();

    return (
        notes.find(
            item => item.id === id
        )
        || null
    );
}

function convertArrayToObject(items) {

    const result = {};

    for (const item of items) {

        if (!item?.id) {
            continue;
        }

        result[item.id] = item;
    }

    return result;
}
