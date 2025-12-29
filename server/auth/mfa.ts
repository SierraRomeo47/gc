import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Generate MFA secret and QR code for user setup
 */
export async function generateMFASecret(
  username: string,
  issuer: string = "GHGConnect"
): Promise<MFASetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${username})`,
    issuer: issuer,
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes(8);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify MFA token
 */
export function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 2, // Allow 2 time-steps before/after for clock skew
  });
}

/**
 * Generate backup codes for MFA
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify backup code
 * Note: In production, backup codes should be hashed and stored in database
 * After use, they should be marked as used/deleted
 */
export function verifyBackupCode(storedCodes: string[], providedCode: string): boolean {
  return storedCodes.includes(providedCode.toUpperCase());
}

/**
 * Hash backup codes for storage
 * In production, use bcrypt or similar
 */
export function hashBackupCodes(codes: string[]): string[] {
  // Placeholder - implement proper hashing in production
  return codes.map(code => Buffer.from(code).toString("base64"));
}

/**
 * Check if MFA token is valid format (6 digits)
 */
export function isValidMFATokenFormat(token: string): boolean {
  return /^\d{6}$/.test(token);
}

