import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  MONGODB_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().optional().default(''),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_SECURE: z.string().default('false'),
  ACTIVE_VEHICLE_TYPES: z.string().default('bike,auto'),
  SERVICE_ZONES: z.string().default('Alpha 1,Alpha 2,Beta 1,Beta 2,Knowledge Park,Pari Chowk'),
  MAPS_PROVIDER: z.string().optional().default(''),
  OTP_DELIVERY_URL: z.string().url().optional().or(z.literal('')).default(''),
  OTP_PROVIDER_TOKEN: z.string().optional().default(''),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid backend environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.')
  process.exit(1)
}

export const env = {
  ...parsed.data,
  CLIENT_ORIGINS: parsed.data.CLIENT_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  ACTIVE_VEHICLE_TYPES: parsed.data.ACTIVE_VEHICLE_TYPES.split(',').map((vehicle) => vehicle.trim()).filter(Boolean),
  SERVICE_ZONES: parsed.data.SERVICE_ZONES.split(',').map((zone) => zone.trim()).filter(Boolean),
  COOKIE_SECURE: parsed.data.COOKIE_SECURE === 'true',
}
