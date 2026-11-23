import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { notConfigured } from '../utils/apiError.js'

const router = Router()
router.use(authenticate)
router.get('/progress', () => notConfigured('Reward ledger and eligibility rules'))
router.get('/history', () => notConfigured('Reward history storage'))

export default router
