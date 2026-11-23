import { ApiError } from '../utils/apiError.js'

export function notFoundHandler(request, response) {
  response.status(404).json({
    message: `No API route for ${request.method} ${request.path}.`,
    code: 'NOT_FOUND',
  })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  const knownError = error instanceof ApiError
  const status = knownError ? error.status : error.status || 500
  const code = knownError ? error.code : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR'
  const message = status >= 500 && !knownError ? 'An unexpected server error occurred.' : error.message

  if (status >= 500) console.error(error)
  response.status(status).json({ message, code })
}
