/**
 * Unified storage engine — Supabase (cloud) or IndexedDB (local).
 * Supabase is always active since credentials are embedded.
 */
import type { Lead } from '../types';
import {
  sb_hasSearch, sb_saveSearchRecord, sb_saveLeads,
  sb_getLeadsBySearchKey, sb_getAllLeads, sb_updateLead,
  sb_clearAll, sb_getSearchHistory, sb_deleteSearch,
  sb_getSearchRecord, sb_getMaxSerial,
} from './supabase';
import {
  makeSearchKey as _mk,
  hasSearch as idb_has, saveSearchRecord as idb_saveSR,
  saveLeadsToDB as idb_save, getLeadsBySearchKey as idb_get,
  getAllLeadsFromDB as idb_getAll, updateLeadInDB as idb_update,
  clearAllLeadsFromDB as idb_clear,
  getSearchHistoryFromDB as idb_getHistory,
  deleteSearchRecordFromDB as idb_deleteSearch,
  getAllLeadsRawFromDB,
  getSearchRecordFromDB as idb_getSearchRecord,
  getMaxSerialFromDB,
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
  // تحقق من المصدرين — إن وُجدت في أي منهما فالبحث محفوظ
  const [cloudResult, localResult] = await Promise.allSettled([
    _useSupabase ? sb_hasSearch(key) : Promise.resolve(false),
    idb_has(key),
  ]);
  const inCloud = cloudResult.status === 'fulfilled' && cloudResult.value === true;
  const inLocal = localResult.status === 'fulfilled' && localResult.value === true;
  return inCloud || inLocal;
}

export async function saveSearchRecord(
  key: string, count: number,
  meta: { query: string; countryCode: string; countryAr: string; cityAr: string; cityEn: string; maxRadius: number }
): Promise<void> {
  // دائماً احفظ محلياً أولاً (ضمان الاستمرارية عند التحديث)
  await idb_saveSR(key, count, meta);
  // مزامنة سحابية في الخلفية (لا تمنع العمل إن فشلت)
  if (_useSupabase) {
    sb_saveSearchRecord(key, count, meta).catch(() => { _useSupabase = false; });
  }
}

/** احسب أكبر رقم تسلسلي موجود في أي مصدر */
async function getMaxSerial(): Promise<number> {
  const [cloud, local] = await Promise.allSettled([
    _useSupabase ? sb_getMaxSerial() : Promise.resolve(0),
    getMaxSerialFromDB(),
  ]);
  return Math.max(
    cloud.status === 'fulfilled' ? cloud.value : 0,
    local.status === 'fulfilled' ? local.value : 0,
  );
}

export async function saveLeads(leads: Lead[], key: string, country: string, city: string): Promise<void> {
  // عيّن أرقاماً تسلسلية للعملاء الجدد (بدون رقم)
  const unNumbered = leads.filter(l => !l.serialNumber);
  if (unNumbered.length > 0) {
    const maxSerial = await getMaxSerial();
    unNumbered.forEach((l, i) => { l.serialNumber = maxSerial + i + 1; });
  }
  // دائماً احفظ محلياً أولاً (ضمان الاستمرارية عند التحديث)
  await idb_save(leads, key, country, city);
  // مزامنة سحابية في الخلفية (لا تمنع العمل إن فشلت)
  if (_useSupabase) {
    sb_saveLeads(leads, key).catch(() => { _useSupabase = false; });
  }
}

export async function getLeadsBySearchKey(key: string): Promise<Lead[]> {
  return trySupabase(() => sb_getLeadsBySearchKey(key), () => idb_get(key));
}

/** يجمع نتائج البحث من Supabase + IndexedDB بدون تكرار */
export async function getLeadsBySearchKeyMerged(key: string): Promise<Lead[]> {
  const [cloudResult, localResult] = await Promise.allSettled([
    sb_getLeadsBySearchKey(key),
    idb_get(key),
  ]);
  const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : [];
  const local = localResult.status === 'fulfilled' ? localResult.value : [];
  const cloudIds = new Set(cloud.map(l => l.id));
  return [...cloud, ...local.filter(l => !cloudIds.has(l.id))];
}

/** يجلب سجل بحث محدد من أي مصدر متاح */
export async function getSearchRecord(key: string): Promise<SavedSearch | null> {
  const [cloudResult, localResult] = await Promise.allSettled([
    _useSupabase ? sb_getSearchRecord(key) : Promise.resolve(null),
    idb_getSearchRecord(key),
  ]);
  const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : null;
  const local = localResult.status === 'fulfilled' ? localResult.value : null;
  // أعِد السجل الأكبر نطاقاً (الأشمل)
  if (cloud && local) {
    return (cloud.maxRadius ?? 0) >= (local.maxRadius ?? 0) ? cloud : local;
  }
  return cloud ?? local;
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
  // دائماً حدّث محلياً أولاً
  await idb_update(id, updates);
  // ثم حدّث السحابة في الخلفية
  if (_useSupabase) {
    sb_updateLead(id, updates).catch(() => { _useSupabase = false; });
  }
}

