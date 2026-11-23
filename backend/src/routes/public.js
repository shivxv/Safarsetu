import { Router } from 'express'
import { env } from '../config/env.js'

const vehicleLabels = {
  bike: { label: 'Bike', description: 'Quick and affordable' },
  auto: { label: 'Auto', description: 'Comfortable and spacious' },
}

const router = Router()

router.get('/booking-configuration', (request, response) => {
  response.json({
    activeVehicleTypes: env.ACTIVE_VEHICLE_TYPES
      .filter((id) => vehicleLabels[id])
      .map((id) => ({ id, ...vehicleLabels[id] })),
    serviceZones: env.SERVICE_ZONES,
    fareRules: {},
    paymentMethods: [],
    cancellationPolicy: null,
    integrations: {
      maps: Boolean(env.MAPS_PROVIDER),
      otp: Boolean(env.OTP_DELIVERY_URL && env.OTP_PROVIDER_TOKEN),
      database: Boolean(env.MONGODB_URI),
    },
  })
})

router.get('/cancellation-policy', (request, response) => {
  response.json({ configured: false, message: 'Cancellation policy has not been configured.' })
})

export default router
