import { NextResponse } from 'next/server'
import type { ApiResponse, ApiError } from '@/types/claude-config'

export function successResponse<T>(data: T, status = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(response, { status })
}

export function errorResponse(error: ApiError, status = 500): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  }
  return NextResponse.json(response, { status })
}

export function validationError(
  message: string,
  details?: Record<string, unknown>
): NextResponse {
  return errorResponse(
    {
      type: 'validation',
      message,
      details,
      recoverable: true,
    },
    400
  )
}

export function filesystemError(message: string, recoverable = false): NextResponse {
  return errorResponse(
    {
      type: 'filesystem',
      message,
      recoverable,
    },
    500
  )
}
