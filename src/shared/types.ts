// src/shared/types.ts
// ─── The single source of truth for all shared interfaces ───
// ⚠️  Changes here affect EVERY module. Discuss with the team first.

/** Status an evidence record moves through. */
export type EvidenceStatus =
  | "draft" // photo taken, consent given, not yet sealed
  | "sealed" // hash + signature computed — record is immutable
  | "submitted" // exported / sent to officer
  | "under_review" // officer is looking at it
  | "verified" // officer accepted
  | "rejected"; // officer rejected

/** What kind of crop damage was observed. */
export type DamageType =
  | "flood"
  | "drought"
  | "hailstorm"
  | "pest_attack"
  | "other";

/** GPS coordinates captured at time of photo. */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  /** Accuracy in metres. */
  accuracy: number;
  /** Milliseconds since epoch. */
  timestamp: number;
}

/**
 * The core data object stored in IndexedDB.
 *
 * Every module reads or writes this shape.
 * Only ONE file defines it — this one.
 */
export interface EvidenceRecord {
  /** UUID v4 — generated on creation. */
  id: string;

  // ── Farmer-provided ──────────────────────────
  farmerName: string;
  /** e.g. masked Aadhaar or a local ID */
  farmerId: string;
  phone: string;
  /** The raw JPEG / PNG captured by the farmer. */
  photoBlob: Blob;
  /** Milliseconds since epoch — when the photo was taken. */
  photoTimestamp: number;
  damageType: DamageType;
  description: string;
  /** null if GPS was unavailable. */
  location: GeoLocation | null;

  // ── Consent ──────────────────────────────────
  /** Must be true before any capture is allowed. */
  consentGiven: boolean;
  /** Milliseconds since epoch — when the farmer tapped "I agree". */
  consentTimestamp: number;

  // ── Cryptographic evidence ───────────────────
  /** SHA-256 hex digest of photoBlob bytes. */
  photoHash: string | null;
  /**
   * Digital signature over photoHash, base64-encoded.
   * NOTE: This proves who sealed the record, but only if you trust the public key.
   */
  signature: string | null;
  /** Base64-encoded public key used to create the signature. */
  publicKey: string | null;

  // ── Workflow ─────────────────────────────────
  status: EvidenceStatus;
  /** Milliseconds since epoch. */
  createdAt: number;
  /** Milliseconds since epoch. */
  updatedAt: number;

  // ── Officer-side (filled during review) ──────
  officerNotes: string | null;
  /** Milliseconds since epoch — when officer reviewed. */
  reviewedAt: number | null;
}

