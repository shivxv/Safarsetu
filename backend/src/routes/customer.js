import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { notConfigured } from '../utils/apiError.js'

const router = Router()
router.use(authenticate)

router.get('/me', () => notConfigured('Customer profile storage'))
router.patch('/me', () => notConfigured('Customer profile storage'))
router.delete('/me', () => notConfigured('Account deletion workflow'))
router.get('/me/dashboard', () => notConfigured('Customer dashboard storage'))
router.get('/me/addresses', () => notConfigured('Saved address storage'))
router.post('/me/addresses', () => notConfigured('Saved address storage'))
router.delete('/me/addresses/:addressId', () => notConfigured('Saved address storage'))
router.get('/me/emergency-contact', () => notConfigured('Emergency contact storage'))
router.put('/me/emergency-contact', () => notConfigured('Emergency contact storage'))
router.get('/me/notification-preferences', () => notConfigured('Notification preferences'))
router.put('/me/notification-preferences', () => notConfigured('Notification preferences'))

export default router
