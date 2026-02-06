import axios from 'axios'

// Use relative URL when unset so Vite proxy works (avoids "Route not found" in dev)
const API_URL = import.meta.env.VITE_API_URL ?? ''

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token expiration (don't redirect on login failure — let Login page show error)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login') && error.config?.method === 'post'
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (email, password) => api.post('/api/auth/register', { email, password }),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/me'),
  updatePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/password', { current_password: currentPassword, new_password: newPassword }),
  updateProfile: (data) =>
    api.post('/api/auth/profile', {
      ...(data.display_name !== undefined && { display_name: data.display_name }),
      ...(data.notification_preferences !== undefined && { notification_preferences: data.notification_preferences }),
    }),
}

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/api/projects'),
  getDeleted: () => api.get('/api/projects/deleted'),
  getById: (id) => api.get(`/api/projects/${id}`),
  create: (data) => api.post('/api/projects', data),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  restore: (id) => api.post(`/api/projects/${id}/restore`),
  permanentDelete: (id) => api.post(`/api/projects/${id}/permanent-delete`),
  addMember: (id, userId) => api.post(`/api/projects/${id}/members`, { user_id: userId }),
  inviteMember: (id, email) => api.post(`/api/projects/${id}/invite`, { email: email.trim() }),
  getMembers: (id) => api.get(`/api/projects/${id}/members`),
  toggleStar: (id) => api.post(`/api/projects/${id}/star`),
}

// Tickets API
export const ticketsAPI = {
  getAll: (projectId, filters = {}) => {
    let url = `/api/tickets?project_id=${projectId}`
    if (filters.status) url += `&status=${filters.status}`
    if (filters.priority) url += `&priority=${filters.priority}`
    if (filters.ticket_type) url += `&ticket_type=${filters.ticket_type}`
    if (filters.assignee) url += `&assignee=${filters.assignee}`
    return api.get(url)
  },
  getById: (id) => api.get(`/api/tickets/${id}`),
  create: (data) => api.post('/api/tickets', data),
  update: (id, data) => api.put(`/api/tickets/${id}`, data),
  delete: (id) => api.delete(`/api/tickets/${id}`),
  getStats: (projectId) => api.get(`/api/tickets/stats?project_id=${projectId}`),
}

// Comments API
export const commentsAPI = {
  getAll: (ticketId) => api.get(`/api/comments?ticket_id=${ticketId}`),
  getById: (id) => api.get(`/api/comments/${id}`),
  create: (data) => api.post('/api/comments', data),
  update: (id, data) => api.put(`/api/comments/${id}`, data),
  delete: (id) => api.delete(`/api/comments/${id}`),
}

// Notifications API
export const notificationsAPI = {
  list: (limit = 50) => api.get(`/api/notifications?limit=${limit}`),
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
}

export default api
