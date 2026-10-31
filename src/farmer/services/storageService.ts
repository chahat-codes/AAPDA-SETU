import { DamageReport } from '../types/damageReport';
import { INITIAL_MOCK_REPORTS } from '../data/mockData';
import { saveRecord, getRecords } from '@shared/db';
import type { EvidenceRecord, DamageType as SharedDamageType } from '@shared/types';

const STORAGE_KEY = 'aapdasetu_farmer_reports_v1';

/**
 * Maps the capitalized DamageReport damageType to the lowercase DamageType in EvidenceRecord.
 */
function mapDamageTypeToShared(dt: string): SharedDamageType {
  const lower = (dt || '').toLowerCase();
  if (lower.includes('flood')) return 'flood';
  if (lower.includes('drought')) return 'drought';
  if (lower.includes('hail')) return 'hailstorm';
  if (lower.includes('pest')) return 'pest_attack';
  return 'other';
}

/**
 * Converts a base64 DataURL or SVG DataURL to a Blob for IndexedDB storage.
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    return new Blob(['demo-field-evidence'], { type: 'image/jpeg' });
  }
}

/**
 * Syncs a DamageReport into IndexedDB as an EvidenceRecord.
 * This bridges the Farmer Desk with the Officer Console, Evidence Engine, and Verify modules.
 */
export async function syncDamageReportToIndexedDB(report: DamageReport): Promise<void> {
  try {
    let photoBlob: Blob;
    let photoTs = Date.now();

    if (report.photos && report.photos.length > 0 && report.photos[0].dataUrl) {
      photoBlob = await dataUrlToBlob(report.photos[0].dataUrl);
      if (report.photos[0].timestamp) {
        photoTs = new Date(report.photos[0].timestamp).getTime();
      }
    } else {
      // Keep missing-photo records visible to local review tools without making
      // a placeholder look like real photographic evidence.
      photoBlob = new Blob(['field-photo-placeholder'], { type: 'application/x-aapdasetu-placeholder' });
    }

    const descriptionParts: string[] = [];
    if (report.farmer.cropName) {
      descriptionParts.push(`Crop: ${report.farmer.cropName} (${report.farmer.cropSeason || 'Kharif'})`);
    }
    if (report.lossPercentage) {
      descriptionParts.push(`Loss: ${report.lossPercentage}%`);
    }
    if (report.farmer.affectedArea || report.farmer.totalArea) {
      descriptionParts.push(`Area: ${report.farmer.affectedArea || '0'}/${report.farmer.totalArea || '0'} Acres`);
    }
    if (report.farmer.village || report.farmer.district) {
      descriptionParts.push(`Village: ${report.farmer.village || ''}, Dist: ${report.farmer.district || ''}, ${report.farmer.state || ''}`);
    }
    if (report.damageDescription) {
      descriptionParts.push(`Obs: ${report.damageDescription}`);
    }

    const fullDescription = descriptionParts.length > 0
      ? `[${descriptionParts.slice(0, -1).join(' | ')}] ${descriptionParts.slice(-1)[0]}`
      : report.damageDescription || 'Crop damage documented via AapdaSetu Farmer Desk';

    const evidenceRecord: EvidenceRecord = {
      id: report.submissionId || report.id,
      farmerName: report.farmer.fullName || 'Farmer',
      farmerId: report.farmer.kisanId || (report.submissionId ? report.submissionId : 'KSN-LOCAL'),
      phone: report.farmer.phoneNumber || '',
      photoBlob: photoBlob,
      photoTimestamp: photoTs,
      damageType: mapDamageTypeToShared(report.damageType),
      description: fullDescription,
      location: report.location && report.location.latitude !== null && report.location.longitude !== null
        ? {
            latitude: report.location.latitude,
            longitude: report.location.longitude,
            accuracy: report.location.accuracy ?? 8,
            timestamp: Date.now(),
          }
        : null,
      consentGiven: !!report.consentGiven,
      consentTimestamp: report.consentTimestamp ? new Date(report.consentTimestamp).getTime() : Date.now(),
      photoHash: null,
      signature: null,
      publicKey: null,
      status: report.status === 'submitted' ? 'submitted' : 'draft',
      createdAt: new Date(report.createdAt).getTime(),
      updatedAt: new Date(report.updatedAt).getTime(),
      officerNotes: null,
      reviewedAt: null,
    };

    await saveRecord(evidenceRecord);
  } catch (err) {
    console.warn('Background sync of DamageReport to IndexedDB failed:', err);
  }
}

