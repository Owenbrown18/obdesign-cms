require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
// ALLOWED_ORIGIN=* opens the API to all origins (public read; writes protected by auth)
// ALLOWED_ORIGIN=https://example.com restricts to a single origin
// Unset falls back to localhost for local development
const corsOrigin = process.env.ALLOWED_ORIGIN === '*'
  ? '*'
  : (process.env.ALLOWED_ORIGIN || 'http://localhost:5173');

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: jpeg, png, webp, gif`));
  },
});

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, err => err ? reject(err) : resolve());
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helper ─────────────────────────────────────────────────

async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, created_at')
    .eq('slug', slug)
    .single();
  return { project: data ?? null, error };
}

// ── Content ────────────────────────────────────────────────

app.get('/content/:projectSlug', async (req, res) => {
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data: fields, error } = await supabase
    .from('content')
    .select('field_key, field_label, field_value, field_type, section_id')
    .eq('project_id', project.id)
    .eq('hidden', false);

  if (error) return res.status(500).json({ error: error.message });

  const content = {};
  for (const field of fields) content[field.field_key] = field.field_value;

  res.json({ slug: req.params.projectSlug, content, fields });
});

app.put('/content/:projectSlug', async (req, res) => {
  const { field_key, field_value } = req.body;
  if (!field_key || field_value === undefined)
    return res.status(400).json({ error: 'field_key and field_value are required' });

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data, error } = await supabase
    .from('content')
    .update({ field_value })
    .eq('project_id', project.id)
    .eq('field_key', field_key)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ updated: data });
});

// ── Structure (read) ───────────────────────────────────────

app.get('/structure/:projectSlug', async (req, res) => {
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, slug, label, sort_order, sections ( id, slug, label, description, sort_order )')
    .eq('project_id', project.id);

  if (error) return res.status(500).json({ error: error.message });

  // Fetch ALL fields including hidden ones so the structure editor sees everything
  const { data: allFields } = await supabase
    .from('content')
    .select('field_key, field_label, field_type, section_id, hidden')
    .eq('project_id', project.id);

  pages?.sort((a, b) => a.sort_order - b.sort_order);
  pages?.forEach(p => {
    p.sections?.sort((a, b) => a.sort_order - b.sort_order);
    p.sections?.forEach(s => {
      s.fields = (allFields ?? []).filter(f => f.section_id === s.id);
    });
  });

  res.json({ pages, projectName: project.name });
});

// ── Structure (write) ──────────────────────────────────────

app.post('/structure/:projectSlug/pages', async (req, res) => {
  const { label, slug } = req.body;
  if (!label || !slug) return res.status(400).json({ error: 'label and slug required' });

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data: last } = await supabase
    .from('pages').select('sort_order').eq('project_id', project.id)
    .order('sort_order', { ascending: false }).limit(1);

  const sort_order = (last?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('pages')
    .insert({ project_id: project.id, label, slug, sort_order })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ page: { ...data, sections: [] } });
});

app.post('/structure/:projectSlug/sections', async (req, res) => {
  const { page_id, label, slug, description = '' } = req.body;
  if (!page_id || !label || !slug) return res.status(400).json({ error: 'page_id, label, slug required' });

  const { data: last } = await supabase
    .from('sections').select('sort_order').eq('page_id', page_id)
    .order('sort_order', { ascending: false }).limit(1);

  const sort_order = (last?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('sections')
    .insert({ page_id, label, slug, description, sort_order })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ section: data });
});

app.post('/structure/:projectSlug/fields', async (req, res) => {
  const { section_id, field_key, field_label, field_type = 'text', field_value = '' } = req.body;
  if (!section_id || !field_key || !field_label)
    return res.status(400).json({ error: 'section_id, field_key, field_label required' });

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data, error } = await supabase
    .from('content')
    .insert({ project_id: project.id, section_id, field_key, field_label, field_type, field_value })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ field: data });
});

app.patch('/structure/:projectSlug/fields/:fieldKey', async (req, res) => {
  const { fieldKey } = req.params;
  const { hidden, field_label } = req.body;

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const updates = {};
  if (hidden    !== undefined) updates.hidden      = hidden;
  if (field_label !== undefined) updates.field_label = field_label;
  if (!Object.keys(updates).length)
    return res.status(400).json({ error: 'Nothing to update' });

  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('project_id', project.id)
    .eq('field_key', fieldKey)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ field: data });
});

app.delete('/structure/:projectSlug/pages/:pageId', async (req, res) => {
  const { pageId } = req.params;
  const { data: sections } = await supabase.from('sections').select('id').eq('page_id', pageId);
  const ids = sections?.map(s => s.id) ?? [];
  if (ids.length) await supabase.from('content').delete().in('section_id', ids);
  const { error } = await supabase.from('pages').delete().eq('id', pageId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

app.delete('/structure/:projectSlug/sections/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  await supabase.from('content').delete().eq('section_id', sectionId);
  const { error } = await supabase.from('sections').delete().eq('id', sectionId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

app.delete('/structure/:projectSlug/fields/:fieldKey', async (req, res) => {
  const { fieldKey } = req.params;
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });
  const { error } = await supabase.from('content')
    .delete().eq('project_id', project.id).eq('field_key', fieldKey);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

// ── Profile ────────────────────────────────────────────────

app.get('/profile/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles').select('id, email, role').eq('id', req.params.userId).single();
  if (error || !data) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

// ── Developer projects ─────────────────────────────────────

app.get('/developer/:developerId/projects', async (req, res) => {
  const { developerId } = req.params;

  const { data: links, error: linkErr } = await supabase
    .from('developer_projects').select('project_id').eq('developer_id', developerId);
  if (linkErr) return res.status(500).json({ error: linkErr.message });
  if (!links.length) return res.json({ projects: [] });

  const { data: projects, error: projErr } = await supabase
    .from('projects').select('id, name, slug, created_at').in('id', links.map(r => r.project_id));
  if (projErr) return res.status(500).json({ error: projErr.message });

  const enriched = await Promise.all(projects.map(async project => {
    const [{ count: pageCount }, { count: fieldCount }, { data: lastContent }] = await Promise.all([
      supabase.from('pages').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
      supabase.from('content').select('*', { count: 'exact', head: true }).eq('project_id', project.id),
      supabase.from('content').select('created_at').eq('project_id', project.id)
        .order('created_at', { ascending: false }).limit(1),
    ]);
    return { ...project, page_count: pageCount ?? 0, field_count: fieldCount ?? 0,
      last_updated: lastContent?.[0]?.created_at ?? project.created_at };
  }));

  res.json({ projects: enriched });
});

app.post('/developer/:developerId/projects', async (req, res) => {
  const { developerId } = req.params;
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });

  const { data: project, error: projErr } = await supabase
    .from('projects').insert({ name, slug }).select().single();
  if (projErr) return res.status(500).json({ error: projErr.message });

  const { error: linkErr } = await supabase
    .from('developer_projects').insert({ developer_id: developerId, project_id: project.id });
  if (linkErr) return res.status(500).json({ error: linkErr.message });

  res.status(201).json({ project });
});

// ── Client project ─────────────────────────────────────────

app.get('/client/:userId/project', async (req, res) => {
  const { data: link, error } = await supabase
    .from('client_projects').select('project_id').eq('client_id', req.params.userId).single();
  if (error || !link) return res.status(404).json({ error: 'No project assigned' });

  const { data: project, error: pErr } = await supabase
    .from('projects').select('id, name, slug').eq('id', link.project_id).single();
  if (pErr || !project) return res.status(500).json({ error: 'Project not found' });

  res.json({ project });
});

// ── Project clients ────────────────────────────────────────

app.get('/project/:projectSlug/clients', async (req, res) => {
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data: links, error: linkErr } = await supabase
    .from('client_projects').select('client_id').eq('project_id', project.id);
  if (linkErr) return res.status(500).json({ error: linkErr.message });
  if (!links.length) return res.json({ clients: [] });

  const { data: clients, error: profileErr } = await supabase
    .from('profiles').select('id, email, role, created_at').in('id', links.map(r => r.client_id));
  if (profileErr) return res.status(500).json({ error: profileErr.message });

  res.json({ clients });
});

app.post('/project/:projectSlug/clients', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const { data: devLink } = await supabase
    .from('developer_projects').select('developer_id').eq('project_id', project.id).single();

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (authErr) return res.status(500).json({ error: authErr.message });

  const userId = authData.user.id;

  await supabase.from('profiles').insert({ id: userId, email, role: 'client' });
  await supabase.from('client_projects').insert({
    client_id: userId, project_id: project.id,
    developer_id: devLink?.developer_id ?? null,
  });

  res.status(201).json({ client: { id: userId, email, role: 'client' } });
});

app.delete('/project/:projectSlug/clients/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  await supabase.from('client_projects').delete()
    .eq('client_id', clientId).eq('project_id', project.id);

  res.json({ deleted: true });
});

app.delete('/project/:projectSlug', async (req, res) => {
  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  // Delete content first (project_id FK may not cascade)
  await supabase.from('content').delete().eq('project_id', project.id);
  // Delete pages (cascades to sections)
  await supabase.from('pages').delete().eq('project_id', project.id);
  // Delete project (cascades developer_projects and client_projects)
  const { error } = await supabase.from('projects').delete().eq('id', project.id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ deleted: true });
});

app.post('/project/:projectSlug/clients/:clientId/reset-password', async (req, res) => {
  const { clientId } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password required' });

  const { error } = await supabase.auth.admin.updateUserById(clientId, { password });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ reset: true });
});

// ── Image upload ───────────────────────────────────────────

app.post('/upload/:projectSlug', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5 MB)' : err.message;
    return res.status(400).json({ error: msg });
  }

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { project, error: pErr } = await getProjectBySlug(req.params.projectSlug);
  if (pErr || !project) return res.status(404).json({ error: 'Project not found' });

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${req.params.projectSlug}/${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from('cms-images')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (uploadErr) return res.status(500).json({ error: uploadErr.message });

  const { data } = supabase.storage.from('cms-images').getPublicUrl(path);
  res.json({ url: data.publicUrl });
});

// ── Start ──────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OBDesign CMS API running on port ${PORT}`));
