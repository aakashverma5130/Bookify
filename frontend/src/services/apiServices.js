import api from './api';

export const authApi = {
  login:         (data)  => api.post('/auth/login', data),
  logout:        ()      => api.post('/auth/logout'),
  forgotPassword:(data)  => api.post('/auth/forgot-password', data),
  verifyOtp:     (data)  => api.post('/auth/verify-otp', data),
  resetPassword: (data, resetToken) =>
    api.post('/auth/reset-password', data, {
      headers: { Authorization: `Bearer ${resetToken}` }
    }),
  getMe:         ()      => api.get('/auth/me'),
};

export const bookApi = {
  getBooks:      (params) => api.get('/books', { params }),
  search:        (params) => api.get('/books/search', { params }),
  getById:       (id)     => api.get(`/books/${id}`),
  create:        (data)   => api.post('/books', data),
  update:        (id, data) => api.put(`/books/${id}`, data),
  delete:        (id)     => api.delete(`/books/${id}`),
  bulkImport:    (data)   => api.post('/books/bulk-import', data),
  addCopy:       (bookId, data) => api.post(`/books/${bookId}/copies`, data),
  getAuthors:    ()       => api.get('/books/authors'),
  getCategories: ()       => api.get('/books/categories'),
};

export const circulationApi = {
  issue:         (data)   => api.post('/issues', data),
  return:        (id, data) => api.put(`/issues/${id}/return`, data),
  renew:         (id)     => api.put(`/issues/${id}/renew`),
  getIssues:     (params) => api.get('/issues', { params }),
  getOverdue:    ()       => api.get('/issues/overdue'),
};

export const reservationApi = {
  create:        (data)   => api.post('/reservations', data),
  cancel:        (id)     => api.delete(`/reservations/${id}`),
  getAll:        ()       => api.get('/reservations'),
};

export const digitalApi = {
  getAll:        (params) => api.get('/digital-resources', { params }),
  upload:        (formData) => api.post('/digital-resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  download:      (id)     => api.get(`/digital-resources/${id}/download`, { responseType: 'blob' }),
  getStats:      (id)     => api.get(`/digital-resources/${id}/stats`),
};

export const purchaseApi = {
  create:        (data)   => api.post('/purchase-requests', data),
  getAll:        ()       => api.get('/purchase-requests'),
  decide:        (id, data) => api.put(`/purchase-requests/${id}/decision`, data),
};

export const notificationApi = {
  getAll:        ()       => api.get('/notifications'),
  markRead:      (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:   ()       => api.put('/notifications/read-all'),
  updateSettings:(data)   => api.put('/notifications/settings', data),
};

export const studentApi = {
  getProfile:    ()       => api.get('/student/profile'),
  getCurrentBooks: ()     => api.get('/student/books'),
  getHistory:    ()       => api.get('/student/history'),
  getFines:      ()       => api.get('/student/fines'),
  getDashboard:  ()       => api.get('/student/dashboard'),
};

export const analyticsApi = {
  getDashboard:  ()       => api.get('/admin/dashboard'),
  getReports:    ()       => api.get('/admin/reports'),
  getForecast:   ()       => api.get('/admin/demand-forecast'),
  getStudents:   (params) => api.get('/admin/students', { params }),
  suspendStudent:(id)     => api.put(`/admin/students/${id}/suspend`),
  activateStudent:(id)    => api.put(`/admin/students/${id}/activate`),
  getSettings:   ()       => api.get('/admin/settings'),
  updateSettings:(data)   => api.put('/admin/settings', data),
};

export const auditApi = {
  scan:          (data)   => api.post('/audit/scan', data),
  getReport:     ()       => api.get('/audit/report'),
};
