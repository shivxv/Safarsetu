const env = import.meta.env

export const appConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  mapsProvider: env.VITE_MAPS_PROVIDER || 'google',
  mapsApiKey: env.VITE_MAPS_API_KEY || '',
  socketUrl: env.VITE_SOCKET_URL || 'http://localhost:5000',
  demoMode: env.VITE_DEMO_MODE !== 'false',
}

export const fallbackServiceZones = [
  'Alpha 1',
  'Alpha 2',
  'Beta 1',
  'Beta 2',
  'Knowledge Park',
  'Pari Chowk',
]
