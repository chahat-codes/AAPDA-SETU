import { useState, useEffect } from 'preact/hooks';
import { Shield, Volume2, VolumeX, AlertCircle, FileCheck } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';
import { Language } from '../types/damageReport';
import { speakText, stopSpeaking } from '@shared/voice';

interface ConsentScreenProps {
  consentGiven: boolean;
  onConsentChange: (granted: boolean) => void;
  onProceed: () => void;
  language: Language;
}

export function ConsentScreen({
  consentGiven,
  onConsentChange,
  onProceed,
  language
}: ConsentScreenProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const toggleAudioGuide = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToSpeak =
        language === 'pa'
          ? 'ਆਪਦਾ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਇਹ ਐਪ ਤੁਹਾਡੀ ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦੇ ਵੇਰਵੇ ਅਤੇ ਤੁਹਾਡੇ ਵੱਲੋਂ ਚੁਣੀਆਂ ਫੋਟੋਆਂ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੇਗੀ। ਥਾਂ ਦੀ ਜਾਣਕਾਰੀ ਲਈ ਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਲੋੜੀਂਦੀ ਹੈ। ਰਿਪੋਰਟ ਕਿਤੇ ਭੇਜੀ ਨਹੀਂ ਜਾਂਦੀ।'
          : language === 'hi'
          ? 'आपदा सेतु में आपका स्वागत है। यह ऐप फसल नुकसान का विवरण और आपके चुने हुए फोटो इसी फोन में सहेजेगी। जगह की जानकारी के लिए फोन की अनुमति चाहिए। रिपोर्ट कहीं भेजी नहीं जाती।'
          : 'Welcome to AapdaSetu. This app saves crop damage details and the photos you choose on this device. Location is added only with device permission. The report is not sent anywhere.';

      speakText(textToSpeak, language, () => setIsPlayingAudio(false));
    }
  };

  return (
    <div className="card consent-card animate-fade-in">
      <div className="card-header justify-between">
        <div className="flex-row items-center gap-3">
          <div className="card-icon-tag bg-emerald">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="card-title">
              {language === 'pa'
                ? 'ਕਿਸਾਨ ਸੂਚਿਤ ਸਹਿਮਤੀ (Informed Consent)'
                : language === 'hi' 
                ? 'किसान सूचित सहमति (Informed Consent)' 
                : 'Farmer Informed Consent'}
            </h2>
            <p className="card-subtitle">
              {language === 'pa'
                ? 'ਫਸਲ ਨੁਕਸਾਨ ਮੁਆਵਜ਼ੇ ਲਈ ਸਬੂਤ ਰਿਕਾਰਡ ਕਰਨ ਦੀ ਸਹਿਮਤੀ'
                : language === 'hi' 
                ? 'मुआवजा दावा दर्ज करने से पूर्व अनुमति आवश्यक है' 
                : 'Mandatory declaration before capturing damage evidence'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAudioGuide}
          className={`audio-assist-btn ${isPlayingAudio ? 'active' : ''}`}
          title="Play voice guide"
        >
          {isPlayingAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span>
            {isPlayingAudio 
              ? (language === 'pa' ? 'ਰੋਕੋ' : language === 'hi' ? 'रोकें' : 'Stop')
              : (language === 'pa' ? 'ਆਵਾਜ਼ ਸੁਣੋ' : language === 'hi' ? 'आवाज़ में सुनें' : 'Listen')}
          </span>
        </button>
      </div>

      {/* Consent Declaration Text in High Legibility Box */}
      <div className="consent-declaration-box">
        <div className="declaration-statement">
          <p className="declaration-lead">
            {language === 'pa'
              ? 'ਮੈਂ ਆਪਣੀ ਮਰਜ਼ੀ ਨਾਲ ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦਾ ਵੇਰਵਾ ਅਤੇ ਮੇਰੇ ਵੱਲੋਂ ਚੁਣੀਆਂ ਖੇਤ ਦੀਆਂ ਫੋਟੋਆਂ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲਣ ਦੀ ਸਹਿਮਤੀ ਦਿੰਦਾ/ਦਿੰਦੀ ਹਾਂ। GPS ਥਾਂ ਕੇਵਲ ਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਾਲ ਜੋੜੀ ਜਾਂਦੀ ਹੈ।'
              : language === 'hi'
              ? 'मैं अपनी इच्छा से फसल नुकसान का विवरण और मेरे चुने हुए खेत के फोटो इसी फोन में सहेजने की सहमति देता/देती हूँ। GPS जगह केवल फोन की अनुमति मिलने पर जोड़ी जाती है।'
              : 'I agree to save crop damage details and the field photos I choose on this device. GPS location is added only if I allow device location access.'}
          </p>

          <ul className="consent-bullets">
            <li>
              <FileCheck size={18} className="bullet-icon text-emerald" />
              <span>
                {language === 'pa'
                  ? 'ਇਹ ਜਾਣਕਾਰੀ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਫਸਲ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਬਣਾਉਣ ਲਈ ਵਰਤੀ ਜਾਵੇਗੀ।'
                  : language === 'hi'
                  ? 'यह जानकारी इसी डिवाइस पर फसल नुकसान की रिपोर्ट बनाने के लिए इस्तेमाल होगी।'
                  : 'This information will be used to create a crop-damage report on this device.'}
              </span>
            </li>
            <li>
              <FileCheck size={18} className="bullet-icon text-emerald" />
              <span>
                {language === 'pa'
                  ? 'GPS ਥਾਂ ਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਅਤੇ ਉਪਲਬਧਤਾ ਉੱਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ। ਫੋਟੋ ਦਾ ਸਮਾਂ ਇਸ ਐਪ ਵਿੱਚ ਜੋੜਨ ਦਾ ਸਮਾਂ ਹੈ।'
                  : language === 'hi'
                  ? 'GPS जगह फोन की अनुमति और उपलब्धता पर निर्भर है। फोटो का समय इस ऐप में जोड़ने का समय है।'
                  : 'GPS depends on device permission and availability. A photo time here is when the app added it to this record.'}
              </span>
            </li>
            <li>
              <FileCheck size={18} className="bullet-icon text-emerald" />
              <span>
                {language === 'pa'
                  ? 'ਇਹ ਪ੍ਰੋਟੋਟਾਈਪ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਕਿਸੇ ਸੇਵਾ ਨੂੰ ਨਹੀਂ ਭੇਜਦਾ।'
                  : language === 'hi'
                  ? 'यह प्रोटोटाइप आपकी जानकारी किसी सेवा को नहीं भेजता।'
                  : 'This prototype does not send your information to any service.'}
              </span>
            </li>
          </ul>
        </div>

        {/* Prototype Transparency Notice */}
        <div className="consent-demo-notice">
          <AlertCircle size={16} className="text-amber flex-shrink-0" />
          <p className="text-xs">
            {language === 'pa'
              ? 'ਨੋਟ: ਇਹ ਪ੍ਰੋਟੋਟਾਈਪ ਡੈਮੋ ਹੈ। ਸਾਰਾ ਡਾਟਾ ਤੁਹਾਡੇ ਫੋਨ/ਕੰਪਿਊਟਰ ਵਿੱਚ ਹੀ ਰਹਿੰਦਾ ਹੈ।'
              : language === 'hi' 
              ? 'नोट: यह एक प्रोटोटाइप सिमुलेशन है। संपूर्ण डेटा आपके ब्राउज़र में सुरक्षित रहता है और किसी बाहरी सर्वर पर अपलोड नहीं होता।' 
              : 'Note: Prototype client simulation. Data remains strictly on your local device storage.'}
          </p>
        </div>
      </div>

      {/* Checkbox Agreement Control */}
      <div className="consent-agreement-row">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => onConsentChange((e.target as HTMLInputElement).checked)}
            className="checkbox-input"
          />
          <span className="checkbox-custom" />
          <span className="checkbox-text font-semibold">
            {language === 'pa'
              ? 'ਮੈਂ ਨਿਯਮਾਂ ਅਤੇ ਸ਼ਰਤਾਂ ਨੂੰ ਸਮਝ ਲਿਆ ਹੈ ਅਤੇ ਆਪਣੀ ਸਹਿਮਤੀ ਦਿੰਦਾ ਹਾਂ'
              : language === 'hi' 
              ? 'मैं उपरोक्त शर्तों से सहमत हूँ और स्वेच्छा से साक्ष्य संग्रह की अनुमति देता हूँ' 
              : 'I have understood the conditions and give my informed consent'}
          </span>
        </label>
      </div>

      {/* Navigation Footer */}
      <div className="card-footer-nav flex-between">
        <div className="text-xs text-muted">
          {language === 'pa' ? 'ਕਦਮ 1 / 6' : language === 'hi' ? 'चरण 1 / 6' : 'Step 1 of 6'}
        </div>

        <button
          type="button"
          disabled={!consentGiven}
          onClick={onProceed}
          className="btn btn-primary btn-large"
        >
          <span>
            {language === 'pa' ? 'ਅੱਗੇ ਵਧੋ (Farmer Details)' : language === 'hi' ? 'आगे बढ़ें (किसान विवरण)' : 'Proceed to Farmer Details'}
          </span>
        </button>
      </div>
    </div>
  );
}
