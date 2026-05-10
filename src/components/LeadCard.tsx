import { useState } from 'react';
import { Phone, MapPin, Star, Globe, Send, CheckCircle, Tag, MessageCircle, Mail, Map, ChevronDown, Brain, Edit3, User, Link2, Sparkles, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lead, LeadStatus } from '../types';
import { LEAD_STATUSES, TEAM_MEMBERS } from '../types';
import { EmailModal } from './EmailModal';

interface LeadCardProps {
  lead: Lead;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onSendTelegram: (lead: Lead) => Promise<void>;
  onOpenReviews: (lead: Lead) => void;
}

/* ── WhatsApp: cold outreach ── */
function buildWhatsAppOutreach(lead: Lead): string {
  const msg = `مرحباً،\n\nنود تقديم خدماتنا لـ *${lead.name}* في ${lead.city || ''}.\n\n${lead.website ? `يمكنكم الاطلاع على أعمالنا: ${lead.website}\n\n` : ''}نتطلع للتعاون معكم 🤝`;
  return `https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
}

/* ── WhatsApp: delivery message ── */
function buildWhatsAppDelivery(lead: Lead): string {
  const url = lead.deliveryUrl || '';
  const msg =
`مرحباً ${lead.name} 👋

يسعدنا إخباركم بأن موقعكم الإلكتروني قد اكتمل بنجاح ✅

🔗 رابط الموقع:
${url}

يمكنكم الاطلاع عليه وإعلامنا بأي ملاحظات أو تعديلات.

شكراً لثقتكم بنا 🙏
نتمنى لكم دوام التوفيق والنجاح 🚀`;
  return `https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
}

/* ── AI Prompt template ── */
function buildAIPrompt(lead: Lead): string {
  const reviewsText = lead.reviews && lead.reviews.length > 0
    ? lead.reviews.slice(0, 5).map((r, i) => `${i + 1}. "${r}"`).join('\n')
    : 'لا توجد تقييمات';

  return `أنت مطوّر ومصمم ويب محترف. مهمتك بناء موقع ويب كامل لعميل جديد بناءً على بياناته أدناه.

═══════════════════════════════════
📋 بيانات العميل
═══════════════════════════════════
الاسم التجاري : ${lead.name}
الفئة / النشاط: ${lead.category || 'غير محدد'}
المدينة       : ${lead.city || 'غير محدد'}
الدولة        : ${lead.country || 'غير محدد'}
رقم الهاتف   : ${lead.phone || 'غير متوفر'}
البريد الإلكتروني: ${lead.email || 'غير متوفر'}
الموقع الحالي : ${lead.website || 'لا يوجد'}
العنوان       : ${lead.address || 'غير متوفر'}
التقييم       : ${lead.rating ? `${lead.rating} / 5 (${lead.reviewCount?.toLocaleString('ar')} تقييم)` : 'غير متوفر'}
رابط الخرائط  : ${lead.googleMapsUrl || 'غير متوفر'}

═══════════════════════════════════
💬 آراء العملاء الفعليين (للمحتوى)
═══════════════════════════════════
${reviewsText}

═══════════════════════════════════
📌 التعليمات
═══════════════════════════════════
- احتفظ بنفس التصميم والقالب الأساسي تماماً
- استبدل جميع البيانات بمعلومات العميل أعلاه
- الاسم، الشعار، الهوية البصرية، العنوان، رقم الهاتف، البريد كلها من بيانات العميل
- استخدم آراء العملاء الحقيقية في قسم التقييمات
- اللغة العربية أساساً مع دعم RTL
- الموقع يجب أن يكون سريعاً ومتجاوباً مع الجوال
- أضف قسم "تواصل معنا" مع خريطة Google إن توفر الرابط
- لا تستخدم أي بيانات وهمية أو placeholder — كل شيء حقيقي من البيانات أعلاه

ابدأ الآن بكتابة كود HTML/CSS/JS الكامل.`;
}

