import { useEffect, useState } from 'preact/hooks';
import { DamageReport, Language } from '../types/damageReport';
import { CheckCircle2, MessageSquare, Printer, PlusCircle, FolderArchive, Volume2, Info } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';
import { fireConfetti } from '@shared/confetti';
import { playSuccessSound } from '@shared/sound';
import { speakText, stopSpeaking } from '@shared/voice';

interface SubmissionSuccessProps {
  report: DamageReport;
  onNewReport: () => void;
  onViewDrafts: () => void;
  language: Language;
}

export function SubmissionSuccess({
  report,
  onNewReport,
  onViewDrafts,
  language
}: SubmissionSuccessProps) {
  const [isSpeakingReceipt, setIsSpeakingReceipt] = useState(false);

  useEffect(() => {
    fireConfetti();
    playSuccessSound();
    return () => {
      stopSpeaking();
    };
  }, []);

  const printReceipt = () => {
    window.print();
  };

  const handleListenReceipt = () => {
    if (isSpeakingReceipt) {
      stopSpeaking();
      setIsSpeakingReceipt(false);
      return;
    }

    setIsSpeakingReceipt(true);
    let speechText = "";
    if (language === 'pa') {
      speechText = `ਰਿਪੋਰਟ ਇਸ ਡਿਵਾਈਸ ਵਿੱਚ ਸੰਭਾਲੀ ਗਈ ਹੈ। ਇਹ ਸਰਕਾਰੀ ਜਾਂ ਬੀਮਾ ਦਫ਼ਤਰ ਨੂੰ ਨਹੀਂ ਭੇਜੀ ਗਈ। ਸਥਾਨਕ ਰੈਫਰੈਂਸ ਨੰਬਰ ${report.submissionId || 'ਏ ਐਸ 2026'} ਹੈ।`;
    } else if (language === 'hi') {
      speechText = `रिपोर्ट इसी डिवाइस में सहेजी गई है। यह सरकारी या बीमा कार्यालय को नहीं भेजी गई। स्थानीय संदर्भ संख्या ${report.submissionId || 'ए एस 2026'} है।`;
    } else {
      speechText = `The report is saved on this device. It has not been sent to a government or insurance office. Local reference ID: ${report.submissionId || 'AS-2026'}.`;
    }

    speakText(speechText, language, () => {
      setIsSpeakingReceipt(false);
    });
  };

  return (
    <div className="card success-card animate-scale-up">
      <div className="success-banner">
        <div className="success-icon-ring">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h2 className="success-title">
          {language === 'pa'
            ? 'ਰਿਪੋਰਟ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੀ ਗਈ'
            : language === 'hi' 
            ? 'रिपोर्ट इसी फ़ोन में सहेजी गई' 
            : 'Report saved on this device'}
        </h2>
        <p className="success-subtitle">
          {language === 'pa'
            ? 'ਇਹ ਰਿਪੋਰਟ ਕਿਸੇ ਸਰਕਾਰੀ ਦਫ਼ਤਰ ਜਾਂ ਬੀਮਾ ਕੰਪਨੀ ਨੂੰ ਨਹੀਂ ਭੇਜੀ ਗਈ।'
            : language === 'hi' 
            ? 'यह रिपोर्ट किसी सरकारी कार्यालय या बीमा कंपनी को नहीं भेजी गई।' 
            : 'This local demo has not sent the report to an office or insurer.'}
        </p>

        {/* Audio Listen Pill */}
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleListenReceipt}
            style={{
              background: isSpeakingReceipt ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
              color: isSpeakingReceipt ? '#15803d' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={16} />
            <span>
              {isSpeakingReceipt
                ? '⏹️ Stop Speaking'
                : language === 'pa'
                ? '🔊 ਪੰਜਾਬੀ ਵਿੱਚ ਰਸੀਦ ਸੁਣੋ'
                : language === 'hi'
                ? '🔊 रसीद सुनें'
                : '🔊 Listen to Confirmation'}
            </span>
          </button>
        </div>
      </div>

      <div className="receipt-box-main">
        <div className="receipt-id-row">
          <div>
            <span className="text-xs text-muted block uppercase tracking-wide">
              {language === 'pa' ? 'ਸਥਾਨਕ ਰੈਫਰੈਂਸ ਨੰਬਰ' : language === 'hi' ? 'स्थानीय संदर्भ संख्या' : 'Local Reference ID'}
            </span>
            <div className="claim-id-text font-mono font-bold text-emerald">
              {report.submissionId || 'AS-2026-IND-DEMO'}
            </div>
          </div>

        </div>

        {/* Simulated SMS Alert Card */}
        <div className="sms-simulation-box">
          <div className="sms-header flex-row items-center gap-2">
            <MessageSquare size={16} className="text-blue" />
            <span className="text-xs font-semibold">
              {language === 'pa'
                ? 'ਸਥਾਨਕ ਡੈਮੋ ਸੁਨੇਹਾ · ਭੇਜਿਆ ਨਹੀਂ ਗਿਆ'
                : language === 'hi' 
                ? 'स्थानीय डेमो संदेश · भेजा नहीं गया' 
                : 'Local demo message · not sent'}
            </span>
            <SimulatedBadge label="Mock SMS" />
          </div>
          <div className="sms-body">
            {language === 'pa'
              ? 'ਆਪਦਾ ਸੇਤੂ ਡੈਮੋ: ਰਿਪੋਰਟ ਸਿਰਫ਼ ਇਸ ਡਿਵਾਈਸ ਵਿੱਚ ਸੰਭਾਲੀ ਗਈ ਹੈ। ਕਿਸੇ ਦਫ਼ਤਰ, ਬੀਮਾ ਕੰਪਨੀ ਜਾਂ ਸਰਵੇਖਣ ਟੀਮ ਨੂੰ ਨਹੀਂ ਭੇਜੀ ਗਈ।'
              : language === 'hi'
              ? 'आपदा सेतु डेमो: रिपोर्ट केवल इसी डिवाइस में सहेजी गई है। किसी कार्यालय, बीमा कंपनी या सर्वेक्षण टीम को नहीं भेजी गई।'
              : 'AapdaSetu demo: This report is saved on this device only. It has not been sent to an office, insurer, or survey team.'}
          </div>
        </div>

        {/* Local incident summary */}
        <div className="success-summary-grid">
          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਕਿਸਾਨ ਦਾ ਨਾਮ' : language === 'hi' ? 'किसान का नाम' : 'Farmer Name'}:</span>
            <span className="value font-semibold">{report.farmer.fullName}</span>
          </div>

          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਮੋਬਾਈਲ ਨੰਬਰ' : language === 'hi' ? 'मोबाइल नंबर' : 'Phone'}:</span>
            <span className="value font-mono">{report.farmer.phoneNumber}</span>
          </div>

          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਪਿੰਡ / ਖਸਰਾ' : language === 'hi' ? 'खसरा / गाँव' : 'Plot / Village'}:</span>
            <span className="value">{report.farmer.khasraNumber}, {report.farmer.village}</span>
          </div>

          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਆਫ਼ਤ / ਨੁਕਸਾਨ' : language === 'hi' ? 'आपदा / नुकसान' : 'Calamity / Loss'}:</span>
            <span className="value text-red font-bold">{report.damageType} ({report.lossPercentage}%)</span>
          </div>

          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਫੋਟੋਆਂ' : language === 'hi' ? 'तस्वीरें' : 'Photos'}:</span>
            <span className="value">{report.photos.length} {language === 'pa' ? 'ਜੋੜੀਆਂ' : language === 'hi' ? 'जोड़ी गईं' : 'added'}</span>
          </div>

          <div className="summary-field">
            <span className="label">{language === 'pa' ? 'ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲਣ ਦਾ ਸਮਾਂ' : language === 'hi' ? 'इस फ़ोन में सहेजने का समय' : 'Saved on this device at'}:</span>
            <span className="value text-xs font-mono">
              {new Date(report.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        <div className="evidence-provenance-note"><Info size={16} /><span>{language === 'pa' ? 'ਇਸ ਸਥਾਨਕ ਰਿਕਾਰਡ ਵਿੱਚ ਆਪਣੇ ਵੱਲੋਂ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਹੈ। ਇਸ ਨੂੰ ਕਿਸੇ ਅਧਿਕਾਰੀ ਨੇ ਜਾਂਚਿਆ ਜਾਂ ਪ੍ਰਮਾਣਿਤ ਨਹੀਂ ਕੀਤਾ।' : language === 'hi' ? 'इस स्थानीय रिकॉर्ड में आपके दिए विवरण हैं। इसे किसी अधिकारी ने जाँचा या सत्यापित नहीं किया है।' : 'This local record contains the information you provided. No authority has reviewed or verified it.'}</span></div>
      </div>

      {/* Action Buttons */}
      <div className="success-actions-row">
        <button
          type="button"
          onClick={printReceipt}
          className="btn btn-outline flex-1"
        >
          <Printer size={18} />
          <span>{language === 'pa' ? 'ਸਥਾਨਕ ਰਿਕਾਰਡ ਪ੍ਰਿੰਟ ਕਰੋ' : language === 'hi' ? 'स्थानीय रिकॉर्ड प्रिंट करें' : 'Print Local Record'}</span>
        </button>

        <button
          type="button"
          onClick={onNewReport}
          className="btn btn-primary flex-1"
        >
          <PlusCircle size={18} />
          <span>{language === 'pa' ? 'ਨਵੀਂ ਰਿਪੋਰਟ ਬਣਾਓ' : language === 'hi' ? 'नई रिपोर्ट बनाएँ' : 'Start New Report'}</span>
        </button>

        <button
          type="button"
          onClick={onViewDrafts}
          className="btn btn-secondary"
        >
          <FolderArchive size={18} />
          <span>{language === 'pa' ? 'ਮੇਰੇ ਰਿਕਾਰਡ' : language === 'hi' ? 'सहेजे गए रिकॉर्ड' : 'View Records'}</span>
        </button>
      </div>
    </div>
  );
}
