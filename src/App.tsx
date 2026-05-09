import { useState, useEffect, type ElementType } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { LayoutDashboard, Search, Settings as SettingsIcon, Zap, BarChart3, Database, Flame } from 'lucide-react';
import type { Lead, AppSettings, SearchParams } from './types';
import { loadSettings, saveSettings } from './utils/storage';
import { searchPlaces } from './utils/googleMaps';
import { sendToTelegram, sendBulkToTelegram } from './utils/telegram';
import {
  makeSearchKey, setupStorage, storageEngine,
  hasSearch, saveSearchRecord, saveLeads,
  getLeadsBySearchKey, getAllLeads, updateLead, clearAll,
  getSearchHistory, deleteSearchRecord,
} from './utils/storage-engine';
import type { SavedSearch } from './utils/storage-engine';
import { SearchPanel }    from './components/SearchPanel';
import { LeadBoard }      from './components/LeadBoard';
import { SettingsPanel }  from './components/SettingsPanel';
import { ErrorBanner }    from './components/ErrorBanner';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ReviewsModal }          from './components/ReviewsModal';
import { SearchHistoryPanel }    from './components/SearchHistoryPanel';
import './index.css';

type Tab = 'dashboard' | 'analytics' | 'search' | 'settings';

const TAB_VARIANTS: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function App() {
  const [tab, setTab]               = useState<Tab>('dashboard');
  const [settings, setSettings]     = useState<AppSettings>(() => { const s = loadSettings(); setupStorage(s); return s; });
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [dbLoading, setDbLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [bulkProgress, setBulkProgress] = useState('');
  const [lastFromCache, setLastFromCache] = useState(false);
  const [reviewLead, setReviewLead] = useState<Lead | null>(null);
  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>([]);

  useEffect(() => {
    Promise.all([
      getAllLeads().catch(() => [] as Lead[]),
      getSearchHistory().catch(() => [] as SavedSearch[]),
    ]).then(([rows, hist]) => {
      setLeads(rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSearchHistory(hist);
    }).finally(() => setDbLoading(false));
  }, []);

  function handleSaveSettings(s: AppSettings) {
    setSettings(s);
    saveSettings(s);
    setupStorage(s);
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
      // Refresh history
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
    // Refresh leads from DB (re-fetch everything to reflect deletion)
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
    const { success, failed } = await sendBulkToTelegram(leadsToSend, settings.telegramBotToken, settings.telegramChatId, idx => setBulkProgress(`جارٍ إرسال ${idx}/${leadsToSend.length}...`));
    setBulkProgress('');
    if (failed > 0) setError(`تم الإرسال: ${success} ✓ | فشل: ${failed} ✗`);
  }

  async function handleClear() {
    if (window.confirm('مسح جميع البيانات؟ لا يمكن التراجع.')) { await clearAll(); setLeads([]); }
  }

  const tabs: { id: Tab; label: string; icon: ElementType }[] = [
    { id: 'dashboard',  label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'analytics',  label: 'التحليلات',   icon: BarChart3 },
    { id: 'search',     label: 'البحث',        icon: Search },
    { id: 'settings',   label: 'الإعدادات',   icon: SettingsIcon },
  ];

  const engine = storageEngine();

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#f1f5f9', color: '#0f172a' }}>

      {/* ══ Header ══ */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ padding: 8, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              <Zap size={19} color="white" />
            </div>
            <div>
              <h1 style={{ color: '#0f172a', fontWeight: 700, fontSize: 17, margin: 0 }}>LeadHarvest AI</h1>
              <p style={{ color: '#94a3b8', fontSize: 10, margin: '1px 0 0' }}>منصة استخراج وإدارة الفرص التسويقية</p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 12, padding: 4, border: '1px solid #e2e8f0' }}>
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <motion.button key={t.id} onClick={() => setTab(t.id)} whileTap={{ scale: 0.95 }} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  background: active ? 'white' : 'transparent',
                  color: active ? '#2563eb' : '#64748b',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={14} />
                  <span>{t.label}</span>
                </motion.button>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {dbLoading && <span style={{ fontSize: 10, color: '#94a3b8' }}>جارٍ تحميل...</span>}
            {/* Storage engine badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: engine === 'firebase' ? '#fef9c3' : '#eff6ff', border: `1px solid ${engine === 'firebase' ? '#fde047' : '#bfdbfe'}` }}>
              {engine === 'firebase' ? <Flame size={11} color="#ca8a04" /> : <Database size={11} color="#2563eb" />}
              <span style={{ fontSize: 10, color: engine === 'firebase' ? '#854d0e' : '#1d4ed8', fontWeight: 500 }}>
                {engine === 'firebase' ? 'Firestore' : 'Local DB'}
              </span>
            </div>
            {/* API status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: settings.googleApiKey ? '#f0fdf4' : '#fff1f2', border: `1px solid ${settings.googleApiKey ? '#bbf7d0' : '#fecdd3'}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: settings.googleApiKey ? '#22c55e' : '#f43f5e' }} />
              <span style={{ fontSize: 10, color: settings.googleApiKey ? '#15803d' : '#be123c', fontWeight: 500 }}>
                {settings.googleApiKey ? 'API متصل' : 'يحتاج API Key'}
              </span>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 600 }}>{leads.length} عميل</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>

        {bulkProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ width: 14, height: 14, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ color: '#1d4ed8', fontSize: 13 }}>{bulkProgress}</span>
          </div>
        )}

        {error && <div style={{ marginBottom: 14 }}><ErrorBanner message={error} onClose={() => setError('')} /></div>}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ width: 18, height: 18, border: '2px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <div>
              <p style={{ color: '#1e40af', fontSize: 13, fontWeight: 600, margin: 0 }}>جارٍ الاستخراج — 10 بحوث متوازية لأقصى تغطية...</p>
              <p style={{ color: '#3b82f6', fontSize: 11, margin: '3px 0 0' }}>النتائج تُحفظ تلقائياً في قاعدة البيانات</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
            {tab === 'dashboard' && (
              <LeadBoard leads={leads} onUpdate={handleUpdate} onSendTelegram={handleSendTelegram} onSendBulk={handleBulkSend} onClear={handleClear} onOpenReviews={setReviewLead} />
            )}
            {tab === 'analytics' && <AnalyticsPanel leads={leads} />}
            {tab === 'search' && (
              <div style={{ maxWidth: 660, margin: '0 auto' }}>
                <SearchPanel onSearch={handleSearch} isLoading={isLoading} hasApiKey={!!settings.googleApiKey} lastFromCache={lastFromCache} />
                <SearchHistoryPanel
                  history={searchHistory}
                  onReload={handleReloadSearch}
                  onDelete={handleDeleteSearch}
                  isLoading={isLoading}
                />
              </div>
            )}
            {tab === 'settings' && (
              <div style={{ maxWidth: 660, margin: '0 auto' }}>
                <SettingsPanel settings={settings} onSave={handleSaveSettings} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {reviewLead && <ReviewsModal lead={reviewLead} onClose={() => setReviewLead(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        button, input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}
