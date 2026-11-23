import api from './api'

export const customerService = {
  getDashboard: () => api.get('/customers/me/dashboard'),
  getProfile: () => api.get('/customers/me'),
  updateProfile: (payload) => api.patch('/customers/me', payload),
  deleteAccount: (confirmation) => api.delete('/customers/me', { data: { confirmation } }),
  getSavedAddresses: () => api.get('/customers/me/addresses'),
  saveAddress: (payload) => api.post('/customers/me/addresses', payload),
  deleteAddress: (addressId) => api.delete(`/customers/me/addresses/${addressId}`),
}
