import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { notConfigured } from '../utils/apiError.js'

const router = Router()
router.post('/tickets', authenticate, () => notConfigured('Support ticket storage and delivery'))

export default router
