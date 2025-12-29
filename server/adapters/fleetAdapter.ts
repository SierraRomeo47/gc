/**
 * Fleet Adapter
 * Transforms database Fleet entity to FleetViewModel for frontend consumption
 */

import type { Fleet } from "@shared/schema";
import type { FleetViewModel } from "@shared/viewModels";

/**
 * Transform DB Fleet to FleetViewModel
 * @param fleet - Database fleet entity
 * @param vesselIds - Array of vessel IDs in this fleet
 * @param vesselCount - Count of vessels (optional, will use vesselIds.length if not provided)
 */
export function toFleetViewModel(
  fleet: Fleet,
  vesselIds: string[] = [],
  vesselCount?: number
): FleetViewModel {
  return {
    // Core fleet fields
    id: fleet.id,
    orgId: fleet.orgId,
    tenantId: fleet.tenantId,
    name: fleet.name,
    description: fleet.description,
    createdAt: fleet.createdAt,
    
    // Computed fields
    vesselIds,
    vesselCount: vesselCount !== undefined ? vesselCount : vesselIds.length,
    isActive: true, // Could be computed based on recent activity
    updatedAt: fleet.createdAt.toISOString(), // Use createdAt as fallback
  };
}

/**
 * Transform array of fleets
 * @param fleets - Array of database fleet entities
 * @param vesselCountMap - Map of fleet ID to vessel count
 * @param vesselIdsMap - Map of fleet ID to array of vessel IDs
 */
export function toFleetViewModels(
  fleets: Fleet[],
  vesselCountMap: Map<string, number> = new Map(),
  vesselIdsMap: Map<string, string[]> = new Map()
): FleetViewModel[] {
  return fleets.map(fleet =>
    toFleetViewModel(
      fleet,
      vesselIdsMap.get(fleet.id) || [],
      vesselCountMap.get(fleet.id)
    )
  );
}

/**
 * Extract fleet summary (minimal fleet info)
 */
export interface FleetSummary {
  id: string;
  name: string;
  orgId: string;
  vesselCount: number;
}

export function toFleetSummary(
  fleet: Fleet,
  vesselCount: number = 0
): FleetSummary {
  return {
    id: fleet.id,
    name: fleet.name,
    orgId: fleet.orgId,
    vesselCount,
  };
}

/**
 * Fleet with vessels (extended view)
 */
export interface FleetWithVessels extends FleetViewModel {
  vessels: Array<{
    id: string;
    name: string;
    imoNumber: string;
    type: string;
  }>;
}

export function toFleetWithVessels(
  fleet: Fleet,
  vessels: Array<{ id: string; name: string; imoNumber: string; vesselType: string }> = []
): FleetWithVessels {
  const fleetViewModel = toFleetViewModel(
    fleet,
    vessels.map(v => v.id),
    vessels.length
  );
  
  return {
    ...fleetViewModel,
    vessels: vessels.map(v => ({
      id: v.id,
      name: v.name,
      imoNumber: v.imoNumber,
      type: v.vesselType,
    })),
  };
}



