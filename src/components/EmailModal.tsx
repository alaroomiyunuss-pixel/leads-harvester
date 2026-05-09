import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Mail, Globe2, Sparkles, Send } from 'lucide-react';
import type { Lead } from '../types';

type Lang = 'ar' | 'en' | 'nl';

interface Props { lead: Lead; onClose: () => void; }

/* ══════════════════════════════════════
   قوالب البريد الإلكتروني بثلاث لغات
══════════════════════════════════════ */
function buildEmail(lead: Lead, lang: Lang): { subject: string; body: string } {
  const name    = lead.name;
  const city    = lead.city || '';
  const cat     = lead.category || '';
  const rating  = lead.rating ? `${lead.rating}/5` : '';
  const url     = lead.deliveryUrl || '[رابط الموقع]';
  const reviews = lead.reviewCount?.toLocaleString() || '';

  if (lang === 'ar') return {
    subject: `موقعكم الإلكتروني جاهز — ${name}`,
    body:
`السيد/السيدة ${name}،

أسعدنا العمل معكم، ويسرّنا إخباركم بأن موقعكم الإلكتروني قد اكتمل بنجاح ✅

🔗 رابط الموقع:
${url}

لقد حرصنا على تضمين كل ما يعكس هويتكم التجارية:
${cat ? `• نشاطكم في مجال: ${cat}` : ''}
${city ? `• الموقع الجغرافي: ${city}` : ''}
${rating ? `• تقييماتكم المميزة: ⭐ ${rating}${reviews ? ` (${reviews} تقييم)` : ''}` : ''}
• بيانات التواصل ومعلومات النشاط

نتطلع لسماع ملاحظاتكم وأي تعديلات تودّون إجراءها.

مع أطيب التحيات وأمنياتنا لكم بدوام التوفيق 🚀`,
  };

  if (lang === 'nl') return {
    subject: `Uw website is klaar — ${name}`,
    body:
`Geachte ${name},

Het was een genoegen om met u samen te werken. Wij zijn verheugd u te informeren dat uw website succesvol is voltooid ✅

🔗 Website link:
${url}

Wij hebben zorgvuldig aandacht besteed aan alles wat uw bedrijfsidentiteit weerspiegelt:
${cat ? `• Uw branche: ${cat}` : ''}
${city ? `• Locatie: ${city}` : ''}
${rating ? `• Uw uitstekende beoordelingen: ⭐ ${rating}${reviews ? ` (${reviews} beoordelingen)` : ''}` : ''}
• Contactgegevens en bedrijfsinformatie

Wij kijken uit naar uw feedback en eventuele aanpassingen die u wenst.

Met vriendelijke groet en wensen voor veel succes 🚀`,
  };

  /* English default */
  return {
    subject: `Your website is ready — ${name}`,
    body:
`Dear ${name},

It was a pleasure working with you. We are delighted to inform you that your website has been successfully completed ✅

🔗 Website link:
${url}

We have carefully crafted everything to reflect your brand identity:
${cat ? `• Your industry: ${cat}` : ''}
${city ? `• Location: ${city}` : ''}
${rating ? `• Your excellent ratings: ⭐ ${rating}${reviews ? ` (${reviews} reviews)` : ''}` : ''}
• Contact details and business information

We look forward to your feedback and any revisions you may wish to make.

Best regards and wishing you continued success 🚀`,
  };
}

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { id: 'en', label: 'English',    flag: '🇬🇧' },
  { id: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export function EmailModal({ lead, onClose }: Props) {
  const [lang, setLang]       = useState<Lang>('ar');
  const [copied, setCopied]   = useState<'subject' | 'body' | 'all' | null>(null);

  const email = buildEmail(lead, lang);
  const hasEmail = !!lead.email;

  async function copy(type: 'subject' | 'body' | 'all') {
    const text =
      type === 'subject' ? email.subject :
      type === 'body'    ? email.body    :
      `${email.subject}\n\n${email.body}`;
    try { await navigator.clipboard.writeText(text); }
    catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function openMailto() {
    const mailto = `mailto:${lead.email || ''}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(mailto, '_blank');
  }

  const isRtl = lang === 'ar';

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={onClose}
      >
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', direction: 'rtl' }}
        >

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ padding: 8, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                <Sparkles size={14} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>بريد إلكتروني مُولَّد بالذكاء الاصطناعي</h3>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: '#94a3b8' }}>{lead.name}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 9, padding: 7, cursor: 'pointer', display: 'flex' }}>
              <X size={15} color="#64748b" />
            </button>
          </div>

          {/* ── اختيار اللغة ── */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {LANGS.map(l => (
                <motion.button key={l.id} whileTap={{ scale: 0.95 }} onClick={() => setLang(l.id)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 6px', borderRadius: 10, fontSize: 12, fontWeight: lang === l.id ? 700 : 500, border: `1.5px solid ${lang === l.id ? '#6366f1' : '#e2e8f0'}`, cursor: 'pointer', background: lang === l.id ? '#eef2ff' : 'white', color: lang === l.id ? '#4338ca' : '#64748b', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 16 }}>{l.flag}</span> {l.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── محتوى البريد ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* الموضوع */}
            <div style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>📌 الموضوع / Subject</span>
                <button onClick={() => copy('subject')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', color: copied === 'subject' ? '#16a34a' : '#64748b' }}>
                  {copied === 'subject' ? <><Check size={10} /> نُسخ</> : <><Copy size={10} /> نسخ</>}
                </button>
              </div>
              <div dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                {email.subject}
              </div>
            </div>

            {/* نص البريد */}
            <div style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>✉️ نص البريد / Body</span>
                <button onClick={() => copy('body')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', color: copied === 'body' ? '#16a34a' : '#64748b' }}>
                  {copied === 'body' ? <><Check size={10} /> نُسخ</> : <><Copy size={10} /> نسخ</>}
                </button>
              </div>
              <pre dir={isRtl ? 'rtl' : 'ltr'} style={{ margin: 0, padding: '12px', fontSize: 12, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
                {email.body}
              </pre>
            </div>

            {/* تحذير: لا يوجد بريد */}
            {!hasEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <Globe2 size={13} color="#d97706" />
                <span style={{ fontSize: 11, color: '#92400e' }}>لا يوجد بريد إلكتروني مُسجَّل لهذا العميل — أضفه من الكارد أولاً</span>
              </div>
            )}
          </div>

          {/* ── أزرار الإجراءات ── */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* نسخ الكل */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => copy('all')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: copied === 'all' ? '#f0fdf4' : 'white', color: copied === 'all' ? '#16a34a' : '#475569', transition: 'all 0.2s' }}>
              {copied === 'all' ? <><Check size={14} /> نُسخ الكل!</> : <><Copy size={14} /> نسخ الكل</>}
            </motion.button>

            {/* فتح في تطبيق البريد */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={openMailto} disabled={!hasEmail}
              style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: hasEmail ? 'pointer' : 'not-allowed', background: hasEmail ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#e2e8f0', color: hasEmail ? 'white' : '#94a3b8', transition: 'all 0.2s' }}>
              {hasEmail ? <><Send size={14} /> فتح في البريد</> : <><Mail size={14} /> أضف البريد أولاً</>}
            </motion.button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
