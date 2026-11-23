import { Router } from 'express'
import mongoose from 'mongoose'
import { databaseStatus } from '../config/database.js'

const router = Router()

router.get('/', (request, response) => {
  const connected = mongoose.connection.readyState === 1
  response.status(200).json({
    status: 'ok',
    service: 'safarsetu-api',
    database: connected ? 'connected' : databaseStatus.state,
    readyForBookings: false,
    timestamp: new Date().toISOString(),
  })
})

export default router
