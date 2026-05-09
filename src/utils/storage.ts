import type { AppSettings, Lead } from '../types';

const SETTINGS_KEY = 'lh_settings';
const LEADS_KEY = 'lh_leads';

/* قيم افتراضية من Vercel Environment Variables — تُقرأ تلقائياً لكل الفريق */
const ENV_DEFAULTS: AppSettings = {
  googleApiKey:     import.meta.env.VITE_GOOGLE_API_KEY     || '',
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  telegramChatId:   import.meta.env.VITE_TELEGRAM_CHAT_ID   || '',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved: AppSettings = JSON.parse(raw);
      /* دمج: env vars تملأ الحقول الفارغة في localStorage */
      return {
        googleApiKey:     saved.googleApiKey     || ENV_DEFAULTS.googleApiKey,
        telegramBotToken: saved.telegramBotToken || ENV_DEFAULTS.telegramBotToken,
        telegramChatId:   saved.telegramChatId   || ENV_DEFAULTS.telegramChatId,
      };
    }
  } catch {}
  return ENV_DEFAULTS;
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
