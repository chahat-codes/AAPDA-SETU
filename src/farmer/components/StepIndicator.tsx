import { StepId, Language } from '../types/damageReport';
import { ShieldCheck, UserCheck, AlertTriangle, Camera, CheckSquare } from 'lucide-preact';

interface StepIndicatorProps {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
  language: Language;
  consentGiven: boolean;
}

interface StepItem {
  id: StepId;
  labelEn: string;
  labelHi: string;
  icon: typeof ShieldCheck;
  stepNumber: number;
}

const STEPS: StepItem[] = [
  { id: 'consent', labelEn: 'Consent', labelHi: 'सहमति', icon: ShieldCheck, stepNumber: 1 },
  { id: 'farmer', labelEn: 'Farmer', labelHi: 'किसान', icon: UserCheck, stepNumber: 2 },
  { id: 'damage', labelEn: 'Damage', labelHi: 'नुकसान', icon: AlertTriangle, stepNumber: 3 },
  { id: 'photos', labelEn: 'Evidence', labelHi: 'साक्ष्य', icon: Camera, stepNumber: 4 },
  { id: 'preview', labelEn: 'Review', labelHi: 'समीक्षा', icon: CheckSquare, stepNumber: 5 }
];

export function StepIndicator({ currentStep, onStepClick, language, consentGiven }: StepIndicatorProps) {
  if (currentStep === 'success') {
    return null;
  }

  const stepOrder = STEPS.map(s => s.id);
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="step-indicator-wrapper">
      <div className="step-progress-track">
        <div 
          className="step-progress-fill" 
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      <div className="steps-container">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted || (idx === 1 && consentGiven) || isCurrent;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`step-bubble-btn ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isClickable ? 'disabled' : ''}`}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <span className="check-mark">✓</span>
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div className="step-label">
                <span className="primary-text">
                  {language === 'hi' ? step.labelHi : step.labelEn}
                </span>
                <span className="sub-step-num">Step {step.stepNumber}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

