import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProject } from '../lib/api';

export default function ProjectSettings({ projectSlug }) {
  const navigate          = useNavigate();
  const [input, setInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const confirmed = input === projectSlug;

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProject(projectSlug);
      navigate('/projects');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Settings
        </h1>
        <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
          Project configuration and danger zone
        </p>
      </div>

      {/* Danger zone */}
      <div style={{
        border: '1px solid rgba(220,38,38,0.2)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px',
          background: 'rgba(220,38,38,0.04)',
          borderBottom: '1px solid rgba(220,38,38,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5L11.5 11H1.5L6.5 1.5Z" stroke="#dc2626" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M6.5 5v3M6.5 9.5v.5" stroke="#dc2626" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#dc2626', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Danger Zone
          </span>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#1a2e2a', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
              Delete this project
            </p>
            <p style={{ color: '#7a9a96', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              Permanently deletes all pages, sections, fields, and client access for{' '}
              <span style={{ fontFamily: 'ui-monospace, monospace', color: '#1a2e2a' }}>{projectSlug}</span>.
              This cannot be undone.
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block', color: '#7a9a96', fontSize: '12px', marginBottom: '7px',
            }}>
              Type <span style={{ fontFamily: 'ui-monospace, monospace', color: '#1a2e2a', fontWeight: 600 }}>{projectSlug}</span> to confirm
            </label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={projectSlug}
              className="ob-input"
              style={{
                width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1',
                borderRadius: '8px', padding: '9px 12px', color: '#1a2e2a',
                fontSize: '13px', fontFamily: 'ui-monospace, monospace',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '12.5px', margin: '0 0 12px' }}>{error}</p>
          )}

          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            style={{
              padding: '9px 20px',
              background: confirmed ? '#dc2626' : 'rgba(220,38,38,0.08)',
              color: confirmed ? '#fff' : 'rgba(220,38,38,0.4)',
              border: `1px solid ${confirmed ? '#dc2626' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: '8px', cursor: confirmed && !deleting ? 'pointer' : 'default',
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
