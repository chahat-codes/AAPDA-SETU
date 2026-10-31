// src/officer/officerUtils.ts
// ─── Utility helpers and demo data for the Officer Console ──

import type { EvidenceRecord, EvidenceStatus, DamageType } from "@shared/types";

/**
 * Returns an emoji icon for a given damage type.
 */
export function getDamageIcon(type: DamageType): string {
  switch (type) {
    case "flood":
      return "🌊";
    case "drought":
      return "🏜️";
    case "hailstorm":
      return "🌨️";
    case "pest_attack":
      return "🐛";
    case "other":
      return "❓";
    default:
      return "❓";
  }
}

/**
 * Returns a human-readable label for a damage type.
 */
export function getDamageLabel(type: DamageType): string {
  switch (type) {
    case "flood":
      return "Flood / Waterlogging";
    case "drought":
      return "Drought / Moisture Stress";
    case "hailstorm":
      return "Hailstorm / Lodging";
    case "pest_attack":
      return "Pest Attack / Blight";
    case "other":
      return "Other Damage";
    default:
      return "Unknown";
  }
}

/**
 * Returns a CSS class name for color-coded status badges.
 */
export function getStatusBadgeClass(status: EvidenceStatus): string {
  switch (status) {
    case "draft":
      return "officer-badge-draft";
    case "sealed":
      return "officer-badge-sealed";
    case "submitted":
      return "officer-badge-submitted";
    case "under_review":
      return "officer-badge-under-review";
    case "verified":
      return "officer-badge-verified";
    case "rejected":
      return "officer-badge-rejected";
    default:
      return "officer-badge-draft";
  }
}

/**
 * Returns a human-readable label for a status value.
 */
export function getStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case "draft":
      return "Draft (Unsealed)";
    case "sealed":
      return "Sealed & Signed";
    case "submitted":
      return "Saved locally";
    case "under_review":
      return "Under Review";
    case "verified":
      return "Local review complete";
    case "rejected":
      return "Flagged / Rejected";
    default:
      return "Unknown";
  }
}

/**
 * Formats a milliseconds-since-epoch timestamp into a readable date+time string.
 * Example: "30 Oct 2024, 14:35"
 */
