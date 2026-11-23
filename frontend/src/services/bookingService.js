import api from './api'

export const bookingService = {
  getConfiguration: () => api.get('/public/booking-configuration'),
  estimateFare: (payload) => api.post('/rides/estimate', payload),
  getHistory: (params) => api.get('/rides/history', { params }),
  submitRating: (rideId, payload) => api.post(`/rides/${rideId}/rating`, payload),
  requestRide: (payload, idempotencyKey) => api.post('/rides/request', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }),
  getBooking: (bookingId) => api.get(`/rides/${bookingId}`),
  cancelBooking: (bookingId, payload) => api.post(`/rides/${bookingId}/cancel`, payload),
  retryMatching: (bookingId, idempotencyKey) => api.post(`/rides/${bookingId}/retry`, {}, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }),
  getPaymentStatus: (bookingId) => api.get(`/payments/${bookingId}/status`),
  startPayment: (bookingId, payload, idempotencyKey) => api.post(`/payments/${bookingId}`, payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  }),
  getReceipt: (bookingId) => api.get(`/rides/${bookingId}/receipt`, { responseType: 'blob' }),
  getRewardProgress: () => api.get('/rewards/progress'),
  getRewardHistory: () => api.get('/rewards/history'),
}
