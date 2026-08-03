const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'postura_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),

  saveCalibration: (data: { neck_angle: number; shoulder_tilt: number; torso_lean: number }) =>
    request('/calibration', { method: 'POST', body: JSON.stringify(data) }),
  getActiveCalibration: () => request('/calibration/active'),

  startSession: () => request('/sessions/start', { method: 'POST' }),
  sampleSession: (
    sessionId: number,
    data: { score: number; neck_angle: number; shoulder_tilt: number; torso_lean: number; issues: string[] }
  ) => request(`/sessions/${sessionId}/sample`, { method: 'POST', body: JSON.stringify(data) }),
  endSession: (sessionId: number) => request(`/sessions/${sessionId}/end`, { method: 'POST' }),
  getSessions: () => request('/sessions'),

  getAnalytics: (period: string) => request(`/analytics/summary?period=${period}`),

  getAchievements: () => request('/achievements'),
  getStreak: () => request('/achievements/streak'),

  setGoal: (target: number, period: string) =>
    request('/goals', { method: 'POST', body: JSON.stringify({ target_avg_score: target, period }) }),
  getGoals: () => request('/goals'),

  triggerOsNotification: (title: string, body: string) =>
    request('/notifications/os', { method: 'POST', body: JSON.stringify({ title, body }) }),
}