export function formatDateTime(ts: number): string {
  if (!ts || ts <= 0) {
    return "N/A";
  }
  const date = new Date(ts);
  const day = date.getDate().toString().padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Creates a clean SVG placeholder image representing crop damage
 * with clear DEMO DATA labelling so photo previews never show broken images.
 */
function createDemoImageBlob(label: string, color: string): Blob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="${color}"/>
    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6,6" opacity="0.6"/>
    <text x="300" y="160" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${label}
    </text>
    <rect x="180" y="195" width="240" height="34" rx="17" fill="#000000" fill-opacity="0.35"/>
    <text x="300" y="218" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600" fill="#fef08a" text-anchor="middle" letter-spacing="1.5">
      DEMO EVIDENCE PHOTO
    </text>
    <text x="300" y="260" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" fill="#ffffff" opacity="0.8" text-anchor="middle">
      Simulated for AapdaSetu local prototype demonstration
    </text>
    <text x="300" y="340" font-family="monospace" font-size="11" fill="#ffffff" opacity="0.5" text-anchor="middle">
      SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
    </text>
  </svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

/**
 * Returns 4 hard-coded demo EvidenceRecords for demonstration.
 * All demo records are clearly labelled as "DEMO DATA".
 */
export function getDemoRecords(): EvidenceRecord[] {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  return [
    {
      id: "demo-flood-001",
      farmerName: "Gurpreet Singh (DEMO)",
      farmerId: "PB-SNG-8821",
      phone: "+91 98765 43210",
      photoBlob: createDemoImageBlob("Paddy Field Submerged (3.5 Acres)", "#1e3a5f"),
      photoTimestamp: now - 18 * oneHour,
      damageType: "flood",
      description:
        "[DEMO DATA] Ghaggar river overflow submerged standing PR-126 paddy crop under 3.5 feet water. Inundation ongoing for 36 hours. Lodging and root rot observed.",
      location: {
        latitude: 30.2458,
        longitude: 75.8421,
        accuracy: 8,
        timestamp: now - 18 * oneHour,
      },
      consentGiven: true,
      consentTimestamp: now - 18 * oneHour - 5000,
      photoHash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      signature: "MEQCIB3+8Gz/6VqC+3hZq1demoSigECDSA256Base64DataExampleForDisplay==",
      publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdemoPublicKeyBase64ExampleP256==",
      status: "submitted",
      createdAt: now - 18 * oneHour,
      updatedAt: now - 18 * oneHour,
      officerNotes: null,
      reviewedAt: null,
    },
    {
      id: "demo-pest-002",
      farmerName: "Rajwinder Kaur (DEMO)",
      farmerId: "PB-BTH-4019",
      phone: "+91 91234 56789",
      photoBlob: createDemoImageBlob("Cotton Whitefly Damage (2.0 Acres)", "#7c2d12"),
      photoTimestamp: now - 42 * oneHour,
      damageType: "pest_attack",
      description:
        "[DEMO DATA] Whitefly outbreak on Bt cotton crop across 2 acres in Bathinda district. Severe leaf yellowing, soot mould, and boll shedding observed.",
      location: {
        latitude: 30.2101,
        longitude: 74.9455,
        accuracy: 6,
        timestamp: now - 42 * oneHour,
      },
      consentGiven: true,
      consentTimestamp: now - 42 * oneHour - 12000,
      photoHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      signature: "MEUCIQDdemoSigCottonWhitefly77218391823719827391827391827391823==",
      publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEcottonDemoKeyP256Verified==",
      status: "under_review",
      createdAt: now - 42 * oneHour,
      updatedAt: now - 12 * oneHour,
      officerNotes: "[DEMO NOTE] Field officer assigned. Telemetry confirms district pest alert. Awaiting drone cross-verification.",
      reviewedAt: now - 12 * oneHour,
    },
    {
      id: "demo-hail-003",
      farmerName: "Amrit Pal (DEMO)",
      farmerId: "PB-MOG-1920",
      phone: "+91 99887 76655",
      photoBlob: createDemoImageBlob("Wheat Lodging Post-Hailstorm (4.5 Acres)", "#14532d"),
      photoTimestamp: now - 65 * oneHour,
      damageType: "hailstorm",
      description:
        "[DEMO DATA] Heavy unseasonal hail and squall flattened ready-to-harvest HD-3086 wheat. Stems snapped, ear heads shattered across 4.5 acres in Moga.",
      location: {
        latitude: 30.8162,
        longitude: 75.1741,
        accuracy: 10,
        timestamp: now - 65 * oneHour,
      },
      consentGiven: true,
      consentTimestamp: now - 65 * oneHour - 8000,
      photoHash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      signature: "MEQCIAhailDamageSignMogaDistrictDemoSignatureBase64String==",
      publicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmogaPublicP256KeyValidExample==",
      status: "verified",
      createdAt: now - 65 * oneHour,
      updatedAt: now - 20 * oneHour,
      officerNotes: "[DEMO NOTE] Verified via Revenue Patwari on-site report. 80% loss estimated for State Relief claim.",
      reviewedAt: now - 20 * oneHour,
    },
    {
      id: "demo-drought-004",
      farmerName: "Surjit Ram (DEMO)",
      farmerId: "PB-MNX-3312",
      phone: "+91 98111 22334",
      photoBlob: createDemoImageBlob("Moisture Stress on Maize (1.8 Acres)", "#713f12"),
      photoTimestamp: now - 90 * oneHour,
      damageType: "drought",
      description:
        "[DEMO DATA] Prolonged 28-day dry spell during critical tasseling phase. Canal supply breach compounded failure. Stunted stalks and cob withering.",
      location: {
        latitude: 29.9821,
        longitude: 75.3892,
        accuracy: 14,
        timestamp: now - 90 * oneHour,
      },
      consentGiven: true,
      consentTimestamp: now - 90 * oneHour - 15000,
      photoHash: null,
      signature: null,
      publicKey: null,
      status: "draft",
      createdAt: now - 90 * oneHour,
      updatedAt: now - 90 * oneHour,
      officerNotes: null,
      reviewedAt: null,
    },
  ];
}
