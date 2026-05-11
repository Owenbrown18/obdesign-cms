import { useEffect, useState } from 'react';
import { getClients, createClient, removeClient, resetClientPassword } from '../lib/api';

const S = {
  label: { color: '#7ba49e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' },
  input: { width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '9px 12px', color: '#1a2e2a', fontSize: '13px', fontFamily: 'inherit' },
  btn: (variant = 'primary') => ({
    padding: '9px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
    ...(variant === 'primary'
      ? { background: '#7ba49e', color: '#0b1f1d' }
      : variant === 'danger'
      ? { background: 'transparent', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' }
      : { background: 'transparent', border: '1px solid #d4e6e1', color: '#7a9a96' }),
  }),
};

function ClientCard({ client, projectSlug, onRemoved, onReset }) {
  const [showReset, setShowReset]       = useState(false);
  const [newPassword, setNewPassword]   = useState('');
  const [resetting, setResetting]       = useState(false);
  const [removing, setRemoving]         = useState(false);
  const [resetErr, setResetErr]         = useState(null);
  const [resetOk, setResetOk]           = useState(false);

  async function handleRemove() {
    if (!confirm(`Revoke access for ${client.email}?`)) return;
    setRemoving(true);
    try { await removeClient(projectSlug, client.id); onRemoved(client.id); }
    finally { setRemoving(false); }
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetting(true); setResetErr(null); setResetOk(false);
    try {
      await resetClientPassword(projectSlug, client.id, newPassword);
      setResetOk(true);
      setNewPassword('');
      setTimeout(() => { setResetOk(false); setShowReset(false); }, 2000);
    } catch (err) {
      setResetErr(err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showReset ? '16px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(123,164,158,0.12)', border: '1px solid rgba(123,164,158,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7ba49e', fontSize: '14px', fontWeight: 700, flexShrink: 0,
          }}>
            {client.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: '#1a2e2a', fontSize: '13.5px', fontWeight: 600, margin: '0 0 2px' }}>{client.email}</p>
            <p style={{ color: '#adc4c0', fontSize: '11px', margin: 0 }}>
              Client · Added {new Date(client.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowReset(v => !v)} style={S.btn('ghost')}>
            Reset Password
          </button>
          <button onClick={handleRemove} disabled={removing} style={S.btn('danger')}>
            {removing ? 'Revoking…' : 'Revoke Access'}
          </button>
        </div>
      </div>

      {showReset && (
        <form onSubmit={handleReset} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>New Password</label>
            <input
              type="password" required minLength={6}
              className="ob-input" style={S.input}
              placeholder="Min. 6 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={resetting} style={{ ...S.btn('primary'), whiteSpace: 'nowrap' }}>
            {resetting ? 'Saving…' : 'Set Password'}
          </button>
          <button type="button" onClick={() => setShowReset(false)} style={S.btn('ghost')}>Cancel</button>
          {resetOk && <span className="anim-slide-up" style={{ color: '#7ba49e', fontSize: '12px', fontWeight: 600, alignSelf: 'center' }}>✓ Updated</span>}
          {resetErr && <span style={{ color: '#dc2626', fontSize: '12px', alignSelf: 'center' }}>{resetErr}</span>}
        </form>
      )}
    </div>
  );
}

export default function ClientAccess({ projectSlug }) {
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [creating, setCreating]   = useState(false);
  const [createErr, setCreateErr] = useState(null);

  useEffect(() => {
    getClients(projectSlug)
      .then(({ clients }) => setClients(clients))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectSlug]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true); setCreateErr(null);
    try {
      const { client } = await createClient(projectSlug, email, password);
      setClients(prev => [...prev, { ...client, created_at: new Date().toISOString() }]);
      setEmail(''); setPassword(''); setShowForm(false);
    } catch (err) {
      setCreateErr(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Client Access
        </h1>
        <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
          Manage who can log in and edit this project's content
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '13.5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ background: '#fff', border: '1px solid #e8edeb', borderRadius: '14px', padding: '20px 22px' }}>
          <div className="skeleton" style={{ height: '14px', width: '200px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '10px', width: '120px', borderRadius: '4px' }} />
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clients.map(client => (
            <ClientCard key={client.id} client={client} projectSlug={projectSlug}
              onRemoved={id => setClients(prev => prev.filter(c => c.id !== id))}
              onReset={() => {}} />
          ))}

          {clients.length === 0 && !showForm && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#adc4c0', fontSize: '13.5px' }}>
              No clients yet — create one below
            </div>
          )}

          {/* Create client form */}
          {showForm ? (
            <div style={{ background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)' }}>
              <p style={{ color: '#7ba49e', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
                Create Client Login
              </p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>Email</label>
                  <input type="email" required className="ob-input" style={S.input}
                    placeholder="client@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>Password</label>
                  <input type="password" required minLength={6} className="ob-input" style={S.input}
                    placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {createErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{createErr}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" disabled={creating} style={S.btn('primary')}>
                    {creating ? 'Creating…' : 'Create Login'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setCreateErr(null); }} style={S.btn('ghost')}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: '13px', background: 'transparent',
                border: '1.5px dashed #bcd4cf', borderRadius: '12px',
                color: '#7a9a96', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#bcd4cf'; e.currentTarget.style.color = '#7a9a96'; }}
            >
              + Create Client Login
            </button>
          )}
        </div>
      )}
    </div>
  );
}
