import React, { useState, useMemo } from 'react';
import { Users, Filter, Send, Trash2, Download, SortAsc } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Lead } from '../types';
import { LEAD_STATUSES, TEAM_MEMBERS } from '../types';
import { LeadCard } from './LeadCard';

interface LeadBoardProps {
  leads: Lead[];
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onSendTelegram: (lead: Lead) => Promise<void>;
  onSendBulk: (leads: Lead[]) => Promise<void>;
  onClear: () => void;
  onOpenReviews: (lead: Lead) => void;
}

type SortBy = 'newest' | 'rating' | 'name';

export function LeadBoard({ leads, onUpdate, onSendTelegram, onSendBulk, onClear, onOpenReviews }: LeadBoardProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [sendingBulk, setSendingBulk] = useState(false);

  const filtered = useMemo(() => {
    let list = leads;
    if (filterStatus !== 'all') list = list.filter(l => l.status === filterStatus);
    if (filterAssignee !== 'all') list = list.filter(l => l.assignee === filterAssignee);
    if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    else if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    return list;
  }, [leads, filterStatus, filterAssignee, sortBy]);

  function downloadCSV() {
    const headers = ['الاسم', 'الهاتف', 'البريد', 'العنوان', 'التقييم', 'النوع', 'الموقع', 'خرائط', 'الحالة', 'المسؤول', 'الملاحظات', 'الدولة', 'المدينة'];
    const rows = filtered.map(l => [l.name, l.phone || '', l.email || '', l.address || '', l.rating || '', l.category || '', l.website || '', l.googleMapsUrl || '', l.status, l.assignee || '', l.notes || '', l.country || '', l.city || '']);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function handleBulkSend() {
    setSendingBulk(true);
    try { await onSendBulk(filtered.filter(l => l.status === 'new')); }
    finally { setSendingBulk(false); }
  }

  const newCount = leads.filter(l => l.status === 'new').length;

  const btnStyle = (active?: boolean, danger?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
    border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
    background: danger ? '#fff1f2' : active ? '#eff6ff' : '#f8fafc',
    borderColor: danger ? '#fecdd3' : active ? '#bfdbfe' : '#e2e8f0',
    color: danger ? '#e11d48' : active ? '#2563eb' : '#64748b',
    opacity: 1,
  });

  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Users size={16} color="#16a34a" />
          </div>
          <div>
            <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, margin: 0 }}>قائمة العملاء المحتملين</h2>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>{leads.length} عميل في قاعدة البيانات</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={downloadCSV} disabled={!leads.length} title="تصدير CSV" style={{ ...btnStyle(), padding: '7px 10px', opacity: leads.length ? 1 : 0.4 }}><Download size={14} /></button>
          <button onClick={handleBulkSend} disabled={sendingBulk || newCount === 0} style={{ ...btnStyle(true), opacity: newCount > 0 ? 1 : 0.4 }}>
            {sendingBulk ? <div style={{ width: 12, height: 12, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
            إرسال الجدد ({newCount})
          </button>
          <button onClick={onClear} disabled={!leads.length} style={{ ...btnStyle(false, true), padding: '7px 10px', opacity: leads.length ? 1 : 0.4 }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
        <Filter size={12} color="#94a3b8" />
        {[{ value: 'all', label: `الكل (${leads.length})` }, ...LEAD_STATUSES.map(s => ({ value: s.value, label: `${s.label} (${leads.filter(l => l.status === s.value).length})` }))].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s', borderColor: filterStatus === f.value ? '#3b82f6' : '#e2e8f0', background: filterStatus === f.value ? '#eff6ff' : 'white', color: filterStatus === f.value ? '#2563eb' : '#64748b', fontWeight: filterStatus === f.value ? 600 : 400 }}>
            {f.label}
          </button>
        ))}
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ marginRight: 'auto', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#475569', outline: 'none', cursor: 'pointer' }}>
          <option value="all">كل الفريق</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SortAsc size={12} color="#94a3b8" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#475569', outline: 'none', cursor: 'pointer' }}>
            <option value="newest">الأحدث</option>
            <option value="rating">الأعلى تقييماً</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Users size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#94a3b8', fontSize: 13 }}>{leads.length === 0 ? 'قم بالبحث لاستخراج العملاء المحتملين' : 'لا توجد نتائج لهذه التصفية'}</p>
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map((lead, i) => (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.2 }}>
              <LeadCard lead={lead} onUpdate={onUpdate} onSendTelegram={onSendTelegram} onOpenReviews={onOpenReviews} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
