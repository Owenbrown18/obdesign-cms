export const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) throw new Error('[CMS] VITE_API_URL is not set — add it to .env');
  return url;
})();

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

function json(method, body) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

// ── Content ────────────────────────────────────────────────
export const getContent  = slug => request(`/content/${slug}`);
export const updateField = (slug, field_key, field_value) =>
  request(`/content/${slug}`, json('PUT', { field_key, field_value }));

// ── Structure (read) ───────────────────────────────────────
export const getStructure = slug => request(`/structure/${slug}`);

// ── Structure (write) ──────────────────────────────────────
export const addPage    = (slug, label, pageSlug) =>
  request(`/structure/${slug}/pages`, json('POST', { label, slug: pageSlug }));
export const addSection = (slug, page_id, label, sectionSlug, description) =>
  request(`/structure/${slug}/sections`, json('POST', { page_id, label, slug: sectionSlug, description }));
export const addField   = (slug, section_id, field_key, field_label, field_type) =>
  request(`/structure/${slug}/fields`, json('POST', { section_id, field_key, field_label, field_type }));

export const deletePage    = (slug, pageId)    => request(`/structure/${slug}/pages/${pageId}`,       { method: 'DELETE' });
export const deleteSection = (slug, sectionId) => request(`/structure/${slug}/sections/${sectionId}`, { method: 'DELETE' });
export const deleteField   = (slug, fieldKey)  => request(`/structure/${slug}/fields/${fieldKey}`,    { method: 'DELETE' });

// ── Profile ────────────────────────────────────────────────
export const getProfile = userId => request(`/profile/${userId}`);

// ── Developer projects ─────────────────────────────────────
export const getDeveloperProjects = developerId => request(`/developer/${developerId}/projects`);
export const createProject        = (developerId, name, slug) =>
  request(`/developer/${developerId}/projects`, json('POST', { name, slug }));

// ── Client project (for client dashboard) ─────────────────
export const getClientProject = userId => request(`/client/${userId}/project`);

// ── Project clients ────────────────────────────────────────
export const getClients           = slug => request(`/project/${slug}/clients`);
export const createClient         = (slug, email, password) =>
  request(`/project/${slug}/clients`, json('POST', { email, password }));
export const deleteProject        = slug =>
  request(`/project/${slug}`, { method: 'DELETE' });
export const uploadImage          = (slug, file) => {
  const form = new FormData();
  form.append('file', file);
  return request(`/upload/${slug}`, { method: 'POST', body: form });
};
export const removeClient         = (slug, clientId) =>
  request(`/project/${slug}/clients/${clientId}`, { method: 'DELETE' });
export const resetClientPassword  = (slug, clientId, password) =>
  request(`/project/${slug}/clients/${clientId}/reset-password`, json('POST', { password }));
