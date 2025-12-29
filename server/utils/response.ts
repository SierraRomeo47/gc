/**
 * Standardized API Response Helpers
 * Provides consistent response formats across all endpoints
 */

import type { Response } from "express";
import type { ApiSuccessResponse, ApiErrorResponse, PaginatedResponse } from "@shared/viewModels";

/**
 * Send a successful response
 */
export function successResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: message,
    code,
    details,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 */
export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  meta?: Record<string, any>
): void {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;
  
  const paginatedData: PaginatedResponse<T> = {
    items,
    total,
    page,
    limit,
    hasMore,
    totalPages,
  };
  
  successResponse(res, paginatedData, 200, meta);
}

/**
 * Send a created response (201)
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): void {
  successResponse(res, data, 201, meta);
}

/**
 * Send a no content response (204)
 */
export function noContentResponse(res: Response): void {
  res.status(204).send();
}

/**
 * Send a bad request error (400)
 */
export function badRequestError(
  res: Response,
  message: string = "Bad request",
  details?: any
): void {
  errorResponse(res, message, 400, "BAD_REQUEST", details);
}

/**
 * Send an unauthorized error (401)
 */
export function unauthorizedError(
  res: Response,
  message: string = "Unauthorized",
  details?: any
): void {
  errorResponse(res, message, 401, "UNAUTHORIZED", details);
}

/**
 * Send a forbidden error (403)
 */
export function forbiddenError(
  res: Response,
  message: string = "Forbidden",
  details?: any
): void {
  errorResponse(res, message, 403, "FORBIDDEN", details);
}

/**
 * Send a not found error (404)
 */
export function notFoundError(
  res: Response,
  message: string = "Resource not found",
  details?: any
): void {
  errorResponse(res, message, 404, "NOT_FOUND", details);
}

/**
 * Send a conflict error (409)
 */
export function conflictError(
  res: Response,
  message: string = "Conflict",
  details?: any
): void {
  errorResponse(res, message, 409, "CONFLICT", details);
}

/**
 * Send a validation error (422)
 */
export function validationError(
  res: Response,
  message: string = "Validation failed",
  errors?: any
): void {
  errorResponse(res, message, 422, "VALIDATION_ERROR", errors);
}

/**
 * Send an internal server error (500)
 */
export function internalServerError(
  res: Response,
  message: string = "Internal server error",
  details?: any
): void {
  errorResponse(res, message, 500, "INTERNAL_SERVER_ERROR", details);
}

/**
 * Wrap async route handlers with error catching
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Async handler error:", error);
      internalServerError(res, error.message, {
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    });
  };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  RESOURCE_EXISTS: "RESOURCE_EXISTS",
  INVALID_INPUT: "INVALID_INPUT",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];



