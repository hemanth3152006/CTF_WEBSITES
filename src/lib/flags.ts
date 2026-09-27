import crypto from "crypto";

const SALT = process.env.FLAG_SALT || "college-ctf-default-salt-key-2026";

/**
 * Normalizes a flag (trims whitespace)
 */
export function normalizeFlag(flag: string): string {
  return flag.trim();
}

/**
 * Computes a secure HMAC-SHA256 hash of a flag.
 * Even if database is compromised, plaintext flags are never exposed.
 */
export function hashFlag(flag: string): string {
  const normalized = normalizeFlag(flag);
  return crypto
    .createHmac("sha256", SALT)
    .update(normalized)
    .digest("hex");
}

/**
 * Timing-safe comparison to prevent side-channel timing attacks
 */
export function verifyFlag(submittedFlag: string, storedFlagHash: string): boolean {
  const submittedHash = hashFlag(submittedFlag);
  
  if (submittedHash.length !== storedFlagHash.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(submittedHash, "utf8"),
    Buffer.from(storedFlagHash, "utf8")
  );
}
