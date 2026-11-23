import api from './api'

export const safetyService = {
  shareTrip: (bookingId) => api.post(`/rides/${bookingId}/share`),
  sendEmergencyAlert: (bookingId, payload) => api.post(`/rides/${bookingId}/emergency`, payload),
  getEmergencyContact: () => api.get('/customers/me/emergency-contact'),
  updateEmergencyContact: (payload) => api.put('/customers/me/emergency-contact', payload),
}
