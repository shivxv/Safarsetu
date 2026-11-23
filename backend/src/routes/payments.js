import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { ApiError, notConfigured } from '../utils/apiError.js'

const router = Router()
router.use(authenticate)

router.get('/:bookingId/status', () => notConfigured('Payment gateway and payment ledger'))
router.post('/:bookingId', (request, response, next) => {
  if (!request.get('Idempotency-Key')) {
    next(new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A unique Idempotency-Key header is required.'))
    return
  }
  notConfigured('Payment gateway and duplicate-payment protection')
})

export default router
