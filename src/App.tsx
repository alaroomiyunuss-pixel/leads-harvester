import { useState, useEffect, type ElementType } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { LayoutDashboard, Search, Settings as SettingsIcon, Zap, BarChart3, Database, Cloud } from 'lucide-react';
import type { Lead, AppSettings, SearchParams } from './types';
import { loadSettings, saveSettings } from './utils/storage';
import { searchPlaces } from './utils/googleMaps';
import { sendToTelegram, sendBulkToTelegram } from './utils/telegram';
import {
  makeSearchKey, storageEngine,
  hasSearch, saveSearchRecord, saveLeads,
  getLeadsBySearchKey, getAllLeads, updateLead, clearAll,
  getSearchHistory, deleteSearchRecord,
} from './utils/storage-engine';
import type { SavedSearch } from './utils/storage-engine';
import { SearchPanel }        from './components/SearchPanel';
import { LeadBoard }          from './components/LeadBoard';
import { SettingsPanel }      from './components/SettingsPanel';
import { ErrorBanner }        from './components/ErrorBanner';
import { AnalyticsPanel }     from './components/AnalyticsPanel';
import { ReviewsModal }       from './components/ReviewsModal';
import { SearchHistoryPanel } from './components/SearchHistoryPanel';
import { AuthGate, isAuthenticated } from './components/AuthGate';
import './index.css';

type Tab = 'dashboard' | 'analytics' | 'search' | 'settings';

const TAB_VARIANTS: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: 'search',    label: 'البحث',        icon: Search },
  { id: 'dashboard', label: 'العملاء',      icon: LayoutDashboard },
  { id: 'analytics', label: 'التحليلات',   icon: BarChart3 },
  { id: 'settings',  label: 'الإعدادات',   icon: SettingsIcon },
];

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [tab, setTab]       = useState<Tab>('search');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [dbLoading, setDbLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [bulkProgress, setBulkProgress] = useState('');
  const [lastFromCache, setLastFromCache] = useState(false);
  const [reviewLead, setReviewLead] = useState<Lead | null>(null);
  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      getAllLeads().catch(() => [] as Lead[]),
      getSearchHistory().catch(() => [] as SavedSearch[]),
    ]).then(([rows, hist]) => {
      setLeads(rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSearchHistory(hist);
    }).finally(() => setDbLoading(false));
  }, [authed]);

  function handleSaveSettings(s: AppSettings) {
    setSettings(s); saveSettings(s);
  }

  async function handleSearch(params: SearchParams) {
    const { countryCode, countryAr, cityAr, cityEn } = params;
    const searchKey = makeSearchKey(params.query, countryCode, cityEn);
    setIsLoading(true); setError(''); setLastFromCache(false); setTab('dashboard');
    try {
      if (await hasSearch(searchKey)) {
        const cached = await getLeadsBySearchKey(searchKey);
        setLastFromCache(true);
        setLeads(prev => { const ids = new Set(prev.map(l => l.id)); return [...cached.filter(l => !ids.has(l.id)), ...prev]; });
        return;
      }
      const found = await searchPlaces(params, settings.googleApiKey);
      await saveLeads(found, searchKey, countryCode, cityAr);
      await saveSearchRecord(searchKey, found.length, { query: params.query, countryCode, countryAr, cityAr, cityEn });
      getSearchHistory().then(h => setSearchHistory(h)).catch(() => {});
      setLeads(prev => { const ids = new Set(prev.map(l => l.id)); return [...found.filter(l => !ids.has(l.id)), ...prev]; });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء البحث');
    } finally { setIsLoading(false); }
  }

  async function handleReloadSearch(s: SavedSearch) {
    setIsLoading(true); setError(''); setLastFromCache(true); setTab('dashboard');
    try {
      const cached = await getLeadsBySearchKey(s.searchKey);
      setLeads(prev => { const ids = new Set(prev.map(l => l.id)); return [...cached.filter(l => !ids.has(l.id)), ...prev]; });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل البحث');
    } finally { setIsLoading(false); }
  }

  async function handleDeleteSearch(searchKey: string) {
    await deleteSearchRecord(searchKey);
    setSearchHistory(prev => prev.filter(s => s.searchKey !== searchKey));
    getAllLeads().then(rows =>
      setLeads(rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    ).catch(() => {});
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
    if (window.confirm('مسح جميع البيانات؟ لا يمكن التراجع.')) { await clearAll(); setLeads([]); setSearchHistory([]); }
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

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ color: '#1e40af', fontSize: 13, fontWeight: 600, margin: 0 }}>جارٍ الاستخراج — 10 بحوث متوازية...</p>
              <p style={{ color: '#3b82f6', fontSize: 11, margin: '2px 0 0' }}>تُحفظ تلقائياً في قاعدة البيانات</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
            {tab === 'search' && (
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <SearchPanel onSearch={handleSearch} isLoading={isLoading} hasApiKey={!!settings.googleApiKey} lastFromCache={lastFromCache} />
                <SearchHistoryPanel history={searchHistory} onReload={handleReloadSearch} onDelete={handleDeleteSearch} isLoading={isLoading} />
              </div>
            )}
            {tab === 'dashboard' && (
              <LeadBoard leads={leads} onUpdate={handleUpdate} onSendTelegram={handleSendTelegram} onSendBulk={handleBulkSend} onClear={handleClear} onOpenReviews={setReviewLead} />
            )}
            {tab === 'analytics' && <AnalyticsPanel leads={leads} />}
            {tab === 'settings' && (
              <div style={{ maxWidth: 660, margin: '0 auto' }}>
                <SettingsPanel settings={settings} onSave={handleSaveSettings} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ══ Bottom Navigation (Mobile App Style) ══ */}
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
          return (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.92 }}
              style={{
                flex: isSearch ? 1.4 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: isSearch ? 3 : 2,
                padding: isSearch ? '10px 8px' : '8px 4px',
                border: 'none', cursor: 'pointer',
                background: active ? (isSearch ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#eff6ff') : 'transparent',
                borderRadius: isSearch ? 0 : 0,
                position: 'relative',
              }}
            >
              {isSearch && active && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#2563eb', borderRadius: '0 0 3px 3px' }} />
              )}
              <div style={{
                padding: isSearch ? '8px 20px' : '5px 12px',
                borderRadius: isSearch ? 14 : 10,
                background: active
                  ? (isSearch ? 'rgba(255,255,255,0.2)' : '#dbeafe')
                  : (isSearch ? '#eff6ff' : 'transparent'),
              }}>
                <Icon size={isSearch ? 22 : 18} color={active ? (isSearch ? 'white' : '#2563eb') : '#94a3b8'} />
              </div>
              <span style={{
                fontSize: isSearch ? 12 : 10,
                fontWeight: active ? 700 : 400,
                color: active ? (isSearch ? 'white' : '#2563eb') : '#94a3b8',
              }}>
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
