/**
 * 限额系统错误类型定义
 */

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 限额相关
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  REQUEST_LIMIT_EXCEEDED = 'REQUEST_LIMIT_EXCEEDED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  
  // 认证相关
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 系统相关
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // 业务相关
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

/**
 * 结构化错误响应
 */
export interface ApiError {
  code: ErrorCode
  message: string
  details?: {
    current?: number
    limit?: number
    resetTime?: string
    plan?: string
  }
}

/**
 * 限额错误的具体信息
 */
export interface QuotaErrorDetails {
  current: number      // 当前已使用
  limit: number        // 限额
  resetTime: string    // 重置时间（ISO 日期）
  plan: string         // 用户等级
  type: 'requests' | 'tokens'  // 超限类型
}

/**
 * 错误分级
 */
export enum ErrorSeverity {
  INFO = 'info',           // 信息提示
  WARNING = 'warning',     // 警告（业务限制）
  ERROR = 'error',         // 错误（系统问题）
  CRITICAL = 'critical',   // 严重错误
}

/**
 * 错误类型映射配置
 */
export const ERROR_CONFIG: Record<ErrorCode, {
  severity: ErrorSeverity
  userMessage: string
  logLevel: 'warn' | 'error'
  shouldRetry: boolean
}> = {
  // 限额相关 - 业务警告，非系统错误
  [ErrorCode.QUOTA_EXCEEDED]: {
    severity: ErrorSeverity.WARNING,
    userMessage: '今日额度已用完',
    logLevel: 'warn',
    shouldRetry: false,
  },
  [ErrorCode.REQUEST_LIMIT_EXCEEDED]: {
    severity: ErrorSeverity.WARNING,
    userMessage: '今日请求次数已用完',
    logLevel: 'warn',
    shouldRetry: false,
  },
  [ErrorCode.TOKEN_LIMIT_EXCEEDED]: {
    severity: ErrorSeverity.WARNING,
    userMessage: '今日 Token 额度已用完',
    logLevel: 'warn',
    shouldRetry: false,
  },
  
  // 认证相关
  [ErrorCode.UNAUTHORIZED]: {
    severity: ErrorSeverity.ERROR,
    userMessage: '请先登录',
    logLevel: 'warn',
    shouldRetry: false,
  },
  [ErrorCode.FORBIDDEN]: {
    severity: ErrorSeverity.ERROR,
    userMessage: '无权访问',
    logLevel: 'warn',
    shouldRetry: false,
  },
  
  // 系统相关 - 真正需要关注的错误
  [ErrorCode.INTERNAL_ERROR]: {
    severity: ErrorSeverity.CRITICAL,
    userMessage: '服务器内部错误',
    logLevel: 'error',
    shouldRetry: true,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    severity: ErrorSeverity.CRITICAL,
    userMessage: '服务暂时不可用',
    logLevel: 'error',
    shouldRetry: true,
  },
  
  // 业务相关
  [ErrorCode.INVALID_REQUEST]: {
    severity: ErrorSeverity.WARNING,
    userMessage: '请求无效',
    logLevel: 'warn',
    shouldRetry: false,
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    severity: ErrorSeverity.ERROR,
    userMessage: '资源不存在',
    logLevel: 'warn',
    shouldRetry: false,
  },
}
