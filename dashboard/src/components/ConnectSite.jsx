import { useState } from 'react';
import { API_BASE } from '../lib/api';

const C = {
  accent:  '#7ba49e',
  heading: '#1a2e2a',
  sub:     '#7a9a96',
  muted:   '#adc4c0',
  border:  '#dde8e5',
  card:    '#ffffff',
};

const STEPS = [
  {
    n: '1',
    title: 'Open Claude Code',
    desc: "Open Claude Code in your client's website project folder.",
  },
  {
    n: '2',
    title: 'Copy & Paste the Prompt',
    desc: 'Paste the integration prompt below into Claude Code and let it run.',
  },
  {
    n: '3',
    title: "You're Done",
    desc: 'Claude Code will read the codebase, create your content structure automatically, add the correct IDs to the HTML, and drop in the fetch script.',
  },
];

const WHAT_IT_DOES = [
  "Read your client's codebase and identify all editable content",
  'Create pages, sections, and fields in your CMS automatically via the API — no manual setup needed',
  'Add cms- prefixed IDs to the correct HTML elements',
  'Insert the fetch script that pulls content from the CMS on page load',
  'Changes go live instantly after that — no redeployment needed',
];

function buildPrompt(projectSlug, apiBase, pages, fields) {
  const existingStructure = pages.length > 0
    ? [
        '',
        'EXISTING STRUCTURE (already in CMS — do not recreate):',
        ...pages.flatMap(page =>
          (page.sections ?? []).flatMap(section => {
            const sectionFields = fields.filter(f => f.section_id === section.id);
            return [
              `  Page: "${page.label}" / Section: "${section.label}"`,
              ...sectionFields.map(f => `    - ${f.field_key} (${f.field_type}): "${f.field_label}"`),
            ];
          })
        ),
      ].join('\n')
    : '';

  return `You are integrating a website with OBDesign CMS.

CMS API: ${apiBase}
Project slug: ${projectSlug}

STEP 1 — ANALYZE THE CODEBASE:
Read all HTML, CSS, and JavaScript files in this project.
Identify every piece of text content that the site owner might want to edit — headings, paragraphs, taglines, contact info, service descriptions, image src attributes, etc.
Group them logically by page and section.

STEP 2 — CREATE THE CMS STRUCTURE:
For each page and section you identified, create the structure in the CMS by calling the API:

Create a page:
POST ${apiBase}/structure/${projectSlug}/pages
Body: { "label": "Page Name", "slug": "page-slug" }

Create a section:
POST ${apiBase}/structure/${projectSlug}/pages/[pageSlug]/sections
Body: { "label": "Section Name", "slug": "section-slug" }

Create a field:
POST ${apiBase}/structure/${projectSlug}/pages/[pageSlug]/sections/[sectionSlug]/fields
Body: {
  "field_label": "Hero Title",
  "field_key": "hero_title",
  "field_type": "text",
  "field_value": "current text from the HTML as default value"
}

Use field_type "text" for short text, "textarea" for long paragraphs, "image" for images.

STEP 3 — UPDATE THE HTML:
For each field created, add a cms- prefixed ID to the corresponding HTML element.
Use the field_key as the ID:
  <h1 id="cms-hero_title">existing text</h1>
Keep all existing text as fallback content.

STEP 4 — ADD THE FETCH SCRIPT:
Add this script just before the closing </body> tag:

<script>
const CMS_API = '${apiBase}/content/${projectSlug}';
fetch(CMS_API)
  .then(r => r.json())
  .then(data => {
    (data.fields || []).forEach(field => {
      const el = document.getElementById('cms-' + field.field_key);
      if (!el) return;
      if (field.field_type === 'image') {
        el.src = field.field_value;
      } else {
        el.textContent = field.field_value;
      }
    });
  })
  .catch(() => {});
</script>

STEP 5 — CONFIRM:
List every field you created with its key, page, section, and the HTML element it maps to.${existingStructure}`;
}

