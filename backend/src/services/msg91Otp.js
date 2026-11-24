import { ApiError } from '../utils/apiError.js'

const MSG91_API_BASE_URL = 'https://control.msg91.com/api/v5/otp'

export function normalizeMobileNumber(value, defaultCountryCode = '91') {
  if (typeof value !== 'string') return null

  const compactNumber = value.replace(/[\s()-]/g, '')
  const hasInternationalPrefix = compactNumber.startsWith('+')
  const digits = compactNumber.replace(/^\+/, '')
  const internationalNumber = !hasInternationalPrefix && digits.length === 10
    ? `${defaultCountryCode}${digits}`
    : digits
  return /^[1-9]\d{7,14}$/.test(internationalNumber) ? internationalNumber : null
}

export function createMsg91OtpClient({
  authKey,
  templateId,
  otpLength,
  otpExpiryMinutes,
  timeoutMs,
  fetchImpl = fetch,
}) {
  function ensureConfigured() {
    if (!authKey || !templateId) {
      throw new ApiError(503, 'OTP_PROVIDER_NOT_CONFIGURED', 'MSG91 OTP delivery is not configured on this server yet.')
    }
  }

  async function request(url, options) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal })
      const responseText = await response.text()
      let payload

      try {
        payload = JSON.parse(responseText)
      } catch {
        throw new ApiError(502, 'OTP_PROVIDER_INVALID_RESPONSE', 'The verification provider returned an invalid response.')
      }

      if (!response.ok) {
        throw new ApiError(502, 'OTP_PROVIDER_REQUEST_FAILED', 'The verification provider could not process the request.')
      }
      return payload
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error.name === 'AbortError') {
        throw new ApiError(504, 'OTP_PROVIDER_TIMEOUT', 'The verification provider did not respond in time. Please try again.')
      }
      throw new ApiError(502, 'OTP_PROVIDER_UNAVAILABLE', 'The verification provider is temporarily unavailable.')
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    async send(mobileNumber) {
      ensureConfigured()
      const url = new URL(MSG91_API_BASE_URL)
      url.searchParams.set('template_id', templateId)
      url.searchParams.set('mobile', mobileNumber)
      url.searchParams.set('otp_length', String(otpLength))
      url.searchParams.set('otp_expiry', String(otpExpiryMinutes))

      const payload = await request(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (payload?.type !== 'success') {
        throw new ApiError(502, 'OTP_PROVIDER_REQUEST_FAILED', 'The verification provider could not send the code.')
      }
    },

    async verify(mobileNumber, otp) {
      ensureConfigured()
      const url = new URL(`${MSG91_API_BASE_URL}/verify`)
      url.searchParams.set('otp', otp)
      url.searchParams.set('mobile', mobileNumber)

      const payload = await request(url, {
        method: 'GET',
        headers: { authkey: authKey },
      })

      if (payload?.type !== 'success') {
        throw new ApiError(400, 'OTP_INVALID_OR_EXPIRED', 'The code is incorrect or has expired. Request a new code and try again.')
      }
    },
  }
}
