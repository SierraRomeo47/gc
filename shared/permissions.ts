/**
 * Unified Permission System
 * Consolidates backend and frontend permission systems
 */

import { BackendRole, FrontendRole } from "./roleMapper";

/**
 * Unified permission enum that covers all system permissions
 */
export enum Permission {
  // Tenant Management
  MANAGE_TENANT = "MANAGE_TENANT",
  VIEW_TENANT = "VIEW_TENANT",
  
  // User Management
  MANAGE_USERS = "MANAGE_USERS",
  VIEW_USERS = "VIEW_USERS",
  CREATE_USERS = "CREATE_USERS",
  EDIT_USERS = "EDIT_USERS",
  DELETE_USERS = "DELETE_USERS",
  MANAGE_ROLES = "MANAGE_ROLES",
  
  // Vessel & Fleet Management
  MANAGE_VESSELS = "MANAGE_VESSELS",
  VIEW_VESSELS = "VIEW_VESSELS",
  CREATE_VESSELS = "CREATE_VESSELS",
  EDIT_VESSELS = "EDIT_VESSELS",
  DELETE_VESSELS = "DELETE_VESSELS",
  
  // Fleet Management
  VIEW_FLEET = "VIEW_FLEET",
  MANAGE_FLEET = "MANAGE_FLEET",
  ASSIGN_VESSELS = "ASSIGN_VESSELS",
  
  // Voyage & Data
  MANAGE_VOYAGES = "MANAGE_VOYAGES",
  VIEW_VOYAGES = "VIEW_VOYAGES",
  IMPORT_DATA = "IMPORT_DATA",
  EXPORT_DATA = "EXPORT_DATA",
  
  // Calculations
  RUN_CALCULATIONS = "RUN_CALCULATIONS",
  VIEW_CALCULATIONS = "VIEW_CALCULATIONS",
  
  // Scenarios
  MANAGE_SCENARIOS = "MANAGE_SCENARIOS",
  VIEW_SCENARIOS = "VIEW_SCENARIOS",
  
  // Compliance & Reporting
  MANAGE_COMPLIANCE = "MANAGE_COMPLIANCE",
  VIEW_COMPLIANCE = "VIEW_COMPLIANCE",
  GENERATE_REPORTS = "GENERATE_REPORTS",
  VIEW_REPORTS = "VIEW_REPORTS",
  
  // Regulatory Constants
  MANAGE_CONSTANTS = "MANAGE_CONSTANTS",
  VIEW_CONSTANTS = "VIEW_CONSTANTS",
  MANAGE_FORMULAS = "MANAGE_FORMULAS",
  
  // System
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
}

/**
 * Backend Role-Permission Matrix
 */
