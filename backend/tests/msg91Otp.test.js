import test from 'node:test'
import assert from 'node:assert/strict'
import { createMsg91OtpClient, normalizeMobileNumber } from '../src/services/msg91Otp.js'

const clientOptions = {
  authKey: 'test-auth-key',
  templateId: 'test-template',
  otpLength: 6,
  otpExpiryMinutes: 5,
  timeoutMs: 1000,
}

test('normalizes international phone numbers and rejects invalid values', () => {
  assert.equal(normalizeMobileNumber('+91 98765-43210'), '919876543210')
  assert.equal(normalizeMobileNumber('+19876543210'), '19876543210')
  assert.equal(normalizeMobileNumber('98765 43210'), '919876543210')
  assert.equal(normalizeMobileNumber('98765 43210', '1'), '19876543210')
  assert.equal(normalizeMobileNumber('98765'), null)
  assert.equal(normalizeMobileNumber(919876543210), null)
})

test('sends an OTP through MSG91 using server-side credentials', async () => {
  let request
  const client = createMsg91OtpClient({
    ...clientOptions,
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options }
      return { ok: true, text: async () => '{"type":"success","request_id":"test-id"}' }
    },
  })

  await client.send('919876543210')

  assert.equal(request.options.method, 'POST')
  assert.equal(request.url.origin, 'https://control.msg91.com')
  assert.equal(request.url.pathname, '/api/v5/otp')
  assert.equal(request.url.searchParams.get('template_id'), 'test-template')
  assert.equal(request.url.searchParams.get('mobile'), '919876543210')
  assert.equal(request.url.searchParams.get('otp_length'), '6')
  assert.equal(request.options.headers.authkey, 'test-auth-key')
  assert.equal(request.url.searchParams.has('authkey'), false)
})

test('verifies an OTP using MSG91s verification endpoint and checks provider type', async () => {
  let request
  const client = createMsg91OtpClient({
    ...clientOptions,
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options }
      return { ok: true, text: async () => '{"type":"success","message":"OTP verified success"}' }
    },
  })

  await client.verify('919876543210', '123456')

  assert.equal(request.options.method, 'GET')
  assert.equal(request.url.pathname, '/api/v5/otp/verify')
  assert.equal(request.url.searchParams.get('mobile'), '919876543210')
  assert.equal(request.url.searchParams.get('otp'), '123456')
  assert.equal(request.options.headers.authkey, 'test-auth-key')
})

test('rejects invalid and expired OTPs without exposing provider messages', async () => {
  const client = createMsg91OtpClient({
    ...clientOptions,
    fetchImpl: async () => ({
      ok: true,
      text: async () => '{"type":"error","message":"provider diagnostic"}',
    }),
  })

  await assert.rejects(client.verify('919876543210', '123456'), (error) => {
    assert.equal(error.status, 400)
    assert.equal(error.code, 'OTP_INVALID_OR_EXPIRED')
    assert.equal(error.message.includes('provider diagnostic'), false)
    return true
  })
})

test('reports an OTP provider timeout explicitly', async () => {
  const client = createMsg91OtpClient({
    ...clientOptions,
    timeoutMs: 10,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      })
    }),
  })

  await assert.rejects(client.send('919876543210'), (error) => {
    assert.equal(error.status, 504)
    assert.equal(error.code, 'OTP_PROVIDER_TIMEOUT')
    return true
  })
})
