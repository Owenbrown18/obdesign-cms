import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { getClientProject, getProfile } from './lib/api';
import { AuthContext, useAuth } from './lib/auth';
import Login from './pages/Login';
import DeveloperLogin from './pages/DeveloperLogin';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';

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
