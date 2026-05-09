import type { AppSettings, Lead } from '../types';

const SETTINGS_KEY = 'lh_settings';
const LEADS_KEY = 'lh_leads';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { googleApiKey: '', telegramBotToken: '', telegramChatId: '' };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    if (raw) {
      const leads = JSON.parse(raw);
      return leads.map((l: Lead) => ({ ...l, timestamp: new Date(l.timestamp) }));
    }
  } catch {}
  return [];
}

export function saveLeads(leads: Lead[]): void {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}
