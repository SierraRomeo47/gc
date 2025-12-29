/**
 * View Models for Frontend
 * These are frontend-specific types that extend or transform database schema types
 */

import type { User, Vessel, Fleet, Organization, Tenant } from "./schema";

/**
 * Subscription tiers for the application
 */
export enum SubscriptionTier {
  BASIC = "basic",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
  PREMIUM = "premium",
}

/**
 * User View Model
 * Extends DB User with computed fields and frontend-specific properties
 */
export interface UserViewModel {
  // Core user fields from DB
  id: string;
  username: string;
  email: string;
  tenantId: string | null;
  mfaEnabled: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  
  // Role information (from userRoles table)
  role: string;
  
  // Frontend-specific computed fields
  name: string; // Display name (derived from username or email)
  subscriptionTier: SubscriptionTier;
  fleetIds: string[]; // Computed from userFleetAccess table
  vesselIds: string[]; // Computed from userVesselAccess table
  isActive: boolean;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Vessel View Model
 * Extends DB Vessel with computed compliance fields
 */
export interface VesselViewModel {
  // Core vessel fields from DB
  id: string;
  tenantId: string;
  fleetId: string | null;
  imoNumber: string;
  name: string;
  vesselType: string;
  flagState: string;
  grossTonnage: number;
  deadweightTonnage: number | null;
  mainEngineType: string | null;
  iceClass: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Frontend-specific computed fields
  type: string; // Alias for vesselType
  flag: string; // Alias for flagState
  voyageType?: string; // Computed from recent voyages
  complianceStatus: "compliant" | "warning" | "non-compliant";
  ghgIntensity: number; // gCO2e/MJ
  targetIntensity: number; // gCO2e/MJ
  fuelConsumption: number; // tonnes
  creditBalance: number; // MJ or tonnes CO2eq
  
  // Optional ownership fields
  ownerId?: string;
  managerId?: string;
  chartererId?: string;
}

/**
 * Fleet View Model
 * Extends DB Fleet with vessel counts and computed fields
 */
export interface FleetViewModel {
  // Core fleet fields from DB
  id: string;
  orgId: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  
  // Frontend-specific computed fields
  vesselIds: string[]; // Computed from vessels table
  vesselCount: number;
  isActive: boolean;
  updatedAt: string;
  
  // Optional ownership fields
  ownerId?: string;
  managerId?: string;
}

/**
 * Organization View Model
 */
export interface OrganizationViewModel {
  id: string;
  tenantId: string;
  name: string;
  parentOrgId: string | null;
  createdAt: Date;
  
  // Computed fields
  fleetCount?: number;
  vesselCount?: number;
}

/**
 * Tenant View Model
 */
export interface TenantViewModel {
  id: string;
  name: string;
  createdAt: Date;
  settingsJson: any;
  
  // Computed fields
  userCount?: number;
  vesselCount?: number;
  fleetCount?: number;
}

/**
 * Port View Model (mostly same as DB)
 */
export interface PortViewModel {
  id: string;
  unlocode: string;
  name: string;
  countryIso: string;
  isEu: boolean;
  isUk: boolean;
  isOmr: boolean;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Fuel View Model (mostly same as DB)
 */
export interface FuelViewModel {
  id: string;
  code: string;
  name: string;
  lcvMjKg: string;
  defaultTtwGco2eMj: string;
  defaultWttGco2eMj: string;
  defaultCo2FactorT: string;
}

/**
 * Voyage View Model
 */
export interface VoyageViewModel {
  id: string;
  tenantId: string;
  vesselId: string;
  voyageNumber: string;
  departurePortId: string;
  arrivalPortId: string;
  departureAt: Date;
  arrivalAt: Date;
  distanceNm: string;
  voyageType: string;
  coverageEuPct: string;
  coverageUkPct: string;
  status: string;
  createdAt: Date;
  
  // Populated relations
  departurePort?: PortViewModel;
  arrivalPort?: PortViewModel;
  vessel?: VesselViewModel;
}

/**
 * User Preferences Data Structure
 */
export interface UserPreferencesData {
  userId: string;
  favorites: string[]; // Array of vessel IDs
  tags: Record<string, string[]>; // vesselId -> array of tag names
  viewMode: "tiles" | "list";
  searchHistory: string[];
  currency: "EUR" | "USD" | "GBP";
  language: "en" | "es" | "fr" | "de";
  timezone: string;
  theme: "light" | "dark" | "system";
  filters: {
    vesselType: string[];
    flag: string[];
    complianceStatus: string[];
    iceClass: string[];
    engineType: string[];
  };
  sortBy: "name" | "imo" | "type" | "flag" | "compliance" | "ghgIntensity";
  sortOrder: "asc" | "desc";
}

/**
 * API Response Wrapper Types
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Imported File (for data imports)
 */
export interface ImportedFile {
  id: string;
  filename: string;
  type: "csv" | "xlsx" | "sql";
  uploadDate: string;
  recordCount: number;
  columns: string[];
  mappedFields: Record<string, string>;
  status: "processing" | "mapped" | "imported" | "error";
}

/**
 * Calculation Formula
 */
export interface CalculationFormula {
  id: string;
  framework: string;
  type: string;
  formula: string;
  variables: Record<string, number | string>;
  description: string;
  locked?: boolean;
}

/**
 * Compliance Status
 */
export type ComplianceStatus = "compliant" | "warning" | "non-compliant";

/**
 * Voyage Type
 */
export type VoyageType = "intra-eu" | "extra-eu" | "uk-domestic" | "omr" | "other";

/**
 * User Access Info (comprehensive access information)
 */
export interface UserAccessInfo {
  fleets: FleetViewModel[];
  vessels: VesselViewModel[];
  explicitFleetAccess: Array<{
    id: string;
    userId: string;
    fleetId: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>;
  explicitVesselAccess: Array<{
    id: string;
    userId: string;
    vesselId: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>;
}

/**
 * Subscription Features
 */
export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, string[]> = {
  [SubscriptionTier.BASIC]: [
    "view_vessels",
    "view_fleet",
    "view_compliance",
    "basic_reports",
  ],
  [SubscriptionTier.PROFESSIONAL]: [
    "view_vessels",
    "view_fleet",
    "view_compliance",
    "manage_fleet",
    "advanced_reports",
    "data_export",
    "analytics",
  ],
  [SubscriptionTier.ENTERPRISE]: [
    "view_vessels",
    "view_fleet",
    "view_compliance",
    "manage_fleet",
    "advanced_reports",
    "data_export",
    "analytics",
    "user_management",
    "custom_formulas",
    "api_access",
  ],
  [SubscriptionTier.PREMIUM]: [
    "view_vessels",
    "view_fleet",
    "view_compliance",
    "manage_fleet",
    "advanced_reports",
    "data_export",
    "analytics",
    "user_management",
    "custom_formulas",
    "api_access",
    "audit_logs",
    "priority_support",
    "custom_integrations",
  ],
};

/**
 * Subscription Display Names
 */
export const SUBSCRIPTION_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.BASIC]: "Basic",
  [SubscriptionTier.PROFESSIONAL]: "Professional",
  [SubscriptionTier.ENTERPRISE]: "Enterprise",
  [SubscriptionTier.PREMIUM]: "Premium",
};

/**
 * Check if user has subscription feature
 */
export function hasSubscriptionFeature(tier: SubscriptionTier, feature: string): boolean {
  const features = SUBSCRIPTION_FEATURES[tier] || [];
  return features.includes(feature);
}



