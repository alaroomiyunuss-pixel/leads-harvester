import { createClient } from '@supabase/supabase-js';
import type { Lead } from '../types';
import type { SavedSearch } from './db';

const URL  = 'https://qafrfyjhpfsydabtcuiy.supabase.co';
const KEY  = 'sb_publishable_C3zTu90v2MP1opv17VZ15A_NJ6w4Q4j';

export const supabase = createClient(URL, KEY);

/* ── helpers ── */
function toRow(lead: Lead, searchKey: string) {
  return {
    id: lead.id, name: lead.name, phone: lead.phone ?? null,
    email: lead.email ?? null, address: lead.address ?? null,
    rating: lead.rating ?? null, review_count: lead.reviewCount ?? null,
    reviews: lead.reviews?.length ? lead.reviews : null,
    category: lead.category ?? null,
    website: lead.website ?? null, google_maps_url: lead.googleMapsUrl ?? null,
    status: lead.status, assignee: lead.assignee ?? null,
    notes: lead.notes ?? null, delivery_url: lead.deliveryUrl ?? null,
    timestamp: lead.timestamp instanceof Date ? lead.timestamp.toISOString() : lead.timestamp,
    place_id: lead.placeId ?? null, country: lead.country ?? null,
    city: lead.city ?? null, search_key: searchKey,
    serial_number: lead.serialNumber ?? null,
  };
}

function fromRow(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string, name: row.name as string,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    address: row.address as string | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    reviews: Array.isArray(row.reviews) ? row.reviews as string[] : undefined,
    category: row.category as string | undefined,
    website: row.website as string | undefined,
    googleMapsUrl: row.google_maps_url as string | undefined,
    status: row.status as Lead['status'],
    assignee: row.assignee as string | undefined,
    notes: row.notes as string | undefined,
    deliveryUrl: row.delivery_url as string | undefined,
    timestamp: new Date(row.timestamp as string),
    serialNumber: row.serial_number as number | undefined,
    placeId: row.place_id as string | undefined,
    country: row.country as string | undefined,
    city: row.city as string | undefined,
  };
}

/* ── searches ── */
export async function sb_hasSearch(searchKey: string): Promise<boolean> {
  const { data } = await supabase.from('searches').select('search_key').eq('search_key', searchKey).maybeSingle();
  return !!data;
}

export async function sb_saveSearchRecord(key: string, count: number, meta: Omit<SavedSearch, 'searchKey' | 'count' | 'timestamp'>): Promise<void> {
  const { error } = await supabase.from('searches').upsert({
    search_key: key, count, timestamp: Date.now(),
    query: meta.query, country_code: meta.countryCode, country_ar: meta.countryAr,
    city_ar: meta.cityAr, city_en: meta.cityEn, max_radius: meta.maxRadius ?? 0,
  });
  if (error) throw new Error(`${error.message}${error.details ? ` | ${error.details}` : ''}${error.hint ? ` | تلميح: ${error.hint}` : ''}`);
}

function rowToSavedSearch(r: Record<string, unknown>): SavedSearch {
  return {
    searchKey: r.search_key as string, query: r.query as string,
    countryCode: r.country_code as string, countryAr: r.country_ar as string,
    cityAr: r.city_ar as string, cityEn: r.city_en as string,
    count: r.count as number, maxRadius: (r.max_radius as number) ?? 0,
    timestamp: r.timestamp as number,
  };
}

export async function sb_getSearchHistory(): Promise<SavedSearch[]> {
  const { data } = await supabase.from('searches').select('*').order('timestamp', { ascending: false });
  return (data ?? []).map(rowToSavedSearch);
}

export async function sb_getSearchRecord(searchKey: string): Promise<SavedSearch | null> {
  const { data } = await supabase.from('searches').select('*').eq('search_key', searchKey).maybeSingle();
  return data ? rowToSavedSearch(data as Record<string, unknown>) : null;
}

export async function sb_deleteSearch(searchKey: string): Promise<void> {
  await supabase.from('leads').delete().eq('search_key', searchKey);
  await supabase.from('searches').delete().eq('search_key', searchKey);
}

/* ── leads ── */
export async function sb_saveLeads(leads: Lead[], searchKey: string): Promise<void> {
  if (!leads.length) return;
  const rows = leads.map(l => toRow(l, searchKey));
  const { error } = await supabase.from('leads').upsert(rows);
  if (error) throw new Error(`${error.message}${error.details ? ` | ${error.details}` : ''}${error.hint ? ` | تلميح: ${error.hint}` : ''}`);
}

export async function sb_getMaxSerial(): Promise<number> {
  const { data } = await supabase.from('leads')
    .select('serial_number')
    .order('serial_number', { ascending: false })
    .limit(1);
  return (data?.[0]?.serial_number as number) ?? 0;
}

export async function sb_getLeadsBySearchKey(searchKey: string): Promise<Lead[]> {
  const { data } = await supabase.from('leads').select('*').eq('search_key', searchKey);
  return (data ?? []).map(fromRow);
}

export async function sb_getAllLeads(): Promise<Lead[]> {
  const { data } = await supabase.from('leads').select('*').order('timestamp', { ascending: false });
  return (data ?? []).map(fromRow);
}

export async function sb_updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.status !== undefined)      patch.status       = updates.status;
  if (updates.assignee !== undefined)    patch.assignee     = updates.assignee;
  if (updates.notes !== undefined)       patch.notes        = updates.notes;
  if (updates.email !== undefined)       patch.email        = updates.email;
  if (updates.deliveryUrl !== undefined) patch.delivery_url = updates.deliveryUrl;
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  if (error) throw error;
}

export async function sb_clearAll(): Promise<void> {
  await supabase.from('leads').delete().neq('id', '');
  await supabase.from('searches').delete().neq('search_key', '');
}
