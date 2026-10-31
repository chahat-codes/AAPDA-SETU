export type DamageType = 'Flood' | 'Drought' | 'Hailstorm' | 'Pest Attack' | 'Other';

export type Language = 'en' | 'hi' | 'pa';

export interface EvidencePhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  /** How this file entered the local report. Older saved records may not have this field. */
  source?: 'camera' | 'upload' | 'simulated';
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  category: 'Overview' | 'Close-up' | 'Landmark' | 'General';
}

export interface FarmerDetails {
  fullName: string;
  phoneNumber: string;
  kisanId: string; // e.g. "KSN-8849-2024" or Aadhaar masked
  state: string;
  district: string;
  block: string;
  village: string;
  khasraNumber: string;
  cropName: string;
  cropSeason: 'Kharif' | 'Rabi' | 'Zaid';
  sowingDate: string;
  totalArea: string; // in acres
  affectedArea: string; // in acres
}

export interface DamageReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'submitted';
  consentGiven: boolean;
  consentTimestamp?: string;
  farmer: FarmerDetails;
  damageType: DamageType;
  customDamageType?: string;
  lossPercentage: number;
  damageDescription: string;
  incidentDate: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    addressText: string;
    isSimulated?: boolean;
  };
  photos: EvidencePhoto[];
  mockDigitalSignature?: string;
  submissionId?: string;
}

export type StepId = 'consent' | 'farmer' | 'damage' | 'photos' | 'preview' | 'success';
