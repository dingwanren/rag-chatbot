import { ErrorCode, ApiError, QuotaErrorDetails } from './error-types'

/**
 * 创建限额错误响应
 * @param message - 错误消息
 * @param details - 详细限额信息
 */
export function createQuotaError(
  message: string,
  details?: QuotaErrorDetails
): Response {
  const error: ApiError = {
    code: ErrorCode.QUOTA_EXCEEDED,
    message,
    details: details ? {
      current: details.current,
      limit: details.limit,
      resetTime: details.resetTime,
      plan: details.plan,
    } : undefined,
  }

  return new Response(JSON.stringify(error), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': details?.limit.toString() ?? '0',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': details?.resetTime ?? '',
    },
  })
}

/**
 * 创建认证错误响应
 */
export function createUnauthorizedError(message = '请先登录'): Response {
  const error: ApiError = {
    code: ErrorCode.UNAUTHORIZED,
    message,
  }

  return new Response(JSON.stringify(error), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 创建禁止访问错误响应
 */
export function createForbiddenError(message = '无权访问'): Response {
  const error: ApiError = {
    code: ErrorCode.FORBIDDEN,
    message,
  }

  return new Response(JSON.stringify(error), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 创建无效请求错误响应
 */
export function createInvalidRequestError(message = '请求无效'): Response {
  const error: ApiError = {
    code: ErrorCode.INVALID_REQUEST,
    message,
  }

  return new Response(JSON.stringify(error), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 创建服务器内部错误响应
 */
export function createInternalError(message = '服务器内部错误'): Response {
  const error: ApiError = {
    code: ErrorCode.INTERNAL_ERROR,
    message,
  }

  return new Response(JSON.stringify(error), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 创建资源未找到错误响应
 */
export function createNotFoundError(message = '资源不存在'): Response {
  const error: ApiError = {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    message,
  }

  return new Response(JSON.stringify(error), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * 通用错误创建器
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, any>
): Response {
  const error: ApiError = {
    code,
    message,
    details,
  }

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
