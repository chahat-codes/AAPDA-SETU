// src/farmer/farmerUtils.ts
// ─── Helper functions for the Farmer module ─────────────────

import type { EvidenceStatus, DamageType } from "@shared/types";

/**
 * Generate a unique ID for a new evidence record.
 * Uses the browser's built-in crypto.randomUUID().
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Format a millisecond timestamp into a human-readable date string.
 * Example: "30 Oct 2026, 2:45 PM"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Return a CSS colour string for each evidence status.
 * Used for status badges in the report list.
 */
export function getStatusColor(status: EvidenceStatus): string {
  switch (status) {
    case "draft":
      return "#6b7280"; // grey
    case "sealed":
      return "#2563eb"; // blue
    case "submitted":
      return "#d97706"; // amber
    case "under_review":
      return "#7c3aed"; // violet
    case "verified":
      return "#16a34a"; // green
    case "rejected":
      return "#dc2626"; // red
    default:
      return "#6b7280";
  }
}

/**
 * Return a human-readable label for each evidence status.
 */
export function getStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sealed":
      return "Sealed";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

/**
 * Return a human-readable label for each damage type.
 */
export function getDamageLabel(type: DamageType): string {
  switch (type) {
    case "flood":
      return "Flood";
    case "drought":
      return "Drought";
    case "hailstorm":
      return "Hailstorm";
    case "pest_attack":
      return "Pest Attack";
    case "other":
      return "Other";
    default:
      return type;
  }
}
