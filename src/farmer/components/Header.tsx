import { Sprout, FolderArchive, WifiOff, Volume2 } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';
import { Language } from '../types/damageReport';
import { playClick } from '@shared/sound';

interface HeaderProps {
  draftCount: number;
  submittedCount: number;
  onOpenDrafts: () => void;
  onNewReport: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
}

export function Header({
  draftCount,
  submittedCount,
  onOpenDrafts,
  onNewReport,
  language,
  onSelectLanguage
}: HeaderProps) {
  return (
    <header className="app-header">
      {/* Tricolor Government Portal Top Stripe */}
      <div className="gov-stripe" />
      
      <div className="header-container">
        <div className="brand-row">
          <div className="brand-logo" onClick={onNewReport} role="button" tabIndex={0}>
            <div className="logo-icon-wrapper">
              <Sprout className="logo-icon" size={26} />
            </div>
            <div className="brand-titles">
              <div className="brand-main">
                <span className="hindi-title">
                  {language === 'pa' ? 'ਆਪਦਾ ਸੇਤੂ' : 'आपदा सेतु'}
                </span>
                <span className="eng-title">AapdaSetu</span>
              </div>
              <p className="brand-subtitle">
                {language === 'pa'
                  ? 'ਕਿਸਾਨ ਫਸਲ ਨੁਕਸਾਨ ਰਾਹਤ ਪੋਰਟਲ (ਪੰਜਾਬ)'
                  : language === 'hi' 
                  ? 'किसान फसल क्षति रिपोर्टिंग प्रणाली' 
                  : 'Farmer Crop Damage Relief Portal'}
              </p>
            </div>
          </div>

          <div className="header-actions">
            {/* 3-Language Selector */}
            <div className="lang-pill-group" style={{ display: 'flex', background: '#f1f5f9', borderRadius: '999px', padding: '2px', border: '1px solid #cbd5e1' }}>
              <button
                type="button"
                onClick={() => { playClick(); onSelectLanguage('pa'); }}
                style={{
                  background: language === 'pa' ? '#15803d' : 'transparent',
                  color: language === 'pa' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                ਪੰਜਾਬੀ
              </button>
              <button
                type="button"
                onClick={() => { playClick(); onSelectLanguage('hi'); }}
                style={{
                  background: language === 'hi' ? '#15803d' : 'transparent',
                  color: language === 'hi' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => { playClick(); onSelectLanguage('en'); }}
                style={{
                  background: language === 'en' ? '#15803d' : 'transparent',
                  color: language === 'en' ? '#ffffff' : '#334155',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              className="drafts-nav-btn"
              onClick={onOpenDrafts}
              title="View saved drafts and local reports"
            >
              <FolderArchive size={18} />
              <span className="drafts-label">
                {language === 'pa' ? 'ਮੇਰੇ ਰਿਕਾਰਡ' : language === 'hi' ? 'सहेजे गए रिकॉर्ड' : 'My Records'}
              </span>
              <span className="badge-pill" title={`${draftCount} Drafts, ${submittedCount} Reports saved on this device`}>
                {draftCount + submittedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Offline & Prototype Notice Bar */}
        <div className="system-status-bar">
          <div className="status-item offline-indicator">
            <WifiOff size={14} />
            <span>
              {language === 'pa'
                ? 'ਆਫਲਾਈਨ ਮੋਡ ਸਰਗਰਮ (ਸਥਾਨਕ ਸਟੋਰੇਜ)'
                : language === 'hi' 
                ? 'ऑफलाइन मोड सक्रिय (लोकल स्टोरेज)' 
                : 'Offline-Ready (LocalStorage Active)'}
            </span>
          </div>

          <SimulatedBadge label="Prototype Demo | No Backend Required" />
        </div>
      </div>
    </header>
  );
}
