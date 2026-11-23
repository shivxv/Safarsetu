import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { authenticate } from '../middleware/authenticate.js'
import { ApiError, notConfigured } from '../utils/apiError.js'

const router = Router()
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please wait and try again.', code: 'RATE_LIMITED' },
})

router.post('/otp/send', otpLimiter, (request, response, next) => {
  const mobileNumber = request.body?.mobileNumber
  if (typeof mobileNumber !== 'string' || !/^\+?[1-9]\d{7,14}$/.test(mobileNumber.replace(/[\s()-]/g, ''))) {
    next(new ApiError(400, 'INVALID_MOBILE_NUMBER', 'Enter a valid mobile number.'))
    return
  }
  if (!env.OTP_DELIVERY_URL || !env.OTP_PROVIDER_TOKEN) {
    next(new ApiError(503, 'OTP_PROVIDER_NOT_CONFIGURED', 'OTP delivery is not configured on this server yet.'))
    return
  }
  next(new ApiError(503, 'OTP_ADAPTER_REQUIRED', 'The configured OTP provider requires a provider-specific adapter before sending messages.'))
})

router.post('/otp/verify', otpLimiter, (request, response, next) => {
  if (!env.OTP_DELIVERY_URL || !env.OTP_PROVIDER_TOKEN) {
    next(new ApiError(503, 'OTP_PROVIDER_NOT_CONFIGURED', 'OTP verification is not configured on this server yet.'))
    return
  }
  next(new ApiError(503, 'OTP_ADAPTER_REQUIRED', 'The configured OTP provider requires a provider-specific adapter before verifying codes.'))
})

router.post('/register', otpLimiter, (request, response, next) => {
  if (!request.body?.privacyConsent) {
    next(new ApiError(400, 'CONSENT_REQUIRED', 'Privacy and terms consent is required to register.'))
    return
  }
  notConfigured('Customer registration and OTP verification')
})

router.post('/login', otpLimiter, () => {
  notConfigured('Customer login and OTP verification')
})

router.get('/session', authenticate, (request, response) => {
  response.json({ authenticated: true, customerId: request.customer.sub })
})

router.post('/logout', (request, response) => {
  response.clearCookie('safarsetu_session', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
  })
  response.status(204).end()
})

export default router
