import api from './api'
import { appConfig } from '../config/appConfig'

export const locationService = {
  suggest: (query) => api.get('/locations/suggestions', { params: { query, provider: appConfig.mapsProvider } }),
  validateCoverage: (pickup, destination, coordinates) => api.post('/locations/validate', { pickup, destination, coordinates }),
  getRoute: (pickup, destination, coordinates) => api.post('/locations/route', { pickup, destination, coordinates, provider: appConfig.mapsProvider }),
  updatePin: (bookingDraftId, locationType, coordinates) => api.patch(`/booking-drafts/${bookingDraftId}/locations/${locationType}`, coordinates),
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser. You can enter the address manually.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can enter the pickup address manually.'
          : error.code === error.TIMEOUT
            ? 'Location lookup timed out. Please try again or enter the pickup address manually.'
            : 'Could not get your location. You can enter the pickup address manually.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  })
}
