import type { Voyage, Consumption, BDN, OPSSession, Fuel } from "@shared/schema";
import { getConstantByKey } from "../data/regulatoryConstants";

export interface FuelEUCalculationResult {
  vesselId: string;
  year: number;
  attainedIntensity: number;
  targetIntensity: number;
  complianceBalance: number;
  penalty: number;
  rfnboIncentive: number;
  totalEnergyGJ: number;
  breakdown: {
    wtt: number;
    ttw: number;
    windFactor: number;
  };
}

export interface FuelConsumptionData {
  fuelId: string;
  massTonnes: number;
  lcvMjKg?: number;
  ttwGco2eMj?: number;
  wttGco2eMj?: number;
  methaneSlipPct?: number;
  isRFNBO?: boolean;
}

/**
 * Calculate GHG Intensity for FuelEU Maritime
 * Formula: GHG_Intensity = f_wind × (WtT + TtW)
 */
export function calculateGHGIntensity(
  consumptions: FuelConsumptionData[],
  fuels: Map<string, Fuel>,
  windFactor: number = 1.0
): { intensity: number; wtt: number; ttw: number; totalEnergyGJ: number } {
  let totalEnergy = 0; // in GJ
  let totalWtTEmissions = 0; // in tonnes CO2eq
  let totalTtWEmissions = 0; // in tonnes CO2eq

  for (const consumption of consumptions) {
    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    // Use actual LCV if provided, otherwise use default from fuel
    const lcvMjKg = consumption.lcvMjKg
      ? parseFloat(consumption.lcvMjKg.toString())
      : parseFloat(fuel.lcvMjKg);

    const ttwGco2eMj = consumption.ttwGco2eMj
      ? parseFloat(consumption.ttwGco2eMj.toString())
      : parseFloat(fuel.defaultTtwGco2eMj);

    const wttGco2eMj = consumption.wttGco2eMj
      ? parseFloat(consumption.wttGco2eMj.toString())
      : parseFloat(fuel.defaultWttGco2eMj);

    const massTonnes = parseFloat(consumption.massTonnes.toString());

    // Convert mass to energy: Energy (GJ) = mass (tonnes) × LCV (MJ/kg) × 1000 kg/tonne / 1000 MJ/GJ
    const energy = (massTonnes * lcvMjKg * 1000) / 1000; // in GJ
    totalEnergy += energy;

    // Calculate WtT emissions: WtT (tonnes CO2eq) = Energy (GJ) × WtT factor (gCO2e/MJ) / 1000
    const wttEmissions = (energy * 1000 * wttGco2eMj) / 1000000; // Convert to tonnes
    totalWtTEmissions += wttEmissions;

    // Calculate TtW emissions with methane slip adjustment
    const methaneSlipPct = consumption.methaneSlipPct
      ? parseFloat(consumption.methaneSlipPct.toString())
      : 0;

    const ttwEmissions =
      (energy * 1000 * ((1 - methaneSlipPct / 100) * ttwGco2eMj)) / 1000000;
    totalTtWEmissions += ttwEmissions;
  }

  if (totalEnergy === 0) {
    return { intensity: 0, wtt: 0, ttw: 0, totalEnergyGJ: 0 };
  }

  // Calculate intensity in gCO2e/MJ
  const wtt = (totalWtTEmissions * 1000000) / (totalEnergy * 1000);
  const ttw = (totalTtWEmissions * 1000000) / (totalEnergy * 1000);
  const intensity = windFactor * (wtt + ttw);

  return {
    intensity,
    wtt,
    ttw,
    totalEnergyGJ: totalEnergy,
  };
}

/**
 * Get FuelEU target intensity for a given year
 */
export function getTargetIntensity(year: number): number {
  const targetsConstant = getConstantByKey("FUELEU_TARGETS");
  if (!targetsConstant) {
    throw new Error("FuelEU targets not found in constants");
  }

  const targets = targetsConstant.value;
  const yearTarget = targets[year];

  if (!yearTarget) {
    // If no specific target, find closest year
    const years = Object.keys(targets)
      .map((y) => parseInt(y))
      .sort((a, b) => a - b);
    const closestYear = years.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );
    return targets[closestYear].targetIntensity;
  }

  return yearTarget.targetIntensity;
}

/**
 * Calculate compliance balance
 * Positive balance = surplus (compliance)
 * Negative balance = deficit (non-compliance)
 */