export async function clearAll(): Promise<void> {
  // امسح من المصدرين معاً
  await Promise.allSettled([
    _useSupabase ? sb_clearAll() : Promise.resolve(),
    idb_clear(),
  ]);
}

export async function getSearchHistory(): Promise<SavedSearch[]> {
  return trySupabase(() => sb_getSearchHistory(), () => idb_getHistory());
}

export async function deleteSearchRecord(key: string): Promise<void> {
  // احذف من المصدرين معاً
  await Promise.allSettled([
    _useSupabase ? sb_deleteSearch(key) : Promise.resolve(),
    idb_deleteSearch(key),
  ]);
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
  const cloudLeads    = await sb_getAllLeads().catch(() => [] as Lead[]);
  const cloudIds      = new Set(cloudLeads.map(l => l.id));
  const cloudPlaceIds = new Set(cloudLeads.map(l => l.placeId).filter(Boolean) as string[]);

  // dedup بالـ id والـ placeId معاً لتجنب أي تكرار
  const newLeads = rawLeads.filter(l =>
    !cloudIds.has(l.id) &&
    !(l.placeId && cloudPlaceIds.has(l.placeId))
  );
  const skipped  = rawLeads.length - newLeads.length;

  /* عيّن أرقاماً تسلسلية للعملاء الجدد */
  const maxCloudSerial = cloudLeads.reduce((m, l) => Math.max(m, l.serialNumber ?? 0), 0);
  let nextSerial = maxCloudSerial + 1;
  for (const lead of newLeads) {
    if (!lead.serialNumber) lead.serialNumber = nextSerial++;
  }

  /* جمّع حسب searchKey */
  const byKey = new Map<string, typeof rawLeads>();
  for (const lead of newLeads) {
    const key = (lead as { searchKey?: string }).searchKey || 'migrated';
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(lead);
  }

  /* ══ الخطوة 1: ارفع سجلات البحث أولاً (foreign key يشترطها) ══ */
  onProgress?.(0, newLeads.length, 'جارٍ رفع سجلات البحث...');

  // اجمع كل الـ searchKeys الموجودة في العملاء الجدد
  const keysInLeads = new Set(
    newLeads.map(l => (l as { searchKey?: string }).searchKey).filter(Boolean) as string[]
  );
  // Map من searchKey → بيانات البحث
  const searchMap = new Map(localSearches.map(s => [s.searchKey, s]));

  for (const key of keysInLeads) {
    const s = searchMap.get(key);
    await sb_saveSearchRecord(
      key,
      s?.count ?? 0,
      {
        query:       s?.query      ?? key.split('|')[0] ?? key,
        countryCode: s?.countryCode ?? key.split('|')[1] ?? '',
        countryAr:   s?.countryAr  ?? '',
        cityAr:      s?.cityAr     ?? key.split('|')[2] ?? '',
        cityEn:      s?.cityEn     ?? key.split('|')[2] ?? '',
        maxRadius:   s?.maxRadius  ?? 0,
      }
    ).catch(() => {/* تجاهل — ربما موجود مسبقاً */});
  }

  // ارفع بقية السجلات (غير المرتبطة بعملاء جدد)
  for (const s of localSearches) {
    if (!keysInLeads.has(s.searchKey)) {
      await sb_saveSearchRecord(s.searchKey, s.count, {
        query: s.query, countryCode: s.countryCode,
        countryAr: s.countryAr, cityAr: s.cityAr, cityEn: s.cityEn,
        maxRadius: s.maxRadius ?? 0,
      }).catch(() => {});
    }
  }

  /* ══ الخطوة 2: ارفع العملاء (بعد وجود الـ search keys) ══ */
  let done = 0;
  let firstError: string | null = null;
  for (const [key, leads] of byKey) {
    try {
      await sb_saveLeads(leads as Lead[], key);
    } catch (e) {
      const msg = e instanceof Error
        ? e.message
        : (typeof e === 'object' && e !== null)
          ? JSON.stringify(e)
          : String(e);
      firstError = firstError ?? msg;
    }
    done += leads.length;
    onProgress?.(done, newLeads.length, `جارٍ رفع العملاء... (${done}/${newLeads.length})`);
  }

  if (firstError) throw new Error(`فشل رفع العملاء: ${firstError}`);

  /* إعادة تفعيل Supabase */
  _useSupabase = true;

  return { leads: newLeads.length, searches: localSearches.length, skipped };
}
