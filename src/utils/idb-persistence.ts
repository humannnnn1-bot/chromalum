const DB_NAME = "chromalum";
const STORE_NAME = "state";
const KEY = "current";

export interface SavedState {
  w: number;
  h: number;
  data: Uint8Array;
  cc: number[];
  version: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveState(state: SavedState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(state, KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadState(): Promise<SavedState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(KEY);
    req.onsuccess = () => {
      db.close();
      const val = req.result;
      if (!val || typeof val.w !== "number" || typeof val.h !== "number"
        || typeof val.version !== "number"
        || !(val.data instanceof Uint8Array) || !Array.isArray(val.cc) || val.cc.length !== 8
        || val.data.length !== val.w * val.h) {
        resolve(null);
        return;
      }
      resolve(val as SavedState);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

