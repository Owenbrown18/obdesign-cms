require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PROJECT_SLUG = 'suzanne-site';

const STRUCTURE = [
  {
    slug: 'home', label: 'Home', sort_order: 0,
    sections: [
      { slug: 'hero', label: 'Hero', description: 'Your main banner content', sort_order: 0 },
    ],
  },
  {
    slug: 'about', label: 'About', sort_order: 1,
    sections: [
      { slug: 'main', label: 'Main Content', description: 'Your story and background', sort_order: 0 },
    ],
  },
  {
    slug: 'contact', label: 'Contact', sort_order: 2,
    sections: [
      { slug: 'info', label: 'Contact Info', description: 'How clients can reach you', sort_order: 0 },
    ],
  },
];

const FIELDS = [
  { field_key: 'hero_title',    field_label: 'Hero Title',    field_type: 'text',     field_value: 'Welcome to My Site', page: 'home',    section: 'hero' },
  { field_key: 'hero_subtitle', field_label: 'Hero Subtitle', field_type: 'text',     field_value: 'A short tagline here', page: 'home',   section: 'hero' },
  { field_key: 'about_text',    field_label: 'About Section', field_type: 'textarea', field_value: 'About me text here',  page: 'about',   section: 'main' },
  { field_key: 'contact_email', field_label: 'Contact Email', field_type: 'text',     field_value: 'suzanne@example.com', page: 'contact', section: 'info' },
];

async function seed() {
  const { data: project } = await supabase
    .from('projects').select('id').eq('slug', PROJECT_SLUG).single();

  if (!project) { console.error('Project not found'); process.exit(1); }

  // Upsert pages and sections, building a map of "page/section" → section.id
  const sectionIdMap = {};

  for (const page of STRUCTURE) {
    const { data: pageRow, error: pageErr } = await supabase
      .from('pages')
      .upsert(
        { project_id: project.id, slug: page.slug, label: page.label, sort_order: page.sort_order },
        { onConflict: 'project_id,slug' }
      )
      .select('id').single();

    if (pageErr) { console.error('Page upsert failed:', pageErr.message); process.exit(1); }

    for (const section of page.sections) {
      const { data: sectionRow, error: secErr } = await supabase
        .from('sections')
        .upsert(
          { page_id: pageRow.id, slug: section.slug, label: section.label, description: section.description, sort_order: section.sort_order },
          { onConflict: 'page_id,slug' }
        )
        .select('id').single();

      if (secErr) { console.error('Section upsert failed:', secErr.message); process.exit(1); }
      sectionIdMap[`${page.slug}/${section.slug}`] = sectionRow.id;
    }
  }

  // Upsert content fields with section_id
  for (const field of FIELDS) {
    const section_id = sectionIdMap[`${field.page}/${field.section}`];
    const { field_key, field_label, field_type, field_value } = field;

    const { error } = await supabase
      .from('content')
      .upsert(
        { project_id: project.id, section_id, field_key, field_label, field_type, field_value },
        { onConflict: 'project_id,field_key' }
      );

    if (error) { console.error(`Field upsert failed (${field_key}):`, error.message); process.exit(1); }
    console.log(`  ${field_key} → ${field.page}/${field.section}`);
  }

  console.log('Seed complete.');
}

seed();
