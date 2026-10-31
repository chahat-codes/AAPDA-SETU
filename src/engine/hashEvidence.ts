// src/engine/hashEvidence.ts
// ─── Thin wrapper: hash an EvidenceRecord's photo ────────────

import { hashBlob } from "@shared/crypto";
import type { EvidenceRecord } from "@shared/types";

/**
 * Compute the SHA-256 hash of a record's photoBlob.
 * Returns the hex digest string.
 */
export async function hashEvidencePhoto(
  record: EvidenceRecord
): Promise<string> {
  return hashBlob(record.photoBlob);
}
