/**
 * 错误类型枚举
 */
export const ErrorType = {
  VIDEO_LOAD_FAILED: 'VIDEO_LOAD_FAILED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  WEBGL_NOT_SUPPORTED: 'WEBGL_NOT_SUPPORTED',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  EXPORT_FAILED: 'EXPORT_FAILED',
  PROJECT_LOAD_FAILED: 'PROJECT_LOAD_FAILED',
  AUDIO_LOAD_FAILED: 'AUDIO_LOAD_FAILED',
  RENDER_ERROR: 'RENDER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  details: any;
  recoverable: boolean;
  timestamp: Date;

  constructor(type: ErrorType, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.recoverable = this.isRecoverable(type);
    this.timestamp = new Date();
  }

  private isRecoverable(type: ErrorType): boolean {
    // 某些错误可以恢复
    const nonRecoverableTypes: string[] = [
      ErrorType.WEBGL_NOT_SUPPORTED,
      ErrorType.UNSUPPORTED_FORMAT
    ];
    return !nonRecoverableTypes.includes(type);
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * 错误日志记录器
 */
class ErrorLogger {
  private logs: AppError[] = [];
  private maxLogs = 100;

  log(error: AppError): void {
    this.logs.push(error);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 输出到控制台
    console.error(`[${error.type}] ${error.message}`, error.details);
    
    // 可以在这里添加远程日志上报
    this.reportToRemote(error);
  }

  private reportToRemote(_error: AppError): void {
    // 这里可以实现远程日志上报
    // 例如发送到 Sentry, LogRocket 等服务
    // if (import.meta.env.PROD) {
    //   fetch('/api/log-error', {
    //     method: 'POST',
    //     body: JSON.stringify(error.toJSON())
    //   });
    // }
  }

  getLogs(): AppError[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs.map(log => log.toJSON()), null, 2);
  }
}

export const errorLogger = new ErrorLogger();
