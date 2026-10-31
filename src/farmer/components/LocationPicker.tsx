import { useState, useRef, useEffect } from 'preact/hooks';
import { Navigation, Compass, Mic, MicOff, Check, AlertCircle, RefreshCw, Volume2 } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';
import { Language } from '../types/damageReport';
import { startDictation, speakText, isSpeechRecognitionSupported } from '@shared/voice';
import { playClick } from '@shared/sound';

interface LocationPickerProps {
  location: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    addressText: string;
    isSimulated?: boolean;
  };
  damageDescription: string;
  onLocationChange: (loc: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    addressText: string;
    isSimulated?: boolean;
  }) => void;
  onDescriptionChange: (desc: string) => void;
  language: Language;
}

export function LocationPicker({
  location,
  damageDescription,
  onLocationChange,
  onDescriptionChange,
  language
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');
  const [gpsMessageSuccess, setGpsMessageSuccess] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  // Stop mic recording if component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const fetchLiveGPS = () => {
    setIsLocating(true);
    setGpsMessageSuccess(false);
    setGpsMessage(
      language === 'pa'
        ? 'ਫੋਨ ਦੀ ਥਾਂ ਲਈ ਬੇਨਤੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ...'
        : language === 'hi'
        ? 'फोन की जगह की अनुमति माँगी जा रही है...'
        : 'Requesting device location...'
    );

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const acc = Number.isFinite(position.coords.accuracy) ? parseFloat(position.coords.accuracy.toFixed(1)) : null;

          onLocationChange({
            ...location,
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            isSimulated: false,
            addressText: location.addressText
          });
          setGpsMessageSuccess(true);
          setGpsMessage(
            language === 'pa'
              ? `ਫੋਨ ਦੀ ਥਾਂ ਦਰਜ ਹੋਈ${acc !== null ? `। ਅੰਦਾਜ਼ਨ ਸ਼ੁੱਧਤਾ ±${acc} ਮੀਟਰ` : ''}। ਇਹ ਨੁਕਸਾਨ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਕਰਦੀ।`
              : language === 'hi'
              ? `फोन की जगह दर्ज हुई${acc !== null ? `। अनुमानित सटीकता ±${acc} मीटर` : ''}। इससे नुकसान की पुष्टि नहीं होती।`
              : `Device location recorded${acc !== null ? `. Estimated accuracy ±${acc} m` : ''}. This does not verify crop damage.`
          );
        },
        (error) => {
          setIsLocating(false);
          setGpsMessageSuccess(false);
          console.info('Device location was not recorded:', error.message);
          const denied = error.code === error.PERMISSION_DENIED;
          setGpsMessage(language === 'pa'
            ? (denied ? 'ਥਾਂ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਤੁਸੀਂ GPS ਤੋਂ ਬਿਨਾਂ ਵੀ ਅੱਗੇ ਜਾ ਸਕਦੇ ਹੋ ਜਾਂ ਨੇੜਲਾ ਚਿੰਨ੍ਹ ਲਿਖ ਸਕਦੇ ਹੋ।' : 'ਫੋਨ ਦੀ ਥਾਂ ਨਹੀਂ ਮਿਲੀ। GPS ਤੋਂ ਬਿਨਾਂ ਵੀ ਅੱਗੇ ਜਾ ਸਕਦੇ ਹੋ ਜਾਂ ਨੇੜਲਾ ਚਿੰਨ੍ਹ ਲਿਖੋ।')
            : language === 'hi'
            ? (denied ? 'जगह की अनुमति नहीं मिली। आप GPS के बिना आगे बढ़ सकते हैं या पास का पहचान-चिह्न लिख सकते हैं।' : 'फोन की जगह नहीं मिली। GPS के बिना भी आगे बढ़ सकते हैं या पास का पहचान-चिह्न लिखें।')
            : (denied ? 'Location permission was not granted. Continue without GPS or enter a nearby landmark.' : 'Device location is unavailable. Continue without GPS or enter a nearby landmark.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setGpsMessageSuccess(false);
      setGpsMessage(language === 'pa' ? 'ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਫੋਨ ਦੀ ਥਾਂ ਉਪਲਬਧ ਨਹੀਂ। GPS ਤੋਂ ਬਿਨਾਂ ਵੀ ਅੱਗੇ ਜਾ ਸਕਦੇ ਹੋ।' : language === 'hi' ? 'इस ब्राउज़र में फोन की जगह उपलब्ध नहीं है। आप GPS के बिना आगे बढ़ सकते हैं।' : 'Device location is not available in this browser. You can continue without GPS.');
    }
  };

  const toggleVoiceRecording = () => {
    playClick();
    if (isRecordingVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecordingVoice(false);
      setVoiceStatus('');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setIsRecordingVoice(false);
      setVoiceStatus(language === 'pa' ? 'ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਨਾਲ ਲਿਖਣਾ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਵੇਰਵਾ ਹੱਥੀਂ ਲਿਖੋ।' : language === 'hi' ? 'इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है। कृपया विवरण हाथ से लिखें।' : 'Voice typing is unavailable in this browser. Please type the description.');
      return;
    }

    setIsRecordingVoice(true);
    setVoiceStatus(language === 'pa' ? 'ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ... (ਸੁਣ ਰਿਹਾ ਹੈ)' : language === 'hi' ? 'बोलिए... (सुन रहा है)' : 'Listening...');

    recognitionRef.current = startDictation(
      language,
      (recognizedText) => {
        onDescriptionChange(`${damageDescription}${damageDescription ? ' ' : ''}${recognizedText}`);
      },
      (err) => {
        setVoiceStatus(err);
        setIsRecordingVoice(false);
      },
      (hadError) => {
        setIsRecordingVoice(false);
        if (!hadError) setVoiceStatus('');
        else window.setTimeout(() => setVoiceStatus(''), 5000);
      }
    );
  };

  return (
    <div className="location-picker-component">
      {/* GPS Geo-Tagging Section */}
      <div className="gps-box">
        <div className="gps-header">
          <div className="gps-title-wrap">
            <Compass className="text-emerald" size={20} />
            <h3 className="section-title">
              {language === 'pa'
                ? 'ਫੋਨ ਦੀ ਥਾਂ ਅਤੇ ਖੇਤ ਦਾ ਪਤਾ (ਵਿਕਲਪਿਕ)'
                : language === 'hi'
                ? 'फोन की जगह और खेत का पता (वैकल्पिक)'
                : 'Device Location & Field Landmark (Optional)'}
            </h3>
          </div>
          {location.isSimulated && <SimulatedBadge label="Simulated GPS Coordinates" />}
        </div>

        <p className="section-helper">
          {language === 'pa'
            ? 'ਇਜਾਜ਼ਤ ਦਿਓ ਤਾਂ ਫੋਨ ਦੀ ਥਾਂ ਦਰਜ ਹੋਵੇਗੀ। ਨਾ ਮਿਲੇ ਤਾਂ ਨੇੜਲਾ ਪਤਾ ਲਿਖ ਸਕਦੇ ਹੋ ਜਾਂ ਇਸਨੂੰ ਖਾਲੀ ਛੱਡ ਸਕਦੇ ਹੋ।'
            : language === 'hi' 
            ? 'अनुमति देने पर फोन की जगह दर्ज होगी। न मिले तो पास का पता लिखें या इसे खाली छोड़ दें।' 
            : 'With your permission, the phone can record its location. If unavailable, enter a nearby landmark or leave it blank.'}
        </p>

        <div className="gps-display-card">
          {location.latitude !== null && location.longitude !== null ? (
            <div className="gps-coordinates-active">
              <div className="coord-chip">
                <span className="coord-label">{language === 'pa' ? 'ਅਕਸ਼ਾਂਸ਼ (Lat):' : language === 'hi' ? 'अक्षांश (Lat):' : 'Latitude:'}</span>
                <span className="coord-val font-mono">{location.latitude}</span>
              </div>
              <div className="coord-chip">
                <span className="coord-label">{language === 'pa' ? 'ਰੇਖਾਂਸ਼ (Lng):' : language === 'hi' ? 'देशांतर (Lng):' : 'Longitude:'}</span>
                <span className="coord-val font-mono">{location.longitude}</span>
              </div>
              {location.accuracy !== null && (
                <div className="coord-chip accuracy-chip">
                  <span className="coord-label">{language === 'pa' ? 'ਸ਼ੁੱਧਤਾ:' : language === 'hi' ? 'सटीकता:' : 'Accuracy:'}</span>
                  <span className="coord-val font-mono">±{location.accuracy}m</span>
                </div>
              )}
            </div>
          ) : (
            <div className="gps-empty-state">
              <AlertCircle size={22} className="text-amber" />
              <span>
                {language === 'pa'
                  ? 'ਫੋਨ ਦੀ ਥਾਂ ਹਾਲੇ ਦਰਜ ਨਹੀਂ ਹੋਈ। ਇਹ ਵਿਕਲਪਿਕ ਹੈ।'
                  : language === 'hi' 
                  ? 'फोन की जगह अभी दर्ज नहीं हुई है। यह वैकल्पिक है।' 
                  : 'No device location recorded. This is optional.'}
              </span>
            </div>
          )}

          <div className="gps-actions-row">
            <button
              type="button"
              disabled={isLocating}
              onClick={fetchLiveGPS}
              className={`btn btn-secondary ${isLocating ? 'loading' : ''}`}
            >
              {isLocating ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>{language === 'pa' ? 'ਥਾਂ ਲਈ ਬੇਨਤੀ...' : language === 'hi' ? 'जगह माँगी जा रही है...' : 'Requesting location...'}</span>
                </>
              ) : (
                <>
                  <Navigation size={18} />
                  <span>
                      {location.latitude !== null 
                      ? (language === 'pa' ? 'ਫੋਨ ਦੀ ਥਾਂ ਮੁੜ ਲਵੋ' : language === 'hi' ? 'फोन की जगह फिर लें' : 'Refresh device location')
                      : (language === 'pa' ? 'ਫੋਨ ਦੀ ਥਾਂ ਲਵੋ' : language === 'hi' ? 'फोन की जगह लें' : 'Use device location')}
                  </span>
                </>
              )}
            </button>

            {gpsMessage && (
              <span className="gps-status-msg">
                {gpsMessageSuccess ? <Check size={14} className="text-green" /> : <AlertCircle size={14} className="text-amber" />} {gpsMessage}
              </span>
            )}
          </div>
        </div>

        {/* Landmark / Address Field */}
        <div className="form-group mt-3">
          <label className="form-label" htmlFor="field-landmark">
            {language === 'pa'
              ? 'ਖੇਤ ਦੇ ਨੇੜਲਾ ਕੋਈ ਚਿੰਨ੍ਹ / ਪੁਲੀ / ਰਸਤਾ'
              : language === 'hi'
              ? 'नजदीकी मील का पत्थर / रास्ता / पहचान'
              : 'Field Landmark / Road / Location Description'}
          </label>
          <input
            id="field-landmark"
            type="text"
            placeholder={
              language === 'pa'
                ? 'ਉਦਾਹਰਨ: ਨਹਿਰੀ ਪੁਲੀ ਨੇੜੇ, ਟਿਊਬਵੈਲ ਕੋਠੀ'
                : language === 'hi'
                ? 'उदा. नहर की पुलिया के पास, पुराना कुआं'
                : 'e.g. Near canal bridge, next to tube-well'
            }
            value={location.addressText}
            onInput={(e) => onLocationChange({ ...location, addressText: (e.target as HTMLInputElement).value })}
            className="form-input"
          />
        </div>
      </div>

      {/* Description Field with Punjabi / Hindi / English Voice Dictation */}
      <div className="description-box mt-4">
        <div className="desc-header flex-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label mb-0" htmlFor="damage-description" style={{ fontWeight: 700 }}>
            {language === 'pa'
              ? 'ਨੁਕਸਾਨ ਦਾ ਵੇਰਵਾ (ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ) *'
              : language === 'hi'
              ? 'नुकसान का विस्तृत विवरण *'
              : 'Detailed Loss Description *'}
          </label>
          
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`btn-voice-pill ${isRecordingVoice ? 'recording' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: isRecordingVoice ? '#ef4444' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            title="Dictate with voice"
          >
            {isRecordingVoice ? (
              <>
                <MicOff size={16} />
                <span>{language === 'pa' ? 'ਬੋਲਣਾ ਰੋਕੋ' : language === 'hi' ? 'रोकें' : 'Stop'}</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>
                  {language === 'pa'
                    ? '🎤 ਪੰਜਾਬੀ ਮਾਈਕ (ਬੋਲੋ)'
                    : language === 'hi'
                    ? '🎤 बोलकर लिखें'
                    : '🎤 Dictate Voice'}
                </span>
              </>
            )}
          </button>
        </div>

        {voiceStatus && (
          <div style={{ fontSize: '0.78rem', color: isRecordingVoice ? '#22c55e' : '#f59e0b', marginBottom: '6px', fontWeight: 600 }}>
            {voiceStatus}
          </div>
        )}

        <textarea
          id="damage-description"
          rows={3}
          required
          aria-required="true"
          placeholder={
            language === 'pa'
              ? 'ਫਸਲ ਦਾ ਕੀ ਨੁਕਸਾਨ ਹੋਇਆ? ਪਾਣੀ ਦਾ ਪੱਧਰ, ਹੜ੍ਹ, ਜਾਂ ਸੁੰਡੀ ਦਾ ਹਮਲਾ... (ਮਾਈਕ ਦਬਾ ਕੇ ਬੋਲੋ)'
              : language === 'hi'
              ? 'फसल को क्या नुकसान हुआ? पानी कितना भरा है? कीड़े का प्रकोप... (माइक दबाकर बोल सकते हैं)'
              : 'Describe the crop failure, waterlogging depth, lodging, or pest severity... (Click mic to speak)'
          }
          value={damageDescription}
          onInput={(e) => onDescriptionChange((e.target as HTMLTextAreaElement).value)}
          className="form-textarea"
        />

        {damageDescription && (
          <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => speakText(damageDescription, language)}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Volume2 size={13} /> {language === 'pa' ? 'ਸੁਣੋ (Listen)' : 'सुनें (Listen)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
