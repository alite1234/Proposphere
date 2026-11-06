import { randomBytes } from "crypto";
import { sha256 } from "./hash";

// Acceptance tokens (spec §7.1): high-entropy, unguessable; only the hash is stored.
// Sequential DB IDs are never used as authorization tokens.

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url"); // ~256 bits entropy
  return { raw, hash: sha256(raw) };
}

export function hashToken(raw: string): string {
  return sha256(raw);
}

export function documentHash(content: unknown): string {
  return sha256(JSON.stringify(content));
}
