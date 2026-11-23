import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { ApiError, notConfigured } from '../utils/apiError.js'

const router = Router()

router.post('/estimate', authenticate, (request, response, next) => {
  if (!request.body?.pickup || !request.body?.destination) {
    next(new ApiError(400, 'LOCATIONS_REQUIRED', 'Pickup and destination are required.'))
    return
  }
  notConfigured('Maps, fare rules, and fare estimation')
})

router.post('/request', authenticate, (request, response, next) => {
  if (!request.get('Idempotency-Key')) {
    next(new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A unique Idempotency-Key header is required.'))
    return
  }
  notConfigured('Ride booking and atomic rider matching')
})

router.get('/history', authenticate, () => notConfigured('Ride history storage'))
router.post('/:bookingId/cancel', authenticate, () => notConfigured('Ride cancellation policy and booking storage'))
router.post('/:bookingId/retry', authenticate, (request, response, next) => {
  if (!request.get('Idempotency-Key')) {
    next(new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A unique Idempotency-Key header is required.'))
    return
  }
  notConfigured('Ride matching retry')
})
router.get('/:bookingId/receipt', authenticate, () => notConfigured('Receipt generation'))
router.post('/:bookingId/rating', authenticate, () => notConfigured('Ride rating storage'))
router.post('/:bookingId/share', authenticate, () => notConfigured('Secure trip sharing'))
router.post('/:bookingId/emergency', authenticate, () => notConfigured('Emergency alert delivery'))
router.get('/:bookingId', authenticate, () => notConfigured('Ride booking storage and live status'))

export default router
