import { useState } from 'react';
import { patchField } from '../lib/api';

// ── Toggle switch ───────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={on ? 'Visible to client — click to hide' : 'Hidden from client — click to show'}
      style={{
        width: '36px', height: '20px', flexShrink: 0,
        background: on ? '#7ba49e' : 'rgba(0,0,0,0.1)',
        border: `1px solid ${on ? '#7ba49e' : 'rgba(0,0,0,0.15)'}`,
        borderRadius: '10px', position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: on ? '16px' : '2px',
        width: '14px', height: '14px', borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.18s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        display: 'block',
      }} />
    </button>
  );
}

// ── Field row ───────────────────────────────────────────────
function FieldRow({ field, projectSlug, onUpdate }) {
  const [label, setLabel]       = useState(field.field_label);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleLabelSave() {
    const trimmed = label.trim();
    if (!trimmed) { setLabel(field.field_label); setEditing(false); return; }
    if (trimmed === field.field_label) { setEditing(false); return; }
    setSaving(true);
    try {
      await patchField(projectSlug, field.field_key, { field_label: trimmed });
      onUpdate(field.field_key, { field_label: trimmed });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    const newHidden = !field.hidden;
    try {
      await patchField(projectSlug, field.field_key, { hidden: newHidden });
      onUpdate(field.field_key, { hidden: newHidden });
    } finally {
      setToggling(false);
    }
  }

  const TYPE_COLORS = {
    text:     { bg: 'rgba(123,164,158,0.1)',  color: '#7ba49e' },
    textarea: { bg: 'rgba(99,130,167,0.1)',   color: '#6382a7' },
    image:    { bg: 'rgba(150,120,170,0.1)',  color: '#9678aa' },
  };
  const tc = TYPE_COLORS[field.field_type] ?? TYPE_COLORS.text;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      background: '#fff', border: '1px solid #e8edeb',
      borderRadius: '10px',
      opacity: field.hidden ? 0.45 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Editable label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleLabelSave();
              if (e.key === 'Escape') { setLabel(field.field_label); setEditing(false); }
            }}
            className="ob-input"
            style={{
              width: '100%', background: '#f4f9f7',
              border: '1px solid #7ba49e', borderRadius: '6px',
              padding: '4px 8px', color: '#1a2e2a', fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Click to edit label"
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#1a2e2a', fontSize: '13px', fontWeight: 600,
              cursor: 'text', textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {field.field_label}
            {saved  && <span style={{ color: '#7ba49e', fontSize: '11px', fontWeight: 700 }}>✓</span>}
            {saving && <span style={{ color: '#adc4c0', fontSize: '11px' }}>saving…</span>}
          </button>
        )}
        <p style={{ color: '#adc4c0', fontSize: '10.5px', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>
          {field.field_key}
        </p>
      </div>

      {/* Type badge */}
      <span style={{
        padding: '2px 8px', borderRadius: '5px', fontSize: '10px',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        background: tc.bg, color: tc.color, flexShrink: 0,
      }}>
        {field.field_type}
      </span>

      {/* Visibility toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <Toggle on={!field.hidden} onChange={handleToggle} disabled={toggling} />
        <span style={{ fontSize: '9px', color: field.hidden ? '#adc4c0' : '#7ba49e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {field.hidden ? 'Hidden' : 'Visible'}
        </span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
export default function StructureEditor({ projectSlug, pages: pagesProp }) {
  const [pages, setPages] = useState(pagesProp);

  function updateFieldLocal(fieldKey, changes) {
    setPages(prev => prev.map(page => ({
      ...page,
      sections: (page.sections ?? []).map(section => ({
        ...section,
        fields: (section.fields ?? []).map(f =>
          f.field_key === fieldKey ? { ...f, ...changes } : f
        ),
      })),
    })));
  }

  const totalFields = pages.reduce((acc, p) =>
    acc + (p.sections ?? []).reduce((a, s) => a + (s.fields ?? []).length, 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Structure Editor
        </h1>
        <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
          Control what your client can see and edit.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'flex-start',
        background: 'rgba(123,164,158,0.07)', border: '1px solid rgba(123,164,158,0.2)',
        borderRadius: '12px', padding: '14px 16px', marginBottom: '28px',
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
          <circle cx="8" cy="8" r="7" stroke="#7ba49e" strokeWidth="1.3"/>
          <path d="M8 7v4M8 5.5v.5" stroke="#7ba49e" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p style={{ color: '#4a7a74', fontSize: '13px', margin: 0, lineHeight: 1.55 }}>
          Fields are created automatically when you run the integration prompt in your client's codebase.
          Use this editor to control what your client can see and edit.
        </p>
      </div>

      {/* Empty state */}
      {totalFields === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#adc4c0', fontSize: '13.5px' }}>
          No fields yet — run the integration prompt on your client's codebase to get started.
        </div>
      )}

      {/* Pages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {pages.map(page => {
          const pageFieldCount = (page.sections ?? []).reduce((a, s) => a + (s.fields ?? []).length, 0);
          return (
            <div key={page.id} style={{
              background: '#fff', border: '1px solid #dde8e5',
              borderRadius: '14px', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(11,31,29,0.05)',
            }}>
              {/* Page header */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid #edf2f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{ color: '#1a2e2a', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                  {page.label}
                </p>
                <span style={{ color: '#adc4c0', fontSize: '11.5px' }}>
                  {pageFieldCount} field{pageFieldCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Sections */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(page.sections ?? []).map(section => {
                  const sectionFields = section.fields ?? [];
                  return (
                    <div key={section.id}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}>
                        <p style={{ color: '#7a9a96', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                          {section.label}
                        </p>
                        <span style={{ color: '#adc4c0', fontSize: '11px' }}>
                          {sectionFields.length} field{sectionFields.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {sectionFields.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sectionFields.map(field => (
                            <FieldRow
                              key={field.field_key}
                              field={field}
                              projectSlug={projectSlug}
                              onUpdate={updateFieldLocal}
                            />
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#adc4c0', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
                          No fields in this section.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