/* ── Prompt Modal ── */
function PromptModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const prompt = buildAIPrompt(lead);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = prompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', direction: 'rtl' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 7, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                <Sparkles size={15} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Prompt للذكاء الاصطناعي</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{lead.name}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}>
              <X size={16} color="#64748b" />
            </button>
          </div>

          {/* Prompt text */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: '#334155', background: '#f8fafc', borderRadius: 12, padding: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1.5px solid #e2e8f0', fontFamily: 'monospace' }}>
              {prompt}
            </pre>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCopy}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: copied ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', transition: 'background 0.3s' }}
            >
              {copied ? <><Check size={15} /> نُسخ بنجاح!</> : <><Copy size={15} /> نسخ الـ Prompt</>}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function LeadCard({ lead, onUpdate, onSendTelegram, onOpenReviews }: LeadCardProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(lead.notes || '');
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(lead.email || '');
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [deliveryVal, setDeliveryVal] = useState(lead.deliveryUrl || '');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const currentStatus = LEAD_STATUSES.find(s => s.value === lead.status) || LEAD_STATUSES[0];

  async function handleSend() {
    setSending(true); setSendError('');
    try { await onSendTelegram(lead); setSent(true); setTimeout(() => setSent(false), 3000); }
    catch (e) { setSendError(e instanceof Error ? e.message : 'خطأ'); }
    finally { setSending(false); }
  }

  return (
    <>
      <motion.div whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }} style={{ borderRadius: 14, border: '1.5px solid #e2e8f0', background: 'white', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {/* الرقم التسلسلي */}
          {lead.serialNumber && (
            <div style={{ flexShrink: 0, minWidth: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                #{lead.serialNumber}
              </span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, margin: 0 }}>{lead.name}</h3>
            {lead.category && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#94a3b8', fontSize: 11, marginTop: 2 }}><Tag size={9} />{lead.category}</span>}
          </div>
          {/* Status dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowStatusMenu(!showStatusMenu)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1.5px solid ${currentStatus.color}50`, background: currentStatus.bg, color: currentStatus.color, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {currentStatus.label} <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {showStatusMenu && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 4, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  {LEAD_STATUSES.map(s => (
                    <button key={s.value} onClick={() => { onUpdate(lead.id, { status: s.value as LeadStatus }); setShowStatusMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'right', padding: '7px 12px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', background: lead.status === s.value ? s.bg : 'transparent', color: lead.status === s.value ? s.color : '#475569', fontWeight: lead.status === s.value ? 600 : 400 }}>
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Assignee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
          <select value={lead.assignee || ''} onChange={e => onUpdate(lead.id, { assignee: e.target.value || undefined })} style={{ flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: lead.assignee ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer' }}>
            <option value="">— بدون مسؤول —</option>
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={11} color="#16a34a" /><span dir="ltr" style={{ color: '#166534', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{lead.phone}</span></div>}
          {lead.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><MapPin size={11} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4 }}>{lead.address}</span></div>}
          {lead.rating && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={11} color="#f59e0b" /><span style={{ color: '#92400e', fontSize: 12, fontWeight: 700 }}>{lead.rating}</span>{lead.reviewCount && <span style={{ color: '#94a3b8', fontSize: 11 }}>({lead.reviewCount.toLocaleString('ar')})</span>}</div>}

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={11} color="#8b5cf6" style={{ flexShrink: 0 }} />
            {editingEmail ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input value={emailVal} onChange={e => setEmailVal(e.target.value)} dir="ltr" placeholder="email@example.com" style={{ flex: 1, background: 'white', border: '1.5px solid #c4b5fd', borderRadius: 6, padding: '3px 6px', fontSize: 11, color: '#0f172a', outline: 'none' }} />
                <button onClick={() => { onUpdate(lead.id, { email: emailVal }); setEditingEmail(false); }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f5f3ff', border: '1.5px solid #c4b5fd', color: '#7c3aed', cursor: 'pointer' }}>حفظ</button>
              </div>
            ) : (
              <button onClick={() => setEditingEmail(true)} style={{ fontSize: 11, color: lead.email ? '#7c3aed' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: lead.email ? 'none' : 'underline dotted' }}>
                {lead.email || '+ أضف البريد'}
              </button>
            )}
          </div>

          {/* Delivery URL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={11} color="#0ea5e9" style={{ flexShrink: 0 }} />
            {editingDelivery ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input value={deliveryVal} onChange={e => setDeliveryVal(e.target.value)} dir="ltr" placeholder="https://client-website.com" style={{ flex: 1, background: 'white', border: '1.5px solid #7dd3fc', borderRadius: 6, padding: '3px 6px', fontSize: 11, color: '#0f172a', outline: 'none' }} />
                <button onClick={() => { onUpdate(lead.id, { deliveryUrl: deliveryVal }); setEditingDelivery(false); }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0f9ff', border: '1.5px solid #7dd3fc', color: '#0284c7', cursor: 'pointer' }}>حفظ</button>
              </div>
            ) : (
              <button onClick={() => setEditingDelivery(true)} style={{ fontSize: 11, color: lead.deliveryUrl ? '#0284c7' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: lead.deliveryUrl ? 'none' : 'underline dotted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {lead.deliveryUrl || '+ رابط الموقع المُسلَّم'}
              </button>
            )}
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4f46e5', textDecoration: 'none', padding: '3px 8px', borderRadius: 8, background: '#eef2ff', border: '1.5px solid #c7d2fe' }}><Globe size={10} /> الموقع</a>}
          {lead.googleMapsUrl && <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#059669', textDecoration: 'none', padding: '3px 8px', borderRadius: 8, background: '#ecfdf5', border: '1.5px solid #a7f3d0' }}><Map size={10} /> خرائط</a>}
          {lead.reviews && lead.reviews.length > 0 && <button onClick={() => onOpenReviews(lead)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ea580c', padding: '3px 8px', borderRadius: 8, background: '#fff7ed', border: '1.5px solid #fed7aa', cursor: 'pointer' }}><Brain size={10} /> AI ({lead.reviews.length})</button>}
          {/* AI Prompt button */}
          <button onClick={() => setShowPrompt(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ea580c', padding: '3px 8px', borderRadius: 8, background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1.5px solid #fed7aa', cursor: 'pointer', fontWeight: 600 }}>
            <Sparkles size={10} /> Prompt
          </button>
          {/* Email button */}
          <button onClick={() => setShowEmail(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: lead.email ? '#4f46e5' : '#94a3b8', padding: '3px 8px', borderRadius: 8, background: lead.email ? '#eef2ff' : '#f8fafc', border: `1.5px solid ${lead.email ? '#c7d2fe' : '#e2e8f0'}`, cursor: 'pointer', fontWeight: 600 }}>
            <Mail size={10} /> بريد
          </button>
        </div>

        {/* Notes */}
        <div>
          {editingNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} rows={2} style={{ width: '100%', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', fontSize: 12, color: '#0f172a', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { onUpdate(lead.id, { notes: noteVal }); setEditingNote(false); }} style={{ flex: 1, fontSize: 11, padding: '4px', borderRadius: 6, background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#2563eb', cursor: 'pointer' }}>حفظ</button>
                <button onClick={() => setEditingNote(false)} style={{ flex: 1, fontSize: 11, padding: '4px', borderRadius: 6, background: 'white', border: '1.5px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditingNote(true)} style={{ width: '100%', textAlign: 'right', fontSize: 11, color: lead.notes ? '#475569' : '#94a3b8', background: lead.notes ? '#f8fafc' : 'transparent', border: `1.5px dashed ${lead.notes ? '#e2e8f0' : '#f1f5f9'}`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
              {lead.notes ? <><Edit3 size={9} style={{ display: 'inline', marginLeft: 4 }} />{lead.notes}</> : '+ أضف ملاحظة'}
            </button>
          )}
        </div>

        {sendError && <p style={{ color: '#dc2626', fontSize: 11, margin: 0 }}>{sendError}</p>}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {/* WhatsApp button — with dropdown if deliveryUrl exists */}
          {lead.phone ? (
            lead.deliveryUrl ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWhatsAppMenu(!showWhatsAppMenu)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: '1.5px solid #bbf7d0', cursor: 'pointer', background: '#f0fdf4', color: '#15803d' }}
                >
                  <MessageCircle size={13} /> واتساب <ChevronDown size={10} />
                </button>
                <AnimatePresence>
                  {showWhatsAppMenu && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'absolute', bottom: '110%', right: 0, zIndex: 50, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 4, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      <a href={buildWhatsAppOutreach(lead)} target="_blank" rel="noopener noreferrer" onClick={() => setShowWhatsAppMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#15803d', textDecoration: 'none', background: 'transparent' }}>
                        <MessageCircle size={12} /> تواصل أولي
                      </a>
                      <a href={buildWhatsAppDelivery(lead)} target="_blank" rel="noopener noreferrer" onClick={() => setShowWhatsAppMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#0284c7', textDecoration: 'none', background: 'transparent' }}>
                        <Link2 size={12} /> تسليم الموقع 🎉
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a href={buildWhatsAppOutreach(lead)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d' }}>
                <MessageCircle size={13} /> واتساب
              </a>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, fontSize: 12, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#94a3b8' }}>
              <MessageCircle size={13} /> لا يوجد رقم
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', background: sent ? '#f0fdf4' : '#eff6ff', color: sent ? '#15803d' : '#2563eb', borderWidth: 1.5, borderStyle: 'solid', borderColor: sent ? '#bbf7d0' : '#bfdbfe' }}>
            {sending ? <><div style={{ width: 12, height: 12, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> إرسال...</>
              : sent ? <><CheckCircle size={13} /> أُرسل!</>
              : <><Send size={13} /> تليجرام</>}
          </motion.button>
        </div>
      </motion.div>

      {/* AI Prompt Modal */}
      {showPrompt && <PromptModal lead={lead} onClose={() => setShowPrompt(false)} />}

      {/* Email Modal */}
      {showEmail && <EmailModal lead={lead} onClose={() => setShowEmail(false)} />}
    </>
  );
}
