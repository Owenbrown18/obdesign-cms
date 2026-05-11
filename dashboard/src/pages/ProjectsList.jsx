import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { getDeveloperProjects, createProject } from '../lib/api';

const C = {
  sidebar:   '#0d211e',
  accent:    '#7ba49e',
  border:    'rgba(123,164,158,0.14)',
  textSub:   'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.28)',
};

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function StatBadge({ icon, value, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7a9a96', fontSize: '12px' }}>
      {icon}
      <span style={{ fontWeight: 600, color: '#1a2e2a' }}>{value}</span>
      <span>{label}</span>
    </span>
  );
}

export default function ProjectsList() {
  const navigate          = useNavigate();
  const { session, profile } = useAuth();

  const email   = session?.user?.email ?? '';
  const initial = email.charAt(0).toUpperCase();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newSlug, setNewSlug]   = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    getDeveloperProjects(profile.id)
      .then(({ projects }) => setProjects(projects))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  function handleNameChange(val) {
    setNewName(val);
    if (!newSlug || newSlug === slugify(newName)) {
      setNewSlug(slugify(val));
    }
  }

  function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName || !newSlug) return;
    setCreating(true);
    setCreateErr(null);
    try {
      const { project } = await createProject(profile.id, newName, newSlug);
      setProjects(prev => [...prev, { ...project, page_count: 0, field_count: 0, last_updated: project.created_at }]);
      setShowForm(false);
      setNewName('');
      setNewSlug('');
    } catch (err) {
      setCreateErr(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7faf9' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0, background: C.sidebar,
        borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '22px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '21px', letterSpacing: '-0.02em' }}>OBDesign</span>
          <span style={{ color: C.accent, fontWeight: 400, fontSize: '17px', marginLeft: '8px', letterSpacing: '0.01em' }}>CMS</span>
        </div>

        <div style={{ padding: '16px 18px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingLeft: '14px', marginBottom: '8px' }}>
            <span style={{ display: 'block', width: '14px', height: '1.5px', background: C.accent, borderRadius: '1px', opacity: 0.7 }} />
            <span style={{ color: C.textMuted, fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Projects</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => navigate(`/projects/${p.slug}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  width: '100%', padding: '8px 14px 8px 22px',
                  background: 'transparent', border: 'none', borderLeft: '2px solid transparent',
                  borderRadius: '0 8px 8px 0', color: C.textSub, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', marginLeft: '-2px',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textSub; }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.2)' }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(123,164,158,0.18)', border: `1px solid rgba(123,164,158,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.accent, fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>{initial}</div>
            <span style={{ color: C.textSub, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              width: '100%', padding: '7px 0', background: 'transparent',
              border: `1px solid rgba(123,164,158,0.2)`, borderRadius: '8px', color: C.textSub,
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              boxShadow: '0 0 8px rgba(255,255,255,0.12)',
              transition: 'border-color 0.15s, color 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(123,164,158,0.2)'; e.currentTarget.style.color = C.textSub; e.currentTarget.style.transform = 'scale(1)'; }}
          >Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(150deg, #f7faf9 0%, #eef4f2 100%)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '52px 48px 80px' }}>

          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
              Projects
            </h1>
            <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
              Your client sites — click any project to open the content editor
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '13.5px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>

            {/* Project cards */}
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.slug}`)}
                style={{
                  background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '16px',
                  padding: '24px', cursor: 'pointer',
                  boxShadow: '0 2px 16px rgba(11,31,29,0.06), 0 1px 3px rgba(11,31,29,0.04)',
                  transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(11,31,29,0.1)'; e.currentTarget.style.borderColor = '#bcd4cf'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(11,31,29,0.06)'; e.currentTarget.style.borderColor = '#dde8e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ color: '#1a2e2a', fontSize: '16px', fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.02em' }}>
                      {project.name}
                    </h2>
                    <span style={{ color: '#adc4c0', fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>{project.slug}</span>
                  </div>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'rgba(123,164,158,0.1)', border: '1px solid rgba(123,164,158,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" stroke="#7ba49e" strokeWidth="1.3"/>
                      <rect x="8" y="1.5" width="4.5" height="4.5" rx="1" stroke="#7ba49e" strokeWidth="1.3"/>
                      <rect x="1.5" y="8" width="4.5" height="4.5" rx="1" stroke="#7ba49e" strokeWidth="1.3"/>
                      <rect x="8" y="8" width="4.5" height="4.5" rx="1" stroke="#7ba49e" strokeWidth="1.3"/>
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                  <StatBadge
                    icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="1.5" stroke="#7a9a96" strokeWidth="1.2"/><path d="M1 4h9" stroke="#7a9a96" strokeWidth="1.2"/></svg>}
                    value={project.page_count} label="pages"
                  />
                  <StatBadge
                    icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 3h7M2 5.5h5M2 8h6" stroke="#7a9a96" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                    value={project.field_count} label="fields"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#adc4c0', fontSize: '11px' }}>
                    Updated {timeAgo(project.last_updated)}
                  </span>
                  <span style={{ color: '#7ba49e', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Open →
                  </span>
                </div>
              </div>
            ))}

            {/* Add project card */}
            {!showForm ? (
              <div
                onClick={() => setShowForm(true)}
                style={{
                  background: 'transparent', border: '1.5px dashed #bcd4cf', borderRadius: '16px',
                  padding: '24px', cursor: 'pointer', minHeight: '160px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.background = 'rgba(123,164,158,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#bcd4cf'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(123,164,158,0.1)', border: '1px solid rgba(123,164,158,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M2 7h10" stroke="#7ba49e" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ color: '#7a9a96', fontSize: '13px', fontWeight: 600 }}>Add Project</span>
              </div>
            ) : (
              <div style={{
                background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '16px', padding: '24px',
                boxShadow: '0 2px 16px rgba(11,31,29,0.06)',
              }}>
                <p style={{ color: '#7ba49e', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
                  New Project
                </p>
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#7ba49e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Name</label>
                    <input
                      type="text" required placeholder="Suzanne Site"
                      value={newName} onChange={e => handleNameChange(e.target.value)}
                      className="ob-input"
                      style={{ width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '9px 12px', color: '#1a2e2a', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#7ba49e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Slug</label>
                    <input
                      type="text" required placeholder="suzanne-site"
                      value={newSlug} onChange={e => setNewSlug(e.target.value)}
                      className="ob-input"
                      style={{ width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '9px 12px', color: '#1a2e2a', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}
                    />
                  </div>
                  {createErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{createErr}</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="submit" disabled={creating}
                      style={{
                        flex: 1, padding: '9px', background: creating ? 'rgba(123,164,158,0.4)' : '#7ba49e',
                        color: '#0b1f1d', border: 'none', borderRadius: '8px',
                        fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
                        cursor: creating ? 'default' : 'pointer',
                      }}>
                      {creating ? 'Creating…' : 'Create'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setCreateErr(null); }}
                      style={{
                        padding: '9px 14px', background: 'transparent',
                        border: '1px solid #d4e6e1', borderRadius: '8px',
                        color: '#7a9a96', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Skeleton cards while loading */}
            {loading && [0, 1].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8edeb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div className="skeleton" style={{ height: '16px', width: '140px', marginBottom: '8px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ height: '10px', width: '80px', marginBottom: '20px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '10px', width: '100%', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
