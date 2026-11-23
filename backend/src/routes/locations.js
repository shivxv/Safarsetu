import { Router } from 'express'
import { env } from '../config/env.js'
import { ApiError, notConfigured } from '../utils/apiError.js'

const router = Router()

router.get('/suggestions', (request, response, next) => {
  if (typeof request.query.query !== 'string' || request.query.query.trim().length < 2) {
    next(new ApiError(400, 'INVALID_QUERY', 'Location search must contain at least two characters.'))
    return
  }
  if (!env.MAPS_PROVIDER) {
    next(new ApiError(503, 'MAPS_NOT_CONFIGURED', 'Location search is not configured on this server yet.'))
    return
  }
  notConfigured('Maps provider adapter')
})

router.post('/validate', (request, response, next) => {
  if (!request.body?.pickup || !request.body?.destination) {
    next(new ApiError(400, 'LOCATIONS_REQUIRED', 'Pickup and destination are required.'))
    return
  }
  notConfigured('Service-zone coverage validation')
})

router.post('/route', (request, response, next) => {
  if (!request.body?.pickup || !request.body?.destination) {
    next(new ApiError(400, 'LOCATIONS_REQUIRED', 'Pickup and destination are required.'))
    return
  }
  if (!env.MAPS_PROVIDER) {
    next(new ApiError(503, 'MAPS_NOT_CONFIGURED', 'Route estimates are not configured on this server yet.'))
    return
  }
  notConfigured('Maps route adapter')
})

export default router
