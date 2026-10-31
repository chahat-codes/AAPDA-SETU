// src/shared/constants.ts
// ─── Project-wide constants ─────────────────────────────────

/** IndexedDB database name. */
export const DB_NAME = "aapadasetu-db";

/** IndexedDB database version. Bump when you change the schema. */
export const DB_VERSION = 1;

/** The single object store for evidence records. */
export const STORE_NAME = "evidence";

/** Hash algorithm used for photo integrity checks. */
export const HASH_ALGORITHM = "SHA-256";

/** Signature algorithm used for sealing records. */
export const SIGN_ALGORITHM = "ECDSA";

/** Curve used with the signature algorithm. */
export const SIGN_CURVE = "P-256";

/** All the routes used in the app. */
export const ROUTES = {
  home: "/",
  farmer: "/farmer",
  reports: "/reports",
  farm: "/farm",
  profile: "/profile",
  cropHelp: "/save-crop",
  waterSoil: "/water-soil",
  helper: "/helper",
  officer: "/officer",
  engine: "/engine",
  verify: "/verify",
} as const;

/** Human-readable module labels (used in nav). */
export const MODULE_LABELS: Record<string, string> = {
  [ROUTES.farmer]: "🧑‍🌾 Farmer",
  [ROUTES.helper]: "🤝 Helper",
  [ROUTES.officer]: "👮 Officer",
  [ROUTES.engine]: "🔐 Engine",
  [ROUTES.verify]: "🔍 Verify",
};

