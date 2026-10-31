import { useState, useRef, useEffect } from 'preact/hooks';
import { DamageType, EvidencePhoto, FarmerDetails, Language } from '../types/damageReport';
import { LocationPicker } from './LocationPicker';
import { Camera, Upload, Trash2, ImagePlus, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Save, Video, X } from 'lucide-preact';
import { generateSampleFieldPhoto } from '../data/mockData';

interface CameraEvidenceProps {
  photos: EvidencePhoto[];
  location: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    addressText: string;
    isSimulated?: boolean;
  };
  damageDescription: string;
  farmer: FarmerDetails;
  damageType: DamageType;
  customDamageType?: string;
  incidentDate: string;
  onPhotosChange: (photos: EvidencePhoto[]) => void;
  onLocationChange: (loc: any) => void;
  onDescriptionChange: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  language: Language;
}

export function CameraEvidence({
  photos,
  location,
  damageDescription,
  farmer,
  damageType,
  customDamageType,
  incidentDate,
  onPhotosChange,
  onLocationChange,
  onDescriptionChange,
  onNext,
  onBack,
  onSaveDraft,
  language
}: CameraEvidenceProps) {
  const [activeCategory, setActiveCategory] = useState<'Overview' | 'Close-up' | 'Landmark'>('Overview');
  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const realPhotoCount = photos.filter((photo) => photo.source !== 'simulated').length;
  const evidenceStepCount = [Boolean(damageType !== 'Other' || customDamageType?.trim()), Boolean(incidentDate), Boolean(farmer.cropName), Boolean(farmer.affectedArea), Boolean(damageDescription.trim()), realPhotoCount > 0].filter(Boolean).length;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop video stream when modal closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    void videoRef.current.play().catch(() => setCameraError('The camera opened, but video playback was blocked. Close this window and try again.'));
  }, [cameraStream]);

  // Open Live Camera
  const startLiveCamera = async () => {
    setCameraError(null);
    setShowLiveCameraModal(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError('Webcam API is unavailable in this environment.');
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access denied or no camera device found. You can use Simulated Snapshot or File Upload.');
    }
  };

  const closeLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowLiveCameraModal(false);
  };

  // Capture from live stream
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      addPhotoEntry(dataUrl, 'camera');
      closeLiveCamera();
    }
  };

  // Shutter simulation fallback for desktops / sandboxes
  const captureSimulatedSnapshot = () => {
    const categoryTitle = activeCategory === 'Overview' 
      ? 'Overview of Inundated Crop Field' 
      : activeCategory === 'Close-up' 
      ? 'Damaged Leaves & Stem Close-up' 
      : 'Plot Boundary & Pillar Landmark';
    
    const colors = {
      'Overview': '#15803d',
      'Close-up': '#b45309',
      'Landmark': '#0369a1'
    };

    const simulatedDataUrl = generateSampleFieldPhoto(categoryTitle, colors[activeCategory]);
    addPhotoEntry(simulatedDataUrl, 'simulated');
    closeLiveCamera();
  };

  // File Upload / Native Camera Capture
  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addPhotoEntry(reader.result, 'upload');
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    target.value = '';
  };

  const addPhotoEntry = (dataUrl: string, source: NonNullable<EvidencePhoto['source']>) => {
    const newPhoto: EvidencePhoto = {
      id: 'photo-' + Date.now(),
      dataUrl,
      timestamp: new Date().toISOString(),
      source,
      category: activeCategory,
      gpsLocation: location.latitude !== null && location.longitude !== null ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? undefined
      } : undefined
    };

    onPhotosChange([...photos, newPhoto]);
    setValidationError('');
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(p => p.id !== photoId));
  };

  const validateAndProceed = () => {
    if (!photos.some((photo) => photo.source !== 'simulated')) {
      setValidationError(
        language === 'pa'
          ? 'ਅੱਗੇ ਜਾਣ ਲਈ ਕੈਮਰੇ ਨਾਲ ਖਿੱਚੀ ਜਾਂ ਗੈਲਰੀ ਤੋਂ ਅਸਲੀ ਖੇਤ ਦੀ ਫੋਟੋ ਜੋੜੋ। ਡੈਮੋ ਫੋਟੋ ਸਬੂਤ ਨਹੀਂ ਹੈ।'
          : language === 'hi'
          ? 'आगे बढ़ने के लिए कैमरे या गैलरी से खेत की असली तस्वीर जोड़ें। डेमो तस्वीर साक्ष्य नहीं है।'
          : 'Add a real field photo from the camera or gallery to continue. Demo images are not evidence.'
      );
      return;
    }
    if (!damageDescription.trim()) {
      setValidationError(
        language === 'pa'
          ? 'ਹੇਠਾਂ ਨੁਕਸਾਨ ਦਾ ਵੇਰਵਾ ਲਿਖੋ ਜਾਂ ਮਾਈਕ ਨਾਲ ਬੋਲੋ।'
          : language === 'hi'
          ? 'नीचे नुकसान का विवरण लिखें या माइक से बोलें।'
          : 'Add a damage description below or dictate it with the microphone.'
      );
      return;
    }
    onNext();
  };

  return (
    <div className="card camera-evidence-card">
      <div className="card-header">
        <div className="card-icon-tag bg-emerald">
          <Camera size={24} />
        </div>
        <div>
          <h2 className="card-title">
            {language === 'pa' ? 'ਖੇਤ ਦੀਆਂ ਫੋਟੋਆਂ ਅਤੇ ਥਾਂ' : language === 'hi' ? 'खेत की तस्वीरें और जगह' : 'Field Photos & Location'}
          </h2>
          <p className="card-subtitle">
            {language === 'hi' 
              ? 'क्षति की तस्वीरें जोड़ें। समय और GPS तभी जोड़े जाएँगे जब उपलब्ध हों।' 
              : language === 'pa' ? 'ਨੁਕਸਾਨ ਦੀਆਂ ਫੋਟੋਆਂ ਜੋੜੋ। ਸਮਾਂ ਅਤੇ GPS ਉਪਲਬਧ ਹੋਣ ਤੇ ਹੀ ਦਰਜ ਹੋਣਗੇ।' : 'Add photos of the damage. Time and GPS are recorded only when available.'}
          </p>
        </div>
      </div>

      <div className="evidence-step-progress">
        <div className="flex-between"><strong>{language === 'pa' ? 'ਰਿਪੋਰਟ ਦੀ ਤਿਆਰੀ' : language === 'hi' ? 'रिपोर्ट की तैयारी' : 'Report completeness'}</strong><span>{evidenceStepCount} / 6</span></div>
        <div className="evidence-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={evidenceStepCount} aria-label={`${evidenceStepCount} of 6 report details present`}><span style={{ width: `${evidenceStepCount / 6 * 100}%` }} /></div>
        <small>{language === 'pa' ? 'ਕਾਰਨ, ਤਾਰੀਖ, ਫਸਲ, ਰਕਬਾ, ਵੇਰਵਾ ਅਤੇ ਇੱਕ ਅਸਲੀ ਫੋਟੋ। GPS ਵਿਕਲਪਿਕ ਹੈ।' : language === 'hi' ? 'कारण, तारीख, फसल, रकबा, विवरण और एक असली तस्वीर। GPS वैकल्पिक है।' : 'Cause, date, crop, area, description and one real photo. GPS is optional.'}</small>
      </div>

      {/* Photo Category Selector */}
      <div className="photo-type-selector">
        <label className="form-label">
          {language === 'hi' ? 'फोटो का प्रकार चुनें:' : 'Select Photo Angle / Purpose:'}
        </label>
        <div className="category-pill-group">
          {(['Overview', 'Close-up', 'Landmark'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`cat-pill-btn ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat === 'Overview' && (language === 'hi' ? '1. पूरा खेत दृश्य (Overview)' : '1. Field Overview')}
              {cat === 'Close-up' && (language === 'hi' ? '2. फसल निकट दृश्य (Close-up)' : '2. Crop Close-up')}
              {cat === 'Landmark' && (language === 'hi' ? '3. खेत सीमा/पहचान (Landmark)' : '3. Boundary / Landmark')}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Buttons: Camera & Upload */}
      <div className="capture-action-grid">
        <button
          type="button"
          onClick={startLiveCamera}
          className="capture-btn primary-capture-btn"
        >
          <div className="capture-icon-bg">
            <Camera size={28} />
          </div>
          <div className="capture-text-wrap">
            <span className="main-text">
              {language === 'hi' ? 'कैमरा खोलें (Live Camera)' : 'Open Camera / Capture'}
            </span>
            <span className="sub-text">
              {language === 'hi' ? 'लाइव फोटो खींचें' : 'Take live field snapshot'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="capture-btn secondary-capture-btn"
        >
          <div className="capture-icon-bg">
            <Upload size={28} />
          </div>
          <div className="capture-text-wrap">
            <span className="main-text">
              {language === 'hi' ? 'गैलरी / फाइल से चुनें' : 'Upload From Gallery'}
            </span>
            <span className="sub-text">
              {language === 'hi' ? 'पहले से ली गई फोटो अपलोड करें' : 'Browse saved farm images'}
            </span>
          </div>
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="error-banner animate-fade-in">
          <AlertTriangle size={18} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Gallery of Captured Photos */}
      <div className="photo-gallery-section">
        <div className="gallery-header flex-between">
          <span className="section-title">
            {language === 'hi' ? `संलग्न तस्वीरें (${photos.length})` : language === 'pa' ? `ਜੁੜੀਆਂ ਫੋਟੋਆਂ (${photos.length})` : `Photos added (${photos.length})`}
          </span>
          {photos.length > 0 && (
            <span className="text-xs text-green flex-row items-center gap-1 font-semibold">
              <CheckCircle size={14} /> {realPhotoCount} {language === 'pa' ? 'ਅਸਲੀ ਫੋਟੋਆਂ' : language === 'hi' ? 'असली तस्वीरें' : 'real photos'}
            </span>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="empty-photo-state">
            <ImagePlus size={36} className="text-muted" />
            <p>
              {language === 'hi' 
                ? 'अभी तक कोई फोटो नहीं ली गई है। कृपया ऊपर दिए बटन से कम से कम एक फोटो जोड़ें।' 
                : 'No photos captured yet. Tap "Open Camera" or "Upload From Gallery" to add.'}
            </p>
          </div>
        ) : (
          <div className="photos-grid">
            {photos.map((item, index) => (
              <div key={item.id} className={`photo-card-item ${item.source === 'simulated' ? 'photo-card-simulated' : ''}`}>
                <div className="photo-img-wrap">
                  <img src={item.dataUrl} alt={`Field Evidence ${index + 1}`} className="evidence-img" />
                  
                  {/* Geo-tag & Timestamp Watermark Overlay */}
                  <div className="photo-watermark">
                    <div className="watermark-tag">{item.source === 'simulated' ? 'DEMO PHOTO' : item.category}</div>
                    <div className="watermark-gps">
                      {item.gpsLocation ? `📍 ${item.gpsLocation.latitude.toFixed(4)}, ${item.gpsLocation.longitude.toFixed(4)}` : location.latitude !== null && location.longitude !== null ? `📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '📍 No GPS location'}
                    </div>
                    <div className="watermark-time">
                      ⏱ {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.source === 'simulated' ? 'Demo' : item.source ? 'Added' : 'Saved time'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePhoto(item.id)}
                    className="delete-photo-btn"
                    title="Remove Photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embed Location & Loss Description component */}
      <LocationPicker
        location={location}
        damageDescription={damageDescription}
        onLocationChange={onLocationChange}
        onDescriptionChange={onDescriptionChange}
        language={language}
      />

      {/* Live Camera Modal */}
      {showLiveCameraModal && (
        <div className="camera-modal-backdrop">
          <div className="camera-modal-content">
            <div className="modal-top-bar">
              <div className="flex-row items-center gap-2">
                <Video size={18} />
                <span className="font-semibold">
                  {language === 'hi' ? 'खेत कैमरा कैप्चर' : 'Live Field Camera'} ({activeCategory})
                </span>
              </div>
              <button type="button" onClick={closeLiveCamera} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="camera-viewport">
              {cameraError ? (
                <div className="camera-error-view">
                  <AlertTriangle size={32} className="text-amber mb-2" />
                  <p className="text-sm text-center mb-4">{cameraError}</p>
                  <p className="text-xs text-muted mb-4">
                    {language === 'hi' 
                      ? 'डेस्कटॉप या बिना वेबकैम के परीक्षण के लिए सिमुलेटेड फोटो का उपयोग करें:' 
                      : 'You can generate a realistic simulated field snapshot for testing:'}
                  </p>
                  <button
                    type="button"
                    onClick={captureSimulatedSnapshot}
                    className="btn btn-primary"
                  >
                    📸 {language === 'hi' ? 'सिमुलेटेड फोटो कैप्चर करें' : 'Generate Simulated Snapshot'}
                  </button>
                </div>
              ) : (
                <div className="video-container">
                  <video ref={videoRef} autoPlay playsInline muted className="live-video" />
                  
                  {/* Camera reticle / crosshairs */}
                  <div className="camera-grid-overlay">
                    <div className="reticle-box" />
                    <div className="live-hud-tag">
                      <span>AAPDASETU GEO-CAM</span>
                      <span>{location.latitude !== null && location.longitude !== null ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}${location.isSimulated ? ' · DEMO' : ''}` : 'Location not recorded'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="camera-modal-actions">
              {!cameraError ? (
                <div className="flex-row justify-center gap-4 w-full">
                  <button
                    type="button"
                    onClick={captureFromVideo}
                    className="shutter-btn"
                    title="Click Shutter"
                  >
                    <div className="inner-shutter" />
                  </button>

                  <button
                    type="button"
                    onClick={captureSimulatedSnapshot}
                    className="btn btn-secondary btn-sm"
                  >
                    ⚡ {language === 'hi' ? 'सिमुलेटेड टेस्ट फोटो' : 'Simulated Snapshot'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="btn btn-secondary w-full"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="card-actions flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={18} />
          <span>{language === 'hi' ? 'पीछे (नुकसान)' : 'Back to Damage'}</span>
        </button>

        <div className="flex-row gap-2 ml-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="btn btn-outline"
          >
            <Save size={18} />
            <span>{language === 'hi' ? 'ड्राफ्ट सहेजें' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={validateAndProceed}
            className="btn btn-primary"
          >
            <span>{language === 'hi' ? 'आगे: समीक्षा व साक्ष्य पूर्वावलोकन' : 'Next: Preview & Review'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
