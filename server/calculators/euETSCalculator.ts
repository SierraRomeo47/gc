import type { Voyage, Consumption, Fuel } from "@shared/schema";
import { getConstantByKey } from "../data/regulatoryConstants";

export interface EUETSCalculationResult {
  voyageId: string;
  year: number;
  co2Emissions: number;
  ch4Emissions?: number;
  n2oEmissions?: number;
  totalEmissionsCO2eq: number;
  allowancesRequired: number;
  coveragePercentage: number;
  phaseInPercentage: number;
  estimatedCost: number;
}

export interface FuelConsumptionForETS {
  fuelId: string;
  massTonnes: number;
  co2FactorT?: number;
  ch4EmissionsFactor?: number;
  n2oEmissionsFactor?: number;
}

/**
 * Calculate CO2 emissions from fuel consumption
 * CO2_Emissions = Fuel_Consumption × CO2_Emission_Factor
 */
export function calculateCO2Emissions(
  consumptions: FuelConsumptionForETS[],
  fuels: Map<string, Fuel>
): number {
  let totalCO2 = 0;

  for (const consumption of consumptions) {
    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    const co2Factor = consumption.co2FactorT
      ? parseFloat(consumption.co2FactorT.toString())
      : parseFloat(fuel.defaultCo2FactorT);

    const massTonnes = parseFloat(consumption.massTonnes.toString());

    // CO2 emissions in tonnes
    totalCO2 += massTonnes * co2Factor;
  }

  return totalCO2;
}

/**
 * Calculate multi-GHG emissions (applicable from 2026+)
 * Total_Emissions = CO2 + (CH4 × 25) + (N2O × 298)
 */
export function calculateMultiGHGEmissions(
  consumptions: FuelConsumptionForETS[],
  fuels: Map<string, Fuel>,
  year: number
): {
  co2: number;
  ch4: number;
  n2o: number;
  totalCO2eq: number;
} {
  // Multi-GHG only applies from 2026
  if (year < 2026) {
    const co2 = calculateCO2Emissions(consumptions, fuels);
    return { co2, ch4: 0, n2o: 0, totalCO2eq: co2 };
  }

  const gwpConstant = getConstantByKey("EU_ETS_GWP_VALUES");
  if (!gwpConstant) {
    throw new Error("GWP values not found");
  }

  const gwp = gwpConstant.value;

  let totalCO2 = 0;
  let totalCH4 = 0; // in tonnes CH4
  let totalN2O = 0; // in tonnes N2O

  for (const consumption of consumptions) {
    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    const massTonnes = parseFloat(consumption.massTonnes.toString());

    // CO2 emissions
    const co2Factor = consumption.co2FactorT
      ? parseFloat(consumption.co2FactorT.toString())
      : parseFloat(fuel.defaultCo2FactorT);
    totalCO2 += massTonnes * co2Factor;

    // CH4 emissions (if provided)
    if (consumption.ch4EmissionsFactor) {
      totalCH4 += massTonnes * consumption.ch4EmissionsFactor;
    }

    // N2O emissions (if provided)
    if (consumption.n2oEmissionsFactor) {
      totalN2O += massTonnes * consumption.n2oEmissionsFactor;
    }
  }

  // Calculate CO2 equivalent
  const totalCO2eq = totalCO2 + totalCH4 * gwp.CH4 + totalN2O * gwp.N2O;

  return {
    co2: totalCO2,
    ch4: totalCH4,
    n2o: totalN2O,
    totalCO2eq,
  };
}

/**
 * Get phase-in percentage for a given year
 * 2024: 40%, 2025: 70%, 2026+: 100%
 */
export function getPhaseInPercentage(year: number): number {
  const phaseInConstant = getConstantByKey("EU_ETS_PHASE_IN");
  if (!phaseInConstant) {
    throw new Error("Phase-in schedule not found");
  }

  const phaseIn = phaseInConstant.value;
  return phaseIn[year] || 1.0; // Default to 100% if year not found
}

/**
 * Get voyage coverage coefficient
 * Intra-EU: 100%, Extra-EU: 50%
 */
export function getVoyageCoverage(coverageEuPct: number): number {
  // coverageEuPct is already calculated in voyage (1.0 for intra-EU, 0.5 for extra-EU, 0 for other)
  return coverageEuPct;
}

/**
 * Calculate ETS allowances required
 * Allowances = CO2_Emissions × Coverage_Percentage × Phase_Rate × Voyage_Coverage
 */
export function calculateAllowances(
  emissions: number,
  year: number,
  coverageEuPct: number
): number {
  const phaseInPct = getPhaseInPercentage(year);
  const voyageCoverage = getVoyageCoverage(coverageEuPct);

  return emissions * phaseInPct * voyageCoverage;
}

/**
 * Estimate cost of allowances
 */
export function estimateCost(
  allowances: number,
  pricePerAllowance?: number
): number {
  const priceConstant = getConstantByKey("EU_ETS_ALLOWANCE_PRICE_EUR");
  const price = pricePerAllowance || (priceConstant ? priceConstant.value : 85);

  return allowances * price;
}

/**
 * Full EU ETS calculation for a voyage
 */
export async function calculateEUETSCompliance(
  voyageId: string,
  year: number,
  coverageEuPct: number,
  consumptions: FuelConsumptionForETS[],
  fuels: Map<string, Fuel>,
  allowancePrice?: number
): Promise<EUETSCalculationResult> {
  // Calculate emissions
  const { co2, ch4, n2o, totalCO2eq } = calculateMultiGHGEmissions(
    consumptions,
    fuels,
    year
  );

  // Calculate allowances required
  const allowancesRequired = calculateAllowances(totalCO2eq, year, coverageEuPct);

  // Get phase-in percentage
  const phaseInPercentage = getPhaseInPercentage(year);

  // Estimate cost
  const estimatedCost = estimateCost(allowancesRequired, allowancePrice);

  return {
    voyageId,
    year,
    co2Emissions: co2,
    ch4Emissions: year >= 2026 ? ch4 : undefined,
    n2oEmissions: year >= 2026 ? n2o : undefined,
    totalEmissionsCO2eq: totalCO2eq,
    allowancesRequired,
    coveragePercentage: coverageEuPct,
    phaseInPercentage,
    estimatedCost,
  };
}

/**
 * Calculate annual ETS cost for a tenant
 */
export interface AnnualETSCost {
  year: number;
  totalEmissions: number;
  totalAllowances: number;
  totalCost: number;
  voyages: number;
}

export async function calculateAnnualETSCost(
  voyageResults: EUETSCalculationResult[]
): Promise<AnnualETSCost> {
  const year = voyageResults[0]?.year || new Date().getFullYear();

  const totalEmissions = voyageResults.reduce(
    (sum, r) => sum + r.totalEmissionsCO2eq,
    0
  );

  const totalAllowances = voyageResults.reduce(
    (sum, r) => sum + r.allowancesRequired,
    0
  );

  const totalCost = voyageResults.reduce((sum, r) => sum + r.estimatedCost, 0);

  return {
    year,
    totalEmissions,
    totalAllowances,
    totalCost,
    voyages: voyageResults.length,
  };
}

