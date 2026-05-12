import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 65% 15%, #385450 0%, #233b38 42%, #0b1f1d 100%)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(20, 38, 34, 0.90)',
        border: '1px solid rgba(123,164,158,0.22)',
        borderRadius: '20px',
        padding: '40px 40px 36px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 32px 64px rgba(11,31,29,0.7), 0 0 0 1px rgba(123,164,158,0.06) inset',
      }}>

        {/* Logo mark + product name */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginTop: '8px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.02em' }}>OBDesign</span>
            <span style={{ color: '#7ba49e', fontWeight: 400, fontSize: '20px', marginLeft: '8px' }}>CMS</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', margin: '6px 0 0' }}>
            Sign in to manage your site content
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block', color: '#7ba49e', fontSize: '10.5px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
            }}>Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className="ob-input"
              style={{
                width: '100%', background: 'rgba(11,31,29,0.65)',
                border: '1px solid rgba(123,164,158,0.22)', borderRadius: '10px',
                padding: '11px 14px', color: '#fff', fontSize: '14px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block', color: '#7ba49e', fontSize: '10.5px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
            }}>Password</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="ob-input"
              style={{
                width: '100%', background: 'rgba(11,31,29,0.65)',
                border: '1px solid rgba(123,164,158,0.22)', borderRadius: '10px',
                padding: '11px 14px', color: '#fff', fontSize: '14px',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: '10px', padding: '10px 14px',
              color: '#fca5a5', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: '4px', width: '100%', padding: '12px',
              background: loading ? 'rgba(255,255,255,0.15)' : '#ffffff',
              color: '#0b1f1d', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '10px',
              fontSize: '12px', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.08em', cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 0 8px rgba(255,255,255,0.2)',
              transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#7ba49e'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'scale(1)'; } }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '12px', marginTop: '28px', marginBottom: 0 }}>
          Powered by OBDesign
        </p>
      </div>
    </div>
  );
}
