import mongoose from 'mongoose'
import { env } from './env.js'

export const databaseStatus = {
  state: 'not_configured',
  error: null,
}

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    console.warn('MONGODB_URI is empty; database-backed API operations will remain unavailable.')
    return
  }

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
    databaseStatus.state = 'connected'
  } catch (error) {
    databaseStatus.state = 'disconnected'
    databaseStatus.error = error.message
    console.error('MongoDB connection failed:', error.message)
  }

  mongoose.connection.on('disconnected', () => {
    databaseStatus.state = 'disconnected'
  })
  mongoose.connection.on('connected', () => {
    databaseStatus.state = 'connected'
    databaseStatus.error = null
  })
}
