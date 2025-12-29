/**
 * Vessel Adapter
 * Transforms database Vessel entity to VesselViewModel for frontend consumption
 */

import type { Vessel } from "@shared/schema";
import type { VesselViewModel, ComplianceStatus } from "@shared/viewModels";

/**
 * Calculate compliance status based on GHG intensity
 */
function calculateComplianceStatus(
  ghgIntensity: number,
  targetIntensity: number
): ComplianceStatus {
  if (ghgIntensity > targetIntensity + 3) {
    return "non-compliant";
  } else if (ghgIntensity > targetIntensity - 2) {
    return "warning";
  }
  return "compliant";
}

/**
 * Estimate GHG intensity based on vessel characteristics
 * This is a simplified calculation - in production, this would come from actual voyage data
 */
function estimateGhgIntensity(vessel: Vessel): number {
  const mainEngineType = vessel.mainEngineType?.toLowerCase() || "";
  
  // Base intensity on engine type
  if (mainEngineType.includes("hydrogen")) return 9.4;
  if (mainEngineType.includes("electric") || mainEngineType.includes("battery")) return 0.0;
  if (mainEngineType.includes("methanol")) return 52.4;
  if (mainEngineType.includes("lng")) return 70.0;
  if (mainEngineType.includes("ammonia")) return 15.0;
  
  // Default diesel with some variance
  return 80 + Math.random() * 20; // 80-100 gCO2e/MJ
}

/**
 * Estimate fuel consumption based on vessel size
 */
function estimateFuelConsumption(vessel: Vessel): number {
  const grossTonnage = vessel.grossTonnage || 50000;
  return (grossTonnage / 40) * (Math.random() * 0.4 + 0.8);
}

/**
 * Calculate credit balance
 */
function calculateCreditBalance(
  ghgIntensity: number,
  targetIntensity: number,
  fuelConsumption: number
): number {
  return (targetIntensity - ghgIntensity) * fuelConsumption * 0.1 + (Math.random() * 100 - 50);
}

/**
 * Transform DB Vessel to VesselViewModel
 * @param vessel - Database vessel entity
 * @param voyageType - Optional voyage type from recent voyages
 * @param actualGhgIntensity - Optional actual GHG intensity from calculations
 * @param actualFuelConsumption - Optional actual fuel consumption from voyage data
 */
export function toVesselViewModel(
  vessel: Vessel,
  voyageType?: string,
  actualGhgIntensity?: number,
  actualFuelConsumption?: number
): VesselViewModel {
  // Use actual values or estimates
  const targetIntensity = 89.3; // 2025 FuelEU Maritime target
  const ghgIntensity = actualGhgIntensity || estimateGhgIntensity(vessel);
  const fuelConsumption = actualFuelConsumption || estimateFuelConsumption(vessel);
  const creditBalance = calculateCreditBalance(ghgIntensity, targetIntensity, fuelConsumption);
  const complianceStatus = calculateComplianceStatus(ghgIntensity, targetIntensity);
  
  return {
    // Core vessel fields
    id: vessel.id,
    tenantId: vessel.tenantId,
    fleetId: vessel.fleetId,
    imoNumber: vessel.imoNumber,
    name: vessel.name,
    vesselType: vessel.vesselType,
    flagState: vessel.flagState,
    grossTonnage: vessel.grossTonnage,
    deadweightTonnage: vessel.deadweightTonnage,
    mainEngineType: vessel.mainEngineType,
    iceClass: vessel.iceClass,
    createdAt: vessel.createdAt,
    updatedAt: vessel.updatedAt,
    
    // Alias fields for frontend compatibility
    type: vessel.vesselType,
    flag: vessel.flagState,
    
    // Computed compliance fields
    voyageType,
    complianceStatus,
    ghgIntensity: parseFloat(ghgIntensity.toFixed(1)),
    targetIntensity,
    fuelConsumption: parseFloat(fuelConsumption.toFixed(1)),
    creditBalance: parseFloat(creditBalance.toFixed(1)),
  };
}

/**
 * Transform array of vessels
 */
export function toVesselViewModels(
  vessels: Vessel[],
  voyageTypeMap: Map<string, string> = new Map(),
  ghgIntensityMap: Map<string, number> = new Map(),
  fuelConsumptionMap: Map<string, number> = new Map()
): VesselViewModel[] {
  return vessels.map(vessel =>
    toVesselViewModel(
      vessel,
      voyageTypeMap.get(vessel.id),
      ghgIntensityMap.get(vessel.id),
      fuelConsumptionMap.get(vessel.id)
    )
  );
}

/**
 * Extract vessel summary (minimal vessel info)
 */
export interface VesselSummary {
  id: string;
  name: string;
  imoNumber: string;
  type: string;
  flag: string;
  complianceStatus: ComplianceStatus;
}

export function toVesselSummary(vessel: Vessel): VesselSummary {
  const ghgIntensity = estimateGhgIntensity(vessel);
  const targetIntensity = 89.3;
  const complianceStatus = calculateComplianceStatus(ghgIntensity, targetIntensity);
  
  return {
    id: vessel.id,
    name: vessel.name,
    imoNumber: vessel.imoNumber,
    type: vessel.vesselType,
    flag: vessel.flagState,
    complianceStatus,
  };
}



