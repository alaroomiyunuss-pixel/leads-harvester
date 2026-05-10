import { useState, useEffect, type ElementType } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { LayoutDashboard, Search, Settings as SettingsIcon, Zap, FolderOpen, Database, Cloud } from 'lucide-react';
import type { Lead, AppSettings, SearchParams } from './types';
import { loadSettings } from './utils/storage';
import { searchPlaces } from './utils/googleMaps';
import { sendToTelegram, sendBulkToTelegram } from './utils/telegram';
import {
  makeSearchKey, storageEngine,
  saveSearchRecord, saveLeads,
  getAllLeadsMerged, updateLead, clearAll,
  getSearchHistoryMerged, deleteSearchRecord,
  getLeadsBySearchKeyMerged, getSearchRecord,
} from './utils/storage-engine';
import type { SavedSearch } from './utils/storage-engine';
import { SearchPanel }      from './components/SearchPanel';
import { LeadBoard }        from './components/LeadBoard';
import { SettingsPanel }    from './components/SettingsPanel';
import { ErrorBanner }      from './components/ErrorBanner';
import { ReviewsModal }     from './components/ReviewsModal';
import { OperationsPanel }  from './components/OperationsPanel';
import { AuthGate, isAuthenticated } from './components/AuthGate';

import './index.css';

type Tab = 'search' | 'dashboard' | 'operations' | 'settings';

const TAB_VARIANTS: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: 'search',     label: 'البحث',      icon: Search },
  { id: 'dashboard',  label: 'العملاء',    icon: LayoutDashboard },
  { id: 'operations', label: 'العمليات',   icon: FolderOpen },
  { id: 'settings',   label: 'الإعدادات', icon: SettingsIcon },
];

