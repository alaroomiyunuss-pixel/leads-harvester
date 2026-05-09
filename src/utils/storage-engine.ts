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

/**
 * يقرأ من Supabase + IndexedDB معاً ويدمجهما.
 * يُستخدم عند بداية التطبيق لضمان ظهور كل البيانات
 * حتى لو الرفع لم يتم بعد.
 */
export async function getAllLeadsMerged(): Promise<Lead[]> {
  const [cloudResult, localResult] = await Promise.allSettled([
    sb_getAllLeads(),
    idb_getAll(),
  ]);
  const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : [];
  const local = localResult.status === 'fulfilled' ? localResult.value : [];

  // دمج بدون تكرار (Cloud له الأولوية)
  const cloudIds = new Set(cloud.map(l => l.id));
  const merged   = [...cloud, ...local.filter(l => !cloudIds.has(l.id))];
  return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * يقرأ سجلات البحث من المصدرين ويدمجهما.
 */
export async function getSearchHistoryMerged(): Promise<SavedSearch[]> {
  const [cloudResult, localResult] = await Promise.allSettled([
    sb_getSearchHistory(),
    idb_getHistory(),
  ]);
  const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : [];
  const local = localResult.status === 'fulfilled' ? localResult.value : [];

  const cloudKeys = new Set(cloud.map(s => s.searchKey));
  const merged    = [...cloud, ...local.filter(s => !cloudKeys.has(s.searchKey))];
  return merged.sort((a, b) => b.timestamp - a.timestamp);
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

/* ════════════════════════════════════════════════════════
   Migration: نقل البيانات المحلية → Supabase
   ════════════════════════════════════════════════════════ */
export async function migrateLocalToCloud(
  onProgress?: (done: number, total: number, phase: string) => void
): Promise<{ leads: number; searches: number; skipped: number }> {

  onProgress?.(0, 1, 'جارٍ قراءة البيانات المحلية...');

  const [rawLeads, localSearches] = await Promise.all([
    getAllLeadsRawFromDB(),
    idb_getHistory(),
  ]);

  if (!rawLeads.length && !localSearches.length) {
    return { leads: 0, searches: 0, skipped: 0 };
  }

  onProgress?.(0, rawLeads.length, 'فحص البيانات الموجودة في السحابة...');
  const cloudLeads = await sb_getAllLeads().catch(() => [] as Lead[]);
  const cloudIds   = new Set(cloudLeads.map(l => l.id));

  const newLeads = rawLeads.filter(l => !cloudIds.has(l.id));
  const skipped  = rawLeads.length - newLeads.length;

  /* جمّع حسب searchKey */
  const byKey = new Map<string, typeof rawLeads>();
  for (const lead of newLeads) {
    const key = (lead as { searchKey?: string }).searchKey || 'migrated';
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(lead);
  }

  let done = 0;
  for (const [key, leads] of byKey) {
    await sb_saveLeads(leads as Lead[], key).catch(() => {});
    done += leads.length;
    onProgress?.(done, newLeads.length, `جارٍ رفع العملاء... (${done}/${newLeads.length})`);
  }

  onProgress?.(done, newLeads.length, 'جارٍ رفع سجلات البحث...');
  for (const s of localSearches) {
    await sb_saveSearchRecord(s.searchKey, s.count, {
      query: s.query, countryCode: s.countryCode,
      countryAr: s.countryAr, cityAr: s.cityAr, cityEn: s.cityEn,
    }).catch(() => {});
  }

  /* إعادة تفعيل Supabase */
  _useSupabase = true;

  return { leads: newLeads.length, searches: localSearches.length, skipped };
}
