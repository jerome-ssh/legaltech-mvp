import * as Sentry from '@sentry/nextjs';
import env from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private readonly logLevel: LogLevel;

  private constructor() {
    this.logLevel = env.LOG_LEVEL;
    
    // Initialize Sentry if DSN is provided
    if (env.SENTRY_DSN) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 1.0,
      });
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
      if (env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: context,
        });
      }
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
      if (error) {
        console.error(error.stack);
      }

      if (env.SENTRY_DSN) {
        if (error) {
          Sentry.captureException(error, {
            extra: context,
          });
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: context,
          });
        }
      }
    }
  }

  // Specialized logging for authentication events
  logAuthEvent(event: string, userId: string, success: boolean, context?: LogContext) {
    const message = `Auth Event: ${event} - User: ${userId} - Success: ${success}`;
    if (success) {
      this.info(message, context);
    } else {
      this.warn(message, context);
    }
  }

  // Specialized logging for API requests
  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const message = `API Request: ${method} ${path} - Status: ${statusCode} - Duration: ${duration}ms`;
    if (statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 