import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler';

/**
 * Validation target (what to validate)
 */
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
}

/**
 * Validate request data against a Zod schema
 */
export function validate(schema: ZodSchema, target: ValidationTarget = ValidationTarget.BODY) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate
      const data = req[target];

      // Validate against schema
      const validated = await schema.parseAsync(data);

      // Replace the original data with validated data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate multiple targets at once
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = [];

      // Validate each target
      for (const [target, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[target as keyof Request];
            const validated = await schema.parseAsync(data);
            req[target as keyof Request] = validated as any;
          } catch (error) {
            if (error instanceof ZodError) {
              error.errors.forEach((err) => {
                errors.push({
                  target,
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code,
                });
              });
            }
          }
        }
      }

      if (errors.length > 0) {
        return next(new ValidationError('Validation failed', errors));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),

  // ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // IMO number
  imoNumber: z.string().regex(/^IMO\d{7}$/, 'Invalid IMO number format'),

  // Email
  email: z.string().email('Invalid email address'),

  // Date range
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).refine(
    (data) => data.endDate >= data.startDate,
    'End date must be after start date'
  ),

  // Sorting
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
};

/**
 * Sanitize string inputs (prevent XSS)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object inputs recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize all inputs
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * SQL injection prevention - check for suspicious patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  /(;|--|\|{2})/g,
  /(\bOR\b|\bAND\b).*=.*=/gi,
  /('|").*(\bOR\b|\bAND\b).*('|")/gi,
];

export function containsSQLInjection(str: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Middleware to check for SQL injection attempts
 */
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const checkObject = (obj: any, path: string = ''): string | null => {
    if (typeof obj === 'string') {
      if (containsSQLInjection(obj)) {
        return path || 'input';
      }
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = checkObject(obj[i], `${path}[${i}]`);
        if (result) return result;
      }
    }

    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const result = checkObject(value, path ? `${path}.${key}` : key);
        if (result) return result;
      }
    }

    return null;
  };

  // Check body, query, and params
  const suspiciousField =
    checkObject(req.body) || checkObject(req.query) || checkObject(req.params);

  if (suspiciousField) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Suspicious input detected',
      field: suspiciousField,
    });
  }

  next();
}

/**
 * File upload validation
 */
export interface FileUploadOptions {
  maxSize?: number;          // Max file size in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  required?: boolean;
}

export function validateFileUpload(options: FileUploadOptions = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/sql'],
    allowedExtensions = ['.csv', '.xlsx', '.xls', '.sql'],
    required = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;

    // Check if file is required
    if (required && !file) {
      return res.status(400).json({
        error: 'File required',
        message: 'Please upload a file',
      });
    }

    if (file) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File size must be less than ${maxSize / 1024 / 1024}MB`,
          maxSize,
        });
      }

      // Check MIME type
      if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${file.mimetype} not allowed`,
          allowedTypes: allowedMimeTypes,
        });
      }

      // Check file extension
      const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (allowedExtensions && ext && !allowedExtensions.includes(ext)) {
        return res.status(400).json({
          error: 'Invalid file extension',
          message: `File extension ${ext} not allowed`,
          allowedExtensions,
        });
      }
    }

    next();
  };
}

/**
 * Schema examples for common entities
 */
export const schemas = {
  // Vessel schemas
  createVessel: z.object({
    name: z.string().min(1).max(255),
    imoNumber: commonSchemas.imoNumber,
    vesselType: z.string().min(1),
    flagState: z.string().length(2),
    grossTonnage: z.number().int().positive(),
    deadweightTonnage: z.number().int().positive().optional(),
    mainEngineType: z.string().optional(),
    iceClass: z.string().optional().nullable(),
    fleetId: z.string().uuid().optional().nullable(),
  }),

  updateVessel: z.object({
    name: z.string().min(1).max(255).optional(),
    vesselType: z.string().min(1).optional(),
    flagState: z.string().length(2).optional(),
    grossTonnage: z.number().int().positive().optional(),
    deadweightTonnage: z.number().int().positive().optional(),
    mainEngineType: z.string().optional(),
    iceClass: z.string().optional().nullable(),
    fleetId: z.string().uuid().optional().nullable(),
  }),

  // User schemas
  createUser: z.object({
    username: z.string().min(3).max(50),
    email: commonSchemas.email,
    password: z.string().min(8).max(100),
    role: z.enum(['OWNER', 'ADMIN', 'COMPLIANCE', 'DATA_ENGINEER', 'OPS', 'FINANCE', 'VERIFIER_RO']),
  }),

  // Login schema
  login: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),

  // Fleet schema
  createFleet: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional().nullable(),
    orgId: z.string().uuid(),
    tenantId: z.string().uuid(),
  }),

  // Voyage schema
  createVoyage: z.object({
    vesselId: z.string().uuid(),
    voyageNumber: z.string().min(1),
    departurePortId: z.string().uuid(),
    arrivalPortId: z.string().uuid(),
    departureAt: z.coerce.date(),
    arrivalAt: z.coerce.date(),
    distanceNm: z.number().positive(),
    voyageType: z.enum(['INTRA_EU', 'EXTRA_EU', 'UK_DOMESTIC', 'OTHER']),
  }).refine(
    (data) => data.arrivalAt > data.departureAt,
    'Arrival time must be after departure time'
  ),
};

export default {
  validate,
  validateMultiple,
  sanitizeInputs,
  preventSQLInjection,
  validateFileUpload,
  commonSchemas,
  schemas,
};

