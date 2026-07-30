import api from './api';

export const projectService = {
  getProjects: async (userId) => {
    try {
      const response = await api.get(`/projects/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },
  getProject: async (projectId) => {
    return api.get(`/projects/${projectId}`);
  },
  createProject: async (projectData) => {
    return api.post('/projects', projectData);
  },
  updateProject: async (projectId, projectData) => {
    return api.put(`/projects/${projectId}`, projectData);
  },
  deleteProject: async (projectId) => {
    return api.delete(`/projects/${projectId}`);
  },
};