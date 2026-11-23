import api from './api'

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  getSession: () => api.get('/auth/session'),
  sendOtp: (mobileNumber) => api.post('/auth/otp/send', { mobileNumber }),
  verifyOtp: (payload) => api.post('/auth/otp/verify', payload),
  forgotPassword: (mobileNumber) => api.post('/auth/forgot-password', { mobileNumber }),
  logout: () => api.post('/auth/logout'),
}
