/**
 * Unified storage engine — uses Firestore when Firebase is configured,
 * falls back to IndexedDB automatically.
 */
import type { Lead, AppSettings } from '../types';
import {
  initFirebase, isFirebaseReady,
  fs_hasSearch, fs_saveSearchRecord, fs_saveLeads,
  fs_getLeadsBySearchKey, fs_getAllLeads, fs_updateLead, fs_clearAll,
} from './firestore';
import {
  makeSearchKey as _mk,
  hasSearch as idb_has,
  saveSearchRecord as idb_saveSR,
  saveLeadsToDB as idb_save,
  getLeadsBySearchKey as idb_get,
  getAllLeadsFromDB as idb_getAll,
  updateLeadInDB as idb_update,
  clearAllLeadsFromDB as idb_clear,
  getSearchHistoryFromDB as idb_getHistory,
  deleteSearchRecordFromDB as idb_deleteSearch,
} from './db';
import type { SavedSearch } from './db';

export { makeSearchKey } from './db';
export type { SavedSearch } from './db';

export function setupStorage(settings: AppSettings): void {
  if (settings.firebaseApiKey && settings.firebaseProjectId) {
    initFirebase({
      apiKey: settings.firebaseApiKey,
      authDomain: settings.firebaseAuthDomain || `${settings.firebaseProjectId}.firebaseapp.com`,
      projectId: settings.firebaseProjectId,
    });
  }
}

export function storageEngine(): 'firebase' | 'indexeddb' {
  return isFirebaseReady() ? 'firebase' : 'indexeddb';
}

export async function hasSearch(searchKey: string): Promise<boolean> {
  return isFirebaseReady() ? fs_hasSearch(searchKey) : idb_has(searchKey);
}

export async function saveSearchRecord(
  searchKey: string,
  count: number,
  meta: { query: string; countryCode: string; countryAr: string; cityAr: string; cityEn: string }
): Promise<void> {
  return isFirebaseReady() ? fs_saveSearchRecord(searchKey, count) : idb_saveSR(searchKey, count, meta);
}

export async function saveLeads(leads: Lead[], searchKey: string, country: string, city: string): Promise<void> {
  return isFirebaseReady()
    ? fs_saveLeads(leads, searchKey)
    : idb_save(leads, searchKey, country, city);
}

export async function getLeadsBySearchKey(searchKey: string): Promise<Lead[]> {
  return isFirebaseReady() ? fs_getLeadsBySearchKey(searchKey) : idb_get(searchKey);
}

export async function getAllLeads(): Promise<Lead[]> {
  return isFirebaseReady() ? fs_getAllLeads() : idb_getAll();
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  return isFirebaseReady() ? fs_updateLead(id, updates) : idb_update(id, updates);
}

export async function clearAll(): Promise<void> {
  return isFirebaseReady() ? fs_clearAll() : idb_clear();
}

export async function getSearchHistory(): Promise<SavedSearch[]> {
  // Firebase version can return empty for now; IndexedDB fully supported
  return isFirebaseReady() ? [] : idb_getHistory();
}

export async function deleteSearchRecord(searchKey: string): Promise<void> {
  if (!isFirebaseReady()) await idb_deleteSearch(searchKey);
}
