const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getContent(projectSlug) {
  const res = await fetch(`${API_BASE}/content/${projectSlug}`);
  if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);
  return res.json();
}

export async function updateField(projectSlug, fieldKey, fieldValue) {
  const res = await fetch(`${API_BASE}/content/${projectSlug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field_key: fieldKey, field_value: fieldValue }),
  });
  if (!res.ok) throw new Error(`Failed to update field: ${res.status}`);
  return res.json();
}
