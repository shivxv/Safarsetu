import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customer.js'
import healthRoutes from './routes/health.js'
import locationRoutes from './routes/locations.js'
import paymentRoutes from './routes/payments.js'
import publicRoutes from './routes/public.js'
import rewardRoutes from './routes/rewards.js'
import rideRoutes from './routes/rides.js'
import supportRoutes from './routes/support.js'
import { ApiError } from './utils/apiError.js'

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This website origin is not allowed.'))
  },
}))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again shortly.', code: 'RATE_LIMITED' },
}))

app.get('/', (request, response) => {
  response.json({ service: 'safarsetu-api', health: '/api/health' })
})
app.use('/api/health', healthRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/rides', rideRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/support', supportRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
