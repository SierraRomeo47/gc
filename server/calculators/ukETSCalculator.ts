import type { Fuel } from "@shared/schema";
import { getConstantByKey } from "../data/regulatoryConstants";

export interface UKETSCalculationResult {
  voyageId: string;
  year: number;
  co2Emissions: number;
  ch4Emissions: number;
  n2oEmissions: number;
  totalEmissionsCO2eq: number;
  allowancesRequired: number;
  coveragePercentage: number;
  estimatedCost: number;
}

export interface FuelConsumptionForUKETS {
  fuelId: string;
  massTonnes: number;
  co2FactorT?: number;
  ch4EmissionsFactor?: number;
  n2oEmissionsFactor?: number;
}

/**
 * Calculate UK ETS emissions
 * UK ETS includes multi-GHG from launch (2026)
 */
export function calculateUKEmissions(
  consumptions: FuelConsumptionForUKETS[],
  fuels: Map<string, Fuel>
): {
  co2: number;
  ch4: number;
  n2o: number;
  totalCO2eq: number;
} {
  const gwpConstant = getConstantByKey("UK_ETS_GWP_VALUES");
  if (!gwpConstant) {
    throw new Error("UK ETS GWP values not found");
  }

  const gwp = gwpConstant.value;

  let totalCO2 = 0;
  let totalCH4 = 0;
  let totalN2O = 0;

  for (const consumption of consumptions) {
    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    const massTonnes = parseFloat(consumption.massTonnes.toString());

    // CO2 emissions
    const co2Factor = consumption.co2FactorT
      ? parseFloat(consumption.co2FactorT.toString())
      : parseFloat(fuel.defaultCo2FactorT);
    totalCO2 += massTonnes * co2Factor;

    // CH4 emissions
    if (consumption.ch4EmissionsFactor) {
      totalCH4 += massTonnes * consumption.ch4EmissionsFactor;
    }

    // N2O emissions
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
 * Calculate UK ETS allowances required
 * UK coverage is 100% for UK domestic voyages and UK port emissions
 */
export function calculateUKAllowances(
  emissions: number,
  coverageUkPct: number
): number {
  return emissions * coverageUkPct;
}

/**
 * Estimate cost of UK allowances
 */
export function estimateUKCost(
  allowances: number,
  pricePerAllowanceGBP?: number
): number {
  const priceConstant = getConstantByKey("UK_ETS_PRICE_RANGE_GBP");
  
  let price = pricePerAllowanceGBP;
  if (!price && priceConstant) {
    // Use mid-point of price range
    price = (priceConstant.value.min + priceConstant.value.max) / 2;
  }
  if (!price) {
    price = 65; // Default mid-point
  }

  return allowances * price;
}

/**
 * Full UK ETS calculation for a voyage
 */
export async function calculateUKETSCompliance(
  voyageId: string,
  year: number,
  coverageUkPct: number,
  consumptions: FuelConsumptionForUKETS[],
  fuels: Map<string, Fuel>,
  allowancePriceGBP?: number
): Promise<UKETSCalculationResult> {
  // UK ETS only applies from July 2026
  if (year < 2026) {
    return {
      voyageId,
      year,
      co2Emissions: 0,
      ch4Emissions: 0,
      n2oEmissions: 0,
      totalEmissionsCO2eq: 0,
      allowancesRequired: 0,
      coveragePercentage: 0,
      estimatedCost: 0,
    };
  }

  // Calculate emissions
  const { co2, ch4, n2o, totalCO2eq } = calculateUKEmissions(consumptions, fuels);

  // Calculate allowances required
  const allowancesRequired = calculateUKAllowances(totalCO2eq, coverageUkPct);

  // Estimate cost
  const estimatedCost = estimateUKCost(allowancesRequired, allowancePriceGBP);

  return {
    voyageId,
    year,
    co2Emissions: co2,
    ch4Emissions: ch4,
    n2oEmissions: n2o,
    totalEmissionsCO2eq: totalCO2eq,
    allowancesRequired,
    coveragePercentage: coverageUkPct,
    estimatedCost,
  };
}

