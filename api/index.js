require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /content/:projectSlug — return all content fields for a project
app.get('/content/:projectSlug', async (req, res) => {
  const { projectSlug } = req.params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('content')
    .select('field_key, field_label, field_value, field_type')
    .eq('project_id', project.id);

  if (fieldsError) {
    return res.status(500).json({ error: fieldsError.message });
  }

  // Return as a flat key→value map alongside the full field metadata
  const content = {};
  for (const field of fields) {
    content[field.field_key] = field.field_value;
  }

  res.json({ slug: projectSlug, content, fields });
});

// PUT /content/:projectSlug — update a single field value
// Body: { field_key: string, field_value: string }
app.put('/content/:projectSlug', async (req, res) => {
  const { projectSlug } = req.params;
  const { field_key, field_value } = req.body;

  if (!field_key || field_value === undefined) {
    return res.status(400).json({ error: 'field_key and field_value are required' });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { data, error } = await supabase
    .from('content')
    .update({ field_value })
    .eq('project_id', project.id)
    .eq('field_key', field_key)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ updated: data });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OBDesign CMS API running on port ${PORT}`);
});
