/**
 * Enhanced Structured Logging System
 * Production-ready logging with Sentry integration and context tracking
 */

import * as Sentry from "@sentry/nextjs";
import pino from "pino";

type LogMeta = Record<string, unknown>;

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Pino logger configuration
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  
  ...(!isProduction && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "SYS:standard",
      },
    },
  }),

  base: {
    env: process.env.NODE_ENV,
    service: "taqam-hr-platform",
  },

  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "*.password",
      "*.token",
    ],
    censor: "[REDACTED]",
  },

  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

function toError(value: unknown): Error | null {
  if (value instanceof Error) return value;
  return null;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    pinoLogger.info(meta || {}, message);
  },

  warn(message: string, meta?: LogMeta) {
    pinoLogger.warn(meta || {}, message);
    
    // Send warnings to Sentry in production
    if (isProduction && meta) {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: meta,
      });
    }
  },

  error(message: string, meta?: LogMeta, err?: unknown) {
    const error = toError(err) ?? (meta ? toError((meta as any).error) : null);
    
    pinoLogger.error({ err: error, ...meta }, message);

    // Send to Sentry
    if (error) {
      Sentry.captureException(error, {
        contexts: {
          custom: meta || {},
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        extra: meta,
      });
    }
  },

  debug(message: string, meta?: LogMeta) {
    pinoLogger.debug(meta || {}, message);
  },

  // API Request logging
  apiRequest(req: {
    method: string;
    url: string;
    userId?: string;
    tenantId?: string;
  }) {
    pinoLogger.info(
      {
        type: "api_request",
        method: req.method,
        url: req.url,
        userId: req.userId,
        tenantId: req.tenantId,
      },
      `${req.method} ${req.url}`
    );
  },

  // API Response logging
  apiResponse(
    req: { method: string; url: string },
    res: { statusCode: number; duration: number }
  ) {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    pinoLogger[level](
      {
        type: "api_response",
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: res.duration,
      },
      `${req.method} ${req.url} - ${res.statusCode} (${res.duration}ms)`
    );
  },

  // Authentication events
  auth(
    action: "login" | "logout" | "token_refresh" | "login_failed",
    userId: string,
    meta?: LogMeta
  ) {
    pinoLogger.info(
      {
        type: "auth",
        action,
        userId,
        ...meta,
      },
      `Auth: ${action} for user ${userId}`
    );
  },

  // Security events
  security(
    event: "suspicious_activity" | "unauthorized_access" | "rate_limit_exceeded" | "password_reset",
    meta: LogMeta
  ) {
    pinoLogger.warn(
      {
        type: "security",
        event,
        ...meta,
      },
      `Security event: ${event}`
    );

    // Always send security events to Sentry
    Sentry.captureMessage(`Security: ${event}`, {
      level: "warning",
      extra: meta,
    });
  },

  // Performance tracking
  performance(operation: string, duration: number, meta?: LogMeta) {
    const level = duration > 5000 ? "warn" : duration > 1000 ? "info" : "debug";
    pinoLogger[level](
      {
        type: "performance",
        operation,
        duration,
        ...meta,
      },
      `${operation} took ${duration}ms`
    );
  },

  // Business logic events
  business(action: string, entity: string, entityId: string, meta?: LogMeta) {
    pinoLogger.info(
      {
        type: "business",
        action,
        entity,
        entityId,
        ...meta,
      },
      `${action} ${entity} ${entityId}`
    );
  },
};

// Timer utility
export function createTimer() {
  const start = Date.now();
  return {
    end: () => Date.now() - start,
    log: (operation: string, meta?: LogMeta) => {
      const duration = Date.now() - start;
      logger.performance(operation, duration, meta);
    },
  };
}

export default logger;
