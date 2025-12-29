import type { Request, Response, NextFunction } from "express";
import { BackendRole } from "@shared/roleMapper";
import { Permission, backendRoleHasPermission, hasPermission as checkPermission } from "@shared/permissions";

// Re-export for backwards compatibility
export { BackendRole as Role };
export { Permission };

/**
 * Check if a role has a specific permission (uses unified permission system)
 */
export function hasPermission(role: BackendRole | string, permission: Permission): boolean {
  return backendRoleHasPermission(role as BackendRole, permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(role: BackendRole | string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(role: BackendRole | string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Extend Express Request to include user context
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        tenantId: string;
        role: BackendRole | string;
      };
      requestId?: string;
    }
  }
}

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user context" });
    }

    const hasAccess = permissions.every(permission => 
      hasPermission(req.user!.role, permission)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Forbidden: Insufficient permissions",
        required: permissions,
        role: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the required permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user context" });
    }

    const hasAccess = permissions.some(permission => 
      hasPermission(req.user!.role, permission)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Forbidden: Insufficient permissions",
        required: permissions,
        role: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has specific role
 */
export function requireRole(...roles: (BackendRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user context" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden: Insufficient role",
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
}

