import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { getContent, getStructure } from '../lib/api';
import FieldEditor from '../components/FieldEditor';
import StructureEditor from '../components/StructureEditor';
import ClientAccess from '../components/ClientAccess';
import ProjectSettings from '../components/ProjectSettings';
import ConnectSite from '../components/ConnectSite';

const C = {
  sidebar:   '#0d211e',
  accent:    '#7ba49e',
  border:    'rgba(123,164,158,0.14)',
  textSub:   'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.28)',
  pageBg:    '#f7faf9',
  cardBg:    '#ffffff',
};

function SkeletonCard() {
  return (
    <div style={{
      background: C.cardBg, border: '1px solid #e8edeb', borderRadius: '16px',
      padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div className="skeleton" style={{ height: '10px', width: '100px', marginBottom: '14px', borderRadius: '6px' }} />
      <div className="skeleton" style={{ height: '40px', width: '100%', borderRadius: '10px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '28px', width: '68px', borderRadius: '8px' }} />
    </div>
  );
}

function NavItem({ label, id, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        width: '100%', padding: '8px 14px 8px 22px',
        background: active ? 'rgba(123,164,158,0.12)' : 'transparent',
        borderLeft: `2px solid ${active ? C.accent : 'transparent'}`,
        borderTop: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: '0 8px 8px 0',
        color: active ? C.accent : C.textSub,
        fontSize: '13px', fontWeight: active ? 700 : 500,
        cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        textAlign: 'left', marginLeft: '-2px',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(123,164,158,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textSub; } }}
    >
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
        background: active ? C.accent : 'rgba(255,255,255,0.2)', transition: 'background 0.15s',
      }} />
      {label}
    </button>
  );
}

