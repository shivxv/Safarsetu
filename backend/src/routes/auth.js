import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { authenticate } from '../middleware/authenticate.js'
import { ApiError, notConfigured } from '../utils/apiError.js'
import { createMsg91OtpClient, normalizeMobileNumber } from '../services/msg91Otp.js'

const router = Router()
const msg91Otp = createMsg91OtpClient({
  authKey: env.MSG91_AUTH_KEY,
  templateId: env.MSG91_TEMPLATE_ID,
  otpLength: env.MSG91_OTP_LENGTH,
  otpExpiryMinutes: env.MSG91_OTP_EXPIRY_MINUTES,
  timeoutMs: env.MSG91_REQUEST_TIMEOUT_MS,
})
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please wait and try again.', code: 'RATE_LIMITED' },
})

router.post('/otp/send', otpLimiter, async (request, response, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(request.body?.mobileNumber, env.MSG91_DEFAULT_COUNTRY_CODE)
    if (!mobileNumber) {
      throw new ApiError(400, 'INVALID_MOBILE_NUMBER', 'Enter a valid mobile number with country code.')
    }
    await msg91Otp.send(mobileNumber)
    response.json({ sent: true })
  } catch (error) {
    next(error)
  }
})

router.post('/otp/verify', otpLimiter, async (request, response, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(request.body?.mobileNumber, env.MSG91_DEFAULT_COUNTRY_CODE)
    const otp = request.body?.otp
    if (!mobileNumber) {
      throw new ApiError(400, 'INVALID_MOBILE_NUMBER', 'Enter a valid mobile number with country code.')
    }
    if (typeof otp !== 'string' || !new RegExp(`^\\d{${env.MSG91_OTP_LENGTH}}$`).test(otp)) {
      throw new ApiError(400, 'INVALID_OTP', 'Enter the verification code received on your mobile.')
    }
    await msg91Otp.verify(mobileNumber, otp)
    response.json({ verified: true })
  } catch (error) {
    next(error)
  }
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
