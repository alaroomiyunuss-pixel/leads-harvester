import { useState } from 'react';
import { Key, Send, Eye, EyeOff, CheckCircle, ExternalLink, Info, Database, Cloud, ShieldCheck } from 'lucide-react';
import type { AppSettings } from '../types';
import { storageEngine } from '../utils/storage-engine';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

type Reveal = Record<string, boolean>;

/* متغيرات البيئة من Vercel */
const ENV = {
  googleApiKey:     import.meta.env.VITE_GOOGLE_API_KEY     || '',
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  telegramChatId:   import.meta.env.VITE_TELEGRAM_CHAT_ID   || '',
};

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState(settings);
  const [show, setShow] = useState<Reveal>({});
  const [saved, setSaved] = useState(false);

  const engine = storageEngine();

  function set(k: keyof AppSettings, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function toggle(k: string) { setShow(p => ({ ...p, [k]: !p[k] })); }

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const card = (title: string, sub: string, icon: React.ReactNode, accent: string, children: React.ReactNode) => (
    <div style={{ borderRadius: 16, border: `1px solid ${accent}30`, background: '#f8fafc', padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30` }}>{icon}</div>
        <div>
          <h3 style={{ color: '#0f172a', fontWeight: 600, fontSize: 14, margin: 0 }}>{title}</h3>
          <p style={{ color: '#64748b', fontSize: 11, margin: '1px 0 0' }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );

  /* حقل مع مؤشر "مُحمَّل من Vercel" إذا كان المتغير موجوداً */
  const field = (label: string, placeholder: string, key: keyof AppSettings, envVal: string, secret = false) => {
    const fromEnv = !!envVal && !(form[key] as string);
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <label style={{ color: '#475569', fontSize: 12 }}>{label}</label>
          {fromEnv && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '2px 7px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
              <ShieldCheck size={9} /> مُحمَّل من Vercel
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={secret && !show[key] ? 'password' : 'text'}
            value={(form[key] as string) || ''}
            onChange={e => set(key, e.target.value)}
            placeholder={fromEnv ? '••••••••  (مُعيَّن في Vercel)' : placeholder}
            dir="ltr"
            style={{
              width: '100%',
              background: fromEnv ? '#f0fdf4' : 'white',
              border: `1.5px solid ${fromEnv ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: 10,
              padding: secret ? '9px 36px 9px 12px' : '9px 12px',
              fontSize: 12, color: '#0f172a', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'monospace', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#3b82f6')}
            onBlur={e => (e.target.style.borderColor = fromEnv ? '#bbf7d0' : '#e2e8f0')}
          />
          {secret && (
            <button type="button" onClick={() => toggle(key)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
              {show[key] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* هل كل المفاتيح مُحمَّلة من Vercel؟ */
  const allFromEnv = !!ENV.googleApiKey && !!ENV.telegramBotToken && !!ENV.telegramChatId;

  return (
    <div style={{ direction: 'rtl' }}>

      {/* Storage engine badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: engine === 'supabase' ? '#f0fdf4' : '#f0f9ff', border: `1px solid ${engine === 'supabase' ? '#bbf7d0' : '#bae6fd'}`, marginBottom: 12 }}>
        {engine === 'supabase' ? <Cloud size={14} color="#16a34a" /> : <Database size={14} color="#0284c7" />}
        <div>
          <span style={{ fontSize: 12, color: engine === 'supabase' ? '#15803d' : '#0369a1', fontWeight: 600 }}>
            {engine === 'supabase' ? '☁️ متصل بـ Supabase (سحابي)' : '💾 IndexedDB (محلي فقط)'}
          </span>
          <p style={{ margin: '1px 0 0', fontSize: 10, color: engine === 'supabase' ? '#16a34a' : '#0284c7' }}>
            {engine === 'supabase' ? 'البيانات تُحفظ في السحابة وتُشارك مع الفريق' : 'Supabase غير متاح — يعمل محلياً'}
          </p>
        </div>
      </div>

      {/* Vercel env banner */}
      {allFromEnv ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 14 }}>
          <ShieldCheck size={15} color="#16a34a" />
          <div>
            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>كل المفاتيح مُحمَّلة من Vercel</span>
            <p style={{ margin: '1px 0 0', fontSize: 10, color: '#16a34a' }}>لا يحتاج أي فرد من الفريق إدخالها يدوياً</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 14 }}>
          <Info size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>لتوحيد الإعدادات للفريق</span>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#78350f', lineHeight: 1.6 }}>
              أضف المتغيرات في <b>Vercel → Settings → Environment Variables</b>:<br />
              <code style={{ fontSize: 10, background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>VITE_GOOGLE_API_KEY</code>، {' '}
              <code style={{ fontSize: 10, background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>VITE_TELEGRAM_BOT_TOKEN</code>، {' '}
              <code style={{ fontSize: 10, background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>VITE_TELEGRAM_CHAT_ID</code>
            </p>
          </div>
        </div>
      )}

      {/* Google Maps */}
      {card('Google Maps API Key', 'مفتاح البحث عن العملاء المحتملين', <Key size={16} color="#f59e0b" />, '#f59e0b',
        <>
          {field('API Key', 'AIzaSy...', 'googleApiKey', ENV.googleApiKey, true)}
          {!ENV.googleApiKey && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 10 }}>
              <p style={{ color: '#92400e', fontSize: 11, margin: '0 0 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Info size={11} /> كيفية الحصول على المفتاح</p>
              <ol style={{ color: '#78350f', fontSize: 11, margin: 0, paddingRight: 16, lineHeight: 1.8 }}>
                <li>اذهب إلى <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d97706' }}>Google Cloud Console <ExternalLink size={9} style={{ display: 'inline' }} /></a></li>
                <li>فعّل <b>Places API (New)</b></li>
                <li>فعّل الفوترة (Billing)</li>
                <li>أنشئ API Key من Credentials</li>
              </ol>
            </div>
          )}
        </>
      )}

      {/* Telegram */}
      {card('إعدادات التليجرام', 'إرسال العملاء لفريق المبيعات فوراً', <Send size={16} color="#3b82f6" />, '#3b82f6',
        <>
          {field('Bot Token', '123456789:ABCdef...', 'telegramBotToken', ENV.telegramBotToken, true)}
          {field('Chat ID', '-100123456789', 'telegramChatId', ENV.telegramChatId)}
        </>
      )}

      {/* Save */}
      <button onClick={handleSave} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
        background: saved ? '#16a34a' : '#2563eb', color: 'white',
        boxShadow: `0 4px 20px ${saved ? 'rgba(22,163,74,0.3)' : 'rgba(37,99,235,0.3)'}`,
        transition: 'all 0.2s',
      }}>
        {saved ? <><CheckCircle size={16} /> تم الحفظ!</> : <>حفظ الإعدادات</>}
      </button>
    </div>
  );
}
