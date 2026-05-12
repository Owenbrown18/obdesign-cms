import { useState } from 'react';
import { addPage, addSection, addField, deletePage, deleteSection, deleteField, API_BASE } from '../lib/api';

const FIELD_TYPES = ['text', 'textarea', 'image'];

const S = {
  label: { color: '#7ba49e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '5px' },
  input: { width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '8px 11px', color: '#1a2e2a', fontSize: '13px', fontFamily: 'inherit' },
  monoInput: { width: '100%', background: '#f4f9f7', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '8px 11px', color: '#1a2e2a', fontSize: '12px', fontFamily: 'ui-monospace, monospace' },
  addBtn: { padding: '7px 14px', background: '#7ba49e', color: '#0b1f1d', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer', transition: 'all 0.15s' },
  cancelBtn: { padding: '7px 12px', background: 'transparent', border: '1px solid #d4e6e1', borderRadius: '7px', color: '#7a9a96', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  deleteBtn: { padding: '3px 8px', background: 'transparent', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '5px', color: 'rgba(220,38,38,0.5)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function FieldRow({ field, projectSlug, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete field "${field.field_key}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteField(projectSlug, field.field_key);
      onDeleted(field.field_key);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#f4f9f7', borderRadius: '7px', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#1a2e2a', fontSize: '12.5px', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>{field.field_key}</span>
        <span style={{ color: '#adc4c0', fontSize: '11px' }}>{field.field_label}</span>
        <span style={{ background: 'rgba(123,164,158,0.12)', color: '#7ba49e', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}>{field.field_type}</span>
      </div>
      <button onClick={handleDelete} disabled={deleting}
        style={S.deleteBtn}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,0.5)'; }}>
        {deleting ? '…' : 'Delete'}
      </button>
    </div>
  );
}

function AddFieldForm({ projectSlug, sectionId, onAdded, onCancel }) {
  const [key, setKey]     = useState('');
  const [label, setLabel] = useState('');
  const [type, setType]   = useState('text');
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState(null);

  function handleLabelChange(val) {
    setLabel(val);
    if (!key || key === slugify(label)) setKey(slugify(val));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const { field } = await addField(projectSlug, sectionId, key, label, type);
      onAdded(field);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#eef4f2', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={S.label}>Label</label>
          <input className="ob-input" style={S.input} required value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="Hero Title" />
        </div>
        <div>
          <label style={S.label}>Key</label>
          <input className="ob-input" style={S.monoInput} required value={key} onChange={e => setKey(e.target.value)} placeholder="hero_title" />
        </div>
      </div>
      <div>
        <label style={S.label}>Type</label>
        <select style={{ ...S.input, cursor: 'pointer' }} value={type} onChange={e => setType(e.target.value)}>
          {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {type === 'image' && (
          <p style={{ color: '#7ba49e', fontSize: '11px', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="#7ba49e" strokeWidth="1.1"/><path d="M5.5 4.5v3M5.5 3.5v.2" stroke="#7ba49e" strokeWidth="1.1" strokeLinecap="round"/></svg>
            After adding this field, open the section in the sidebar to upload an image.
          </p>
        )}
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={saving} style={S.addBtn}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#5e8a86'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7ba49e'; }}
        >{saving ? 'Adding…' : 'Add Field'}</button>
        <button type="button" onClick={onCancel} style={S.cancelBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.12)'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d4e6e1'; e.currentTarget.style.color = '#7a9a96'; }}
        >Cancel</button>
      </div>
    </form>
  );
}

function SectionBlock({ projectSlug, section, fields, onFieldAdded, onFieldDeleted, onSectionDeleted }) {
  const [showAddField, setShowAddField] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sectionFields = fields.filter(f => f.section_id === section.id);

  async function handleDeleteSection() {
    if (!confirm(`Delete section "${section.label}" and all its fields?`)) return;
    setDeleting(true);
    try {
      await deleteSection(projectSlug, section.id);
      onSectionDeleted(section.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4a7a76', fontSize: '12px', fontWeight: 700 }}>{section.label}</span>
          {section.description && <span style={{ color: '#adc4c0', fontSize: '11px' }}>{section.description}</span>}
        </div>
        <button onClick={handleDeleteSection} disabled={deleting}
          style={S.deleteBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,0.5)'; }}>
          {deleting ? '…' : 'Delete'}
        </button>
      </div>

      <div style={{ paddingLeft: '0' }}>
        {sectionFields.map(f => (
          <FieldRow key={f.field_key} field={f} projectSlug={projectSlug} onDeleted={onFieldDeleted} />
        ))}
        {sectionFields.length === 0 && !showAddField && (
          <p style={{ color: '#adc4c0', fontSize: '12px', margin: '0 0 6px', fontStyle: 'italic' }}>No fields yet</p>
        )}
        {showAddField
          ? <AddFieldForm projectSlug={projectSlug} sectionId={section.id}
              onAdded={f => { onFieldAdded(f); setShowAddField(false); }}
              onCancel={() => setShowAddField(false)} />
          : <button onClick={() => setShowAddField(true)} style={{ ...S.cancelBtn, fontSize: '10.5px', marginTop: '2px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.12)'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d4e6e1'; e.currentTarget.style.color = '#7a9a96'; }}
            >+ Add Field</button>
        }
      </div>
    </div>
  );
}

function AddSectionForm({ projectSlug, pageId, onAdded, onCancel }) {
  const [label, setLabel]   = useState('');
  const [slug, setSlug]     = useState('');
  const [desc, setDesc]     = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);

  function handleLabelChange(val) {
    setLabel(val);
    if (!slug || slug === slugify(label)) setSlug(slugify(val));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const { section } = await addSection(projectSlug, pageId, label, slug, desc);
      onAdded(section);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#eef4f2', border: '1px solid #d4e6e1', borderRadius: '8px', padding: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={S.label}>Label</label>
          <input className="ob-input" style={S.input} required value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="Hero" />
        </div>
        <div>
          <label style={S.label}>Slug</label>
          <input className="ob-input" style={S.monoInput} required value={slug} onChange={e => setSlug(e.target.value)} placeholder="hero" />
        </div>
      </div>
      <div>
        <label style={S.label}>Description</label>
        <input className="ob-input" style={S.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of this section" />
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={saving} style={S.addBtn}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#5e8a86'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7ba49e'; }}
        >{saving ? 'Adding…' : 'Add Section'}</button>
        <button type="button" onClick={onCancel} style={S.cancelBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.12)'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d4e6e1'; e.currentTarget.style.color = '#7a9a96'; }}
        >Cancel</button>
      </div>
    </form>
  );
}

function PageBlock({ projectSlug, page, fields, onSectionAdded, onFieldAdded, onFieldDeleted, onSectionDeleted, onPageDeleted }) {
  const [showAddSection, setShowAddSection] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeletePage() {
    if (!confirm(`Delete page "${page.label}" and everything inside it?`)) return;
    setDeleting(true);
    try {
      await deletePage(projectSlug, page.id);
      onPageDeleted(page.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '14px', padding: '20px 22px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ color: '#1a2e2a', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em' }}>{page.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#adc4c0', fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>{page.slug}</span>
          <button onClick={handleDeletePage} disabled={deleting}
            style={S.deleteBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,0.5)'; }}>
            {deleting ? '…' : 'Delete page'}
          </button>
        </div>
      </div>

      <div style={{ paddingLeft: '12px', borderLeft: '2px solid #eef4f2' }}>
        {page.sections?.map(section => (
          <SectionBlock key={section.id} projectSlug={projectSlug} section={section} fields={fields}
            onFieldAdded={onFieldAdded}
            onFieldDeleted={onFieldDeleted}
            onSectionDeleted={onSectionDeleted} />
        ))}
        {page.sections?.length === 0 && !showAddSection && (
          <p style={{ color: '#adc4c0', fontSize: '12px', margin: '0 0 8px', fontStyle: 'italic' }}>No sections yet</p>
        )}
        {showAddSection
          ? <AddSectionForm projectSlug={projectSlug} pageId={page.id}
              onAdded={s => { onSectionAdded(page.id, s); setShowAddSection(false); }}
              onCancel={() => setShowAddSection(false)} />
          : <button onClick={() => setShowAddSection(true)} style={{ ...S.cancelBtn, marginTop: '4px' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.12)'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d4e6e1'; e.currentTarget.style.color = '#7a9a96'; }}
            >+ Add Section</button>
        }
      </div>
    </div>
  );
}

function AddPageForm({ projectSlug, onAdded, onCancel }) {
  const [label, setLabel]   = useState('');
  const [slug, setSlug]     = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);

  function handleLabelChange(val) {
    setLabel(val);
    if (!slug || slug === slugify(label)) setSlug(slugify(val));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const { page } = await addPage(projectSlug, label, slug);
      onAdded(page);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #dde8e5', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ color: '#7ba49e', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>New Page</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={S.label}>Label</label>
          <input className="ob-input" style={S.input} required value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="Services" />
        </div>
        <div>
          <label style={S.label}>Slug</label>
          <input className="ob-input" style={S.monoInput} required value={slug} onChange={e => setSlug(e.target.value)} placeholder="services" />
        </div>
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={saving} style={S.addBtn}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#5e8a86'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7ba49e'; }}
        >{saving ? 'Adding…' : 'Add Page'}</button>
        <button type="button" onClick={onCancel} style={S.cancelBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.12)'; e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d4e6e1'; e.currentTarget.style.color = '#7a9a96'; }}
        >Cancel</button>
      </div>
    </form>
  );
}


export default function StructureEditor({ projectSlug, pages: initialPages, fields: initialFields, onStructureChange }) {
  const [pages, setPages]   = useState(initialPages);
  const [fields, setFields] = useState(initialFields);
  const [showAddPage, setShowAddPage] = useState(false);

  function updateAndNotify(newPages, newFields) {
    setPages(newPages);
    setFields(newFields ?? fields);
    onStructureChange(newPages, newFields ?? fields);
  }

  function handlePageAdded(page) {
    updateAndNotify([...pages, page], fields);
    setShowAddPage(false);
  }

  function handlePageDeleted(pageId) {
    const removed = pages.find(p => p.id === pageId);
    const removedSectionIds = new Set((removed?.sections ?? []).map(s => s.id));
    updateAndNotify(
      pages.filter(p => p.id !== pageId),
      fields.filter(f => !removedSectionIds.has(f.section_id))
    );
  }

  function handleSectionAdded(pageId, section) {
    updateAndNotify(pages.map(p =>
      p.id === pageId ? { ...p, sections: [...(p.sections ?? []), section] } : p
    ), fields);
  }

  function handleSectionDeleted(sectionId) {
    updateAndNotify(
      pages.map(p => ({ ...p, sections: p.sections?.filter(s => s.id !== sectionId) })),
      fields.filter(f => f.section_id !== sectionId)
    );
  }

  function handleFieldAdded(field) {
    updateAndNotify(pages, [...fields, field]);
  }

  function handleFieldDeleted(fieldKey) {
    updateAndNotify(pages, fields.filter(f => f.field_key !== fieldKey));
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#1a2e2a', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Structure Editor
        </h1>
        <p style={{ color: '#7a9a96', fontSize: '13.5px', margin: 0 }}>
          Manage pages, sections, and fields · changes take effect immediately
        </p>
      </div>

      {pages.map(page => (
        <PageBlock key={page.id} projectSlug={projectSlug} page={page} fields={fields}
          onSectionAdded={handleSectionAdded}
          onFieldAdded={handleFieldAdded}
          onFieldDeleted={handleFieldDeleted}
          onSectionDeleted={handleSectionDeleted}
          onPageDeleted={handlePageDeleted} />
      ))}

      {showAddPage
        ? <AddPageForm projectSlug={projectSlug} onAdded={handlePageAdded} onCancel={() => setShowAddPage(false)} />
        : (
          <button onClick={() => setShowAddPage(true)}
            style={{
              width: '100%', padding: '12px', background: 'transparent',
              border: '1.5px dashed #bcd4cf', borderRadius: '12px',
              color: '#7a9a96', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7ba49e'; e.currentTarget.style.color = '#7ba49e'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#bcd4cf'; e.currentTarget.style.color = '#7a9a96'; }}
          >
            + Add Page
          </button>
        )
      }

    </div>
  );
}
