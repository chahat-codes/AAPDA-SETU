import { useState } from 'preact/hooks';
import { FarmerDetails, Language } from '../types/damageReport';
import { INDIAN_STATES, COMMON_CROPS } from '../data/mockData';
import { User, MapPin, Landmark, Save, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';

interface FarmerDetailsFormProps {
  farmer: FarmerDetails;
  onChange: (updated: FarmerDetails) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  language: Language;
}

export function FarmerDetailsForm({
  farmer,
  onChange,
  onNext,
  onBack,
  onSaveDraft,
  language
}: FarmerDetailsFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFieldChange = (field: keyof FarmerDetails, value: string) => {
    onChange({
      ...farmer,
      [field]: value
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateAndProceed = () => {
    const newErrors: { [key: string]: string } = {};

    if (!farmer.fullName.trim()) {
      newErrors.fullName = language === 'hi' ? 'कृपया किसान का नाम दर्ज करें' : 'Farmer name is required';
    }

    if (!farmer.phoneNumber.trim() || !/^\d{10}$/.test(farmer.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = language === 'hi' ? '10 अंकों का मान्य मोबाइल नंबर दर्ज करें' : 'Enter valid 10-digit mobile number';
    }

    if (!farmer.village.trim()) {
      newErrors.village = language === 'hi' ? 'गाँव का नाम आवश्यक है' : 'Village is required';
    }

    if (!farmer.district.trim()) {
      newErrors.district = language === 'hi' ? 'जिले का नाम आवश्यक है' : 'District is required';
    }

    if (!farmer.khasraNumber.trim()) {
      newErrors.khasraNumber = language === 'hi' ? 'खसरा / सर्वे नंबर दर्ज करें' : 'Khasra / Survey number required';
    }

    if (!farmer.affectedArea.trim() || Number(farmer.affectedArea) <= 0) {
      newErrors.affectedArea = language === 'hi' ? 'प्रभावित रकबा (एकड़) दर्ज करें' : 'Enter affected area in acres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  // Helper autofill for quick demo testing
  const autofillDemoFarmer = () => {
    onChange({
      fullName: 'Vikram Singh Rawat (विक्रम सिंह रावत)',
      phoneNumber: '9876543210',
      kisanId: 'KSN-RJ-8832-19',
      state: 'Rajasthan',
      district: 'Bhilwara',
      block: 'Mandal',
      village: 'Bhagwanpura (भगवानपुरा)',
      khasraNumber: '118/4',
      cropName: 'Mustard',
      cropSeason: 'Rabi',
      sowingDate: '2026-10-10',
      totalArea: '5.0',
      affectedArea: '3.5'
    });
  };

  return (
    <div className="card farmer-form-card">
      <div className="card-header justify-between">
        <div className="flex-row items-center gap-3">
          <div className="card-icon-tag bg-blue">
            <User size={24} />
          </div>
          <div>
            <h2 className="card-title">
              {language === 'hi' ? 'किसान एवं भूमि का विवरण' : 'Farmer & Land Details'}
            </h2>
            <p className="card-subtitle">
              {language === 'hi' 
                ? 'मुआवजा सत्यापन हेतु किसान और प्रभावित भूमि की सही जानकारी दें' 
                : 'Enter registered farmer details and affected land parcel info'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={autofillDemoFarmer}
          className="btn btn-secondary btn-sm"
          title="Autofill realistic sample farmer data"
        >
          ⚡ {language === 'hi' ? 'डेमो डेटा भरें' : 'Autofill Demo'}
        </button>
      </div>

      <div className="form-sections">
        {/* SECTION 1: Personal & Identification */}
        <div className="form-sub-block">
          <div className="sub-block-title">
            <User size={18} />
            <span>{language === 'hi' ? '1. व्यक्तिगत जानकारी' : '1. Farmer Identification'}</span>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">
                {language === 'hi' ? 'किसान का पूरा नाम *' : 'Farmer Full Name *'}
              </label>
              <input
                type="text"
                placeholder={language === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                value={farmer.fullName}
                onInput={(e) => handleFieldChange('fullName', (e.target as HTMLInputElement).value)}
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'hi' ? 'मोबाइल नंबर (OTP सत्यापन) *' : 'Mobile Number (10 digits) *'}
              </label>
              <div className="input-with-tag">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98XXXXXXXX"
                  value={farmer.phoneNumber}
                  onInput={(e) => handleFieldChange('phoneNumber', (e.target as HTMLInputElement).value)}
                  className={`form-input ${errors.phoneNumber ? 'input-error' : ''}`}
                />
                <span className="inner-tag">
                  <CheckCircle2 size={12} /> {language === 'hi' ? 'सिम्युलेटेड OTP' : 'Mock OTP'}
                </span>
              </div>
              {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'hi' ? 'किसान पहचान संख्या / Kisan ID (वैकल्पिक)' : 'Kisan ID / Masked Aadhaar (Optional)'}
            </label>
            <div className="input-with-tag">
              <input
                type="text"
                placeholder="KSN-2026-XXXX-XXXX"
                value={farmer.kisanId}
                onInput={(e) => handleFieldChange('kisanId', (e.target as HTMLInputElement).value)}
                className="form-input font-mono"
              />
              <SimulatedBadge label="Mock PM-KISAN ID" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Land Location Details */}
        <div className="form-sub-block">
          <div className="sub-block-title">
            <MapPin size={18} />
            <span>{language === 'hi' ? '2. भूमि व स्थान विवरण' : '2. Land & Location'}</span>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'राज्य (State) *' : 'State *'}</label>
              <select
                value={farmer.state}
                onChange={(e) => handleFieldChange('state', (e.target as HTMLSelectElement).value)}
                className="form-input form-select"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'जिला (District) *' : 'District *'}</label>
              <input
                type="text"
                placeholder={language === 'hi' ? 'उदा. सीहोर / भीलवाड़ा' : 'e.g. Sehore / Bhilwara'}
                value={farmer.district}
                onInput={(e) => handleFieldChange('district', (e.target as HTMLInputElement).value)}
                className={`form-input ${errors.district ? 'input-error' : ''}`}
              />
              {errors.district && <span className="error-text">{errors.district}</span>}
            </div>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'तहसील / ब्लॉक (Tehsil / Block)' : 'Block / Tehsil'}</label>
              <input
                type="text"
                placeholder={language === 'hi' ? 'उदा. आष्टा' : 'e.g. Ashta'}
                value={farmer.block}
                onInput={(e) => handleFieldChange('block', (e.target as HTMLInputElement).value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'गाँव / मौजा (Village) *' : 'Village *'}</label>
              <input
                type="text"
                placeholder={language === 'hi' ? 'उदा. कोठरी' : 'e.g. Kothri'}
                value={farmer.village}
                onInput={(e) => handleFieldChange('village', (e.target as HTMLInputElement).value)}
                className={`form-input ${errors.village ? 'input-error' : ''}`}
              />
              {errors.village && <span className="error-text">{errors.village}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {language === 'hi' ? 'खसरा / भू-नक्शा सर्वे नंबर *' : 'Khasra / Survey Number *'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'उदा. 142/2 या 88' : 'e.g. 142/2 or Plot 88'}
              value={farmer.khasraNumber}
              onInput={(e) => handleFieldChange('khasraNumber', (e.target as HTMLInputElement).value)}
              className={`form-input ${errors.khasraNumber ? 'input-error' : ''}`}
            />
            {errors.khasraNumber && <span className="error-text">{errors.khasraNumber}</span>}
          </div>
        </div>

        {/* SECTION 3: Crop Details */}
        <div className="form-sub-block">
          <div className="sub-block-title">
            <Landmark size={18} />
            <span>{language === 'hi' ? '3. फसल विवरण' : '3. Affected Crop Details'}</span>
          </div>

          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'फसल का नाम *' : 'Crop Name *'}</label>
              <select
                value={farmer.cropName}
                onChange={(e) => handleFieldChange('cropName', (e.target as HTMLSelectElement).value)}
                className="form-input form-select"
              >
                {COMMON_CROPS.map((c) => (
                  <option key={c.value} value={c.value}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'फसल मौसम (Season)' : 'Season'}</label>
              <select
                value={farmer.cropSeason}
                onChange={(e) => handleFieldChange('cropSeason', (e.target as HTMLSelectElement).value as any)}
                className="form-input form-select"
              >
                <option value="Kharif">Kharif (खरीफ - वर्षा ऋतु)</option>
                <option value="Rabi">Rabi (रबी - शीत ऋतु)</option>
                <option value="Zaid">Zaid (जायद - ग्रीष्म ऋतु)</option>
              </select>
            </div>
          </div>

          <div className="grid-3-col">
            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'बुवाई की तारीख' : 'Sowing Date'}</label>
              <input
                type="date"
                value={farmer.sowingDate}
                onInput={(e) => handleFieldChange('sowingDate', (e.target as HTMLInputElement).value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'कुल रकबा (एकड़)' : 'Total Farm Area (Acres)'}</label>
              <input
                type="number"
                step="0.1"
                placeholder="4.0"
                value={farmer.totalArea}
                onInput={(e) => handleFieldChange('totalArea', (e.target as HTMLInputElement).value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'hi' ? 'क्षतिग्रस्त रकबा (एकड़) *' : 'Affected Area (Acres) *'}</label>
              <input
                type="number"
                step="0.1"
                placeholder="3.0"
                value={farmer.affectedArea}
                onInput={(e) => handleFieldChange('affectedArea', (e.target as HTMLInputElement).value)}
                className={`form-input ${errors.affectedArea ? 'input-error' : ''}`}
              />
              {errors.affectedArea && <span className="error-text">{errors.affectedArea}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card-actions flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={18} />
          <span>{language === 'hi' ? 'पीछे (सहमति)' : 'Back to Consent'}</span>
        </button>

        <div className="flex-row gap-2 ml-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="btn btn-outline"
            title="Save as local draft"
          >
            <Save size={18} />
            <span>{language === 'hi' ? 'ड्राफ्ट सहेजें' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={validateAndProceed}
            className="btn btn-primary"
          >
            <span>{language === 'hi' ? 'आगे: नुकसान का प्रकार' : 'Next: Crop Damage'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
