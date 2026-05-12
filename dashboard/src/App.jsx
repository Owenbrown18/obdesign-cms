import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { getClientProject, getProfile } from './lib/api';
import { AuthContext, useAuth } from './lib/auth';
import Login from './pages/Login';
import DeveloperLogin from './pages/DeveloperLogin';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';

// ── Mobile blocker ─────────────────────────────────────────
function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isMobile) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0d211e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.02em' }}>OBDesign</span>
        <span style={{ color: '#7ba49e', fontWeight: 400, fontSize: '22px', marginLeft: '8px' }}>CMS</span>
      </div>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'rgba(123,164,158,0.1)', border: '1px solid rgba(123,164,158,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="6" width="16" height="12" rx="2" stroke="#7ba49e" strokeWidth="1.5"/>
          <path d="M7 6V5a4 4 0 0 1 8 0v1" stroke="#7ba49e" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="11" cy="12" r="1.5" fill="#7ba49e"/>
        </svg>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
        Desktop only
      </p>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0, lineHeight: 1.6, maxWidth: '280px' }}>
        OBDesign CMS is designed for desktop. Please open this on a computer to manage your content.
      </p>
    </div>
  );
}

// ── Auth route (redirect away if already logged in) ────────
function AuthRoute({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (session && profile)
    return <Navigate to={profile.role === 'developer' ? '/projects' : '/dashboard'} replace />;
  return children;
}

// ── Route guard ────────────────────────────────────────────
function ProtectedRoute({ allowedRole, children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to={allowedRole === 'developer' ? '/developer' : '/login'} replace />;
  if (profile && profile.role !== allowedRole)
    return <Navigate to={profile.role === 'developer' ? '/projects' : '/dashboard'} replace />;
  return children;
}

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === 'developer') return <Navigate to="/projects" replace />;
  return <Navigate to="/dashboard" replace />;
}

// ── App ────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]                 = useState(undefined);
  const [profile, setProfile]                 = useState(null);
  const [clientProjectSlug, setClientSlug]    = useState(null);

  const loading = session === undefined || (session !== null && profile === null);

  async function fetchProfile(userId) {
    try {
      const p = await getProfile(userId);
      setProfile(p);
      if (p.role === 'client') {
        getClientProject(userId)
          .then(({ project }) => setClientSlug(project.slug))
          .catch(() => {});
      }
    } catch {
      setProfile({ role: 'client' });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s ?? null);
      if (s) fetchProfile(s.user.id);
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      if (s) fetchProfile(s.user.id);
      else { setProfile(null); setClientSlug(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, clientProjectSlug, loading }}>
      <MobileBlocker />
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/developer" element={<AuthRoute><DeveloperLogin /></AuthRoute>} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="client">
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute allowedRole="developer">
              <ProjectsList />
            </ProtectedRoute>
          } />

          <Route path="/projects/:projectSlug" element={
            <ProtectedRoute allowedRole="developer">
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/"  element={<RootRedirect />} />
          <Route path="*"  element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
