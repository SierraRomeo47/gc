// Official Maritime Compliance Regulatory Constants
// Sources: European Commission, IMO, DNV, Bureau Veritas

// FuelEU Maritime Official Targets (based on 2008 baseline 91.16 gCO2e/MJ)
export const FUELEU_MARITIME = {
  baseline: 91.16, // 2008 baseline intensity
  targets: {
    2025: { reduction: 2, intensity: 89.34 }, // 2% reduction
    2026: { reduction: 6, intensity: 85.69 }, // 6% reduction
    2027: { reduction: 6, intensity: 85.69 }, // Same as 2026
    2028: { reduction: 8, intensity: 83.87 }, // 8% reduction
    2029: { reduction: 10, intensity: 82.04 }, // 10% reduction
    2030: { reduction: 6, intensity: 85.69 }, // Official 2030 target
    2035: { reduction: 14.5, intensity: 77.94 }, // 14.5% reduction
    2040: { reduction: 31, intensity: 62.90 }, // 31% reduction
    2045: { reduction: 62, intensity: 34.64 }, // 62% reduction
    2050: { reduction: 80, intensity: 18.23 } // 80% reduction (de facto phase-out)
  },
  penaltyRate: 2400, // EUR per tonne CO2eq
  poolingMechanisms: {
    bankingLimit: 0.02, // 2% of previous year
    borrowingLimit: 0.02 // 2% of current year
  }
};

// IMO Net Zero Framework Official Targets (2023 IMO Strategy)
export const IMO_NET_ZERO = {
  baseline: 91.16, // 2008 baseline
  targets: {
    2030: { reduction: 20, intensity: 72.93 }, // 20% reduction (minimum)
    "2030_aspirational": { reduction: 30, intensity: 63.81 }, // 30% aspirational
    2040: { reduction: 70, intensity: 27.35 }, // 70% reduction (minimum)
    "2040_aspirational": { reduction: 80, intensity: 18.23 }, // 80% aspirational
    2050: { reduction: 96, intensity: 3.65 } // Net zero with residual 4%
  },
  economicMeasures: {
    estimatedLevy: 150, // EUR per tonne CO2eq (preliminary estimate)
    implementationYear: 2027
  }
};

// EU ETS Maritime Parameters
export const EU_ETS = {
  phaseIn: {
    2024: 0.40, // 40% coverage
    2025: 0.70, // 70% coverage
    2026: 1.00, // 100% coverage (corrected from 70%)
    2027: 1.00  // 100% coverage (full implementation)
  },
  voyageCoverage: {
    "intra-eu": 1.00, // 100% of intra-EU voyages
    "extra-eu": 0.50  // 50% of extra-EU voyages
  },
  emissionFactor: 3.114, // tCO2 per tonne fuel (HFO)
  allowancePrice: 85, // EUR per EUA (approximate current price)
  surrenderDeadline: "April 30" // Corrected from September 30
};

// UK ETS Maritime Parameters  
export const UK_ETS = {
  allowancePrice: 75, // GBP per allowance
  currencyConversion: 1.13, // GBP to EUR
  emissionFactor: 3.114, // tCO2 per tonne fuel
  coverage: {
    "uk-domestic": 1.00, // 100% UK domestic voyages
    "uk-international": 0.50 // 50% international voyages touching UK ports
  }
};

// Fuel Properties and Emission Factors
export const FUEL_PROPERTIES = {
  "HFO": {
    emissionFactor: 3.114, // tCO2/tonne
    lcv: 40.2, // MJ/kg
    ghgIntensity: 91.16 // gCO2e/MJ
  },
  "MGO": {
    emissionFactor: 3.206, // tCO2/tonne
    lcv: 42.7, // MJ/kg
    ghgIntensity: 87.5 // gCO2e/MJ
  },
  "LNG": {
    emissionFactor: 2.750, // tCO2/tonne
    lcv: 48.0, // MJ/kg
    ghgIntensity: 82.5 // gCO2e/MJ (tank-to-wake)
  },
  "Bio-LNG": {
    emissionFactor: 2.750, // tCO2/tonne (tank-to-wake)
    lcv: 48.0, // MJ/kg
    ghgIntensity: 45.3 // gCO2e/MJ (well-to-wake)
  },
  "e-Methanol": {
    emissionFactor: 1.375, // tCO2/tonne
    lcv: 19.9, // MJ/kg
    ghgIntensity: 35.4 // gCO2e/MJ (renewable electricity)
  },
  "e-Ammonia": {
    emissionFactor: 0, // tCO2/tonne (no carbon)
    lcv: 18.6, // MJ/kg
    ghgIntensity: 28.7 // gCO2e/MJ (renewable electricity + process)
  }
};

// Helper Functions for Calculations
export const calculateFuelEUPenalty = (
  currentIntensity: number, 
  targetIntensity: number, 
  energyUsed: number // in MJ
): number => {
  const complianceGap = Math.max(0, currentIntensity - targetIntensity); // gCO2e/MJ
  const excessEmissions = (complianceGap * energyUsed) / 1000000; // Convert to tCO2eq
  return excessEmissions * FUELEU_MARITIME.penaltyRate; // EUR
};

export const calculateEUETSCost = (
  fuelConsumption: number, // tonnes
  voyageType: 'intra-eu' | 'extra-eu',
  year: number
): number => {
  const phaseInCoverage = EU_ETS.phaseIn[year as keyof typeof EU_ETS.phaseIn] || 1.0;
  const voyageCoverage = EU_ETS.voyageCoverage[voyageType];
  const emissions = fuelConsumption * EU_ETS.emissionFactor; // tCO2
  const coveredEmissions = emissions * phaseInCoverage * voyageCoverage;
  return coveredEmissions * EU_ETS.allowancePrice; // EUR
};

export const calculateIMOGap = (
  currentIntensity: number,
  year: number
): { gap: number; isCompliant: boolean; targetIntensity: number } => {
  let targetIntensity = IMO_NET_ZERO.baseline;
  
  if (year >= 2050) {
    targetIntensity = IMO_NET_ZERO.targets[2050].intensity;
  } else if (year >= 2040) {
    targetIntensity = IMO_NET_ZERO.targets[2040].intensity;
  } else if (year >= 2030) {
    targetIntensity = IMO_NET_ZERO.targets[2030].intensity;
  } else {
    // Linear interpolation between now and 2030
    const progress = (year - 2025) / (2030 - 2025);
    const reduction = progress * IMO_NET_ZERO.targets[2030].reduction;
    targetIntensity = IMO_NET_ZERO.baseline * (1 - reduction / 100);
  }
  
  const gap = Math.max(0, currentIntensity - targetIntensity);
  return {
    gap,
    isCompliant: gap === 0,
    targetIntensity
  };
};