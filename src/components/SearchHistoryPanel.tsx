import React, { useState } from 'react';
import { History, RefreshCw, Trash2, MapPin, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SavedSearch } from '../utils/db';

interface SearchHistoryPanelProps {
  history: SavedSearch[];
  onReload: (s: SavedSearch) => void;
  onDelete: (searchKey: string) => void;
  isLoading: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export function SearchHistoryPanel({ history, onReload, onDelete, isLoading }: SearchHistoryPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (history.length === 0) return null;

  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 10, background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
          <History size={16} color="#7c3aed" />
        </div>
        <div>
          <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, margin: 0 }}>بحوث محفوظة</h3>
          <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>
            {history.length} بحث — النتائج محفوظة، لا حاجة لإعادة الاستخراج
          </p>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {history.map((s) => (
            <motion.div
              key={s.searchKey}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0, overflow: 'hidden' }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                border: '1.5px solid #f1f5f9',
                background: '#fafafa',
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.query}
                  </span>
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <Users size={9} color="#2563eb" />
                    <span style={{ color: '#2563eb', fontSize: 10, fontWeight: 600 }}>{s.count}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#64748b', fontSize: 11 }}>
                    <MapPin size={9} color="#3b82f6" />
                    {s.cityAr}، {s.countryAr}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8', fontSize: 10 }}>
                    <Clock size={9} />
                    {timeAgo(s.timestamp)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {confirmDelete === s.searchKey ? (
                  <>
                    <button
                      onClick={() => { onDelete(s.searchKey); setConfirmDelete(null); }}
                      style={{ fontSize: 10, padding: '4px 9px', borderRadius: 8, background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#e11d48', cursor: 'pointer', fontWeight: 600 }}
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ fontSize: 10, padding: '4px 9px', borderRadius: 8, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onReload(s)}
                      disabled={isLoading}
                      title="تحميل من الذاكرة"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, padding: '5px 11px', borderRadius: 9,
                        background: '#eff6ff', border: '1.5px solid #bfdbfe',
                        color: '#2563eb', cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 600, opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      <RefreshCw size={11} /> تحميل
                    </motion.button>
                    <button
                      onClick={() => setConfirmDelete(s.searchKey)}
                      title="حذف هذا البحث"
                      style={{ padding: '5px 7px', borderRadius: 9, background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#f43f5e', cursor: 'pointer' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
