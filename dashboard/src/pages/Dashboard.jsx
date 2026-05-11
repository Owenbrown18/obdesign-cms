import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getContent } from '../lib/api';
import FieldEditor from '../components/FieldEditor';

const PROJECT_SLUG = 'suzanne-site';
const PROJECT_NAME = "Suzanne's Site";

// ── Brand tokens ──────────────────────────────────────────
const C = {
  dark:      '#0b1f1d',
  sidebar:   '#0d211e',
  accent:    '#7ba49e',
  border:    'rgba(123,164,158,0.14)',
  text:      '#ffffff',
  textSub:   'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.28)',
  // light content area
  pageBg:    '#f7faf9',
  cardBg:    '#ffffff',
};

// ── Section definitions ───────────────────────────────────
const SECTIONS = [
  {
    id: 'homepage',
    label: 'Homepage',
    description: 'The headline and tagline visitors see first',
    keys: ['hero_title', 'hero_subtitle'],
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1.5 6.5L7 2L12.5 6.5V12.5H9V9.5H5V12.5H1.5V6.5Z"
          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
    description: 'Your story and background',
    keys: ['about_text'],
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 13C1.5 10.515 4.015 8.5 7 8.5s5.5 2.015 5.5 4.5"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'How clients can reach you',
    keys: ['contact_email'],
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="3.5" width="11" height="7.5" rx="1.5"
          stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 5.5L7 8.5L12.5 5.5"
          stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
];

// ── Skeleton card ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: C.cardBg,
      border: '1px solid #e8edeb',
      borderRadius: '16px',
      padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div className="skeleton" style={{ height: '10px', width: '100px', marginBottom: '14px', borderRadius: '6px' }} />
      <div className="skeleton" style={{ height: '40px', width: '100%', borderRadius: '10px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '28px', width: '68px', borderRadius: '8px' }} />
    </div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────
function NavItem({ section, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        width: '100%', padding: '9px 14px',
        background: active ? 'rgba(123,164,158,0.12)' : 'transparent',
        borderLeft: `2px solid ${active ? C.accent : 'transparent'}`,
        borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: '0 8px 8px 0',
        color: active ? C.accent : C.textSub,
        fontSize: '13.5px', fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        textAlign: 'left', marginLeft: '-2px',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(123,164,158,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textSub; } }}
    >
      {section.icon}
      {section.label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function Dashboard({ session }) {
  const [fields, setFields]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeSectionId, setActive]  = useState('homepage');

  const email   = session?.user?.email ?? '';
  const initial = email.charAt(0).toUpperCase();

  const activeSection  = SECTIONS.find(s => s.id === activeSectionId) ?? SECTIONS[0];
  const visibleFields  = fields.filter(f => activeSection.keys.includes(f.field_key));

  useEffect(() => {
    getContent(PROJECT_SLUG)
      .then(data => setFields(data.fields))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(fieldKey, newValue) {
    setFields(prev => prev.map(f =>
      f.field_key === fieldKey ? { ...f, field_value: newValue } : f
    ));
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>

        {/* Wordmark */}
        <div style={{
          padding: '22px 20px 20px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em' }}>OBDesign</span>
          <span style={{ color: '#7ba49e', fontWeight: 400, fontSize: '14px', marginLeft: '7px', letterSpacing: '0.01em' }}>CMS</span>
        </div>

        {/* Project badge */}
        <div style={{ padding: '14px 18px 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 10px',
            background: 'rgba(123,164,158,0.08)',
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}`, flexShrink: 0 }} />
            <span style={{ color: C.textSub, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {PROJECT_NAME}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 18px', flex: 1 }}>
          <p style={{
            color: C.textMuted, fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: '4px', paddingLeft: '14px',
          }}>Sections</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {SECTIONS.map(s => (
              <NavItem
                key={s.id}
                section={s}
                active={s.id === activeSectionId}
                onClick={() => setActive(s.id)}
              />
            ))}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(123,164,158,0.18)', border: `1px solid rgba(123,164,158,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.accent, fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>{initial}</div>
            <span style={{ color: C.textSub, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              width: '100%', padding: '7px 0',
              background: 'transparent', border: `1px solid rgba(123,164,158,0.2)`,
              borderRadius: '8px', color: C.textSub,
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(123,164,158,0.2)'; e.currentTarget.style.color = C.textSub; }}
          >Sign out</button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main style={{
        flex: 1, overflowY: 'auto',
        background: 'linear-gradient(150deg, #f7faf9 0%, #eef4f2 100%)',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 48px 80px' }}>

          {/* Section header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              color: '#1a2e2a', fontSize: '26px', fontWeight: 700,
              letterSpacing: '-0.03em', margin: '0 0 6px',
            }}>{activeSection.label}</h1>
            <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
              {activeSection.description} · changes go live instantly
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '13.5px',
            }}>{error}</div>
          )}

          {/* Skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeSection.keys.map(k => <SkeletonCard key={k} />)}
            </div>
          )}

          {/* Field editors */}
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {visibleFields.map(field => (
                <FieldEditor
                  key={field.field_key}
                  projectSlug={PROJECT_SLUG}
                  field={field}
                  onSaved={handleSaved}
                />
              ))}
              {visibleFields.length === 0 && (
                <p style={{ color: '#9aaba9', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                  No fields in this section yet.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
