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
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};