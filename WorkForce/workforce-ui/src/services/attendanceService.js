import api from './api';

export const attendanceService = {
  markAttendance: async (attendanceData) => {
    return api.post('/attendance/mark', attendanceData);
  },
  bulkMarkAttendance: async (bulkData) => {
    return api.post('/attendance/bulk', bulkData);
  },
  getAttendance: async (workerId, startDate, endDate) => {
    return api.get(`/attendance/worker/${workerId}?startDate=${startDate}&endDate=${endDate}`);
  },
};