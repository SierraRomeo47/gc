import { storage } from "../storage";
import type { Port } from "@shared/schema";

/**
 * Calculate great circle distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in nautical miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Validate distance against calculated great circle distance
 * Allows ±50% variance for routing variations
 */
export function validateDistance(
  reportedDistance: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { valid: boolean; calculatedDistance: number; variance: number } {
  const calculatedDistance = calculateDistance(lat1, lon1, lat2, lon2);
  const variance = Math.abs(reportedDistance - calculatedDistance) / calculatedDistance;
  const valid = variance <= 0.5; // Allow 50% variance

  return {
    valid,
    calculatedDistance,
    variance,
  };
}

/**
 * Determine voyage type based on departure and arrival ports
 */
export async function determineVoyageType(
  departurePortId: string,
  arrivalPortId: string
): Promise<{
  voyageType: "INTRA_EU" | "EXTRA_EU" | "UK_DOMESTIC" | "OTHER";
  coverageEuPct: number;
  coverageUkPct: number;
}> {
  const depPort = await storage.getPort(departurePortId);
  const arrPort = await storage.getPort(arrivalPortId);

  if (!depPort || !arrPort) {
    throw new Error("Invalid port IDs");
  }

  // UK domestic voyage
  if (depPort.isUk && arrPort.isUk) {
    return {
      voyageType: "UK_DOMESTIC",
      coverageEuPct: 0,
      coverageUkPct: 1.0,
    };
  }

  // Intra-EU voyage (both ports in EU)
  if (depPort.isEu && arrPort.isEu) {
    return {
      voyageType: "INTRA_EU",
      coverageEuPct: 1.0,
      coverageUkPct: 0,
    };
  }

  // Extra-EU voyage (one port in EU, one outside)
  if (depPort.isEu || arrPort.isEu) {
    return {
      voyageType: "EXTRA_EU",
      coverageEuPct: 0.5, // 50% of emissions for extra-EU voyages
      coverageUkPct: 0,
    };
  }

  // Neither port in EU or UK
  return {
    voyageType: "OTHER",
    coverageEuPct: 0,
    coverageUkPct: 0,
  };
}

/**
 * Check if port is in Outermost Regions (OMR)
 * OMR ports may have special rules
 */
export function isOMRPort(port: Port): boolean {
  return port.isOmr;
}

/**
 * Calculate EU ETS coverage for a voyage based on year
 * Phase-in schedule: 2024 (40%), 2025 (70%), 2026+ (100%)
 */
export function calculateETSCoverage(year: number, baseEuCoverage: number): number {
  if (year < 2024) return 0;
  if (year === 2024) return baseEuCoverage * 0.4;
  if (year === 2025) return baseEuCoverage * 0.7;
  return baseEuCoverage; // 2026 onwards: 100%
}

/**
 * Get port by UN/LOCODE
 */
export async function getPortByUnlocode(unlocode: string): Promise<Port | undefined> {
  return await storage.getPortByUnlocode(unlocode.toUpperCase());
}

/**
 * Validate port exists and return port details
 */
export async function validatePort(portId: string): Promise<{
  valid: boolean;
  port?: Port;
  error?: string;
}> {
  const port = await storage.getPort(portId);
  
  if (!port) {
    return {
      valid: false,
      error: "Port not found",
    };
  }

  return {
    valid: true,
    port,
  };
}

/**
 * Get all EU ports
 */
export async function getEUPorts(): Promise<Port[]> {
  const allPorts = await storage.getAllPorts();
  return allPorts.filter((port) => port.isEu);
}

/**
 * Get all UK ports
 */
export async function getUKPorts(): Promise<Port[]> {
  const allPorts = await storage.getAllPorts();
  return allPorts.filter((port) => port.isUk);
}

/**
 * Calculate segment-level emissions for multi-leg voyages
 * This would be used for voyages that cross EU/non-EU boundaries
 */
export interface VoyageSegment {
  startPort: Port;
  endPort: Port;
  distanceNm: number;
  isEuWaters: boolean;
  coverageCoefficient: number;
}

export async function calculateVoyageSegments(
  portIds: string[],
  totalDistance: number
): Promise<VoyageSegment[]> {
  if (portIds.length < 2) {
    throw new Error("At least 2 ports required for segments");
  }

  const segments: VoyageSegment[] = [];
  const ports = await Promise.all(portIds.map((id) => storage.getPort(id)));

  for (let i = 0; i < ports.length - 1; i++) {
    const startPort = ports[i];
    const endPort = ports[i + 1];

    if (!startPort || !endPort) {
      throw new Error(`Invalid port at index ${i}`);
    }

    // Calculate segment distance (simplified - equal distribution)
    const segmentDistance = totalDistance / (ports.length - 1);

    // Determine if segment is in EU waters
    const isEuWaters = startPort.isEu && endPort.isEu;

    // Coverage coefficient
    let coverageCoefficient = 0;
    if (isEuWaters) {
      coverageCoefficient = 1.0; // 100% for intra-EU
    } else if (startPort.isEu || endPort.isEu) {
      coverageCoefficient = 0.5; // 50% for extra-EU
    }

    segments.push({
      startPort,
      endPort,
      distanceNm: segmentDistance,
      isEuWaters,
      coverageCoefficient,
    });
  }

  return segments;
}

