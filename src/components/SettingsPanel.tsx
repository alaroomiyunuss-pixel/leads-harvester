import { Cloud, Database, ShieldCheck, AlertCircle, Send, Key, Lock } from 'lucide-react';
import { storageEngine } from '../utils/storage-engine';

/* نقرأ فقط هل المتغير موجود أم لا — لا نعرضه أبداً */
const HAS_GOOGLE   = !!import.meta.env.VITE_GOOGLE_API_KEY;
const HAS_TG_TOKEN = !!import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const HAS_TG_CHAT  = !!import.meta.env.VITE_TELEGRAM_CHAT_ID;

function StatusRow({ label, ok, okText, failText }: { label: string; ok: boolean; okText: string; failText: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: ok ? '#15803d' : '#b91c1c', background: ok ? '#f0fdf4' : '#fff1f2', padding: '4px 10px', borderRadius: 20, border: `1px solid ${ok ? '#bbf7d0' : '#fecdd3'}` }}>
        {ok ? <ShieldCheck size={11} /> : <AlertCircle size={11} />}
        {ok ? okText : failText}
      </span>
    </div>
  );
}

export function SettingsPanel() {
  const engine = storageEngine();
  const allOk = HAS_GOOGLE && HAS_TG_TOKEN && HAS_TG_CHAT;

  return (
    <div style={{ direction: 'rtl' }}>

      {/* بانر الحماية */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#1e293b,#0f172a)', marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.1)' }}>
          <Lock size={16} color="white" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>المفاتيح محمية في Vercel</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>لا يمكن لأحد الاطلاع عليها أو نسخها من داخل التطبيق</p>
        </div>
      </div>

      {/* حالة قاعدة البيانات */}
      <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {engine === 'supabase' ? <Cloud size={15} color="#16a34a" /> : <Database size={15} color="#0284c7" />}
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>قاعدة البيانات</h3>
        </div>
        <StatusRow
          label="Supabase (سحابي)"
          ok={engine === 'supabase'}
          okText="متصل ✓"
          failText="غير متصل"
        />
        <div style={{ marginTop: 4 }}>
          <StatusRow
            label="IndexedDB (احتياطي محلي)"
            ok={true}
            okText="جاهز دائماً"
            failText=""
          />
        </div>
      </div>

      {/* حالة المفاتيح */}
      <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Key size={15} color="#f59e0b" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>مفاتيح API</h3>
        </div>
        <StatusRow label="Google Maps API" ok={HAS_GOOGLE} okText="مُفعَّل ✓" failText="غير مُضبوط" />
        <div style={{ marginTop: 4 }}>
          <StatusRow label="Telegram Bot Token" ok={HAS_TG_TOKEN} okText="مُفعَّل ✓" failText="غير مُضبوط" />
        </div>
        <div style={{ marginTop: 4 }}>
          <StatusRow label="Telegram Chat ID" ok={HAS_TG_CHAT} okText="مُفعَّل ✓" failText="غير مُضبوط" />
        </div>

        {!allOk && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#92400e', lineHeight: 1.7 }}>
              لإضافة المفاتيح الناقصة، اذهب إلى:<br />
              <b>Vercel → Settings → Environment Variables</b><br />
              ثم أضف المتغيرات وأعد النشر (Redeploy).
            </p>
          </div>
        )}
      </div>

      {/* حالة التليجرام */}
      <div style={{ borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Send size={15} color="#3b82f6" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>التليجرام</h3>
        </div>
        <StatusRow
          label="إرسال العملاء للفريق"
          ok={HAS_TG_TOKEN && HAS_TG_CHAT}
          okText="جاهز للإرسال ✓"
          failText="يحتاج إعداد"
        />
      </div>

    </div>
  );
}
