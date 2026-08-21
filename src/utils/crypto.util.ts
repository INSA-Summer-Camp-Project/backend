import crypto from "node:crypto";

/**
 * Generates a cryptographically secure random opaque token.
 * @param length The length of the random bytes (default 32)
 * @returns A base64url encoded random string
 */
export const generateRandomToken = (length = 32): string => {
  return crypto.randomBytes(length).toString("base64url");
};

/**
 * Creates a SHA-256 hash of a given string.
 * @param token The raw token to hash
 * @returns The hex representation of the hashed token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