export default function ConnectSite({ projectSlug, pages, fields }) {
  const [copied, setCopied]             = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);

  const prompt = buildPrompt(projectSlug, API_BASE, pages, fields);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: C.heading, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Connect Site
        </h1>
        <p style={{ color: C.sub, fontSize: '13.5px', margin: 0 }}>
          Automatically wire OBDesign CMS into your client's website using AI. Takes about 2 minutes.
        </p>
      </div>

      {/* ── How It Works ───────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: C.accent, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
          How It Works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {STEPS.map(step => (
            <div key={step.n} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
              padding: '18px 20px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(123,164,158,0.1)', border: '1px solid rgba(123,164,158,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.accent, fontSize: '12px', fontWeight: 700, marginBottom: '12px', flexShrink: 0,
              }}>{step.n}</div>
              <p style={{ color: C.heading, fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>{step.title}</p>
              <p style={{ color: C.sub, fontSize: '12.5px', margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What Claude Code Will Do ────────────────────── */}
      <div style={{
        background: 'rgba(123,164,158,0.06)', border: '1px solid rgba(123,164,158,0.18)',
        borderRadius: '12px', padding: '18px 20px', marginBottom: '28px',
      }}>
        <p style={{ color: C.accent, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          What Claude Code Will Do
        </p>
        <p style={{ color: C.heading, fontSize: '13px', margin: '0 0 12px' }}>
          The prompt instructs Claude Code to:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {WHAT_IT_DOES.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: C.accent, flexShrink: 0, marginTop: '6px',
              }} />
              <p style={{ color: '#3d5a55', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Integration Prompt ──────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: C.accent, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
          Your Integration Prompt
        </p>
        <div style={{ position: 'relative' }}>
          <pre style={{
            background: '#0b1f1d', color: '#7ba49e', fontSize: '11.5px', lineHeight: 1.75,
            padding: '20px 20px', paddingRight: '80px', borderRadius: '12px',
            border: '1px solid rgba(123,164,158,0.15)', margin: 0,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
          }}>{prompt}</pre>
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute', top: '12px', right: '12px',
              padding: '6px 14px',
              background: copied ? 'rgba(123,164,158,0.3)' : 'rgba(123,164,158,0.12)',
              border: '1px solid rgba(123,164,158,0.35)', borderRadius: '8px',
              color: '#7ba49e', fontSize: '10px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* ── Current Structure ───────────────────────────── */}
      {pages.length > 0 && (
        <div>
          <button
            onClick={() => setStructureOpen(v => !v)}
            style={{
              width: '100%', padding: '12px 18px',
              background: structureOpen ? 'rgba(123,164,158,0.08)' : 'transparent',
              border: '1px solid rgba(123,164,158,0.2)', borderRadius: '10px',
              color: C.sub, fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,164,158,0.08)'; }}
            onMouseLeave={e => { if (!structureOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <span>Current Structure — {pages.length} page{pages.length !== 1 ? 's' : ''}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: structureOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {structureOpen && (
            <div style={{
              marginTop: '8px', background: C.card,
              border: `1px solid ${C.border}`, borderRadius: '12px',
              padding: '20px 22px', boxShadow: '0 2px 12px rgba(11,31,29,0.05)',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}>
              {pages.map(page => (
                <div key={page.id}>
                  <p style={{
                    color: C.heading, fontSize: '11px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px',
                  }}>
                    {page.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                    {(page.sections ?? []).map(section => {
                      const sectionFields = fields.filter(f => f.section_id === section.id);
                      return (
                        <div key={section.id}>
                          <p style={{ color: C.sub, fontSize: '12px', fontWeight: 600, margin: '0 0 5px' }}>
                            {section.label}
                          </p>
                          {sectionFields.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px' }}>
                              {sectionFields.map(f => (
                                <div key={f.field_key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <code style={{
                                    color: C.accent, fontSize: '11px',
                                    background: 'rgba(123,164,158,0.08)',
                                    padding: '1px 7px', borderRadius: '4px',
                                    fontFamily: 'ui-monospace, monospace',
                                  }}>{f.field_key}</code>
                                  <span style={{ color: '#5a7a76', fontSize: '12px' }}>{f.field_label}</span>
                                  <span style={{
                                    color: 'rgba(123,164,158,0.5)', fontSize: '10px',
                                    background: 'rgba(123,164,158,0.06)', padding: '1px 5px',
                                    borderRadius: '3px', fontWeight: 600,
                                  }}>{f.field_type}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: C.muted, fontSize: '12px', margin: '0 0 0 10px', fontStyle: 'italic' }}>
                              No fields
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