export function calculateComplianceBalance(
  attainedIntensity: number,
  targetIntensity: number,
  totalEnergyGJ: number
): { balanceMJ: number; balanceTonnesCO2eq: number } {
  // Balance (MJ) = (Target - Attained) × Total Energy (GJ) × 1000
  const balanceMJ = (targetIntensity - attainedIntensity) * totalEnergyGJ * 1000;

  // Convert to tonnes CO2eq
  const balanceTonnesCO2eq = balanceMJ * (attainedIntensity / 1000000);

  return {
    balanceMJ,
    balanceTonnesCO2eq,
  };
}

/**
 * Calculate penalty for non-compliance
 * Penalty = EUR 58.50 × Non_Compliant_Energy_GJ + OPS_Penalty
 * Or equivalently: EUR 2,400 × Excess_Emissions_tCO2eq
 */
export function calculatePenalty(deficitMJ: number): number {
  if (deficitMJ >= 0) return 0; // No penalty if compliant

  const penaltyRatePerGJ = getConstantByKey("FUELEU_PENALTY_RATE_PER_GJ");
  if (!penaltyRatePerGJ) {
    throw new Error("FuelEU penalty rate not found");
  }

  const deficitGJ = Math.abs(deficitMJ) / 1000;
  return deficitGJ * penaltyRatePerGJ.value;
}

/**
 * Apply RFNBO incentive multiplier
 * For years 2025-2033, RFNBO fuels get 0.5× multiplier on attained intensity
 */
export function applyRFNBOIncentive(
  consumptions: FuelConsumptionData[],
  year: number,
  fuels: Map<string, Fuel>
): number {
  // Check if RFNBO incentive applies
  if (year < 2025 || year > 2033) return 0;

  const multiplierConstant = getConstantByKey("FUELEU_RFNBO_MULTIPLIER");
  if (!multiplierConstant) return 0;

  const multiplier = multiplierConstant.value;

  // Calculate energy from RFNBO fuels
  let rfnboEnergyGJ = 0;

  for (const consumption of consumptions) {
    if (!consumption.isRFNBO) continue;

    const fuel = fuels.get(consumption.fuelId);
    if (!fuel) continue;

    const lcvMjKg = consumption.lcvMjKg
      ? parseFloat(consumption.lcvMjKg.toString())
      : parseFloat(fuel.lcvMjKg);

    const massTonnes = parseFloat(consumption.massTonnes.toString());
    const energy = (massTonnes * lcvMjKg * 1000) / 1000;

    rfnboEnergyGJ += energy;
  }

  // Incentive value (not a reduction, just the incentive amount for reporting)
  return rfnboEnergyGJ * multiplier;
}

/**
 * Calculate OPS requirement penalty
 * Mandatory OPS at certain ports from 2030
 */
export function calculateOPSRequirement(
  port: { isMandatoryPort: boolean },
  opsSession: OPSSession | null,
  requiredKwh: number
): { compliant: boolean; penalty: number } {
  if (!port.isMandatoryPort) {
    return { compliant: true, penalty: 0 };
  }

  if (!opsSession || parseFloat(opsSession.kwhSupplied) < requiredKwh) {
    // Calculate penalty for OPS non-compliance
    const shortfall = requiredKwh - (opsSession ? parseFloat(opsSession.kwhSupplied) : 0);
    const penaltyPerKwh = 10; // EUR per kWh (example rate)
    return {
      compliant: false,
      penalty: shortfall * penaltyPerKwh,
    };
  }

  return { compliant: true, penalty: 0 };
}

/**
 * Full FuelEU compliance calculation for a vessel
 */
export async function calculateFuelEUCompliance(
  vesselId: string,
  year: number,
  consumptions: FuelConsumptionData[],
  fuels: Map<string, Fuel>,
  windFactor: number = 1.0
): Promise<FuelEUCalculationResult> {
  // Calculate attained GHG intensity
  const { intensity, wtt, ttw, totalEnergyGJ } = calculateGHGIntensity(
    consumptions,
    fuels,
    windFactor
  );

  // Get target intensity for the year
  const targetIntensity = getTargetIntensity(year);

  // Calculate compliance balance
  const { balanceMJ, balanceTonnesCO2eq } = calculateComplianceBalance(
    intensity,
    targetIntensity,
    totalEnergyGJ
  );

  // Calculate penalty if non-compliant
  const penalty = calculatePenalty(balanceMJ);

  // Calculate RFNBO incentive
  const rfnboIncentive = applyRFNBOIncentive(consumptions, year, fuels);

  return {
    vesselId,
    year,
    attainedIntensity: intensity,
    targetIntensity,
    complianceBalance: balanceMJ,
    penalty,
    rfnboIncentive,
    totalEnergyGJ,
    breakdown: {
      wtt,
      ttw,
      windFactor,
    },
  };
}

