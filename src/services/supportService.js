import api from './api'

export const supportService = {
  submitTicket: (payload) => api.post('/support/tickets', payload),
  getCancellationPolicy: () => api.get('/public/cancellation-policy'),
}
