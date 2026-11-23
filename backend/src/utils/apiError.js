export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}

export function notConfigured(feature) {
  throw new ApiError(503, 'FEATURE_NOT_CONFIGURED', `${feature} is not configured on this server yet.`)
}
