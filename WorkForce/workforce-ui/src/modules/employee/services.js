import { api } from '../../shared/services';

// ===== PROJECT SERVICES =====
export const projectService = {
  getProjects: (userId) => api.get(`/projects/user/${userId}`),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

// ===== WORKER SERVICES =====
export const workerService = {
  createWorker: (data) => api.post('/workers', data),
  updateWorker: (id, data) => api.put(`/workers/${id}`, data),
  deleteWorker: (id) => api.delete(`/workers/${id}`),
  // Deactivate is one-way (no matching activate call - see WorkerController.DeactivateWorker,
  // reactivation was removed there). Distinct from deleteWorker: this flips IsCurrentlyActive
  // (business status) only, so the worker keeps showing up in GetWorkersByProject / the
  // Deactive tab, rather than a real soft-delete that would make it disappear.
  deactivateWorker: (id, data) => api.put(`/workers/${id}/deactivate`, data),
  // All of a user's workers across every project - backs the Employees tab.
  getWorkersByUser: (userId) => api.get(`/workers/user/${userId}`),
  // Sends a worker to a (possibly different) project - see WorkerController.AssignWorker.
  assignWorker: (id, data) => api.put(`/workers/${id}/assign`, data),
  updateWage: (id, data) => api.put(`/workers/${id}/wage`, data),
};

// ===== ATTENDANCE SERVICES =====
export const attendanceService = {
  markAttendance: (data) => api.post('/attendance/mark', data),
  bulkMarkAttendance: (data) => api.post('/attendance/bulk', data),
  getAttendance: (workerId, startDate, endDate) => 
    api.get(`/attendance/worker/${workerId}?startDate=${startDate || ''}&endDate=${endDate || ''}`),
  deleteAttendanceByDate: (projectId, date) => 
    api.delete(`/attendance/date?projectId=${projectId}&date=${date}`),
};

// ===== PAYMENT SERVICES =====
export const paymentService = {
  recordPayment: (data) => api.post('/payments/record', data),
  recordAdvance: (data) => api.post('/payments/advance', data),
  recordBonus: (data) => api.post('/payments/bonus', data),
  getPaymentHistory: (workerId) => api.get(`/payments/history/${workerId}`),
  getWorkerBalance: (workerId) => api.get(`/payments/worker/${workerId}/balance`),
  updatePayment: (id, data) => api.put(`/payments/payment/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/payment/${id}`),
  deleteAdvance: (id) => api.delete(`/payments/advance/${id}`),
  deleteBonus: (id) => api.delete(`/payments/bonus/${id}`),
};
