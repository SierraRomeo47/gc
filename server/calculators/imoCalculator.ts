import type { Fuel } from "@shared/schema";
import { getConstantByKey } from "../data/regulatoryConstants";

export interface IMOCalculationResult {
  vesselId: string;
  year: number;
  attainedGFI: number;
  targetGFI: number;
  complianceGap: number;
  remedialCost: number;
  tier: "TIER1" | "TIER2" | "COMPLIANT";
}

export interface FuelConsumptionForIMO {
  fuelId: string;
  massTonnes: number;
  ghgWtW: number; // Well-to-Wake GHG intensity in gCO2e/MJ
}

/**
 * Calculate Attained GHG Fuel Intensity (GFI)
 * GFI_attained = Σ(GHG_WtW,j × E_j) / ΣE_j
 */
export function calculateAttainedGFI(
  consumptions: FuelConsumptionForIMO[],
  fuels: Map<string, Fuel>
): { gfi: number; totalEnergyGJ: number } {
  let totalWeightedEmissions = 0;
  let totalEnergy = 0;

  for (const consumption of consumptions) {
    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    const massTonnes = parseFloat(consumption.massTonnes.toString());
    const lcvMjKg = parseFloat(fuel.lcvMjKg);

    // Calculate energy in GJ
    const energy = (massTonnes * lcvMjKg * 1000) / 1000;
    totalEnergy += energy;

    // Weighted emissions
    const ghgWtW = consumption.ghgWtW;
    totalWeightedEmissions += ghgWtW * energy * 1000; // Convert to MJ
  }

  if (totalEnergy === 0) {
    return { gfi: 0, totalEnergyGJ: 0 };
  }

  const gfi = totalWeightedEmissions / (totalEnergy * 1000);

  return { gfi, totalEnergyGJ: totalEnergy };
}

/**
 * Get IMO target GFI for a given year
 */
export function getTargetGFI(year: number): {
  targetGFI: number;
  reduction: number;
  type: "minimum" | "aspirational" | "net-zero";
} {
  const targetsConstant = getConstantByKey("IMO_GFI_TARGETS");
  if (!targetsConstant) {
    throw new Error("IMO targets not found");
  }

  const targets = targetsConstant.value;

  // For 2030
  if (year >= 2028 && year < 2040) {
    return {
      targetGFI: targets["2030"].targetGFI,
      reduction: targets["2030"].minimum,
      type: "minimum",
    };
  }

  // For 2040
  if (year >= 2040 && year < 2050) {
    return {
      targetGFI: targets["2040"].targetGFI,
      reduction: targets["2040"].minimum,
      type: "minimum",
    };
  }

  // For 2050
  if (year >= 2050) {
    return {
      targetGFI: targets["2050"].targetGFI,
      reduction: targets["2050"].target,
      type: "net-zero",
    };
  }

  // Before 2028, no targets yet
  return {
    targetGFI: 91.16, // Baseline
    reduction: 0,
    type: "minimum",
  };
}

/**
 * Calculate compliance gap
 * Positive gap = non-compliant (attained > target)
 * Negative gap = compliant (attained < target)
 */
export function calculateComplianceGap(
  attainedGFI: number,
  targetGFI: number,
  totalEnergyGJ: number
): { gapGCO2eMJ: number; gapTonnesCO2eq: number } {
  const gapGCO2eMJ = attainedGFI - targetGFI;

  // Convert to tonnes CO2eq
  const gapTonnesCO2eq = (gapGCO2eMJ * totalEnergyGJ * 1000) / 1000000;

  return {
    gapGCO2eMJ,
    gapTonnesCO2eq,
  };
}

/**
 * Determine pricing tier and calculate remedial cost
 */
export function calculateRemedialCost(
  gapTonnesCO2eq: number
): { tier: "TIER1" | "TIER2" | "COMPLIANT"; cost: number } {
  if (gapTonnesCO2eq <= 0) {
    return { tier: "COMPLIANT", cost: 0 };
  }

  const tier1PriceConstant = getConstantByKey("IMO_TIER1_PRICE_EUR");
  const tier2PriceConstant = getConstantByKey("IMO_TIER2_PRICE_EUR");

  const tier1Price = tier1PriceConstant ? tier1PriceConstant.value : 100;
  const tier2Price = tier2PriceConstant ? tier2PriceConstant.value : 380;

  // Simple tier determination (can be more complex based on regulations)
  // For now: small gaps use Tier 1, large gaps use Tier 2
  const threshold = 1000; // tonnes CO2eq

  if (gapTonnesCO2eq <= threshold) {
    return {
      tier: "TIER1",
      cost: gapTonnesCO2eq * tier1Price,
    };
  } else {
    return {
      tier: "TIER2",
      cost: gapTonnesCO2eq * tier2Price,
    };
  }
}

/**
 * Full IMO GFI compliance calculation
 */
export async function calculateIMOCompliance(
  vesselId: string,
  year: number,
  consumptions: FuelConsumptionForIMO[],
  fuels: Map<string, Fuel>
): Promise<IMOCalculationResult> {
  // Calculate attained GFI
  const { gfi: attainedGFI, totalEnergyGJ } = calculateAttainedGFI(
    consumptions,
    fuels
  );

  // Get target GFI
  const { targetGFI } = getTargetGFI(year);

  // Calculate compliance gap
  const { gapTonnesCO2eq } = calculateComplianceGap(
    attainedGFI,
    targetGFI,
    totalEnergyGJ
  );

  // Calculate remedial cost
  const { tier, cost } = calculateRemedialCost(gapTonnesCO2eq);

  return {
    vesselId,
    year,
    attainedGFI,
    targetGFI,
    complianceGap: gapTonnesCO2eq,
    remedialCost: cost,
    tier,
  };
}

