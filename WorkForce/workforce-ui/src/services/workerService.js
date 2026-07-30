import api from './api';

export const workerService = {
  createWorker: async (projectId, workerData) => {
    return api.post(`/workers/project/${projectId}`, workerData);
  },
  updateWorker: async (workerId, workerData) => {
    return api.put(`/workers/${workerId}`, workerData);
  },
  deleteWorker: async (workerId) => {
    return api.delete(`/workers/${workerId}`);
  },
};