export const storageService = {
  getReports(): DamageReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Start with a truthful empty inbox. Sample data remains available through
        // the explicit demo reset action and existing saved reports are preserved.
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: DamageReport[] = JSON.parse(data);

      // Async sync from IndexedDB if any records were created in Helper mode
      this.syncFromIndexedDB(parsed).catch(() => {});

      return parsed;
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return [];
    }
  },

  async syncFromIndexedDB(currentLocalReports: DamageReport[]): Promise<void> {
    try {
      const dbRecords = await getRecords();
      if (!dbRecords || dbRecords.length === 0) return;

      // A sync may finish after a user saves a draft. Merge the latest local
      // value before writing so an in-flight migration cannot overwrite it.
      try {
        const latestLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as DamageReport[];
        const merged = new Map<string, DamageReport>();
        currentLocalReports.forEach((report) => merged.set(report.id, report));
        latestLocal.forEach((report) => merged.set(report.id, report));
        currentLocalReports = Array.from(merged.values());
      } catch { /* keep the in-memory snapshot if local storage is unavailable */ }

      let changed = false;
      const existingIds = new Set(currentLocalReports.map(r => r.id));

      for (const rec of dbRecords) {
        if (!existingIds.has(rec.id) && !rec.id.startsWith('demo-')) {
          // Convert EvidenceRecord to a displayable DamageReport
          const importedReport: DamageReport = {
            id: rec.id,
            createdAt: new Date(rec.createdAt).toISOString(),
            updatedAt: new Date(rec.updatedAt).toISOString(),
            status: rec.status === 'draft' ? 'draft' : 'submitted',
            consentGiven: rec.consentGiven,
            consentTimestamp: rec.consentTimestamp ? new Date(rec.consentTimestamp).toISOString() : undefined,
            farmer: {
              fullName: rec.farmerName,
              phoneNumber: rec.phone,
              kisanId: rec.farmerId,
              state: 'Punjab',
              district: '',
              block: '',
              village: '',
              khasraNumber: '',
              cropName: 'Field Crop',
              cropSeason: 'Kharif',
              sowingDate: new Date(rec.createdAt).toISOString().split('T')[0],
              totalArea: '',
              affectedArea: ''
            },
            damageType: (rec.damageType.charAt(0).toUpperCase() + rec.damageType.slice(1).replace('_', ' ')) as any,
            lossPercentage: 50,
            damageDescription: rec.description,
            incidentDate: new Date(rec.createdAt).toISOString().split('T')[0],
            location: {
              latitude: rec.location ? rec.location.latitude : null,
              longitude: rec.location ? rec.location.longitude : null,
              accuracy: rec.location ? rec.location.accuracy : null,
              addressText: rec.location ? `Lat: ${rec.location.latitude.toFixed(4)}, Lng: ${rec.location.longitude.toFixed(4)}` : '',
              isSimulated: false
            },
            photos: [],
            mockDigitalSignature: rec.photoHash || undefined,
            submissionId: rec.id
          };
          currentLocalReports.push(importedReport);
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLocalReports));
      }
    } catch {
      // Ignore background sync errors
    }
  },

  getReportById(id: string): DamageReport | undefined {
    const reports = this.getReports();
    return reports.find(r => r.id === id);
  },

  saveReport(report: DamageReport): void {
    const reports = this.getReports();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    const updatedReport: DamageReport = {
      ...report,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      reports[existingIndex] = updatedReport;
    } else {
      reports.unshift(updatedReport);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));

    // Also persist to IndexedDB in background
    syncDamageReportToIndexedDB(updatedReport).catch(() => {});
  },

  submitReport(report: DamageReport): DamageReport {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const stateCode = report.farmer.state ? report.farmer.state.substring(0, 2).toUpperCase() : 'IN';
    const submissionId = `AS-2026-${stateCode}-${randomNum}`;
    
    // Explicitly marked simulated mock signature/hash
    const mockHash = 'SIM-SHA256-' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const submittedReport: DamageReport = {
      ...report,
      status: 'submitted',
      submissionId,
      mockDigitalSignature: mockHash,
      updatedAt: new Date().toISOString()
    };

    this.saveReport(submittedReport);
    return submittedReport;
  },

  deleteReport(id: string): void {
    const reports = this.getReports().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },

  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REPORTS));
    INITIAL_MOCK_REPORTS.forEach(r => {
      syncDamageReportToIndexedDB(r).catch(() => {});
    });
  },

  createNewBlankReport(): DamageReport {
    let farmProfile: { crop?: string; village?: string; area?: string } = {};
    try {
      farmProfile = JSON.parse(localStorage.getItem('aapdasetu-farm-profile-v1') || '{}');
    } catch { /* profile details are optional */ }
    return {
      id: 'report-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      consentGiven: false,
      farmer: {
        fullName: '',
        phoneNumber: '',
        kisanId: '',
        state: 'Madhya Pradesh',
        district: '',
        block: '',
        village: farmProfile.village || '',
        khasraNumber: '',
        cropName: farmProfile.crop || 'Wheat',
        cropSeason: 'Rabi',
        sowingDate: new Date().toISOString().split('T')[0],
        totalArea: farmProfile.area || '',
        affectedArea: ''
      },
      damageType: 'Flood',
      lossPercentage: 50,
      damageDescription: '',
      incidentDate: '',
      location: {
        latitude: null,
        longitude: null,
        accuracy: null,
        addressText: '',
        isSimulated: false
      },
      photos: []
    };
  }
};

