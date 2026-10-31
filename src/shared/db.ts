// src/shared/db.ts
// ─── IndexedDB helpers: open, save, read ────────────────────
// Uses the raw IndexedDB API — no extra libraries needed.

import { DB_NAME, DB_VERSION, STORE_NAME } from "./constants";
import type { EvidenceRecord } from "./types";

/**
 * Open (or create) the IndexedDB database.
 * Returns a Promise that resolves with the database instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Called when the database is created or version is bumped.
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // "id" is the primary key for every EvidenceRecord.
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a single EvidenceRecord to IndexedDB.
 * If a record with the same id already exists, it is overwritten.
 */
export async function saveRecord(record: EvidenceRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Read all EvidenceRecords from IndexedDB.
 * Returns an array (empty if the store has no records yet).
 */
export async function getRecords(): Promise<EvidenceRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as EvidenceRecord[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Read a single EvidenceRecord by its id.
 * Returns null if not found.
 */
export async function getRecordById(
  id: string
): Promise<EvidenceRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as EvidenceRecord) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