const backendRolePermissions: Record<BackendRole, Permission[]> = {
  [BackendRole.OWNER]: Object.values(Permission), // Owner has all permissions
  
  [BackendRole.ADMIN]: [
    Permission.VIEW_TENANT,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_VESSELS,
    Permission.VIEW_VESSELS,
    Permission.CREATE_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.DELETE_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_FLEET,
    Permission.ASSIGN_VESSELS,
    Permission.MANAGE_VOYAGES,
    Permission.VIEW_VOYAGES,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.RUN_CALCULATIONS,
    Permission.VIEW_CALCULATIONS,
    Permission.MANAGE_SCENARIOS,
    Permission.VIEW_SCENARIOS,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_COMPLIANCE,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_CONSTANTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [BackendRole.COMPLIANCE]: [
    Permission.VIEW_TENANT,
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_VOYAGES,
    Permission.EXPORT_DATA,
    Permission.RUN_CALCULATIONS,
    Permission.VIEW_CALCULATIONS,
    Permission.VIEW_SCENARIOS,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_COMPLIANCE,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_CONSTANTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [BackendRole.DATA_ENGINEER]: [
    Permission.VIEW_TENANT,
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_VOYAGES,
    Permission.VIEW_VOYAGES,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.RUN_CALCULATIONS,
    Permission.VIEW_CALCULATIONS,
    Permission.VIEW_CONSTANTS,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [BackendRole.OPS]: [
    Permission.VIEW_TENANT,
    Permission.VIEW_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_VOYAGES,
    Permission.VIEW_VOYAGES,
    Permission.VIEW_CALCULATIONS,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_CONSTANTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_REPORTS,
  ],
  
  [BackendRole.FINANCE]: [
    Permission.VIEW_TENANT,
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_VOYAGES,
    Permission.EXPORT_DATA,
    Permission.VIEW_CALCULATIONS,
    Permission.MANAGE_SCENARIOS,
    Permission.VIEW_SCENARIOS,
    Permission.VIEW_COMPLIANCE,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_CONSTANTS,
    Permission.VIEW_ANALYTICS,
  ],
  
  [BackendRole.VERIFIER_RO]: [
    Permission.VIEW_TENANT,
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_VOYAGES,
    Permission.VIEW_CALCULATIONS,
    Permission.VIEW_SCENARIOS,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_CONSTANTS,
    Permission.VIEW_AUDIT_LOGS,
  ],
};

/**
 * Frontend Role-Permission Matrix
 */
const frontendRolePermissions: Record<FrontendRole, Permission[]> = {
  [FrontendRole.ADMIN]: [
    Permission.VIEW_VESSELS,
    Permission.CREATE_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.DELETE_VESSELS,
    Permission.MANAGE_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_FLEET,
    Permission.ASSIGN_VESSELS,
    Permission.VIEW_COMPLIANCE,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.MANAGE_FORMULAS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
  ],
  
  [FrontendRole.FLEET_MANAGER]: [
    Permission.VIEW_VESSELS,
    Permission.CREATE_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_FLEET,
    Permission.ASSIGN_VESSELS,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
  ],
  
  [FrontendRole.COMMERCIAL_MANAGER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
  ],
  
  [FrontendRole.EMISSION_ANALYST]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
  ],
  
  [FrontendRole.TECH_SUPERINTENDENT]: [
    Permission.VIEW_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
  ],
  
  [FrontendRole.OPERATIONS_MANAGER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
  ],
  
  [FrontendRole.COMPLIANCE_OFFICER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS,
  ],
};

/**
 * Check if a backend role has a specific permission
 */
export function backendRoleHasPermission(role: BackendRole | string, permission: Permission): boolean {
  const permissions = backendRolePermissions[role as BackendRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a frontend role has a specific permission
 */
export function frontendRoleHasPermission(role: FrontendRole | string, permission: Permission): boolean {
  const permissions = frontendRolePermissions[role as FrontendRole];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role (either backend or frontend) has a permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  // Try as backend role first
  if (backendRolePermissions[role as BackendRole]) {
    return backendRoleHasPermission(role as BackendRole, permission);
  }
  
  // Try as frontend role
  if (frontendRolePermissions[role as FrontendRole]) {
    return frontendRoleHasPermission(role as FrontendRole, permission);
  }
  
  return false;
}

/**
 * Check if role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a backend role
 */
export function getBackendRolePermissions(role: BackendRole): Permission[] {
  return backendRolePermissions[role] || [];
}

/**
 * Get all permissions for a frontend role
 */
export function getFrontendRolePermissions(role: FrontendRole): Permission[] {
  return frontendRolePermissions[role] || [];
}

/**
 * Get all permissions for any role type
 */
export function getRolePermissions(role: string): Permission[] {
  if (backendRolePermissions[role as BackendRole]) {
    return getBackendRolePermissions(role as BackendRole);
  }
  
  if (frontendRolePermissions[role as FrontendRole]) {
    return getFrontendRolePermissions(role as FrontendRole);
  }
  
  return [];
}

/**
 * Permission display names
 */
export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  [Permission.MANAGE_TENANT]: "Manage Tenant",
  [Permission.VIEW_TENANT]: "View Tenant",
  [Permission.MANAGE_USERS]: "Manage Users",
  [Permission.VIEW_USERS]: "View Users",
  [Permission.CREATE_USERS]: "Create Users",
  [Permission.EDIT_USERS]: "Edit Users",
  [Permission.DELETE_USERS]: "Delete Users",
  [Permission.MANAGE_ROLES]: "Manage Roles",
  [Permission.MANAGE_VESSELS]: "Manage Vessels",
  [Permission.VIEW_VESSELS]: "View Vessels",
  [Permission.CREATE_VESSELS]: "Create Vessels",
  [Permission.EDIT_VESSELS]: "Edit Vessels",
  [Permission.DELETE_VESSELS]: "Delete Vessels",
  [Permission.VIEW_FLEET]: "View Fleet",
  [Permission.MANAGE_FLEET]: "Manage Fleet",
  [Permission.ASSIGN_VESSELS]: "Assign Vessels",
  [Permission.MANAGE_VOYAGES]: "Manage Voyages",
  [Permission.VIEW_VOYAGES]: "View Voyages",
  [Permission.IMPORT_DATA]: "Import Data",
  [Permission.EXPORT_DATA]: "Export Data",
  [Permission.RUN_CALCULATIONS]: "Run Calculations",
  [Permission.VIEW_CALCULATIONS]: "View Calculations",
  [Permission.MANAGE_SCENARIOS]: "Manage Scenarios",
  [Permission.VIEW_SCENARIOS]: "View Scenarios",
  [Permission.MANAGE_COMPLIANCE]: "Manage Compliance",
  [Permission.VIEW_COMPLIANCE]: "View Compliance",
  [Permission.GENERATE_REPORTS]: "Generate Reports",
  [Permission.VIEW_REPORTS]: "View Reports",
  [Permission.MANAGE_CONSTANTS]: "Manage Constants",
  [Permission.VIEW_CONSTANTS]: "View Constants",
  [Permission.MANAGE_FORMULAS]: "Manage Formulas",
  [Permission.VIEW_ANALYTICS]: "View Analytics",
  [Permission.MANAGE_SETTINGS]: "Manage Settings",
  [Permission.VIEW_AUDIT_LOGS]: "View Audit Logs",
};

export function getPermissionDisplayName(permission: Permission): string {
  return PERMISSION_DISPLAY_NAMES[permission] || permission.toString();
}



