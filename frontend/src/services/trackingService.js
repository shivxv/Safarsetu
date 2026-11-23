import { io } from 'socket.io-client'
import { appConfig } from '../config/appConfig'

export function connectToRide(bookingId, onUpdate, onError) {
  const socket = io(appConfig.socketUrl, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    auth: { bookingId },
  })

  socket.on('ride:update', onUpdate)
  socket.on('connect_error', onError)
  socket.connect()

  return () => socket.disconnect()
}
