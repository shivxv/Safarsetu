import { bookingService } from './bookingService'

export const rideService = {
  estimateFare: bookingService.estimateFare,
  createRequest: bookingService.requestRide,
  getStatus: bookingService.getBooking,
  cancel: bookingService.cancelBooking,
  getHistory: (params) => bookingService.getHistory(params),
  getRide: bookingService.getBooking,
  submitRating: (rideId, payload) => bookingService.submitRating(rideId, payload),
}
