import { useState } from 'preact/hooks';
import { DamageType, Language } from '../types/damageReport';
import { CloudRain, Sun, CloudLightning, Bug, HelpCircle, AlertTriangle, ArrowRight, ArrowLeft, Save } from 'lucide-preact';

interface DamageSelectionProps {
  damageType: DamageType;
  customDamageType?: string;
  lossPercentage: number;
  incidentDate: string;
  onChange: (fields: {
    damageType: DamageType;
    customDamageType?: string;
    lossPercentage: number;
    incidentDate: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  language: Language;
}

interface DamageOption {
  type: DamageType;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: typeof CloudRain;
  colorClass: string;
}

const DAMAGE_OPTIONS: DamageOption[] = [
  {
    type: 'Flood',
    titleEn: 'Flood / Waterlogging',
    titleHi: 'बाढ़ / जलभराव',
    descEn: 'Submergence, continuous excessive rain, canal overflow',
    descHi: 'अतिवृष्टि, खेत में पानी भर जाना या नहर टूटना',
    icon: CloudRain,
    colorClass: 'flood-card'
  },
  {
    type: 'Drought',
    titleEn: 'Drought / Dry Spell',
    titleHi: 'सूखा / वर्षा की कमी',
    descEn: 'Prolonged dry spell, failure of monsoons, withered crop',
    descHi: 'लंबे समय तक बारिश न होना, फसल का सूखना',
    icon: Sun,
    colorClass: 'drought-card'
  },
  {
    type: 'Hailstorm',
    titleEn: 'Hailstorm / Gola',
    titleHi: 'ओलावृष्टि / भारी ओले',
    descEn: 'Severe hail impact shattering stems, leaves & flowers',
    descHi: 'ओले गिरने से पौधों की टहनी व दाने टूटना',
    icon: CloudLightning,
    colorClass: 'hail-card'
  },
  {
    type: 'Pest Attack',
    titleEn: 'Pest Attack / Disease',
    titleHi: 'कीट प्रकोप / टिड्डी दल / रोग',
    descEn: 'Locusts, bollworm, fungal blight or viral outbreak',
    descHi: 'टिड्डी, इल्ली, फंगस या पौधों में कीट महामारी',
    icon: Bug,
    colorClass: 'pest-card'
  },
  {
    type: 'Other',
    titleEn: 'Other Disaster',
    titleHi: 'अन्य आपदा',
    descEn: 'Unseasonal frost, fire, gale force winds / cyclone',
    descHi: 'पाला, आगजनी, तेज आंधी या चक्रवाती तूफान',
    icon: HelpCircle,
    colorClass: 'other-card'
  }
];

export function DamageSelection({
  damageType,
  customDamageType = '',
  lossPercentage,
  incidentDate,
  onChange,
  onNext,
  onBack,
  onSaveDraft,
  language
}: DamageSelectionProps) {
  const [customInput, setCustomInput] = useState(customDamageType);
  const [error, setError] = useState('');

  const handleSelectType = (selected: DamageType) => {
    onChange({
      damageType: selected,
      customDamageType: selected === 'Other' ? customInput : '',
      lossPercentage,
      incidentDate
    });
    setError('');
  };

  const handleLossChange = (percent: number) => {
    onChange({
      damageType,
      customDamageType: damageType === 'Other' ? customInput : '',
      lossPercentage: percent,
      incidentDate
    });
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    onChange({
      damageType,
      customDamageType: val,
      lossPercentage,
      incidentDate
    });
  };

  const handleDateChange = (date: string) => {
    onChange({
      damageType,
      customDamageType: damageType === 'Other' ? customInput : '',
      lossPercentage,
      incidentDate: date
    });
  };

  const validateAndProceed = () => {
    if (!incidentDate) {
      setError(language === 'pa' ? 'ਘਟਨਾ ਦੀ ਤਾਰੀਖ ਚੁਣੋ' : language === 'hi' ? 'घटना की तारीख चुनें' : 'Choose the incident date');
      return;
    }
    if (damageType === 'Other' && !customInput.trim()) {
      setError(language === 'pa' ? 'ਹੋਰ ਕਾਰਨ ਦਾ ਵੇਰਵਾ ਲਿਖੋ' : language === 'hi' ? 'अन्य आपदा का विवरण लिखें' : 'Please describe the other cause');
      return;
    }
    onNext();
  };

  return (
    <div className="card damage-selection-card">
      <div className="card-header">
        <div className="card-icon-tag bg-amber">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2 className="card-title">
            {language === 'hi' ? 'फसल क्षति का प्रकार चुनें' : 'Select Crop Damage Type'}
          </h2>
          <p className="card-subtitle">
            {language === 'hi' 
              ? 'आपकी फसल किस प्राकृतिक आपदा से प्रभावित हुई है?' 
              : 'Identify the primary natural disaster cause and estimated damage extent'}
          </p>
        </div>
      </div>

      {/* Grid of Damage Options */}
      <div className="damage-grid">
        {DAMAGE_OPTIONS.map((opt) => {
          const isSelected = damageType === opt.type;
          const Icon = opt.icon;

          return (
            <div
              key={opt.type}
              onClick={() => handleSelectType(opt.type)}
              className={`damage-card-item ${opt.colorClass} ${isSelected ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
            >
              <div className="damage-card-top">
                <div className="damage-icon-circle">
                  <Icon size={28} />
                </div>
                <div className="selection-radio-dot">
                  {isSelected && <div className="inner-dot" />}
                </div>
              </div>

              <div className="damage-card-body">
                <h3 className="damage-title">
                  {language === 'hi' ? opt.titleHi : opt.titleEn}
                </h3>
                <p className="damage-desc">
                  {language === 'hi' ? opt.descHi : opt.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom disaster input if "Other" is chosen */}
      {damageType === 'Other' && (
        <div className="custom-damage-box animate-fade-in">
          <label className="form-label">
            {language === 'hi' ? 'आपदा का नाम / कारण दर्ज करें *' : 'Specify Nature of Damage / Calamity *'}
          </label>
          <input
            type="text"
            placeholder={language === 'hi' ? 'उदा. शीतलहर / पाला, तेज आंधी, आग' : 'e.g. Severe Frost, Wildfire, Gale Wind'}
            value={customInput}
            onInput={(e) => handleCustomChange((e.target as HTMLInputElement).value)}
            className={`form-input ${error ? 'input-error' : ''}`}
          />
          {error && <span className="error-text">{error}</span>}
        </div>
      )}

      {/* Incident Date & Severity Percentage */}
      <div className="form-sub-block mt-4">
        <div className="grid-2-col">
          <div className="form-group">
            <label className="form-label" htmlFor="incident-date">
              {language === 'hi' ? 'आपदा घटित होने की तिथि' : 'Date of Calamity / Incident'}
            </label>
            <input
              id="incident-date"
              type="date"
              value={incidentDate}
              required
              aria-invalid={Boolean(error && !incidentDate)}
              onInput={(e) => handleDateChange((e.target as HTMLInputElement).value)}
              className="form-input"
            />
            {error && !incidentDate && <span className="error-text" role="alert">{error}</span>}
          </div>

          <div className="form-group">
            <label className="form-label flex-between">
              <span>{language === 'hi' ? 'अनुमानित फसल क्षति (प्रतिशत)' : 'Estimated Crop Loss Percentage'}</span>
              <span className="loss-badge">{lossPercentage}%</span>
            </label>
            
            {/* Quick Preset Buttons */}
            <div className="loss-presets">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleLossChange(pct)}
                  className={`preset-btn ${lossPercentage === pct ? 'active' : ''}`}
                >
                  {pct}% {pct === 100 ? (language === 'hi' ? '(पूर्ण नष्ट)' : '(Total Loss)') : ''}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={lossPercentage}
              onInput={(e) => handleLossChange(Number((e.target as HTMLInputElement).value))}
              className="loss-slider"
            />
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
          <span>{language === 'hi' ? 'पीछे (किसान विवरण)' : 'Back to Farmer'}</span>
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
            <span>{language === 'hi' ? 'आगे: फोटो व स्थान साक्ष्य' : 'Next: Photos & Location'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

