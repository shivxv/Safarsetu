import axios from 'axios'
import { appConfig } from '../config/appConfig'

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Unable to connect. Please try again.'
    const requestError = new Error(message)
    requestError.status = error.response?.status
    return Promise.reject(requestError)
  },
)

export default api