export default function App() {
  const [authed, setAuthed]         = useState(isAuthenticated);
  const [tab, setTab]               = useState<Tab>('search');
  const [settings]                  = useState<AppSettings>(() => loadSettings());
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [dbLoading, setDbLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [searchInfo, setSearchInfo] = useState('');   // رسالة dedup
  const [bulkProgress, setBulkProgress] = useState('');
  const [reviewLead, setReviewLead] = useState<Lead | null>(null);
  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>([]);

  /* ── تحميل البيانات عند بدء التطبيق ── */
  useEffect(() => {
    if (!authed) return;
    Promise.all([
      getAllLeadsMerged().catch(() => [] as Lead[]),
      getSearchHistoryMerged().catch(() => [] as SavedSearch[]),
    ]).then(([rows, hist]) => {
      setLeads(rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSearchHistory(hist);
    }).finally(() => setDbLoading(false));
  }, [authed]);

  /* ── دالة dedup مشتركة ── */
  function mergeLeads(incoming: Lead[], prev: Lead[]): Lead[] {
    const ids = new Set(prev.map(l => l.id));
    return [...incoming.filter(l => !ids.has(l.id)), ...prev];
  }

  /* ── بحث جديد — Cache ذكي بالنطاق ── */
  async function handleSearch(params: SearchParams) {
    const { countryCode, countryAr, cityAr, cityEn } = params;
    /* المفتاح: مجال + دولة + مدينة فقط (بدون نطاق) */
    const searchKey = makeSearchKey(params.query, countryCode, cityEn);
    setIsLoading(true); setError(''); setSearchInfo(''); setTab('dashboard');

    try {
      /* ── اجلب ما هو محفوظ لهذا المجال+المدينة ── */
      const [cached, record] = await Promise.all([
        getLeadsBySearchKeyMerged(searchKey),
        getSearchRecord(searchKey),
      ]);
      const prevMaxRadius = record?.maxRadius ?? 0;

      /* ── حالة 1: مخبَّأ بالكامل (نطاق جديد ≤ نطاق محفوظ) ── */
      if (cached.length > 0 && params.radius <= prevMaxRadius) {
        setLeads(prev => mergeLeads(cached, prev));
        setSearchInfo(
          `⚡ من الذاكرة — ${cached.length} نتيجة (نطاق ${prevMaxRadius / 1000} كم مُحمَّل سابقاً)`
        );
        setIsLoading(false);
        return;
      }

      /* ── حالة 2: نطاق أكبر أو بحث جديد كلياً ── */
      const isExpanding = cached.length > 0 && params.radius > prevMaxRadius;

      /* استدعاء Google API */
      const found = await searchPlaces(params, settings.googleApiKey);

      /* حذف ما تم استخراجه مسبقاً لنفس المجال+المدينة */
      const cachedPlaceIds = new Set(
        cached.map(l => l.placeId).filter(Boolean) as string[]
      );
      const brandNew = found.filter(
        l => !cachedPlaceIds.has(l.placeId ?? '') && !cachedPlaceIds.has(l.id)
      );
      const dupCount = found.length - brandNew.length;

      /* احفظ فقط الجديد */
      if (brandNew.length > 0) {
        await saveLeads(brandNew, searchKey, countryCode, cityAr);
      }

      /* حدّث سجل البحث (زِد العدد + حدّث أقصى نطاق) */
      const newTotal = cached.length + brandNew.length;
      await saveSearchRecord(searchKey, newTotal, {
        query: params.query, countryCode, countryAr, cityAr, cityEn,
        maxRadius: Math.max(prevMaxRadius, params.radius),
      });

      getSearchHistoryMerged().then(h => setSearchHistory(h)).catch(() => {});

      /* ادمج القديم + الجديد في الواجهة */
      setLeads(prev => mergeLeads([...cached, ...brandNew], prev));

      if (isExpanding) {
        setSearchInfo(
          `🔍 توسيع النطاق ${prevMaxRadius / 1000}→${params.radius / 1000} كم` +
          ` | ✅ ${brandNew.length} جديد` +
          (dupCount > 0 ? ` | ⏭ ${dupCount} موجود مسبقاً` : '')
        );
      } else if (brandNew.length === 0) {
        setSearchInfo(`⚡ كل النتائج موجودة مسبقاً — ${cached.length} نتيجة محفوظة`);
      } else {
        setSearchInfo(
          `✅ ${brandNew.length} عميل جديد` +
          (dupCount > 0 ? ` | ⏭ ${dupCount} موجود` : '')
        );
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء البحث');
    } finally { setIsLoading(false); }
  }

  /* ── حذف عملية بحث ── */
  async function handleDeleteSearch(searchKey: string) {
    await deleteSearchRecord(searchKey);
    setSearchHistory(prev => prev.filter(s => s.searchKey !== searchKey));
    getAllLeadsMerged().then(rows => {
      setLeads(rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }).catch(() => {});
  }

  async function handleUpdate(id: string, updates: Partial<Lead>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    await updateLead(id, updates);
  }

  async function handleSendTelegram(lead: Lead) {
    await sendToTelegram(lead, settings.telegramBotToken, settings.telegramChatId);
  }

  async function handleBulkSend(leadsToSend: Lead[]) {
    setBulkProgress(`جارٍ إرسال 0/${leadsToSend.length}...`);
    const { success, failed } = await sendBulkToTelegram(
      leadsToSend, settings.telegramBotToken, settings.telegramChatId,
      idx => setBulkProgress(`جارٍ إرسال ${idx}/${leadsToSend.length}...`)
    );
    setBulkProgress('');
    if (failed > 0) setError(`تم الإرسال: ${success} ✓ | فشل: ${failed} ✗`);
  }

  async function handleClear() {
    if (window.confirm('مسح جميع البيانات؟ لا يمكن التراجع.')) {
      await clearAll(); setLeads([]); setSearchHistory([]);
    }
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;

  const engine = storageEngine();

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#f1f5f9', color: '#0f172a', paddingBottom: 72 }}>

      {/* ══ Header ══ */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ padding: 7, borderRadius: 11, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 3px 10px rgba(37,99,235,0.3)' }}>
              <Zap size={17} color="white" />
            </div>
            <div>
              <h1 style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, margin: 0 }}>LeadHarvest AI</h1>
              <p style={{ color: '#94a3b8', fontSize: 9, margin: '1px 0 0' }}>منصة استخراج وإدارة الفرص</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {dbLoading && <span style={{ fontSize: 9, color: '#94a3b8' }}>⏳</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: engine === 'supabase' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${engine === 'supabase' ? '#bbf7d0' : '#bfdbfe'}` }}>
              {engine === 'supabase' ? <Cloud size={10} color="#16a34a" /> : <Database size={10} color="#2563eb" />}
              <span style={{ fontSize: 9, color: engine === 'supabase' ? '#15803d' : '#1d4ed8', fontWeight: 600 }}>
                {engine === 'supabase' ? 'Cloud' : 'Local'}
              </span>
            </div>
            <div style={{ padding: '3px 8px', borderRadius: 20, background: settings.googleApiKey ? '#f0fdf4' : '#fff1f2', border: `1px solid ${settings.googleApiKey ? '#bbf7d0' : '#fecdd3'}` }}>
              <span style={{ fontSize: 9, color: settings.googleApiKey ? '#15803d' : '#be123c', fontWeight: 600 }}>
                {settings.googleApiKey ? '✓ API' : '✗ API'}
              </span>
            </div>
            <div style={{ padding: '3px 8px', borderRadius: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: 9, color: '#1d4ed8', fontWeight: 700 }}>{leads.length} عميل</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '16px' }}>

        {bulkProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ width: 13, height: 13, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ color: '#1d4ed8', fontSize: 13 }}>{bulkProgress}</span>
          </div>
        )}

        {error && <div style={{ marginBottom: 12 }}><ErrorBanner message={error} onClose={() => setError('')} /></div>}

        {/* رسالة dedup */}
        {searchInfo && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '9px 14px', marginBottom: 12 }}>
            <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>{searchInfo}</span>
            <button onClick={() => setSearchInfo('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ color: '#1e40af', fontSize: 13, fontWeight: 600, margin: 0 }}>جارٍ الاستخراج — 10 بحوث متوازية...</p>
              <p style={{ color: '#3b82f6', fontSize: 11, margin: '2px 0 0' }}>تُحفظ تلقائياً — المكررات تُحذف تلقائياً</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">

            {tab === 'search' && (
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <SearchPanel
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  hasApiKey={!!settings.googleApiKey}
                  lastFromCache={false}
                />
              </div>
            )}

            {tab === 'dashboard' && (
              <LeadBoard
                leads={leads}
                onUpdate={handleUpdate}
                onSendTelegram={handleSendTelegram}
                onSendBulk={handleBulkSend}
                onClear={handleClear}
                onOpenReviews={setReviewLead}
              />
            )}

            {tab === 'operations' && (
              <OperationsPanel
                leads={leads}
                history={searchHistory}
                onUpdate={handleUpdate}
                onSendTelegram={handleSendTelegram}
                onOpenReviews={setReviewLead}
                onDelete={handleDeleteSearch}
                isLoading={isLoading}
              />
            )}

            {tab === 'settings' && (
              <div style={{ maxWidth: 660, margin: '0 auto' }}>
                <SettingsPanel />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ══ Bottom Navigation ══ */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'white', borderTop: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          const isSearch = t.id === 'search';
          /* شارة عدد العمليات */
          const badge = t.id === 'operations' && searchHistory.length > 0 ? searchHistory.length : null;
          return (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.92 }}
              style={{
                flex: isSearch ? 1.3 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: isSearch ? 3 : 2,
                padding: isSearch ? '10px 8px' : '8px 4px',
                border: 'none', cursor: 'pointer',
                background: active
                  ? (isSearch ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#eff6ff')
                  : 'transparent',
                position: 'relative',
              }}
            >
              {isSearch && active && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#2563eb' }} />
              )}
              <div style={{ position: 'relative', padding: isSearch ? '8px 16px' : '5px 12px', borderRadius: isSearch ? 14 : 10, background: active ? (isSearch ? 'rgba(255,255,255,0.2)' : '#dbeafe') : (isSearch ? '#eff6ff' : 'transparent') }}>
                <Icon size={isSearch ? 22 : 18} color={active ? (isSearch ? 'white' : '#2563eb') : '#94a3b8'} />
                {badge && (
                  <span style={{ position: 'absolute', top: -3, left: -3, background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '1px 4px', minWidth: 15, textAlign: 'center', lineHeight: '13px' }}>
                    {badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: isSearch ? 12 : 10, fontWeight: active ? 700 : 400, color: active ? (isSearch ? 'white' : '#2563eb') : '#94a3b8' }}>
                {t.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {reviewLead && <ReviewsModal lead={reviewLead} onClose={() => setReviewLead(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}

