import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { migrateLocalToCloud } from '../utils/storage-engine';

export function SyncBanner() {
  const [state, setState]   = useState<'idle' | 'running' | 'ok' | 'error'>('idle');
  const [msg,   setMsg]     = useState('');

  async function handleSync() {
    setState('running'); setMsg('');
    try {
      const result = await migrateLocalToCloud((done, total, phase) => {
        setMsg(`${phase}${total > 1 ? `  ${done}/${total}` : ''}`);
      });
      if (result.leads === 0 && result.searches === 0) {
        setMsg('كل البيانات موجودة في السحابة ✓');
      } else {
        setMsg(`✓ رُفع ${result.leads} عميل و${result.searches} بحث${result.skipped > 0 ? ` (${result.skipped} موجود مسبقاً)` : ''}`);
      }
      setState('ok');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }

  /* ── بعد نجاح الرفع: بانر صغير أخضر ── */
  if (state === 'ok') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0', marginBottom: 12 }}>
        <CheckCircle size={14} color="#16a34a" />
        <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600, flex: 1 }}>{msg}</span>
        <button onClick={() => setState('idle')} style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
    );
  }

  /* ── خطأ ── */
  if (state === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 14px', borderRadius: 12, background: '#fff1f2', border: '1.5px solid #fecdd3', marginBottom: 12 }}>
        <AlertCircle size={14} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: '#be123c', flex: 1 }}>{msg}</span>
        <button onClick={() => setState('idle')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
    );
  }

  /* ── idle / running ── */
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#eff6ff', border: '1.5px solid #bfdbfe', marginBottom: 12 }}>
      <UploadCloud size={15} color="#2563eb" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>مزامنة البيانات مع السحابة</span>
        {state === 'running' && msg && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#3b82f6' }}>{msg}</p>
        )}
      </div>
      <button
        onClick={handleSync}
        disabled={state === 'running'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
          border: 'none', cursor: state === 'running' ? 'not-allowed' : 'pointer',
          background: state === 'running' ? '#93c5fd' : '#2563eb',
          color: 'white', whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        {state === 'running'
          ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ الرفع...</>
          : <><UploadCloud size={12} /> رفع للسحابة</>}
      </button>
    </div>
  );
}
