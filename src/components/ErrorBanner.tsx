import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps { message: string; onClose: () => void; }

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 14, padding: 14 }}>
      <div style={{ padding: 6, borderRadius: 8, background: '#fee2e2', flexShrink: 0 }}>
        <AlertTriangle size={15} color="#dc2626" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#991b1b', fontSize: 13, fontWeight: 600, margin: '0 0 3px' }}>حدث خطأ</p>
        <pre style={{ color: '#b91c1c', fontSize: 12, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{message}</pre>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 2, flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}
