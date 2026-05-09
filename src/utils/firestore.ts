/**
 * Firebase stub — Firebase removed, using IndexedDB only.
 * Can be replaced with Supabase or any cloud backend later.
 */
import type { Lead } from '../types';

export function initFirebase(_config: Record<string, string>): void {}
export function isFirebaseReady(): boolean { return false; }
export async function fs_hasSearch(_key: string): Promise<boolean> { return false; }
export async function fs_saveSearchRecord(_key: string, _count: number): Promise<void> {}
export async function fs_saveLeads(_leads: Lead[], _key: string): Promise<void> {}
export async function fs_getLeadsBySearchKey(_key: string): Promise<Lead[]> { return []; }
export async function fs_getAllLeads(): Promise<Lead[]> { return []; }
export async function fs_updateLead(_id: string, _updates: Partial<Lead>): Promise<void> {}
export async function fs_clearAll(): Promise<void> {}
