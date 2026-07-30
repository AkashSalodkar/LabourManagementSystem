// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7029/api';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = {
  get: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('📤 GET Request:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ GET Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  },
  post: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('📤 POST Request:', url, data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log('✅ POST Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  },
  put: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('📤 PUT Request:', url, data);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log('✅ PUT Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  },
  delete: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('📤 DELETE Request:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log('✅ DELETE Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  },
};

export default api;