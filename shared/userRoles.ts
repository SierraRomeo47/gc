// User Roles and Permissions System
export enum UserRole {
  ADMIN = 'admin',
  FLEET_MANAGER = 'fleet_manager',
  COMMERCIAL_MANAGER = 'commercial_manager',
  EMISSION_ANALYST = 'emission_analyst',
  TECH_SUPERINTENDENT = 'tech_superintendent',
  OPERATIONS_MANAGER = 'operations_manager',
  COMPLIANCE_OFFICER = 'compliance_officer'
}

export enum Permission {
  // Vessel Management
  VIEW_VESSELS = 'view_vessels',
  CREATE_VESSELS = 'create_vessels',
  EDIT_VESSELS = 'edit_vessels',
  DELETE_VESSELS = 'delete_vessels',
  
  // Fleet Management
  VIEW_FLEET = 'view_fleet',
  MANAGE_FLEET = 'manage_fleet',
  ASSIGN_VESSELS = 'assign_vessels',
  
  // Compliance
  VIEW_COMPLIANCE = 'view_compliance',
  MANAGE_COMPLIANCE = 'manage_compliance',
  VIEW_REPORTS = 'view_reports',
  
  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_ROLES = 'manage_roles',
  
  // Data Management
  IMPORT_DATA = 'import_data',
  EXPORT_DATA = 'export_data',
  MANAGE_FORMULAS = 'manage_formulas',
  
  // System
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs'
}

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  PREMIUM = 'premium'
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.VIEW_VESSELS,
    Permission.CREATE_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.DELETE_VESSELS,
    Permission.VIEW_FLEET,
    Permission.MANAGE_FLEET,
    Permission.ASSIGN_VESSELS,
    Permission.VIEW_COMPLIANCE,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_ROLES,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.MANAGE_FORMULAS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_AUDIT_LOGS
  ],
  
  [UserRole.FLEET_MANAGER]: [
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
    Permission.VIEW_ANALYTICS
  ],
  
  [UserRole.COMMERCIAL_MANAGER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS
  ],
  
  [UserRole.EMISSION_ANALYST]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS
  ],
  
  [UserRole.TECH_SUPERINTENDENT]: [
    Permission.VIEW_VESSELS,
    Permission.EDIT_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA
  ],
  
  [UserRole.OPERATIONS_MANAGER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.VIEW_USERS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS
  ],
  
  [UserRole.COMPLIANCE_OFFICER]: [
    Permission.VIEW_VESSELS,
    Permission.VIEW_FLEET,
    Permission.VIEW_COMPLIANCE,
    Permission.MANAGE_COMPLIANCE,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_ANALYTICS
  ]
};

// Subscription-based feature access
export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, string[]> = {
  [SubscriptionTier.BASIC]: [
    'view_vessels',
    'view_fleet',
    'view_compliance',
    'basic_reports'
  ],
  [SubscriptionTier.PROFESSIONAL]: [
    'view_vessels',
    'view_fleet',
    'view_compliance',
    'manage_fleet',
    'advanced_reports',
    'data_export',
    'analytics'
  ],
  [SubscriptionTier.ENTERPRISE]: [
    'view_vessels',
    'view_fleet',
    'view_compliance',
    'manage_fleet',
    'advanced_reports',
    'data_export',
    'analytics',
    'user_management',
    'custom_formulas',
    'api_access'
  ],
  [SubscriptionTier.PREMIUM]: [
    'view_vessels',
    'view_fleet',
    'view_compliance',
    'manage_fleet',
    'advanced_reports',
    'data_export',
    'analytics',
    'user_management',
    'custom_formulas',
    'api_access',
    'audit_logs',
    'priority_support',
    'custom_integrations'
  ]
};

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  tenantId: string;
  fleetIds: string[];
  vesselIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Vessel ownership interface
export interface VesselOwnership {
  vesselId: string;
  ownerId: string;
  chartererId?: string;
  managerId?: string;
  ownershipPercentage: number;
  charterPercentage?: number;
  managementPercentage?: number;
}

// Fleet interface
export interface Fleet {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  managerId?: string;
  vesselIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission checking utilities
export const hasPermission = (user: User, permission: Permission): boolean => {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const hasSubscriptionFeature = (user: User, feature: string): boolean => {
  const features = SUBSCRIPTION_FEATURES[user.subscriptionTier] || [];
  return features.includes(feature);
};

export const canAccessVessel = (user: User, vesselId: string): boolean => {
  // Admin can access all vessels
  if (user.role === UserRole.ADMIN) return true;
  
  // Check if user has access to this vessel
  return user.vesselIds.includes(vesselId);
};

export const canAccessFleet = (user: User, fleetId: string): boolean => {
  // Admin can access all fleets
  if (user.role === UserRole.ADMIN) return true;
  
  // Check if user has access to this fleet
  return user.fleetIds.includes(fleetId);
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Administrator',
  [UserRole.FLEET_MANAGER]: 'Fleet Manager',
  [UserRole.COMMERCIAL_MANAGER]: 'Commercial Manager',
  [UserRole.EMISSION_ANALYST]: 'Emission Analyst',
  [UserRole.TECH_SUPERINTENDENT]: 'Technical Superintendent',
  [UserRole.OPERATIONS_MANAGER]: 'Operations Manager',
  [UserRole.COMPLIANCE_OFFICER]: 'Compliance Officer'
};

// Subscription display names
export const SUBSCRIPTION_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.BASIC]: 'Basic',
  [SubscriptionTier.PROFESSIONAL]: 'Professional',
  [SubscriptionTier.ENTERPRISE]: 'Enterprise',
  [SubscriptionTier.PREMIUM]: 'Premium'
};
