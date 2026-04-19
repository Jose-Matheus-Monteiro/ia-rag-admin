const BASE = '/api'

let _token: string | null = localStorage.getItem('token')

export function setToken(t: string) {
  _token = t
  localStorage.setItem('token', t)
}

export function clearToken() {
  _token = null
  localStorage.removeItem('token')
}

export function hasToken() {
  return !!_token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams({ username, password, grant_type: 'password' })
    return fetch(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    }).then(async (r) => {
      if (!r.ok) throw new Error('Credenciais inválidas')
      return r.json() as Promise<{ access_token: string }>
    })
  },

  getNodes: (parentId?: string) =>
    request<Node[]>(`/nodes${parentId ? `?parent_id=${parentId}` : ''}`),

  getNode: (id: string) => request<Node>(`/nodes/${id}`),

  createNode: (body: NodeCreate) =>
    request<Node>('/nodes', { method: 'POST', body: JSON.stringify(body) }),

  updateNode: (id: string, body: NodeUpdate) =>
    request<Node>(`/nodes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteNode: (id: string) => request<void>(`/nodes/${id}`, { method: 'DELETE' }),

  getVersions: (id: string) => request<NodeVersion[]>(`/nodes/${id}/versions`),

  restoreVersion: (id: string, version: number) =>
    request<Node>(`/nodes/${id}/versions/${version}/restore`, { method: 'POST' }),

  publishNode: (id: string) => request<unknown>(`/nodes/${id}/publish`, { method: 'POST' }),

  unpublishNode: (id: string) => request<Node>(`/nodes/${id}/unpublish`, { method: 'POST' }),

  scrape: (url: string) =>
    request<ScrapeResult>('/scrape', { method: 'POST', body: JSON.stringify({ url }) }),
}

export interface Node {
  id: string
  parent_id: string | null
  name: string
  text_content: string | null
  source_url: string | null
  status: 'draft' | 'active' | 'archived'
  version: number
  created_at: string | null
  updated_at: string | null
  published_at: string | null
  has_children: boolean
  children?: Node[]
}

export interface NodeCreate {
  name: string
  parent_id?: string | null
  text_content?: string | null
  source_url?: string | null
}

export interface NodeUpdate {
  name?: string
  text_content?: string | null
  source_url?: string | null
  status?: string
  change_note?: string
}

export interface NodeVersion {
  id: string
  version: number
  name: string
  text_content: string | null
  source_url: string | null
  status: string
  change_note: string | null
  changed_at: string | null
}

export interface ScrapeResult {
  url: string
  text: string | null
  html: string | null
}