function SectionLabel({ children, color = C.textMuted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingLeft: '14px', marginBottom: '10px' }}>
      <span style={{ display: 'block', width: '14px', height: '1.5px', background: C.accent, borderRadius: '1px', opacity: 0.7, flexShrink: 0 }} />
      <span style={{ color, fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
        {children}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { projectSlug: urlSlug } = useParams();
  const navigate                 = useNavigate();
  const { session, profile, clientProjectSlug } = useAuth();

  const isDevView    = profile?.role === 'developer';
  const PROJECT_SLUG = urlSlug || clientProjectSlug || null;

  const email   = session?.user?.email ?? '';
  const initial = email.charAt(0).toUpperCase();

  const [projectName, setProjectName]          = useState('');
  const [pages, setPages]                      = useState([]);
  const [fields, setFields]                    = useState([]);
  const [loading, setLoading]                  = useState(true);
  const [error, setError]                      = useState(null);
  const [activeSectionId, setActive]           = useState(null);
  const [expandedPageIds, setExpandedPages]    = useState(new Set());

  // Derive active section/page from content nav state
  let activeSection = null;
  let activePage    = null;
  const isDevPanel  = activeSectionId === '__structure__' || activeSectionId === '__clients__' || activeSectionId === '__settings__' || activeSectionId === '__connect__';

  if (!isDevPanel) {
    for (const page of pages) {
      const sec = page.sections?.find(s => s.id === activeSectionId);
      if (sec) { activeSection = sec; activePage = page; break; }
    }
  }

  const visibleFields = activeSection
    ? fields.filter(f => f.section_id === activeSection.id)
    : [];

  useEffect(() => {
    if (!PROJECT_SLUG) return;
    setLoading(true);
    setError(null);

    Promise.all([getStructure(PROJECT_SLUG), getContent(PROJECT_SLUG)])
      .then(([structData, contentData]) => {
        const pagesData = structData.pages ?? [];
        setProjectName(structData.projectName ?? '');
        setPages(pagesData);
        setFields(contentData.fields ?? []);
        const firstSection = pagesData[0]?.sections?.[0];
        if (firstSection) setActive(firstSection.id);
        if (pagesData[0]?.id) setExpandedPages(new Set([pagesData[0].id]));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [PROJECT_SLUG]);

  function togglePage(pageId) {
    setExpandedPages(prev => {
      const next = new Set(prev);
      next.has(pageId) ? next.delete(pageId) : next.add(pageId);
      return next;
    });
  }

  function handleSaved(fieldKey, newValue) {
    setFields(prev => prev.map(f =>
      f.field_key === fieldKey ? { ...f, field_value: newValue } : f
    ));
  }

  // Called by StructureEditor when structure changes — syncs nav and refreshes content
  function handleStructureChange(newPages) {
    setPages(newPages);
    getContent(PROJECT_SLUG)
      .then(data => setFields(data.fields ?? []))
      .catch(() => {});
  }

  if (!PROJECT_SLUG) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f7faf9', flexDirection: 'column', gap: '12px',
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="16" stroke="#bcd4cf" strokeWidth="1.5"/>
        <path d="M18 11v8M18 23v1" stroke="#bcd4cf" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p style={{ color: '#7a9a96', fontSize: '15px', fontWeight: 600, margin: 0 }}>
        No project assigned
      </p>
      <p style={{ color: '#adc4c0', fontSize: '13px', margin: 0 }}>
        Contact your developer to get access to a project.
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.pageBg }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: '220px', flexShrink: 0, background: C.sidebar,
        borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
        height: '100vh',
        boxShadow: '4px 0 16px rgba(123,164,158,0.2)',
      }}>

        {/* Wordmark */}
        <div style={{ padding: '22px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '21px', letterSpacing: '-0.02em' }}>OBDesign</span>
          <span style={{ color: C.accent, fontWeight: 400, fontSize: '17px', marginLeft: '8px', letterSpacing: '0.01em' }}>CMS</span>
        </div>

        {/* Back to projects (developer only) */}
        {isDevView && (
          <div style={{ padding: '10px 18px 0' }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 600,
                padding: '4px 6px', borderRadius: '6px',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.background = 'rgba(123,164,158,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6 2L3 5L6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Projects
            </button>
          </div>
        )}

        {/* Project badge */}
        <div style={{ padding: isDevView ? '8px 18px 6px' : '14px 18px 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px',
            background: 'rgba(123,164,158,0.08)', border: `1px solid ${C.border}`, borderRadius: '8px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}`, flexShrink: 0 }} />
            <span style={{ color: C.textSub, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {projectName || PROJECT_SLUG}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 18px 12px', flex: 1, overflowY: 'auto' }}>
          <SectionLabel>Pages</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {pages.map(page => {
              const isOpen = expandedPageIds.has(page.id);
              return (
                <div key={page.id}>
                  <button
                    onClick={() => togglePage(page.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '6px 10px 6px 14px',
                      background: 'transparent', border: 'none', borderRadius: '6px',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{
                      color: isOpen ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.32)',
                      fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.08em', transition: 'color 0.15s',
                    }}>{page.label}</span>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                      style={{ color: 'rgba(255,255,255,0.22)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', flexShrink: 0 }}>
                      <path d="M3 2L6 4.5L3 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '4px' }}>
                      {page.sections?.map(section => (
                        <NavItem
                          key={section.id}
                          label={section.label}
                          id={section.id}
                          active={section.id === activeSectionId}
                          onClick={() => setActive(section.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Developer-only section */}
          {isDevView && (
            <div style={{ marginTop: '20px' }}>
              <SectionLabel color="rgba(123,164,158,0.6)">Developer</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <NavItem label="Structure Editor" id="__structure__"
                  active={activeSectionId === '__structure__'}
                  onClick={() => setActive('__structure__')} />
                <NavItem label="Client Access" id="__clients__"
                  active={activeSectionId === '__clients__'}
                  onClick={() => setActive('__clients__')} />
                <NavItem label="Connect Site" id="__connect__"
                  active={activeSectionId === '__connect__'}
                  onClick={() => setActive('__connect__')} />
                <NavItem label="Settings" id="__settings__"
                  active={activeSectionId === '__settings__'}
                  onClick={() => setActive('__settings__')} />
              </div>
            </div>
          )}
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

      {/* ── Main content ─────────────────────────────────── */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'linear-gradient(150deg, #f7faf9 0%, #eef4f2 100%)', boxShadow: '0 0 0 1px rgba(123,164,158,0.38), 0 0 18px rgba(123,164,158,0.45)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 48px 80px' }}>

          {/* Developer panels */}
          {activeSectionId === '__structure__' && (
            <StructureEditor
              projectSlug={PROJECT_SLUG}
              pages={pages}
              fields={fields}
              onStructureChange={handleStructureChange}
            />
          )}
          {activeSectionId === '__clients__' && (
            <ClientAccess projectSlug={PROJECT_SLUG} />
          )}
          {activeSectionId === '__settings__' && (
            <ProjectSettings projectSlug={PROJECT_SLUG} />
          )}
          {activeSectionId === '__connect__' && (
            <ConnectSite projectSlug={PROJECT_SLUG} pages={pages} fields={fields} />
          )}

          {/* Content editor */}
          {!isDevPanel && (
            <>
              {activeSection && !loading && (
                <div style={{ marginBottom: '32px' }}>
                  <p style={{ color: '#7a9a96', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                    {activePage?.label}
                  </p>
                  <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                    {activeSection.label}
                  </h1>
                  <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
                    {activeSection.description} · changes go live instantly
                  </p>
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '13.5px' }}>
                  {error}
                </div>
              )}

              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <SkeletonCard /><SkeletonCard />
                </div>
              )}

              {!loading && !error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {visibleFields.map(field => (
                    <FieldEditor key={field.field_key} projectSlug={PROJECT_SLUG} field={field} onSaved={handleSaved} />
                  ))}
                  {visibleFields.length === 0 && activeSection && (
                    <p style={{ color: '#9aaba9', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                      No fields in this section yet.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
