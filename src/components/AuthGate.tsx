import { useState } from 'react';
import { Zap, Lock, Eye, EyeOff } from 'lucide-react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'leads2025';
const AUTH_KEY = 'lh_auth';

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === btoa(PASSWORD);
}

interface AuthGateProps { onAuth: () => void; }

export function AuthGate({ onAuth }: AuthGateProps) {
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pass === PASSWORD) {
      localStorage.setItem(AUTH_KEY, btoa(PASSWORD));
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setPass('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <div style={{
      direction: 'rtl', minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', padding: 16, borderRadius: 20, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 8px 24px rgba(37,99,235,0.35)', marginBottom: 14 }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>LeadHarvest AI</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>منصة استخراج وإدارة العملاء المحتملين</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1.5px solid #e2e8f0',
          padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ padding: 8, borderRadius: 10, background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
              <Lock size={16} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: 15, margin: 0 }}>تسجيل الدخول</h2>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0 0' }}>للفريق الداخلي فقط</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type={show ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="كلمة المرور"
                autoFocus
                style={{
                  width: '100%', background: error ? '#fff1f2' : '#f8fafc',
                  border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
                  borderRadius: 12, padding: '12px 40px 12px 14px',
                  fontSize: 15, color: '#0f172a', outline: 'none',
                  boxSizing: 'border-box', transition: 'all 0.2s',
                  letterSpacing: show ? 0 : 3,
                }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: 12, margin: '-8px 0 12px', textAlign: 'center' }}>
                كلمة المرور غير صحيحة
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%', padding: '13px', borderRadius: 12, fontSize: 15,
                fontWeight: 700, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                color: 'white', boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              }}
            >
              دخول 🔐
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
