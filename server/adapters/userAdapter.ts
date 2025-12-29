/**
 * User Adapter
 * Transforms database User entity to UserViewModel for frontend consumption
 */

import type { User, UserRole } from "@shared/schema";
import type { UserViewModel, SubscriptionTier } from "@shared/viewModels";
import { toFrontendRole } from "@shared/roleMapper";

/**
 * Transform DB User to UserViewModel
 * @param user - Database user entity
 * @param role - User's role from userRoles table
 * @param fleetIds - User's accessible fleet IDs (from userFleetAccess)
 * @param vesselIds - User's accessible vessel IDs (from userVesselAccess)
 * @param subscriptionTier - User's subscription tier (default: professional)
 */
export function toUserViewModel(
  user: User,
  role?: string,
  fleetIds: string[] = [],
  vesselIds: string[] = [],
  subscriptionTier: SubscriptionTier = "professional"
): UserViewModel {
  // Use the same role name consistently - no conversion needed
  console.log('🔍 toUserViewModel - role received:', role);
  
  // Use the role directly since we're keeping frontend and backend role names consistent
  const userRole = role || 'emission_analyst';
  
  console.log('🔍 toUserViewModel - role used:', userRole);
  
  // Generate display name from username or email
  const name = user.username || user.email.split("@")[0] || "Unknown User";
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    tenantId: user.tenantId,
    mfaEnabled: user.mfaEnabled,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    
    // Role and permissions
    role: userRole,
    
    // Computed/extended fields
    name,
    subscriptionTier,
    fleetIds,
    vesselIds,
    isActive: true, // Could be computed from lastLogin or other criteria
    updatedAt: user.createdAt.toISOString(), // Use createdAt as fallback
    lastLoginAt: user.lastLogin?.toISOString(),
  };
}

/**
 * Transform array of users
 */
export function toUserViewModels(
  users: User[],
  rolesMap: Map<string, string> = new Map(),
  fleetAccessMap: Map<string, string[]> = new Map(),
  vesselAccessMap: Map<string, string[]> = new Map()
): UserViewModel[] {
  return users.map(user => 
    toUserViewModel(
      user,
      rolesMap.get(user.id),
      fleetAccessMap.get(user.id) || [],
      vesselAccessMap.get(user.id) || []
    )
  );
}

/**
 * Extract user summary (minimal user info)
 */
export interface UserSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  name: string;
}

export function toUserSummary(user: User, role?: string): UserSummary {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: role ? toFrontendRole(role) : "emission_analyst",
    name: user.username || user.email.split("@")[0],
  };
}


