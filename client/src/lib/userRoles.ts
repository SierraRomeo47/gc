/**
 * User Roles and Permissions System (Frontend)
 * Now uses shared role mapper and permissions system
 */

import {
  FrontendRole,
  BackendRole,
  toFrontendRole,
  toBackendRole,
  getFrontendRoleDisplayName,
  getAllFrontendRoles,
} from "@shared/roleMapper";

import {
  Permission,
  frontendRoleHasPermission,
  getFrontendRolePermissions,
  getPermissionDisplayName,
  PERMISSION_DISPLAY_NAMES,
} from "@shared/permissions";

import {
  SubscriptionTier,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_DISPLAY_NAMES,
  hasSubscriptionFeature,
  type UserViewModel,
} from "@shared/viewModels";

// Re-export enums and types for convenience
export { FrontendRole as UserRole };
export { Permission };
export { SubscriptionTier };

// Re-export display names
export const ROLE_DISPLAY_NAMES = getAllFrontendRoles().reduce((acc, role) => {
  acc[role] = getFrontendRoleDisplayName(role);
  return acc;
}, {} as Record<FrontendRole, string>);

export { SUBSCRIPTION_DISPLAY_NAMES, PERMISSION_DISPLAY_NAMES };

/**
 * Role-based permissions mapping (uses unified permissions from shared)
 */
export const ROLE_PERMISSIONS = getAllFrontendRoles().reduce((acc, role) => {
  acc[role] = getFrontendRolePermissions(role);
  return acc;
}, {} as Record<FrontendRole, Permission[]>);

// Subscription features (re-export from shared)
export { SUBSCRIPTION_FEATURES };

/**
 * Permission checking utilities
 */
export const hasPermission = (user: UserViewModel, permission: Permission): boolean => {
  return frontendRoleHasPermission(user.role, permission);
};

export { hasSubscriptionFeature };

export const canAccessVessel = (user: UserViewModel, vesselId: string): boolean => {
  // Admin can access all vessels
  if (user.role === FrontendRole.ADMIN) return true;
  
  // Check if user has access to this vessel
  return user.vesselIds.includes(vesselId);
};

export const canAccessFleet = (user: UserViewModel, fleetId: string): boolean => {
  // Admin can access all fleets
  if (user.role === FrontendRole.ADMIN) return true;
  
  // Check if user has access to this fleet
  return user.fleetIds.includes(fleetId);
};

/**
 * Convert backend role to frontend role (for API responses)
 */
export { toFrontendRole, toBackendRole };

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: string): string => {
  return getFrontendRoleDisplayName(role as FrontendRole);
};

/**
 * Get all available roles
 */
export const getAllRoles = (): FrontendRole[] => {
  return getAllFrontendRoles();
};

/**
 * Check if a role string is valid
 */
export const isValidRole = (role: string): boolean => {
  return getAllFrontendRoles().includes(role as FrontendRole);
};
