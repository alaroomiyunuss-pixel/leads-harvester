/**
 * Unified storage engine — Supabase (cloud) or IndexedDB (local).
 * Supabase is always active since credentials are embedded.
 */
import type { Lead } from '../types';
import {
  sb_hasSearch, sb_saveSearchRecord, sb_saveLeads,
  sb_getLeadsBySearchKey, sb_getAllLeads, sb_updateLead,
  sb_clearAll, sb_getSearchHistory, sb_deleteSearch,
} from './supabase';
import {
  makeSearchKey as _mk,
  hasSearch as idb_has, saveSearchRecord as idb_saveSR,
  saveLeadsToDB as idb_save, getLeadsBySearchKey as idb_get,
  getAllLeadsFromDB as idb_getAll, updateLeadInDB as idb_update,
  clearAllLeadsFromDB as idb_clear,
  getSearchHistoryFromDB as idb_getHistory,
  deleteSearchRecordFromDB as idb_deleteSearch,
} from './db';
import type { SavedSearch } from './db';

export { makeSearchKey } from './db';
export type { SavedSearch } from './db';

/* Use Supabase unless explicitly disabled */
let _useSupabase = true;

export function setupStorage(): void { /* no-op — Supabase always ready */ }
export function storageEngine(): 'supabase' | 'indexeddb' {
  return _useSupabase ? 'supabase' : 'indexeddb';
}
export function disableSupabase(): void { _useSupabase = false; }

/* ── wrappers (try Supabase, fallback to IndexedDB) ── */
async function trySupabase<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!_useSupabase) return fallback();
  try { return await fn(); }
  catch { _useSupabase = false; return fallback(); }
}

export async function hasSearch(key: string): Promise<boolean> {
  return trySupabase(() => sb_hasSearch(key), () => idb_has(key));
}

export async function saveSearchRecord(
  key: string, count: number,
  meta: { query: string; countryCode: string; countryAr: string; cityAr: string; cityEn: string }
): Promise<void> {
  await trySupabase(
    () => sb_saveSearchRecord(key, count, meta),
    () => idb_saveSR(key, count, meta)
  );
}

export async function saveLeads(leads: Lead[], key: string, country: string, city: string): Promise<void> {
  await trySupabase(
    () => sb_saveLeads(leads, key),
    () => idb_save(leads, key, country, city)
  );
}

export async function getLeadsBySearchKey(key: string): Promise<Lead[]> {
  return trySupabase(() => sb_getLeadsBySearchKey(key), () => idb_get(key));
}

export async function getAllLeads(): Promise<Lead[]> {
  return trySupabase(() => sb_getAllLeads(), () => idb_getAll());
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  await trySupabase(() => sb_updateLead(id, updates), () => idb_update(id, updates));
}

export async function clearAll(): Promise<void> {
  await trySupabase(() => sb_clearAll(), () => idb_clear());
}

export async function getSearchHistory(): Promise<SavedSearch[]> {
  return trySupabase(() => sb_getSearchHistory(), () => idb_getHistory());
}

export async function deleteSearchRecord(key: string): Promise<void> {
  await trySupabase(() => sb_deleteSearch(key), () => idb_deleteSearch(key));
}
