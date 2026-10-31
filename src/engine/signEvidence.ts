// src/engine/signEvidence.ts
// ─── Thin wrapper: generate key pair and sign a photo hash ───

import { generateKeyPair, signHash } from "@shared/crypto";

/**
 * Generate a fresh ECDSA P-256 key pair, sign the given photo hash,
 * and return the signature + public key (both base64).
 */
export async function sealWithSignature(
  photoHash: string
): Promise<{ signature: string; publicKey: string }> {
  const { publicKey, privateKey } = await generateKeyPair();
  const signature = await signHash(photoHash, privateKey);
  return { signature, publicKey };
}
