import { DamageReport } from '../types/damageReport';

export const INDIAN_STATES = [
  'Madhya Pradesh',
  'Rajasthan',
  'Uttar Pradesh',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Bihar',
  'Gujarat',
  'Karnataka',
  'Odisha',
  'Andhra Pradesh',
  'Tamil Nadu',
  'Telangana',
  'West Bengal'
];

export const COMMON_CROPS = [
  { name: 'Wheat (गेहूं)', value: 'Wheat', season: 'Rabi' },
  { name: 'Paddy / Rice (धान / चावल)', value: 'Paddy', season: 'Kharif' },
  { name: 'Mustard (सरसों)', value: 'Mustard', season: 'Rabi' },
  { name: 'Soybean (सोयाबीन)', value: 'Soybean', season: 'Kharif' },
  { name: 'Cotton (कपास)', value: 'Cotton', season: 'Kharif' },
  { name: 'Maize (मक्का)', value: 'Maize', season: 'Kharif' },
  { name: 'Gram / Chana (चना)', value: 'Gram', season: 'Rabi' },
  { name: 'Sugarcane (गन्ना)', value: 'Sugarcane', season: 'Zaid' },
  { name: 'Other Crop (अन्य)', value: 'Other', season: 'Kharif' }
];

// Helper to generate a realistic SVG data URL for a sample crop image placeholder
export const generateSampleFieldPhoto = (caption: string, color = '#15803d'): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f0fdf4"/>
    <rect y="220" width="600" height="180" fill="${color}" opacity="0.85"/>
    <circle cx="480" cy="90" r="50" fill="#fde047" opacity="0.9"/>
    <!-- Simulated Crop Stalks -->
    <path d="M 50,400 Q 60,300 70,220 M 110,400 Q 100,320 120,240 M 180,400 Q 195,310 185,225 M 250,400 Q 240,330 260,230 M 320,400 Q 330,310 325,235 M 400,400 Q 390,300 410,240 M 480,400 Q 500,320 490,220 M 550,400 Q 540,310 560,230" stroke="#14532d" stroke-width="6" fill="none"/>
    <rect x="20" y="330" width="560" height="50" rx="8" fill="rgba(0,0,0,0.65)"/>
    <text x="35" y="360" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">📍 ${caption}</text>
    <text x="35" y="375" fill="#a7f3d0" font-family="monospace" font-size="11">23.2599° N, 77.4126° E | AAPDASETU FIELD EVIDENCE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_MOCK_REPORTS: DamageReport[] = [
  {
    id: 'draft-demo-001',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'draft',
    consentGiven: true,
    consentTimestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    farmer: {
      fullName: 'Rameshwar Dayal Patidar (रामेश्वर दयाल)',
      phoneNumber: '9827103456',
      kisanId: 'KSN-MP-7829-01',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      block: 'Ashta',
      village: 'Kothri (कोठरी)',
      khasraNumber: '142/3',
      cropName: 'Soybean',
      cropSeason: 'Kharif',
      sowingDate: '2026-07-10',
      totalArea: '4.5',
      affectedArea: '3.5'
    },
    damageType: 'Flood',
    lossPercentage: 80,
    damageDescription: 'Waterlogging due to intense flash floods for 48 hours. Plants submerged and roots rotting across 3.5 acres.',
    incidentDate: '2026-10-27',
    location: {
      latitude: 23.0189,
      longitude: 76.8834,
      accuracy: 6.2,
      addressText: 'Near Canal Branch, Kothri Village, Ashta Tehsil, Sehore, MP',
      isSimulated: true
    },
    photos: [
      {
        id: 'photo-mock-1',
        dataUrl: generateSampleFieldPhoto('Submerged Soybean Fields (Soybean Jalmagna)', '#0284c7'),
        timestamp: '2026-10-27T10:15:00Z',
        category: 'Overview',
        gpsLocation: {
          latitude: 23.0189,
          longitude: 76.8834,
          accuracy: 6.2
        }
      },
      {
        id: 'photo-mock-2',
        dataUrl: generateSampleFieldPhoto('Root Rotting Close-up (Jadh Sadhan)', '#0369a1'),
        timestamp: '2026-10-27T10:20:00Z',
        category: 'Close-up',
        gpsLocation: {
          latitude: 23.0191,
          longitude: 76.8832,
          accuracy: 5.5
        }
      }
    ]
  },
  {
    id: 'submitted-demo-002',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'submitted',
    submissionId: 'AS-2026-MP-99421',
    mockDigitalSignature: 'SIM-SIG-7e9b04fc9a88e1329',
    consentGiven: true,
    consentTimestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    farmer: {
      fullName: 'Sunita Devi (सुनीता देवी)',
      phoneNumber: '9414022891',
      kisanId: 'KSN-RJ-4412-88',
      state: 'Rajasthan',
      district: 'Kota',
      block: 'Ladpura',
      village: 'Mandana (मंडाना)',
      khasraNumber: '89/1',
      cropName: 'Mustard',
      cropSeason: 'Rabi',
      sowingDate: '2026-10-01',
      totalArea: '2.0',
      affectedArea: '1.8'
    },
    damageType: 'Hailstorm',
    lossPercentage: 70,
    damageDescription: 'Severe hailstorm shattered seedlings and young pods. 70% destroyed on field.',
    incidentDate: '2026-10-24',
    location: {
      latitude: 24.9814,
      longitude: 75.8239,
      accuracy: 4.8,
      addressText: 'Farm plot adjacent to NH-52, Mandana, Kota, Rajasthan',
      isSimulated: true
    },
    photos: [
      {
        id: 'photo-mock-3',
        dataUrl: generateSampleFieldPhoto('Hailstorm Impact on Mustard Crop', '#7c3aed'),
        timestamp: '2026-10-24T16:45:00Z',
        category: 'Overview',
        gpsLocation: {
          latitude: 24.9814,
          longitude: 75.8239,
          accuracy: 4.8
        }
      }
    ]
  }
];

