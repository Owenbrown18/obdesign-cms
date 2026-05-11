import { useState } from 'react';
import { updateField } from '../lib/api';

const STATUS = { idle: 'idle', saving: 'saving', saved: 'saved', error: 'error' };

export default function FieldEditor({ projectSlug, field, onSaved }) {
  const [value, setValue]   = useState(field.field_value);
  const [status, setStatus] = useState(STATUS.idle);

  const isDirty = value !== field.field_value;

  async function handleSave() {
    setStatus(STATUS.saving);
    try {
      await updateField(projectSlug, field.field_key, value);
      setStatus(STATUS.saved);
      onSaved?.(field.field_key, value);
      setTimeout(() => setStatus(STATUS.idle), 2200);
    } catch {
      setStatus(STATUS.error);
      setTimeout(() => setStatus(STATUS.idle), 3000);
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #dde8e5',
      borderRadius: '16px',
      padding: '24px 28px',
      boxShadow: '0 2px 16px rgba(11,31,29,0.06), 0 1px 3px rgba(11,31,29,0.04)',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(11,31,29,0.1), 0 2px 6px rgba(11,31,29,0.06)'; e.currentTarget.style.borderColor = '#bcd4cf'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(11,31,29,0.06), 0 1px 3px rgba(11,31,29,0.04)'; e.currentTarget.style.borderColor = '#dde8e5'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          color: '#7ba49e', fontSize: '10.5px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {field.field_label}
        </span>
        <span style={{
          color: '#adc4c0', fontSize: '11px', fontFamily: 'ui-monospace, monospace',
        }}>
          {field.field_key}
        </span>
      </div>

      {/* Input */}
      {field.field_type === 'textarea' ? (
        <textarea
          rows={4}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="ob-input"
          style={{
            width: '100%', resize: 'vertical',
            background: '#f4f9f7',
            border: '1px solid #d4e6e1',
            borderRadius: '10px', padding: '11px 14px',
            color: '#1a2e2a', fontSize: '14px', lineHeight: '1.55',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="ob-input"
          style={{
            width: '100%',
            background: '#f4f9f7',
            border: '1px solid #d4e6e1',
            borderRadius: '10px', padding: '11px 14px',
            color: '#1a2e2a', fontSize: '14px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || status === STATUS.saving}
          style={{
            padding: '7px 22px',
            background: isDirty && status !== STATUS.saving ? '#7ba49e' : 'rgba(123,164,158,0.12)',
            color: isDirty && status !== STATUS.saving ? '#0b1f1d' : '#adc4c0',
            border: 'none', borderRadius: '8px',
            fontSize: '11px', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            cursor: isDirty && status !== STATUS.saving ? 'pointer' : 'default',
            transition: 'background 0.2s, color 0.2s, transform 0.15s',
            boxShadow: isDirty && status !== STATUS.saving ? '0 2px 12px rgba(123,164,158,0.3)' : 'none',
          }}
          onMouseEnter={e => { if (isDirty && status !== STATUS.saving) e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {status === STATUS.saving ? 'Saving…' : 'Save'}
        </button>

        {status === STATUS.saved && (
          <span className="anim-slide-up" style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            color: '#7ba49e', fontSize: '12.5px', fontWeight: 600,
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5L5.2 9.5L11 3.5" stroke="#7ba49e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Saved
          </span>
        )}

        {status === STATUS.error && (
          <span className="anim-slide-up" style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: 600 }}>
            Error — try again
          </span>
        )}
      </div>
    </div>
  );
}
