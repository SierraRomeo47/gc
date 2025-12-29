import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { Role } from "./rbac";

// Secrets validation - no defaults in production
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? '' : "dev-secret-not-for-production");
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (NODE_ENV === 'production' ? '' : "dev-refresh-secret-not-for-production");

// Test mode flag - ONLY for automated testing, never use in development or production
const TESTING_MODE = process.env.SKIP_AUTH_FOR_TESTS === 'true';
const TEST_USER = {
  id: 'test-user-id',
  username: 'test-user',
  email: 'test@example.com',
  tenantId: 'test-tenant-id',
  role: 'ADMIN' as Role,
};

if (TESTING_MODE) {
  console.warn('⚠️  WARNING: Authentication is DISABLED for testing!');
  console.warn('⚠️  This should ONLY be used in automated test environments.');
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  tenantId: string;
  role: Role;
}

/**
 * Generate access token (15 minutes)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
    issuer: "ghgconnect",
  });
}

/**
 * Generate refresh token (7 days)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    issuer: "ghgconnect",
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Test mode bypass - ONLY for automated testing
  if (TESTING_MODE) {
    req.user = TEST_USER;
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Unauthorized: Token expired" });
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

/**
 * Middleware to add request ID for tracing
 */
export function addRequestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
}

/**
 * Middleware to enforce tenant isolation
 * Ensures that users can only access data from their own tenant
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user context" });
  }

  // Add tenant filter to query parameters
  req.query.tenantId = req.user.tenantId;
  
  // If body contains tenantId, verify it matches user's tenant
  if (req.body && req.body.tenantId && req.body.tenantId !== req.user.tenantId) {
    return res.status(403).json({ 
      error: "Forbidden: Cannot access data from another tenant" 
    });
  }

  // Automatically set tenantId in request body for POST/PUT requests
  if ((req.method === "POST" || req.method === "PUT") && req.body) {
    req.body.tenantId = req.user.tenantId;
  }

  next();
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis-backed rate limiter
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip || "anonymous";
    const now = Date.now();
    
    let record = rateLimitStore.get(identifier);
    
    // Reset if window has passed
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(identifier, record);
    }
    
    record.count++;
    
    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", new Date(record.resetAt).toISOString());
    
    if (record.count > maxRequests) {
      return res.status(429).json({ 
        error: "Too many requests",
        retryAfter: new Date(record.resetAt).toISOString()
      });
    }
    
    next();
  };
}

/**
 * Cleanup old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Every minute

