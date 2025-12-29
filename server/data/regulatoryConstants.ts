/**
 * Regulatory Constants for Maritime Compliance Frameworks
 * Source: EU Regulations, IMO 2023 Strategy, UK ETS
 * Last Updated: October 2025
 */

export interface RegConstant {
  key: string;
  framework: "FUELEU" | "EU_ETS" | "IMO" | "UK_ETS";
  value: any;
  effectiveFrom: string;
  effectiveTo?: string;
  version: string;
  sourceRegulation: string;
  sourceUrl?: string;
}

export const REGULATORY_CONSTANTS: RegConstant[] = [
  // ===== FUELEU MARITIME =====
  
  // Baseline
  {
    key: "FUELEU_BASELINE_INTENSITY",
    framework: "FUELEU",
    value: 91.16,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1805/oj",
  },

  // Reduction targets by year
  {
    key: "FUELEU_TARGETS",
    framework: "FUELEU",
    value: {
      2025: { reduction: 0.02, targetIntensity: 89.34 },
      2026: { reduction: 0.06, targetIntensity: 85.69 },
      2027: { reduction: 0.06, targetIntensity: 85.69 },
      2028: { reduction: 0.08, targetIntensity: 83.87 },
      2029: { reduction: 0.10, targetIntensity: 82.04 },
      2030: { reduction: 0.06, targetIntensity: 85.69 },
      2035: { reduction: 0.145, targetIntensity: 77.94 },
      2040: { reduction: 0.31, targetIntensity: 62.90 },
      2045: { reduction: 0.62, targetIntensity: 34.64 },
      2050: { reduction: 0.80, targetIntensity: 18.23 },
    },
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Annex I",
  },

  // Penalty rates
  {
    key: "FUELEU_PENALTY_RATE_PER_GJ",
    framework: "FUELEU",
    value: 58.50,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 20",
  },
  {
    key: "FUELEU_PENALTY_RATE_PER_TONNE_CO2EQ",
    framework: "FUELEU",
    value: 2400,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 20",
  },

  // Banking and borrowing
  {
    key: "FUELEU_BANKING_LIMIT_PCT",
    framework: "FUELEU",
    value: 0.02,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 19",
  },
  {
    key: "FUELEU_BORROWING_LIMIT_PCT",
    framework: "FUELEU",
    value: 0.02,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 19",
  },

  // RFNBO incentive multiplier
  {
    key: "FUELEU_RFNBO_MULTIPLIER",
    framework: "FUELEU",
    value: 0.5,
    effectiveFrom: "2025-01-01",
    effectiveTo: "2033-12-31",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 9",
  },

  // Wind-assist factor
  {
    key: "FUELEU_WIND_ASSIST_FACTOR",
    framework: "FUELEU",
    value: 1.0,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805",
  },

  // OPS requirements
  {
    key: "FUELEU_OPS_COVERAGE_PCT",
    framework: "FUELEU",
    value: 0.9,
    effectiveFrom: "2030-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/1805 Article 10",
  },

  // ===== EU ETS =====

  // Phase-in schedule
  {
    key: "EU_ETS_PHASE_IN",
    framework: "EU_ETS",
    value: {
      2024: 0.40,
      2025: 0.70,
      2026: 1.00,
      2027: 1.00,
    },
    effectiveFrom: "2024-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/957",
  },

  // Voyage coverage
  {
    key: "EU_ETS_VOYAGE_COVERAGE",
    framework: "EU_ETS",
    value: {
      intraEU: 1.0,
      extraEU: 0.5,
    },
    effectiveFrom: "2024-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/957",
  },

  // Allowance price (market-based, this is reference)
  {
    key: "EU_ETS_ALLOWANCE_PRICE_EUR",
    framework: "EU_ETS",
    value: 85,
    effectiveFrom: "2025-01-01",
    version: "1.0.0",
    sourceRegulation: "Market Price Reference",
  },

  // Emission factors
  {
    key: "EU_ETS_EMISSION_FACTOR_HFO",
    framework: "EU_ETS",
    value: 3.114,
    effectiveFrom: "2024-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/957 Annex II",
  },

  // Global Warming Potentials
  {
    key: "EU_ETS_GWP_VALUES",
    framework: "EU_ETS",
    value: {
      CO2: 1,
      CH4: 25,
      N2O: 298,
    },
    effectiveFrom: "2026-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/957 Multi-GHG Expansion",
  },

  // Surrender deadline
  {
    key: "EU_ETS_SURRENDER_DEADLINE",
    framework: "EU_ETS",
    value: "04-30",
    effectiveFrom: "2024-01-01",
    version: "1.0.0",
    sourceRegulation: "EU Regulation 2023/957",
  },

  // ===== IMO NET ZERO FRAMEWORK =====

  // GFI Targets
  {
    key: "IMO_GFI_TARGETS",
    framework: "IMO",
    value: {
      2030: {
        minimum: 0.20,
        aspirational: 0.30,
        targetGFI: 72.93,
      },
      2040: {
        minimum: 0.70,
        aspirational: 0.80,
        targetGFI: 27.35,
      },
      2050: {
        target: 0.96,
        residual: 0.04,
        targetGFI: 3.65,
      },
    },
    effectiveFrom: "2028-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO 2023 Strategy (MEPC 80)",
  },

  // Two-tier pricing
  {
    key: "IMO_TIER1_PRICE_EUR",
    framework: "IMO",
    value: 100,
    effectiveFrom: "2028-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO GHG Fuel Standard",
  },
  {
    key: "IMO_TIER2_PRICE_EUR",
    framework: "IMO",
    value: 380,
    effectiveFrom: "2028-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO GHG Fuel Standard",
  },

  // ZNZ thresholds
  {
    key: "IMO_ZNZ_THRESHOLDS",
    framework: "IMO",
    value: {
      2028: 19.0,
      2035: 14.0,
    },
    effectiveFrom: "2028-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO GHG Fuel Standard",
  },

  // Surplus validity
  {
    key: "IMO_SURPLUS_VALIDITY_YEARS",
    framework: "IMO",
    value: 2,
    effectiveFrom: "2028-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO GHG Fuel Standard",
  },

  // Registry opening
  {
    key: "IMO_REGISTRY_OPENING",
    framework: "IMO",
    value: "2027-01-01",
    effectiveFrom: "2027-01-01",
    version: "1.0.0",
    sourceRegulation: "IMO GHG Fuel Standard",
  },

  // ===== UK ETS =====

  // Launch date
  {
    key: "UK_ETS_LAUNCH_DATE",
    framework: "UK_ETS",
    value: "2026-07-01",
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // Coverage
  {
    key: "UK_ETS_COVERAGE",
    framework: "UK_ETS",
    value: {
      ukDomestic: 1.0,
      ukInternationalPort: 1.0,
    },
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // Price range
  {
    key: "UK_ETS_PRICE_RANGE_GBP",
    framework: "UK_ETS",
    value: {
      min: 31,
      max: 100,
      reserve: 22,
    },
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // Market size
  {
    key: "UK_ETS_MARKET_SIZE_ALLOWANCES",
    framework: "UK_ETS",
    value: 2000000,
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // Surrender deadline
  {
    key: "UK_ETS_SURRENDER_DEADLINE",
    framework: "UK_ETS",
    value: "04-30",
    effectiveFrom: "2027-01-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // GWP values (from launch)
  {
    key: "UK_ETS_GWP_VALUES",
    framework: "UK_ETS",
    value: {
      CO2: 1,
      CH4: 25,
      N2O: 298,
    },
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },

  // Vessel size threshold
  {
    key: "UK_ETS_VESSEL_THRESHOLD_GT",
    framework: "UK_ETS",
    value: 5000,
    effectiveFrom: "2026-07-01",
    version: "1.0.0",
    sourceRegulation: "UK ETS Authority",
  },
];

/**
 * Get constants for a specific framework
 */
export function getConstantsByFramework(framework: "FUELEU" | "EU_ETS" | "IMO" | "UK_ETS"): RegConstant[] {
  return REGULATORY_CONSTANTS.filter(c => c.framework === framework);
}

/**
 * Get constant by key
 */
export function getConstantByKey(key: string): RegConstant | undefined {
  return REGULATORY_CONSTANTS.find(c => c.key === key);
}

/**
 * Get constants effective at a specific date
 */
export function getConstantsAsOf(date: Date, framework?: string): RegConstant[] {
  return REGULATORY_CONSTANTS.filter(c => {
    const effectiveFrom = new Date(c.effectiveFrom);
    const effectiveTo = c.effectiveTo ? new Date(c.effectiveTo) : null;
    
    const isEffective = date >= effectiveFrom && (!effectiveTo || date <= effectiveTo);
    const matchesFramework = !framework || c.framework === framework;
    
    return isEffective && matchesFramework;
  });
}

