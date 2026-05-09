import { useState } from 'react';
import { Cloud, Database, ShieldCheck, AlertCircle, Send, Key, Lock, UploadCloud, CheckCircle, RefreshCw } from 'lucide-react';
import { storageEngine, migrateLocalToCloud } from '../utils/storage-engine';

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
  const allOk  = HAS_GOOGLE && HAS_TG_TOKEN && HAS_TG_CHAT;

  const [migrating,    setMigrating]    = useState(false);
  const [migrateMsg,   setMigrateMsg]   = useState('');
  const [migrateOk,    setMigrateOk]    = useState(false);

  async function handleMigrate() {
    setMigrating(true); setMigrateMsg(''); setMigrateOk(false);
    try {
      const result = await migrateLocalToCloud((done, total, phase) => {
        setMigrateMsg(`${phase} ${total > 1 ? `${done}/${total}` : ''}`);
      });
      if (result.leads === 0 && result.searches === 0) {
        setMigrateMsg('لا توجد بيانات محلية للرفع — كل شيء موجود في السحابة بالفعل ✅');
      } else {
        setMigrateMsg(`✅ تم رفع ${result.leads} عميل و${result.searches} بحث إلى السحابة${result.skipped > 0 ? ` (${result.skipped} موجود مسبقاً)` : ''}`);
      }
      setMigrateOk(true);
    } catch {
      setMigrateMsg('❌ فشل الرفع — تحقق من اتصال الإنترنت');
    } finally { setMigrating(false); }
  }

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

      {/* ═══ مزامنة البيانات المحلية ═══ */}
      <div style={{ borderRadius: 14, border: '1.5px solid #bfdbfe', background: '#eff6ff', padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#dbeafe', border: '1px solid #bfdbfe' }}>
            <UploadCloud size={16} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e40af' }}>رفع البيانات المحلية إلى السحابة</h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#3b82f6', lineHeight: 1.5 }}>
              إذا البيانات تظهر عندك فقط ولا تظهر لغيرك — اضغط هنا
            </p>
          </div>
        </div>
        {migrateMsg && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 10, background: migrateOk ? '#f0fdf4' : '#fff7ed', border: `1px solid ${migrateOk ? '#bbf7d0' : '#fed7aa'}`, marginBottom: 10 }}>
            {migrateOk ? <CheckCircle size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />}
            <span style={{ fontSize: 11, color: migrateOk ? '#15803d' : '#92400e', lineHeight: 1.5 }}>{migrateMsg}</span>
          </div>
        )}
        <button onClick={handleMigrate} disabled={migrating}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 700, border: 'none', cursor: migrating ? 'not-allowed' : 'pointer', background: migrating ? '#93c5fd' : '#2563eb', color: 'white', transition: 'all 0.2s' }}>
          {migrating
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الرفع...</>
            : <><UploadCloud size={14} /> رفع البيانات إلى السحابة</>}
        </button>
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
