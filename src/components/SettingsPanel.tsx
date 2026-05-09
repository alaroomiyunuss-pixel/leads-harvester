import React, { useState } from 'react';
import { Key, Send, Eye, EyeOff, CheckCircle, ExternalLink, Info, Flame, Database } from 'lucide-react';
import type { AppSettings } from '../types';
import { storageEngine } from '../utils/storage-engine';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

type Reveal = Record<string, boolean>;

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

  const field = (label: string, placeholder: string, key: keyof AppSettings, secret = false) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: '#475569', fontSize: 12, marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={secret && !show[key] ? 'password' : 'text'}
          value={(form[key] as string) || ''}
          onChange={e => set(key, e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          style={{ width: '100%', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: secret ? '9px 36px 9px 12px' : '9px 12px', fontSize: 12, color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', transition: 'border-color 0.2s' }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        {secret && (
          <button type="button" onClick={() => toggle(key)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
            {show[key] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ direction: 'rtl' }}>

      {/* Storage engine badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: engine === 'firebase' ? '#f0fdf4' : '#f0f9ff', border: `1px solid ${engine === 'firebase' ? '#bbf7d0' : '#bae6fd'}`, marginBottom: 16 }}>
        {engine === 'firebase' ? <Flame size={14} color="#16a34a" /> : <Database size={14} color="#0284c7" />}
        <span style={{ fontSize: 12, color: engine === 'firebase' ? '#15803d' : '#0369a1', fontWeight: 500 }}>
          {engine === 'firebase' ? '🔥 يعمل على Firebase Firestore (سحابي)' : '💾 يعمل على IndexedDB (محلي)'}
        </span>
      </div>

      {/* Google Maps */}
      {card('Google Maps API Key', 'يُخزَّن محلياً — لا يُرسَل لأي خادم', <Key size={16} color="#f59e0b" />, '#f59e0b',
        <>
          {field('API Key', 'AIzaSy...', 'googleApiKey', true)}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 10 }}>
            <p style={{ color: '#92400e', fontSize: 11, margin: '0 0 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Info size={11} /> كيفية الحصول على المفتاح</p>
            <ol style={{ color: '#78350f', fontSize: 11, margin: 0, paddingRight: 16, lineHeight: 1.8 }}>
              <li>اذهب إلى <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d97706' }}>Google Cloud Console <ExternalLink size={9} style={{ display: 'inline' }} /></a></li>
              <li>فعّل <b>Places API (New)</b></li>
              <li>فعّل الفوترة (Billing)</li>
              <li>أنشئ API Key من Credentials</li>
            </ol>
          </div>
        </>
      )}

      {/* Firebase */}
      {card('Firebase Firestore', 'تزامن سحابي — شارك البيانات مع الفريق', <Flame size={16} color="#ef4444" />, '#ef4444',
        <>
          {field('Firebase API Key', 'AIzaSy...', 'firebaseApiKey', true)}
          {field('Auth Domain', 'your-project.firebaseapp.com', 'firebaseAuthDomain')}
          {field('Project ID', 'your-project-id', 'firebaseProjectId')}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10 }}>
            <p style={{ color: '#7f1d1d', fontSize: 11, margin: '0 0 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Info size={11} /> إعداد Firebase</p>
            <ol style={{ color: '#991b1b', fontSize: 11, margin: 0, paddingRight: 16, lineHeight: 1.8 }}>
              <li>أنشئ مشروعاً في <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626' }}>Firebase Console <ExternalLink size={9} style={{ display: 'inline' }} /></a></li>
              <li>فعّل <b>Firestore Database</b></li>
              <li>اضبط Rules على <code style={{ fontSize: 10, background: '#fee2e2', padding: '1px 4px', borderRadius: 4 }}>allow read, write: if true;</code></li>
              <li>انسخ الـ Config من إعدادات المشروع</li>
            </ol>
          </div>
        </>
      )}

      {/* Telegram */}
      {card('إعدادات التليجرام', 'إرسال العملاء لفريق المبيعات فوراً', <Send size={16} color="#3b82f6" />, '#3b82f6',
        <>
          {field('Bot Token', '123456789:ABCdef...', 'telegramBotToken', true)}
          {field('Chat ID', '-100123456789', 'telegramChatId')}
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
