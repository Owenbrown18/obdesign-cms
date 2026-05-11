import { useRef, useState } from 'react';
import { updateField, uploadImage } from '../lib/api';

const STATUS = { idle: 'idle', saving: 'saving', saved: 'saved', error: 'error' };

const savedTick = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5L5.2 9.5L11 3.5" stroke="#7ba49e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function FieldEditor({ projectSlug, field, onSaved }) {
  const [value, setValue]       = useState(field.field_value ?? '');
  const [status, setStatus]     = useState(STATUS.idle);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const fileRef = useRef(null);

  const isImage = field.field_type === 'image';
  const isDirty = value !== (field.field_value ?? '');

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

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const { url } = await uploadImage(projectSlug, file);
      setValue(url);
      await updateField(projectSlug, field.field_key, url);
      onSaved?.(field.field_key, url);
      setStatus(STATUS.saved);
      setTimeout(() => setStatus(STATUS.idle), 2200);
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleRemove() {
    setValue('');
    setStatus(STATUS.saving);
    try {
      await updateField(projectSlug, field.field_key, '');
      onSaved?.(field.field_key, '');
      setStatus(STATUS.saved);
      setTimeout(() => setStatus(STATUS.idle), 2200);
    } catch {
      setStatus(STATUS.error);
      setTimeout(() => setStatus(STATUS.idle), 3000);
    }
  }

  const filename = value
    ? decodeURIComponent(value.split('/').pop().split('?')[0])
    : null;

  return (
    <div
      style={{
        background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 2px 16px rgba(11,31,29,0.06), 0 1px 3px rgba(11,31,29,0.04)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(11,31,29,0.1), 0 2px 6px rgba(11,31,29,0.06)'; e.currentTarget.style.borderColor = '#bcd4cf'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(11,31,29,0.06), 0 1px 3px rgba(11,31,29,0.04)'; e.currentTarget.style.borderColor = '#dde8e5'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
        <span style={{ color: '#7ba49e', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {field.field_label}
        </span>
        <span style={{ color: '#adc4c0', fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>
          {field.field_key}
        </span>
      </div>

      {/* ── Image field ──────────────────────────────────── */}
      {isImage ? (
        <div>
          {value && (
            <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #d4e6e1', background: '#f4f9f7' }}>
              <img
                src={value}
                alt={field.field_label}
                style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }}
              />
            </div>
          )}

          {value && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
              padding: '8px 12px', background: '#f4f9f7', borderRadius: '8px', border: '1px solid #d4e6e1',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#7ba49e" strokeWidth="1.2"/>
                <circle cx="4.5" cy="4.5" r="1" fill="#7ba49e"/>
                <path d="M1 9.5L4 6.5L6.5 9L9 7L13 10.5" stroke="#7ba49e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                color: '#1a2e2a', fontSize: '12px', fontFamily: 'ui-monospace, monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {filename}
              </span>
              <button
                onClick={handleRemove}
                disabled={status === STATUS.saving}
                style={{
                  color: '#dc2626', fontSize: '11px', fontWeight: 700, background: 'none',
                  border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px 0',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}
              >
                Remove
              </button>
            </div>
          )}

          {!value && !uploading && (
            <div style={{
              marginBottom: '12px', padding: '28px', border: '1.5px dashed #d4e6e1',
              borderRadius: '10px', textAlign: 'center',
              color: '#adc4c0', fontSize: '13px',
            }}>
              No image uploaded
            </div>
          )}

          {uploading && (
            <div style={{
              marginBottom: '12px', padding: '14px 16px',
              background: 'rgba(123,164,158,0.06)', border: '1px solid rgba(123,164,158,0.2)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '14px', height: '14px', border: '2px solid rgba(123,164,158,0.25)',
                borderTopColor: '#7ba49e', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              <span style={{ color: '#7ba49e', fontSize: '12.5px', fontWeight: 600 }}>Uploading…</span>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || status === STATUS.saving}
              style={{
                padding: '7px 20px',
                background: uploading ? 'rgba(123,164,158,0.12)' : '#7ba49e',
                color: uploading ? '#adc4c0' : '#0b1f1d',
                border: 'none', borderRadius: '8px',
                fontSize: '11px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                cursor: uploading ? 'default' : 'pointer',
                transition: 'background 0.2s, color 0.2s, transform 0.15s',
                boxShadow: uploading ? 'none' : '0 0 8px rgba(123,164,158,0.4)',
              }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {value ? 'Replace Image' : 'Upload Image'}
            </button>

            {status === STATUS.saved && (
              <span className="anim-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7ba49e', fontSize: '12.5px', fontWeight: 600 }}>
                {savedTick} Saved
              </span>
            )}
            {status === STATUS.error && (
              <span className="anim-slide-up" style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: 600 }}>
                Error — try again
              </span>
            )}
          </div>

          {uploadErr && (
            <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0' }}>{uploadErr}</p>
          )}
        </div>

      ) : field.field_type === 'textarea' ? (
        /* ── Textarea field ──────────────────────────────── */
        <textarea
          rows={4}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="ob-input"
          style={{
            width: '100%', resize: 'vertical',
            background: '#f4f9f7', border: '1px solid #d4e6e1',
            borderRadius: '10px', padding: '11px 14px',
            color: '#1a2e2a', fontSize: '14px', lineHeight: '1.55',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />

      ) : (
        /* ── Text field ──────────────────────────────────── */
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="ob-input"
          style={{
            width: '100%',
            background: '#f4f9f7', border: '1px solid #d4e6e1',
            borderRadius: '10px', padding: '11px 14px',
            color: '#1a2e2a', fontSize: '14px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
      )}

      {/* Save footer — text/textarea only */}
      {!isImage && (
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
              boxShadow: isDirty && status !== STATUS.saving ? '0 0 8px rgba(123,164,158,0.4)' : 'none',
            }}
            onMouseEnter={e => { if (isDirty && status !== STATUS.saving) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {status === STATUS.saving ? 'Saving…' : 'Save'}
          </button>

          {status === STATUS.saved && (
            <span className="anim-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7ba49e', fontSize: '12.5px', fontWeight: 600 }}>
              {savedTick} Saved
            </span>
          )}
          {status === STATUS.error && (
            <span className="anim-slide-up" style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: 600 }}>
              Error — try again
            </span>
          )}
        </div>
      )}
    </div>
  );
}
