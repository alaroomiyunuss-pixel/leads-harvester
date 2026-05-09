import type { Lead } from '../types';

const DB_NAME = 'LeadsHarvesterDB';
const DB_VERSION = 2; // bumped to add metadata to searches store

type StoredLead = Lead & { searchKey: string; country: string; city: string };

export interface SavedSearch {
  searchKey: string;
  query: string;
  countryCode: string;
  countryAr: string;
  cityAr: string;
  cityEn: string;
  count: number;
  timestamp: number;
}

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('leads')) {
        const store = db.createObjectStore('leads', { keyPath: 'id' });
        store.createIndex('by-searchKey', 'searchKey', { unique: false });
      }
      if (!db.objectStoreNames.contains('searches')) {
        db.createObjectStore('searches', { keyPath: 'searchKey' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

function tx(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode = 'readonly'
): IDBTransaction {
  return db.transaction(stores, mode);
}

export function makeSearchKey(query: string, countryCode: string, cityEn: string): string {
  return `${query.trim().toLowerCase()}|${countryCode.toLowerCase()}|${cityEn.trim().toLowerCase()}`;
}

export async function hasSearch(searchKey: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'searches').objectStore('searches').get(searchKey);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSearchRecord(
  searchKey: string,
  count: number,
  meta: { query: string; countryCode: string; countryAr: string; cityAr: string; cityEn: string }
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = tx(db, 'searches', 'readwrite');
    t.objectStore('searches').put({ searchKey, count, timestamp: Date.now(), ...meta });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getSearchHistoryFromDB(): Promise<SavedSearch[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'searches').objectStore('searches').getAll();
    req.onsuccess = () => resolve((req.result as SavedSearch[]).sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSearchRecordFromDB(searchKey: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = tx(db, ['leads', 'searches'], 'readwrite');
    // Remove the search record
    t.objectStore('searches').delete(searchKey);
    // Remove all leads tied to this search
    const index = t.objectStore('leads').index('by-searchKey');
    const range = IDBKeyRange.only(searchKey);
    const cursorReq = index.openCursor(range);
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result as IDBCursorWithValue | null;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function saveLeadsToDB(
  leads: Lead[],
  searchKey: string,
  country: string,
  city: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = tx(db, 'leads', 'readwrite');
    const store = t.objectStore('leads');
    for (const lead of leads) {
      const stored: StoredLead = { ...lead, searchKey, country, city };
      store.put(stored);
    }
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getLeadsBySearchKey(searchKey: string): Promise<Lead[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const index = tx(db, 'leads').objectStore('leads').index('by-searchKey');
    const req = index.getAll(searchKey);
    req.onsuccess = () =>
      resolve(
        req.result.map((l: StoredLead) => ({
          ...l,
          timestamp: new Date(l.timestamp),
        }))
      );
    req.onerror = () => reject(req.error);
  });
}

export async function getAllLeadsFromDB(): Promise<Lead[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'leads').objectStore('leads').getAll();
    req.onsuccess = () =>
      resolve(
        req.result.map((l: StoredLead) => ({
          ...l,
          timestamp: new Date(l.timestamp),
        }))
      );
    req.onerror = () => reject(req.error);
  });
}

export async function updateLeadInDB(id: string, updates: Partial<Lead>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = tx(db, 'leads', 'readwrite');
    const store = t.objectStore('leads');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) store.put({ ...getReq.result, ...updates });
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function clearAllLeadsFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = tx(db, ['leads', 'searches'], 'readwrite');
    t.objectStore('leads').clear();
    t.objectStore('searches').clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
