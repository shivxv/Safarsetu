import mongoose from 'mongoose'
import app from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'

await connectDatabase()

const server = app.listen(env.PORT, () => {
  console.log(`SafarSetu API listening on http://localhost:${env.PORT}`)
  console.log(`Health check: http://localhost:${env.PORT}/api/health`)
})

async function shutdown(signal) {
  console.log(`${signal} received; shutting down SafarSetu API.`)
  server.close(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
