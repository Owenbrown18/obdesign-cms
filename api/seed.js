require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PROJECT_SLUG = 'suzanne-site';

const fields = [
  { field_key: 'hero_title',     field_label: 'Hero Title',       field_type: 'text',     field_value: 'Welcome to My Site' },
  { field_key: 'hero_subtitle',  field_label: 'Hero Subtitle',    field_type: 'text',     field_value: 'A short tagline here' },
  { field_key: 'about_text',     field_label: 'About Section',    field_type: 'textarea', field_value: 'About me text here' },
  { field_key: 'contact_email',  field_label: 'Contact Email',    field_type: 'text',     field_value: 'suzanne@example.com' },
];

async function seed() {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', PROJECT_SLUG)
    .single();

  if (projectError || !project) {
    console.error('Project not found:', projectError?.message);
    process.exit(1);
  }

  const rows = fields.map(f => ({ ...f, project_id: project.id }));

  const { data, error } = await supabase
    .from('content')
    .upsert(rows, { onConflict: 'project_id,field_key' })
    .select();

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} fields for "${PROJECT_SLUG}":`);
  data.forEach(r => console.log(`  ${r.field_key}: "${r.field_value}"`));
}

seed();
