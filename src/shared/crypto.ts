// src/shared/crypto.ts
// ─── Web Crypto API helpers: hashing, key generation, signing, verification ──
// Uses SubtleCrypto — works in modern browsers and service workers.

import { HASH_ALGORITHM, SIGN_ALGORITHM, SIGN_CURVE } from "./constants";

/**
 * Compute the SHA-256 hash of a Blob.
 * Returns the digest as a lowercase hex string.
 */
export async function hashBlob(blob: Blob): Promise<string> {
  try {
    const buffer = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest(HASH_ALGORITHM, buffer);
    // Convert ArrayBuffer → hex string
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  } catch (error) {
    throw new Error(
      `Failed to hash blob: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate an ECDSA P-256 key pair.
 * Returns both keys as base64-encoded strings:
 *   publicKey  → base64 of SPKI format
 *   privateKey → base64 of PKCS8 format
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: SIGN_ALGORITHM, namedCurve: SIGN_CURVE },
      true, // extractable — we need to export the keys
      ["sign", "verify"]
    );

    const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
      publicKey: arrayBufferToBase64(spki),
      privateKey: arrayBufferToBase64(pkcs8),
    };
  } catch (error) {
    throw new Error(
      `Failed to generate key pair: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Sign a hex hash string with a base64-encoded PKCS8 private key.
 * Returns the signature as a base64 string.
 *
 * The hex hash is converted to UTF-8 bytes for signing (not decoded as raw
 * binary). This means verifySignature must use the same encoding.
 */
export async function signHash(
  hash: string,
  privateKeyBase64: string
): Promise<string> {
  try {
    const keyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: SIGN_ALGORITHM, namedCurve: SIGN_CURVE },
      false,
      ["sign"]
    );

    // Encode the hex hash string as UTF-8 bytes for signing
    const encoder = new TextEncoder();
    const data = encoder.encode(hash);

    const signature = await crypto.subtle.sign(
      { name: SIGN_ALGORITHM, hash: HASH_ALGORITHM },
      privateKey,
      data
    );

    return arrayBufferToBase64(signature);
  } catch (error) {
    throw new Error(
      `Failed to sign hash: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Verify a signature against a hex hash and a base64-encoded SPKI public key.
 * Returns true if the signature is valid, false otherwise.
 */
export async function verifySignature(
  hash: string,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  try {
    const keyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await crypto.subtle.importKey(
      "spki",
      keyBuffer,
      { name: SIGN_ALGORITHM, namedCurve: SIGN_CURVE },
      false,
      ["verify"]
    );

    const signatureBuffer = base64ToArrayBuffer(signatureBase64);

    // Encode the hex hash string the same way it was signed (UTF-8 bytes)
    const encoder = new TextEncoder();
    const data = encoder.encode(hash);

    const isValid = await crypto.subtle.verify(
      { name: SIGN_ALGORITHM, hash: HASH_ALGORITHM },
      publicKey,
      signatureBuffer,
      data
    );

    return isValid;
  } catch (error) {
    throw new Error(
      `Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ─── Internal helpers ──────────────────────────────────────────

/** Convert an ArrayBuffer to a base64 string. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert a base64 string back to an ArrayBuffer. */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
