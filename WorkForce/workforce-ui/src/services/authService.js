import api from './api';

export const authService = {
  sendOtp: async (mobileNumber, industry) => {
    return api.post('/auth/send-otp', { mobileNumber, industry });
  },
  register: async (mobileNumber, otp, fullName, industry) => {
    return api.post('/auth/register', { mobileNumber, otp, fullName, industry });
  },
  login: async (mobileNumber, otp) => {
    return api.post('/auth/login', { mobileNumber, otp });
  },
};