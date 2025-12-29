/**
 * Role Mapping Layer
 * Provides bidirectional mapping between backend and frontend role systems
 */

// Backend roles from server/auth/rbac.ts
export enum BackendRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  COMPLIANCE = "COMPLIANCE",
  DATA_ENGINEER = "DATA_ENGINEER",
  OPS = "OPS",
  FINANCE = "FINANCE",
  VERIFIER_RO = "VERIFIER_RO",
}

// Frontend roles from client/lib/userRoles.ts
export enum FrontendRole {
  ADMIN = "admin",
  FLEET_MANAGER = "fleet_manager",
  COMMERCIAL_MANAGER = "commercial_manager",
  EMISSION_ANALYST = "emission_analyst",
  TECH_SUPERINTENDENT = "tech_superintendent",
  OPERATIONS_MANAGER = "operations_manager",
  COMPLIANCE_OFFICER = "compliance_officer",
}

/**
 * Mapping from backend roles to frontend roles
 */
const backendToFrontendMap: Record<BackendRole, FrontendRole> = {
  [BackendRole.OWNER]: FrontendRole.ADMIN,
  [BackendRole.ADMIN]: FrontendRole.ADMIN,
  [BackendRole.COMPLIANCE]: FrontendRole.COMPLIANCE_OFFICER,
  [BackendRole.DATA_ENGINEER]: FrontendRole.EMISSION_ANALYST,
  [BackendRole.OPS]: FrontendRole.OPERATIONS_MANAGER,
  [BackendRole.FINANCE]: FrontendRole.COMMERCIAL_MANAGER,
  [BackendRole.VERIFIER_RO]: FrontendRole.COMPLIANCE_OFFICER,
};

/**
 * Mapping from frontend roles to backend roles
 */
const frontendToBackendMap: Record<FrontendRole, BackendRole> = {
  [FrontendRole.ADMIN]: BackendRole.ADMIN,
  [FrontendRole.FLEET_MANAGER]: BackendRole.ADMIN,
  [FrontendRole.COMMERCIAL_MANAGER]: BackendRole.FINANCE,
  [FrontendRole.EMISSION_ANALYST]: BackendRole.DATA_ENGINEER,
  [FrontendRole.TECH_SUPERINTENDENT]: BackendRole.OPS,
  [FrontendRole.OPERATIONS_MANAGER]: BackendRole.OPS,
  [FrontendRole.COMPLIANCE_OFFICER]: BackendRole.COMPLIANCE,
};

/**
 * Convert backend role to frontend role
 */
export function toFrontendRole(backendRole: string): string {
  const normalized = backendRole.toUpperCase() as BackendRole;
  return backendToFrontendMap[normalized] || FrontendRole.EMISSION_ANALYST;
}

/**
 * Convert frontend role to backend role
 */
export function toBackendRole(frontendRole: string): string {
  const normalized = frontendRole.toLowerCase() as FrontendRole;
  return frontendToBackendMap[normalized] || BackendRole.DATA_ENGINEER;
}

/**
 * Check if a backend role string is valid
 */
export function isValidBackendRole(role: string): boolean {
  return Object.values(BackendRole).includes(role.toUpperCase() as BackendRole);
}

/**
 * Check if a frontend role string is valid
 */
export function isValidFrontendRole(role: string): boolean {
  return Object.values(FrontendRole).includes(role.toLowerCase() as FrontendRole);
}

/**
 * Get all backend roles
 */
export function getAllBackendRoles(): BackendRole[] {
  return Object.values(BackendRole);
}

/**
 * Get all frontend roles
 */
export function getAllFrontendRoles(): FrontendRole[] {
  return Object.values(FrontendRole);
}

/**
 * Get display name for backend role
 */
export function getBackendRoleDisplayName(role: BackendRole | string): string {
  const displayNames: Record<BackendRole, string> = {
    [BackendRole.OWNER]: "Owner",
    [BackendRole.ADMIN]: "Administrator",
    [BackendRole.COMPLIANCE]: "Compliance Officer",
    [BackendRole.DATA_ENGINEER]: "Data Engineer",
    [BackendRole.OPS]: "Operations Manager",
    [BackendRole.FINANCE]: "Finance Manager",
    [BackendRole.VERIFIER_RO]: "Verifier (Read-Only)",
  };
  
  return displayNames[role as BackendRole] || role.toString();
}

/**
 * Get display name for frontend role
 */
export function getFrontendRoleDisplayName(role: FrontendRole | string): string {
  const displayNames: Record<FrontendRole, string> = {
    [FrontendRole.ADMIN]: "System Administrator",
    [FrontendRole.FLEET_MANAGER]: "Fleet Manager",
    [FrontendRole.COMMERCIAL_MANAGER]: "Commercial Manager",
    [FrontendRole.EMISSION_ANALYST]: "Emission Analyst",
    [FrontendRole.TECH_SUPERINTENDENT]: "Technical Superintendent",
    [FrontendRole.OPERATIONS_MANAGER]: "Operations Manager",
    [FrontendRole.COMPLIANCE_OFFICER]: "Compliance Officer",
  };
  
  return displayNames[role as FrontendRole] || role.toString();
}

// Type guards
export function isBackendRole(role: any): role is BackendRole {
  return typeof role === 'string' && isValidBackendRole(role);
}

export function isFrontendRole(role: any): role is FrontendRole {
  return typeof role === 'string' && isValidFrontendRole(role);
}



