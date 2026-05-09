
import { TrendingUp, DollarSign, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Lead } from '../types';
import { LEAD_STATUSES, TEAM_MEMBERS } from '../types';

interface AnalyticsPanelProps { leads: Lead[]; }

export function AnalyticsPanel({ leads }: AnalyticsPanelProps) {
  const total = leads.length;
  const paid = leads.filter(l => l.status === 'paid' || l.status === 'done').length;
  const inProgress = leads.filter(l => !['new', 'done'].includes(l.status)).length;
  const doneCount = leads.filter(l => l.status === 'done').length;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const statusDist = LEAD_STATUSES.map(s => ({ ...s, count: leads.filter(l => l.status === s.value).length, pct: total > 0 ? Math.round((leads.filter(l => l.status === s.value).length / total) * 100) : 0 }));
  const teamPerf = TEAM_MEMBERS.map(member => { const assigned = leads.filter(l => l.assignee === member); const done = assigned.filter(l => l.status === 'done').length; return { name: member, total: assigned.length, done, rate: assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0 }; }).filter(m => m.total > 0);

  const kpis = [
    { title: 'إجمالي العملاء', value: total, sub: 'في قاعدة البيانات', icon: <Users size={18} color="#2563eb" />, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    { title: 'قيد التنفيذ', value: inProgress, sub: 'مشروع نشط', icon: <TrendingUp size={18} color="#ea580c" />, bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
    { title: 'تم الدفع', value: paid, sub: 'عملية ناجحة', icon: <DollarSign size={18} color="#16a34a" />, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
    { title: 'نسبة الإنجاز', value: `${completionRate}%`, sub: 'من الإجمالي', icon: <Award size={18} color="#7c3aed" />, bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 4px' }}>{k.title}</p>
                <p style={{ color: k.color, fontSize: 30, fontWeight: 800, margin: '0 0 2px' }}>{k.value}</p>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>{k.sub}</p>
              </div>
              <div style={{ padding: 10, borderRadius: 12, background: 'white', border: `1.5px solid ${k.border}` }}>{k.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Status distribution */}
        <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 16px' }}>توزيع الحالات</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusDist.filter(s => s.count > 0).length === 0
              ? <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 20 }}>لا توجد بيانات بعد</p>
              : statusDist.filter(s => s.count > 0).map(s => (
                <div key={s.value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: '#0f172a', fontSize: 12, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{s.count} ({s.pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 4, background: s.color }} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Team performance */}
        <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 16px' }}>أداء الفريق</h3>
          {teamPerf.length === 0
            ? <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 20 }}>لم يُسنَد أي مشروع بعد</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teamPerf.sort((a, b) => b.rate - a.rate).map(m => (
                <div key={m.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{m.done}/{m.total}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.rate >= 50 ? '#16a34a' : '#ea580c' }}>{m.rate}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.rate}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 4, background: m.rate >= 50 ? '#22c55e' : '#fb923c' }} />
                  </div>
                </div>
              ))}
            </div>}
        </div>
      </div>

      {/* City distribution */}
      {total > 0 && (
        <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>توزيع حسب المدينة</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(leads.reduce<Record<string, number>>((acc, l) => { const k = l.city || 'غير محدد'; acc[k] = (acc[k] || 0) + 1; return acc; }, {})).sort(([, a], [, b]) => b - a).map(([city, count]) => (
              <div key={city} style={{ padding: '5px 14px', borderRadius: 20, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#0f172a', fontSize: 12, fontWeight: 500 }}>{city}</span>
                <span style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
