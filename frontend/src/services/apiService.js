const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, body.error ?? body.message ?? response.statusText)
  }

  return response.json()
}

// Converts a backend Resource object to the shape the frontend components expect.
// icon is optional — categories carry the icon, not individual resources.
export function normalizeResource(apiResource, icon = '✨') {
  return {
    id: apiResource.id,
    icon,
    title: apiResource.title,
    description: apiResource.description,
    contact: apiResource.contact_info ?? '',
    audioText: apiResource.audio_fallback_text || apiResource.description,
    category: apiResource.category_name ?? '',
    keywords: apiResource.keywords
      ? apiResource.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [],
  }
}

// Flattens a Category object (with nested resources) into a list of normalized resources,
// carrying the category icon down to each resource card.
export function normalizeCategoryResources(category) {
  return (category.resources ?? []).map((r) => normalizeResource(r, category.icon ?? '✨'))
}

// POST /api/match/
// Returns a normalized resource, or null if no match found.
export async function matchQuery(query) {
  const data = await apiFetch('/api/match/', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })

  // Direct resource match
  if (data.title) {
    return normalizeResource(data)
  }

  // Fallback: backend returned the general-support category
  if (data.resources?.length) {
    return normalizeResource(data.resources[0], data.icon)
  }

  // { message: "No match found" } — nothing useful
  return null
}

// GET /api/categories/  (returns all categories with nested resources, unpaginated)
export async function getCategories() {
  return apiFetch('/api/categories/')
}

// GET /api/resources/?category=<slug>
export async function getResources(categorySlug) {
  const qs = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''
  return apiFetch(`/api/resources/${qs}`)
}
