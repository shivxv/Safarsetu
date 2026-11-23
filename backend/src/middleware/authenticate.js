import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'

export function authenticate(request, response, next) {
  if (!env.JWT_SECRET) {
    next(new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured on this server yet.'))
    return
  }

  const token = request.cookies.safarsetu_session
  if (!token) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue.'))
    return
  }

  try {
    request.customer = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    next()
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Your session is invalid or has expired.'))
  }
}
