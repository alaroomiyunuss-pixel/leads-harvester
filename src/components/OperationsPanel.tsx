import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Globe2, ChevronDown, Trash2, RefreshCw, AlertCircle, FolderOpen } from 'lucide-react';
import type { Lead } from '../types';
import type { SavedSearch } from '../utils/storage-engine';
import { LeadCard } from './LeadCard';

interface Props {
  leads: Lead[];
  history: SavedSearch[];
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onSendTelegram: (lead: Lead) => Promise<void>;
  onOpenReviews: (lead: Lead) => void;
  onDelete: (searchKey: string) => Promise<void>;
  isLoading: boolean;
}

/* ── تعريف فلاتر الحالة ── */
type StatusFilter =
  | 'all'          // الكل
  | 'untouched'    // لم يُراسَل (جديد فقط)
  | 'in_progress'  // قيد العمل (تصميم → تعديلات)
  | 'delivered'    // مُسلَّم (مرسل للعميل+)
  | 'done';        // مكتمل (دفع / انتهاء)

const STATUS_FILTERS: { id: StatusFilter; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { id: 'all',         label: 'الكل',          emoji: '📋', color: '#475569', bg: '#f8fafc',  border: '#e2e8f0' },
  { id: 'untouched',   label: 'لم يُراسَل',    emoji: '🆕', color: '#1d4ed8', bg: '#eff6ff',  border: '#bfdbfe' },
  { id: 'in_progress', label: 'قيد التصميم',   emoji: '✏️', color: '#6d28d9', bg: '#f5f3ff',  border: '#c4b5fd' },
  { id: 'delivered',   label: 'مُرسَل للعميل', emoji: '📤', color: '#0e7490', bg: '#ecfeff',  border: '#a5f3fc' },
  { id: 'done',        label: 'مكتمل',         emoji: '✅', color: '#15803d', bg: '#f0fdf4',  border: '#86efac' },
];

function matchesStatus(lead: Lead, filter: StatusFilter): boolean {
  if (filter === 'all')         return true;
  if (filter === 'untouched')   return lead.status === 'new';
  if (filter === 'in_progress') return ['design', 'review', 'client_edits'].includes(lead.status);
  if (filter === 'delivered')   return lead.status === 'sent_client';
  if (filter === 'done')        return ['paid', 'done'].includes(lead.status);
  return true;
}

/* ── مساعد: احصاء لكل فلتر ── */
function countByFilter(leads: Lead[], filter: StatusFilter): number {
  return leads.filter(l => matchesStatus(l, filter)).length;
}

