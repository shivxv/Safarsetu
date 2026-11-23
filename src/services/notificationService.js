import api from './api'

export const notificationService = {
  getPreferences: () => api.get('/customers/me/notification-preferences'),
  updatePreferences: (preferences) => api.put('/customers/me/notification-preferences', preferences),
}
