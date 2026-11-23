import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

test('health endpoint reports API state without exposing connection details', async (context) => {
  const server = app.listen(0)
  context.after(() => new Promise((resolve) => server.close(resolve)))
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.service, 'safarsetu-api')
  assert.equal(body.status, 'ok')
  assert.equal('error' in body, false)
})

test('public booking configuration does not invent fare or payment settings', async (context) => {
  const server = app.listen(0)
  context.after(() => new Promise((resolve) => server.close(resolve)))
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const response = await fetch(`http://127.0.0.1:${address.port}/api/public/booking-configuration`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(body.activeVehicleTypes.map(({ id }) => id), ['bike', 'auto'])
  assert.deepEqual(body.fareRules, {})
  assert.deepEqual(body.paymentMethods, [])
  assert.deepEqual(body.serviceZones, ['Alpha 1', 'Alpha 2', 'Beta 1', 'Beta 2', 'Knowledge Park', 'Pari Chowk'])
})

test('OTP endpoint clearly reports missing provider configuration', async (context) => {
  const server = app.listen(0)
  context.after(() => new Promise((resolve) => server.close(resolve)))
  await new Promise((resolve) => server.once('listening', resolve))
  const address = server.address()
  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber: '+919876543210' }),
  })
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.code, 'OTP_PROVIDER_NOT_CONFIGURED')
})
