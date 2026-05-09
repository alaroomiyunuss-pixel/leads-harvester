import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDoc,
  getDocs, updateDoc, deleteDoc, query, where,
  type Firestore,
} from 'firebase/firestore';
import type { Lead } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initFirebase(config: FirebaseConfig): void {
  if (!config.apiKey || !config.projectId) { app = null; db = null; return; }
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
}

export function isFirebaseReady(): boolean { return !!db; }

const LEADS_COL     = 'leads';
const SEARCHES_COL  = 'searches';

/* ── helpers ── */
function toStored(lead: Lead, searchKey: string) {
  return { ...lead, searchKey, timestamp: lead.timestamp.toISOString() };
}
function fromStored(data: Record<string, unknown>): Lead {
  return { ...data, timestamp: new Date(data.timestamp as string) } as Lead;
}

/* ── Firestore operations (same API as db.ts) ── */

export async function fs_hasSearch(searchKey: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, SEARCHES_COL, searchKey));
  return snap.exists();
}

export async function fs_saveSearchRecord(searchKey: string, count: number): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, SEARCHES_COL, searchKey), { searchKey, count, timestamp: Date.now() });
}

export async function fs_saveLeads(leads: Lead[], searchKey: string): Promise<void> {
  if (!db) return;
  await Promise.all(leads.map(l => setDoc(doc(db!, LEADS_COL, l.id), toStored(l, searchKey))));
}

export async function fs_getLeadsBySearchKey(searchKey: string): Promise<Lead[]> {
  if (!db) return [];
  const q = query(collection(db, LEADS_COL), where('searchKey', '==', searchKey));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromStored(d.data() as Record<string, unknown>));
}

export async function fs_getAllLeads(): Promise<Lead[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, LEADS_COL));
  return snap.docs.map(d => fromStored(d.data() as Record<string, unknown>));
}

export async function fs_updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, LEADS_COL, id), updates as Record<string, unknown>);
}

export async function fs_clearAll(): Promise<void> {
  if (!db) return;
  const [leadsSnap, searchesSnap] = await Promise.all([
    getDocs(collection(db, LEADS_COL)),
    getDocs(collection(db, SEARCHES_COL)),
  ]);
  await Promise.all([
    ...leadsSnap.docs.map(d => deleteDoc(d.ref)),
    ...searchesSnap.docs.map(d => deleteDoc(d.ref)),
  ]);
}
