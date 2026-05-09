import { useState } from 'react';
import { Search, Sliders, Zap, AlertCircle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SearchParams } from '../types';
import { COUNTRIES } from '../data/locations';

interface SearchPanelProps {
  onSearch: (params: SearchParams) => Promise<void>;
  isLoading: boolean;
  hasApiKey: boolean;
  lastFromCache?: boolean;
}

const CATEGORIES = ['مطاعم', 'مقاهي', 'فنادق', 'صيدليات', 'عيادات أسنان', 'محلات ملابس', 'محلات إلكترونيات', 'صالونات حلاقة', 'مدارس', 'جيم ونوادي رياضية'];

const inputStyle: React.CSSProperties = { width: '100%', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

export function SearchPanel({ onSearch, isLoading, hasApiKey, lastFromCache }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [cityEn, setCityEn] = useState('');
  const [radius, setRadius] = useState(5000);
  const [maxResults, setMaxResults] = useState(60);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);
  const selectedCity = selectedCountry?.cities.find(c => c.en === cityEn);
  const canSubmit = !!query.trim() && !!countryCode && !!cityEn && hasApiKey && !isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSearch({
      query: query.trim(),
      countryCode,
      countryAr: selectedCountry!.ar,
      cityAr: selectedCity!.ar,
      cityEn,
      radius,
      maxResults,
      cityLat: selectedCity!.lat,
      cityLng: selectedCity!.lng,
    });
  }

  return (
    <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 9, borderRadius: 12, background: '#eff6ff', border: '1.5px solid #bfdbfe' }}><Zap size={18} color="#2563eb" /></div>
        <div>
          <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, margin: 0 }}>استخراج العملاء المحتملين</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>10 بحوث متوازية — 100+ نتيجة فريدة — تُحفظ تلقائياً</p>
        </div>
        {lastFromCache && (
          <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', fontSize: 11, fontWeight: 600 }}>
            <Database size={11} /> من الذاكرة
          </span>
        )}
      </div>

      {!hasApiKey && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <AlertCircle size={15} color="#f59e0b" />
          <p style={{ color: '#92400e', fontSize: 13, margin: 0 }}>أدخل <strong>Google Maps API Key</strong> في الإعدادات أولاً.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Categories */}
        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 8px' }}>اختر تصنيفاً سريعاً:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <motion.button key={cat} type="button" onClick={() => setQuery(cat)} whileTap={{ scale: 0.95 }} style={{ fontSize: 12, padding: '5px 13px', borderRadius: 20, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s', borderColor: query === cat ? '#3b82f6' : '#e2e8f0', background: query === cat ? '#2563eb' : 'white', color: query === cat ? 'white' : '#64748b', fontWeight: query === cat ? 600 : 400 }}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Query input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: '#475569', fontSize: 12, marginBottom: 5, fontWeight: 500 }}>نوع النشاط التجاري *</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="مثال: مطاعم، مقاهي..." style={{ ...inputStyle, paddingRight: 34 }} onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
          </div>
        </div>

        {/* Country + City */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', color: '#475569', fontSize: 12, marginBottom: 5, fontWeight: 500 }}>الدولة *</label>
            <select value={countryCode} onChange={e => { setCountryCode(e.target.value); setCityEn(''); }} style={{ ...inputStyle, cursor: 'pointer', color: countryCode ? '#0f172a' : '#94a3b8' }} onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}>
              <option value="">اختر الدولة...</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.ar}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#475569', fontSize: 12, marginBottom: 5, fontWeight: 500 }}>المدينة *</label>
            <select value={cityEn} onChange={e => setCityEn(e.target.value)} disabled={!countryCode} style={{ ...inputStyle, cursor: countryCode ? 'pointer' : 'not-allowed', color: cityEn ? '#0f172a' : '#94a3b8', opacity: countryCode ? 1 : 0.5 }} onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}>
              <option value="">{countryCode ? 'اختر المدينة...' : '← اختر الدولة أولاً'}</option>
              {selectedCountry?.cities.map(c => <option key={c.en} value={c.en}>{c.ar}</option>)}
            </select>
          </div>
        </div>

        {/* Location badge */}
        {countryCode && cityEn && selectedCountry && selectedCity && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe', marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{selectedCountry.flag}</span>
            <span style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 600 }}>{selectedCity.ar}، {selectedCountry.ar}</span>
            <span style={{ color: '#94a3b8', fontSize: 11, marginRight: 'auto' }}>{selectedCity.en}, {selectedCountry.en}</span>
          </motion.div>
        )}

        {/* Advanced */}
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
          <Sliders size={12} /> إعدادات متقدمة {showAdvanced ? '▲' : '▼'}
        </button>
        {showAdvanced && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0', marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 5 }}>نطاق البحث</label>
              <select value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ ...inputStyle, fontSize: 12 }}>
                {[1000, 3000, 5000, 10000, 25000].map(r => <option key={r} value={r}>{r / 1000} كم</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 5 }}>عدد النتائج</label>
              <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} style={{ ...inputStyle, fontSize: 12 }}>
                {[20, 40, 60, 100, 200].map(n => <option key={n} value={n}>{n} نتيجة</option>)}
              </select>
            </div>
          </motion.div>
        )}

        <motion.button type="submit" disabled={!canSubmit} whileTap={canSubmit ? { scale: 0.98 } : {}} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? '#2563eb' : '#e2e8f0', color: canSubmit ? 'white' : '#94a3b8', boxShadow: canSubmit ? '0 4px 14px rgba(37,99,235,0.3)' : 'none', transition: 'all 0.2s' }}>
          {isLoading
            ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> جارٍ الاستخراج...</>
            : <><Search size={16} /> ابدأ الاستخراج ({maxResults} نتيجة)</>}
        </motion.button>
      </form>
    </div>
  );
}