export function OperationsPanel({ leads, history, onUpdate, onSendTelegram, onOpenReviews, onDelete, isLoading }: Props) {

  /* ── فلاتر ── */
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity,    setSelectedCity]    = useState('all');
  const [statusFilter,    setStatusFilter]    = useState<StatusFilter>('all');
  const [deleting, setDeleting]               = useState<string | null>(null);
  const [confirmKey, setConfirmKey]           = useState<string | null>(null);
  const [showHistory, setShowHistory]         = useState(false);

  /* ── بناء قوائم الدول والمدن ── */
  const countries = useMemo(() =>
    ['all', ...Array.from(new Set(leads.map(l => l.country).filter(Boolean) as string[])).sort()],
    [leads]);

  const cities = useMemo(() => {
    const base = leads.filter(l => selectedCountry === 'all' || l.country === selectedCountry);
    return ['all', ...Array.from(new Set(base.map(l => l.city).filter(Boolean) as string[])).sort()];
  }, [leads, selectedCountry]);

  /* ── تطبيق الفلاتر ── */
  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (selectedCountry !== 'all' && l.country !== selectedCountry) return false;
      if (selectedCity    !== 'all' && l.city    !== selectedCity)    return false;
      return matchesStatus(l, statusFilter);
    });
  }, [leads, selectedCountry, selectedCity, statusFilter]);

  /* ── تجميع النتائج حسب المدينة ── */
  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const lead of filtered) {
      const key = [lead.country, lead.city].filter(Boolean).join(' — ') || 'غير محدد';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lead);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'ar'));
  }, [filtered]);

  async function handleDelete(key: string) {
    setDeleting(key);
    try { await onDelete(key); } finally { setDeleting(null); setConfirmKey(null); }
  }

  /* ── حالة فارغة ── */
  if (!leads.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', direction: 'rtl' }}>
        <div style={{ display: 'inline-flex', padding: 20, borderRadius: 20, background: '#f1f5f9', marginBottom: 16 }}>
          <FolderOpen size={32} color="#94a3b8" />
        </div>
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>لا توجد بيانات بعد</p>
        <p style={{ color: '#94a3b8', fontSize: 12 }}>ابدأ بالبحث وستظهر جميع النتائج هنا تلقائياً</p>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ══ إحصائيات سريعة ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'إجمالي المنشآت', value: leads.length,   icon: <Users size={13} color="#2563eb" />,  bg: '#eff6ff',  color: '#1d4ed8' },
          { label: 'مدينة',          value: cities.length - 1, icon: <MapPin size={13} color="#16a34a" />,  bg: '#f0fdf4',  color: '#15803d' },
          { label: 'دولة',           value: countries.length - 1, icon: <Globe2 size={13} color="#d97706" />, bg: '#fffbeb',  color: '#92400e' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, opacity: 0.75 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══ فلاتر الحالة (chips) ══ */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 10, scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map(f => {
          const count = countByFilter(
            leads.filter(l =>
              (selectedCountry === 'all' || l.country === selectedCountry) &&
              (selectedCity    === 'all' || l.city    === selectedCity)
            ), f.id);
          const active = statusFilter === f.id;
          return (
            <motion.button key={f.id} whileTap={{ scale: 0.95 }} onClick={() => setStatusFilter(f.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 500, border: `1.5px solid ${active ? f.border : '#e2e8f0'}`, cursor: 'pointer', background: active ? f.bg : 'white', color: active ? f.color : '#64748b', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 }}>
              <span>{f.emoji}</span> {f.label}
              <span style={{ background: active ? f.border : '#f1f5f9', color: active ? f.color : '#94a3b8', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ══ فلاتر الدولة والمدينة ══ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {/* الدولة */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Globe2 size={12} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <ChevronDown size={12} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedCity('all'); }}
            style={{ width: '100%', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 30px 8px 30px', fontSize: 12, color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option value="all">🌍 كل الدول</option>
            {countries.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* المدينة */}
        <div style={{ position: 'relative', flex: 1 }}>
          <MapPin size={12} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <ChevronDown size={12} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
            style={{ width: '100%', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 30px 8px 30px', fontSize: 12, color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option value="all">🏙️ كل المدن</option>
            {cities.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ══ عدد النتائج ══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
          {filtered.length === leads.length
            ? `عرض جميع المنشآت (${leads.length})`
            : `${filtered.length} من ${leads.length} منشأة`}
        </span>
        {(selectedCountry !== 'all' || selectedCity !== 'all' || statusFilter !== 'all') && (
          <button onClick={() => { setSelectedCountry('all'); setSelectedCity('all'); setStatusFilter('all'); }}
            style={{ fontSize: 11, color: '#ef4444', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '3px 10px', cursor: 'pointer' }}>
            ✕ مسح الفلاتر
          </button>
        )}
      </div>

      {/* ══ الكروت مجمّعة حسب الدولة / المدينة ══ */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 16, border: '1.5px dashed #e2e8f0' }}>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>لا توجد منشآت تطابق الفلتر المحدد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([groupName, groupLeads]) => (
            <div key={groupName}>
              {/* رأس المجموعة */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ height: 1, flex: 0.3, background: '#e2e8f0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <MapPin size={11} color="#64748b" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{groupName}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>({groupLeads.length})</span>
                </div>
                <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
              </div>

              {/* كروت المنشآت */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                <AnimatePresence>
                  {groupLeads.map(lead => (
                    <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <LeadCard
                        lead={lead}
                        onUpdate={onUpdate}
                        onSendTelegram={onSendTelegram}
                        onOpenReviews={onOpenReviews}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ سجل عمليات البحث (قابل للطي) ══ */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569' }}>
            <ChevronDown size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            سجل عمليات البحث ({history.length})
            <span style={{ marginRight: 'auto', fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
              {showHistory ? 'إخفاء' : 'عرض'}
            </span>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {history.map(s => {
                    const isConfirming = confirmKey === s.searchKey;
                    const isDeleting   = deleting === s.searchKey;
                    return (
                      <div key={s.searchKey} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'white', border: '1.5px solid #e2e8f0' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{s.query}</span>
                            <span style={{ fontSize: 10, background: '#dbeafe', color: '#1d4ed8', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{s.count}</span>
                            <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>✓ محفوظ</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.cityAr} — {s.countryAr}</span>
                        </div>
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleDelete(s.searchKey)} disabled={isDeleting}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626' }}>
                              {isDeleting ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : '✕ حذف'}
                            </button>
                            <button onClick={() => setConfirmKey(null)} style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: 'white', color: '#64748b' }}>لا</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmKey(s.searchKey)}
                            style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 8, border: '1.5px solid #fecdd3', cursor: 'pointer', background: '#fff1f2', color: '#e11d48' }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                        {isConfirming && (
                          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#fff1f2', border: '1px solid #fecdd3', marginTop: 4, width: '100%' }}>
                            <AlertCircle size={11} color="#e11d48" />
                            <span style={{ fontSize: 11, color: '#be123c' }}>سيُحذف هذا البحث وعملاؤه نهائياً</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} />
          {' '}جارٍ التحميل...
        </div>
      )}
    </div>
  );
}
