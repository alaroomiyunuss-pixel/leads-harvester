import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Trash2, Download, CheckSquare, Square,
  RefreshCw, MapPin, Clock, Users, Search, Layers, AlertCircle,
} from 'lucide-react';
import type { Lead } from '../types';
import type { SavedSearch } from '../utils/storage-engine';
import { getLeadsBySearchKey } from '../utils/storage-engine';

interface Props {
  history: SavedSearch[];
  allLeads: Lead[];
  onLoadLeads: (leads: Lead[], label: string) => void;
  onDelete: (searchKey: string) => Promise<void>;
  isLoading: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `منذ ${d} يوم`;
  if (h > 0) return `منذ ${h} ساعة`;
  if (m > 0) return `منذ ${m} دقيقة`;
  return 'الآن';
}

export function OperationsPanel({ history, allLeads, onLoadLeads, onDelete, isLoading }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  /* ── إحصائيات ── */
  const totalLeads = allLeads.length;
  const uniqueCities = new Set(history.map(h => h.cityAr)).size;
  const uniqueCountries = new Set(history.map(h => h.countryAr)).size;

  /* ── تحديد / إلغاء ── */
  function toggleSelect(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function selectAll() { setSelected(new Set(history.map(h => h.searchKey))); }
  function clearSelection() { setSelected(new Set()); }

  /* ── تحميل بحث واحد ── */
  async function handleLoadOne(s: SavedSearch) {
    setLoadingKey(s.searchKey);
    try {
      const leads = await getLeadsBySearchKey(s.searchKey);
      onLoadLeads(leads, `${s.query} — ${s.cityAr}`);
    } finally { setLoadingKey(null); }
  }

  /* ── تحميل المحدد دفعة واحدة ── */
  async function handleLoadSelected() {
    if (!selected.size) return;
    setLoadingKey('bulk');
    try {
      const allSelected = history.filter(h => selected.has(h.searchKey));
      const results = await Promise.all(allSelected.map(h => getLeadsBySearchKey(h.searchKey)));
      const flat = results.flat();
      /* dedup بالـ id */
      const unique = Array.from(new Map(flat.map(l => [l.id, l])).values());
      const dupCount = flat.length - unique.length;
      onLoadLeads(unique, `${selected.size} عملية بحث (${dupCount > 0 ? `حُذف ${dupCount} مكرر` : 'بدون تكرار'})`);
      clearSelection();
    } finally { setLoadingKey(null); }
  }

  /* ── تحميل الكل ── */
  async function handleLoadAll() {
    setLoadingKey('all');
    try {
      onLoadLeads(allLeads, 'جميع العمليات');
    } finally { setLoadingKey(null); }
  }

  /* ── حذف ── */
  async function handleDelete(key: string) {
    setDeleting(key);
    try { await onDelete(key); } finally { setDeleting(null); setConfirmKey(null); }
  }

  if (!history.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', direction: 'rtl' }}>
        <div style={{ display: 'inline-flex', padding: 20, borderRadius: 20, background: '#f1f5f9', marginBottom: 16 }}>
          <FolderOpen size={32} color="#94a3b8" />
        </div>
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>لا توجد عمليات بحث بعد</p>
        <p style={{ color: '#94a3b8', fontSize: 12 }}>ابدأ بالبحث وستظهر هنا تلقائياً</p>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ══ إحصائيات سريعة ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'عملية بحث', value: history.length, icon: <Search size={14} color="#6366f1" />, bg: '#eef2ff', color: '#4338ca' },
          { label: 'عميل فريد', value: totalLeads, icon: <Users size={14} color="#0284c7" />, bg: '#f0f9ff', color: '#0369a1' },
          { label: 'مدينة', value: uniqueCities + (uniqueCountries > 1 ? ` / ${uniqueCountries} دول` : ''), icon: <MapPin size={14} color="#16a34a" />, bg: '#f0fdf4', color: '#15803d' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 10px 8px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══ شريط الإجراءات ══ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* تحميل الكل */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLoadAll} disabled={isLoading || loadingKey === 'all'}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', minWidth: 110 }}>
          {loadingKey === 'all' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Layers size={13} />}
          عرض الكل ({totalLeads})
        </motion.button>

        {/* تحميل المحدد */}
        {selected.size > 0 && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.97 }}
            onClick={handleLoadSelected} disabled={loadingKey === 'bulk'}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1.5px solid #bfdbfe', cursor: 'pointer', background: '#eff6ff', color: '#1d4ed8', minWidth: 110 }}>
            {loadingKey === 'bulk' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
            عرض المحدد ({selected.size})
          </motion.button>
        )}

        {/* تحديد الكل / إلغاء */}
        <button onClick={selected.size === history.length ? clearSelection : selectAll}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: 'white', color: '#475569', whiteSpace: 'nowrap' }}>
          {selected.size === history.length ? <CheckSquare size={13} color="#2563eb" /> : <Square size={13} />}
          {selected.size === history.length ? 'إلغاء' : 'تحديد الكل'}
        </button>
      </div>

      {/* ══ قائمة عمليات البحث ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {history.map(s => {
            const isSelected = selected.has(s.searchKey);
            const isDeleting = deleting === s.searchKey;
            const isLoadingThis = loadingKey === s.searchKey;
            const isConfirming = confirmKey === s.searchKey;

            return (
              <motion.div key={s.searchKey}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                style={{ borderRadius: 14, border: `1.5px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}`, background: isSelected ? '#f0f6ff' : 'white', padding: '12px 14px', transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(s.searchKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0, marginTop: 1 }}>
                    {isSelected ? <CheckSquare size={17} color="#2563eb" /> : <Square size={17} color="#cbd5e1" />}
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.query}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', background: '#dbeafe', padding: '2px 7px', borderRadius: 20 }}>
                        {s.count} عميل
                      </span>
                      <span style={{ fontSize: 10, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>
                        ✓ محفوظ
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#64748b' }}>
                        <MapPin size={10} /> {s.cityAr} — {s.countryAr}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#94a3b8' }}>
                        <Clock size={10} /> {timeAgo(s.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {/* زر عرض */}
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleLoadOne(s)} disabled={isLoadingThis || isLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1.5px solid #bfdbfe', cursor: 'pointer', background: '#eff6ff', color: '#2563eb' }}>
                      {isLoadingThis ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
                      عرض
                    </motion.button>

                    {/* زر حذف */}
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleDelete(s.searchKey)} disabled={isDeleting}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626' }}>
                          {isDeleting ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : '✕ حذف'}
                        </button>
                        <button onClick={() => setConfirmKey(null)} style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: 'white', color: '#64748b' }}>
                          لا
                        </button>
                      </div>
                    ) : (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmKey(s.searchKey)}
                        style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 8, border: '1.5px solid #fecdd3', cursor: 'pointer', background: '#fff1f2', color: '#e11d48' }}>
                        <Trash2 size={12} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* confirm banner */}
                {isConfirming && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <AlertCircle size={12} color="#e11d48" />
                    <span style={{ fontSize: 11, color: '#be123c' }}>سيُحذف هذا البحث و {s.count} عميل مرتبط به نهائياً</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
