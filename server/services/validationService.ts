import { storage } from "../storage";
import { calculateDistance } from "./coverageService";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  code: string;
  fixHint?: string;
}

export interface ValidationWarning {
  field: string;
  value: any;
  message: string;
  code: string;
}

/**
 * Validate IMO number format
 * Format: IMO followed by 7 digits
 * Also includes checksum validation
 */
export function validateIMONumber(imoNumber: string): {
  valid: boolean;
  error?: string;
} {
  // Check format: IMO + 7 digits
  const imoRegex = /^IMO(\d{7})$/;
  const match = imoNumber.match(imoRegex);

  if (!match) {
    return {
      valid: false,
      error: "Invalid IMO format. Expected format: IMO1234567",
    };
  }

  // Validate checksum
  const digits = match[1];
  const checksum = parseInt(digits[6]);

  let sum = 0;
  for (let i = 0; i < 6; i++) {
    sum += parseInt(digits[i]) * (7 - i);
  }

  const calculatedChecksum = sum % 10;

  if (checksum !== calculatedChecksum) {
    return {
      valid: false,
      error: `Invalid IMO checksum. Expected ${calculatedChecksum}, got ${checksum}`,
    };
  }

  return { valid: true };
}

/**
 * Validate voyage data
 */
export async function validateVoyageData(voyageData: {
  voyageNumber: string;
  vesselId: string;
  departurePortId: string;
  arrivalPortId: string;
  departureAt: Date;
  arrivalAt: Date;
  distanceNm: number;
  tenantId: string;
}): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check voyage number uniqueness
  const existingVoyages = await storage.getVoyagesByVessel(
    voyageData.vesselId,
    voyageData.tenantId
  );
  const duplicateVoyage = existingVoyages.find(
    (v) => v.voyageNumber === voyageData.voyageNumber
  );
  if (duplicateVoyage) {
    errors.push({
      field: "voyageNumber",
      value: voyageData.voyageNumber,
      message: "Duplicate voyage number for this vessel",
      code: "DUPLICATE_VOYAGE",
      fixHint: "Use a unique voyage identifier",
    });
  }

  // Validate ports exist
  const depPort = await storage.getPort(voyageData.departurePortId);
  if (!depPort) {
    errors.push({
      field: "departurePortId",
      value: voyageData.departurePortId,
      message: "Departure port not found",
      code: "INVALID_PORT",
      fixHint: "Check port ID or use UN/LOCODE to find port",
    });
  }

  const arrPort = await storage.getPort(voyageData.arrivalPortId);
  if (!arrPort) {
    errors.push({
      field: "arrivalPortId",
      value: voyageData.arrivalPortId,
      message: "Arrival port not found",
      code: "INVALID_PORT",
      fixHint: "Check port ID or use UN/LOCODE to find port",
    });
  }

  // Validate dates
  if (voyageData.departureAt >= voyageData.arrivalAt) {
    errors.push({
      field: "departureAt",
      value: voyageData.departureAt,
      message: "Departure date must be before arrival date",
      code: "INVALID_DATE_ORDER",
      fixHint: "Check date/time values",
    });
  }

  // Validate distance if ports have coordinates
  if (depPort && arrPort && depPort.latitude && arrPort.latitude) {
    const depLat = parseFloat(depPort.latitude);
    const depLon = parseFloat(depPort.longitude!);
    const arrLat = parseFloat(arrPort.latitude);
    const arrLon = parseFloat(arrPort.longitude!);

    const calculatedDistance = calculateDistance(depLat, depLon, arrLat, arrLon);
    const variance = Math.abs(voyageData.distanceNm - calculatedDistance) / calculatedDistance;

    if (variance > 0.5) {
      // More than 50% variance
      warnings.push({
        field: "distanceNm",
        value: voyageData.distanceNm,
        message: `Distance variance >50%. Reported: ${voyageData.distanceNm.toFixed(2)} NM, Calculated: ${calculatedDistance.toFixed(2)} NM`,
        code: "DISTANCE_VARIANCE",
      });
    }
  }

  // Check for negative distance
  if (voyageData.distanceNm <= 0) {
    errors.push({
      field: "distanceNm",
      value: voyageData.distanceNm,
      message: "Distance must be positive",
      code: "NEGATIVE_VALUE",
      fixHint: "Distance should be in nautical miles",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate fuel consumption data
 */
export function validateFuelConsumption(consumptionData: {
  fuelId: string;
  massTonnes: number;
  engineType?: string;
  methaneSlipPct?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for negative values
  if (consumptionData.massTonnes < 0) {
    errors.push({
      field: "massTonnes",
      value: consumptionData.massTonnes,
      message: "Fuel consumption cannot be negative",
      code: "NEGATIVE_VALUE",
      fixHint: "Check data entry",
    });
  }

  // Check for implausible values (e.g., very high consumption)
  if (consumptionData.massTonnes > 10000) {
    warnings.push({
      field: "massTonnes",
      value: consumptionData.massTonnes,
      message: "Unusually high fuel consumption",
      code: "IMPLAUSIBLE_VALUE",
    });
  }

  // Validate methane slip percentage
  if (
    consumptionData.methaneSlipPct !== undefined &&
    (consumptionData.methaneSlipPct < 0 || consumptionData.methaneSlipPct > 100)
  ) {
    errors.push({
      field: "methaneSlipPct",
      value: consumptionData.methaneSlipPct,
      message: "Methane slip must be between 0 and 100%",
      code: "OUT_OF_RANGE",
      fixHint: "Enter percentage value (0-100)",
    });
  }

  // Check fuel-engine compatibility
  if (
    consumptionData.fuelId.includes("LNG") &&
    consumptionData.engineType &&
    !consumptionData.engineType.toLowerCase().includes("gas")
  ) {
    warnings.push({
      field: "engineType",
      value: consumptionData.engineType,
      message: "LNG fuel typically requires gas-capable engine",
      code: "FUEL_ENGINE_MISMATCH",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate vessel data
 */
export function validateVesselData(vesselData: {
  imoNumber: string;
  grossTonnage: number;
  deadweightTonnage?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate IMO number
  const imoValidation = validateIMONumber(vesselData.imoNumber);
  if (!imoValidation.valid) {
    errors.push({
      field: "imoNumber",
      value: vesselData.imoNumber,
      message: imoValidation.error!,
      code: "INVALID_IMO",
      fixHint: "IMO number should be 7 digits with valid checksum",
    });
  }

  // Validate tonnage
  if (vesselData.grossTonnage < 0) {
    errors.push({
      field: "grossTonnage",
      value: vesselData.grossTonnage,
      message: "Gross tonnage cannot be negative",
      code: "NEGATIVE_VALUE",
    });
  }

  if (
    vesselData.deadweightTonnage !== undefined &&
    vesselData.deadweightTonnage < 0
  ) {
    errors.push({
      field: "deadweightTonnage",
      value: vesselData.deadweightTonnage,
      message: "Deadweight tonnage cannot be negative",
      code: "NEGATIVE_VALUE",
    });
  }

  // Check if DWT > GT (unusual but not invalid)
  if (
    vesselData.deadweightTonnage &&
    vesselData.deadweightTonnage > vesselData.grossTonnage * 2
  ) {
    warnings.push({
      field: "deadweightTonnage",
      value: vesselData.deadweightTonnage,
      message: "DWT significantly larger than GT (unusual)",
      code: "UNUSUAL_RATIO",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Batch validate voyage imports
 */
export async function batchValidateVoyages(
  voyages: any[],
  tenantId: string
): Promise<{
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: Array<{ row: number; validation: ValidationResult }>;
}> {
  const results: Array<{ row: number; validation: ValidationResult }> = [];

  for (let i = 0; i < voyages.length; i++) {
    try {
      const validation = await validateVoyageData({ ...voyages[i], tenantId });
      results.push({ row: i + 1, validation });
    } catch (error) {
      results.push({
        row: i + 1,
        validation: {
          valid: false,
          errors: [
            {
              field: "general",
              value: null,
              message: `Validation error: ${error}`,
              code: "VALIDATION_ERROR",
            },
          ],
          warnings: [],
        },
      });
    }
  }

  const validRows = results.filter((r) => r.validation.valid).length;

  return {
    totalRows: voyages.length,
    validRows,
    invalidRows: voyages.length - validRows,
    results,
  };
}

