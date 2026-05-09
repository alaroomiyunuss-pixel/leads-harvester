import React, { useState } from 'react';
import { X, Brain, Copy, CheckCircle, Star } from 'lucide-react';
import type { Lead } from '../types';

interface ReviewsModalProps {
  lead: Lead;
  onClose: () => void;
}

const AI_PROMPT_TEMPLATE = (lead: Lead, reviews: string[]) => `أنت محلل تسويقي متخصص.

اسم الشركة: ${lead.name}
المدينة: ${lead.city || ''}
التقييم: ${lead.rating}/5 (${lead.reviewCount?.toLocaleString('ar') || 0} تقييم)

تقييمات العملاء:
${reviews.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

المطلوب:
1. استخرج نقاط القوة الرئيسية لهذه الشركة من التقييمات
2. استخرج نقاط الضعف والشكاوى
3. اقترح أفضل طريقة للتواصل مع هذا العميل المحتمل
4. ما هي الخدمات التي يحتاجها بشدة بناءً على التقييمات؟`;

export function ReviewsModal({ lead, onClose }: ReviewsModalProps) {
  const [copied, setCopied] = useState(false);
  const reviews = lead.reviews || [];
  const prompt = AI_PROMPT_TEMPLATE(lead, reviews);

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f172a', border: '1px solid rgba(51,65,85,0.8)',
          borderRadius: 20, padding: 24, width: '100%', maxWidth: 560,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 16,
          direction: 'rtl',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 12, background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <Brain size={18} color="#fb923c" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: 0 }}>نافذة AI — {lead.name}</h2>
              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>
                {reviews.length} تقييمات • جاهز للنسخ إلى GPT / Gemini
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Rating summary */}
        {lead.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star size={14} color="#fbbf24" />
            <span style={{ color: '#fde68a', fontWeight: 600 }}>{lead.rating}</span>
            <span style={{ color: '#64748b', fontSize: 12 }}>/ 5 — {lead.reviewCount?.toLocaleString('ar')} تقييم</span>
          </div>
        )}

        {/* Reviews list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {reviews.length === 0 ? (
            <p style={{ color: '#475569', textAlign: 'center', padding: 20 }}>لا توجد تقييمات متاحة</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{r}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Prompt preview */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 12, padding: 12 }}>
          <p style={{ color: '#fb923c', fontSize: 11, margin: '0 0 6px', fontWeight: 600 }}>📋 البرومبت الجاهز لـ GPT / Gemini:</p>
          <pre style={{ color: '#94a3b8', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto', lineHeight: 1.5 }}>
            {prompt.substring(0, 250)}...
          </pre>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(251,146,60,0.2)',
            color: copied ? '#86efac' : '#fb923c',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: copied ? 'rgba(34,197,94,0.3)' : 'rgba(251,146,60,0.3)',
          }}
        >
          {copied ? <><CheckCircle size={16} /> تم النسخ! الصقه في GPT / Gemini</> : <><Copy size={16} /> نسخ البرومبت كاملاً</>}
        </button>
      </div>
    </div>
  );
}
