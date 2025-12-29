import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    
    Object.setPrototypeOf(this, ApplicationError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error handler
 */
function handleDatabaseError(error: any): { statusCode: number; message: string; code?: string } {
  // PostgreSQL specific errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return {
          statusCode: 409,
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
        };
      case '23503': // Foreign key violation
        return {
          statusCode: 400,
          message: 'Invalid reference to related resource',
          code: 'INVALID_REFERENCE',
        };
      case '23502': // Not null violation
        return {
          statusCode: 400,
          message: 'Required field is missing',
          code: 'MISSING_REQUIRED_FIELD',
        };
      case '42P01': // Undefined table
        return {
          statusCode: 500,
          message: 'Database schema error',
          code: 'SCHEMA_ERROR',
        };
      case 'ECONNREFUSED':
        return {
          statusCode: 503,
          message: 'Database connection failed',
          code: 'DB_CONNECTION_ERROR',
        };
      default:
        return {
          statusCode: 500,
          message: 'Database error occurred',
          code: error.code,
        };
    }
  }

  return {
    statusCode: 500,
    message: 'Database error occurred',
  };
}

/**
 * Validation error handler (Zod)
 */
function handleValidationError(error: ZodError): {
  statusCode: number;
  message: string;
  errors: any[];
} {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    errors,
  };
}

/**
 * JWT error handler
 */
function handleJWTError(error: any): { statusCode: number; message: string } {
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token',
    };
  }
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired',
    };
  }
  return {
    statusCode: 401,
    message: 'Authentication failed',
  };
}

/**
 * Format error response
 */
function formatErrorResponse(
  error: any,
  req: Request,
  isDevelopment: boolean
) {
  const response: any = {
    status: 'error',
    message: error.message || 'Internal server error',
  };

  // Add error code if available
  if (error.code) {
    response.code = error.code;
  }

  // Add request ID for tracing
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Add validation errors if available
  if (error.errors) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
    response.raw = error;
  }

  // Add timestamp
  response.timestamp = new Date().toISOString();

  return response;
}

/**
 * Log error with context
 */
function logError(error: any, req: Request) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    },
  };

  // In production, log to structured logging service
  // In development, log to console
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service (Winston, Pino, etc.)
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('Error occurred:', errorLog);
  }
}

/**
 * Global error handler middleware
 * This should be the last middleware in the chain
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log the error
  logError(error, req);

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errorResponse: any = { message };

  // Handle specific error types
  if (error instanceof ZodError) {
    const validationError = handleValidationError(error);
    statusCode = validationError.statusCode;
    message = validationError.message;
    errorResponse = {
      message,
      errors: validationError.errors,
    };
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const jwtError = handleJWTError(error);
    statusCode = jwtError.statusCode;
    message = jwtError.message;
  } else if (error.code && typeof error.code === 'string') {
    // Database errors
    if (error.code.startsWith('23') || error.code === 'ECONNREFUSED') {
      const dbError = handleDatabaseError(error);
      statusCode = dbError.statusCode;
      message = dbError.message;
      if (dbError.code) {
        errorResponse.code = dbError.code;
      }
    }
  }

  // Format the full error response
  const fullResponse = formatErrorResponse(
    { ...error, message, statusCode },
    req,
    isDevelopment
  );

  // Send response
  res.status(statusCode).json(fullResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApplicationError(
    `Route not found: ${req.method} ${req.url}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error helpers
 */
export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request', code?: string) {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, code);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict', code?: string) {
    super(message, 409, code);
  }
}

export class ValidationError extends ApplicationError {
  errors: any[];

  constructor(message: string = 'Validation failed', errors: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, code);
  }
}

