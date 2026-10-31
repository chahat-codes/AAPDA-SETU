import { useState, useEffect } from 'preact/hooks';
import { DamageReport, StepId, Language } from './types/damageReport';
import { storageService } from './services/storageService';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { ConsentScreen } from './components/ConsentScreen';
import { FarmerDetailsForm } from './components/FarmerDetailsForm';
import { DamageSelection } from './components/DamageSelection';
import { CameraEvidence } from './components/CameraEvidence';
import { EvidencePreview } from './components/EvidencePreview';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { SavedDraftsModal } from './components/SavedDraftsModal';
import { fireConfetti } from '@shared/confetti';
import { playSuccessSound, playClick } from '@shared/sound';
import './farmer.css';

export default function FarmerPage({ initialReportId, onExit, initialLanguage = 'pa', onLanguageChange }: { initialReportId?: string; onExit?: () => void; initialLanguage?: Language; onLanguageChange?: (language: Language) => void }) {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [currentReport, setCurrentReport] = useState<DamageReport>(storageService.createNewBlankReport());
  const [currentStep, setCurrentStep] = useState<StepId>('consent');
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial reports from storage
  useEffect(() => {
    const loaded = storageService.getReports();
    setReports(loaded);
    const restoreReport = (items: DamageReport[]) => {
      if (!initialReportId) return;
      const report = items.find((item) => item.id === initialReportId);
      if (report) {
        setCurrentReport(report);
        setCurrentStep(report.status === 'submitted' || report.photos.length > 0 ? 'preview' : report.farmer.fullName ? 'damage' : report.consentGiven ? 'farmer' : 'consent');
      }
    };
    restoreReport(loaded);
    storageService.syncFromIndexedDB(loaded).then(() => {
      const refreshed = storageService.getReports();
      setReports(refreshed);
      restoreReport(refreshed);
    }).catch(() => {});
  }, [initialReportId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    try { localStorage.setItem('aapdasetu-language', nextLanguage); } catch { /* keep the selection for this visit */ }
    onLanguageChange?.(nextLanguage);
  };

  const handleConsentChange = (granted: boolean) => {
    setCurrentReport(prev => ({
      ...prev,
      consentGiven: granted,
      consentTimestamp: granted ? new Date().toISOString() : undefined
    }));
  };

  const handleSaveDraft = () => {
    storageService.saveReport(currentReport);
    setReports(storageService.getReports());
    playClick();
    showToast(
      language === 'pa'
        ? '✓ ਡਰਾਫਟ ਫੋਨ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਸੇਵ ਹੋ ਗਿਆ!'
        : language === 'hi' 
        ? '✓ ड्राफ्ट सुरक्षित रूप से सहेज लिया गया!' 
        : '✓ Draft saved successfully to device storage!'
    );
  };

  const handleStartNewReport = () => {
    playClick();
    const blank = storageService.createNewBlankReport();
    setCurrentReport(blank);
    setCurrentStep('consent');
  };

  const handleSelectReport = (report: DamageReport) => {
    playClick();
    setCurrentReport(report);
    // If already submitted, open preview; if draft with consent, go to farmer details or photos
    if (report.status === 'submitted') {
      setCurrentStep('preview');
    } else if (report.photos.length > 0) {
      setCurrentStep('preview');
    } else if (report.farmer.fullName) {
      setCurrentStep('damage');
    } else if (report.consentGiven) {
      setCurrentStep('farmer');
    } else {
      setCurrentStep('consent');
    }
  };

  const handleDeleteReport = (id: string) => {
    storageService.deleteReport(id);
    const updated = storageService.getReports();
    setReports(updated);
    if (currentReport.id === id) {
      handleStartNewReport();
    }
    showToast(language === 'pa' ? 'ਰਿਕਾਰਡ ਹਟਾ ਦਿੱਤਾ ਗਿਆ' : language === 'hi' ? 'रिकॉर्ड हटा दिया गया' : 'Record deleted');
  };

  const handleResetDemoData = () => {
    storageService.resetDemoData();
    const fresh = storageService.getReports();
    setReports(fresh);
    showToast(language === 'pa' ? 'ਡੈਮੋ ਰਿਕਾਰਡ ਰੀਸੈੱਟ ਹੋ ਗਏ' : language === 'hi' ? 'डेमो रिकॉर्ड रीसेट हो गए' : 'Demo records restored');
  };

  const handleSubmitClaim = () => {
    const submitted = storageService.submitReport(currentReport);
    setCurrentReport(submitted);
    setReports(storageService.getReports());
    setCurrentStep('success');
    fireConfetti();
    playSuccessSound();
    showToast(
      language === 'pa'
        ? '✓ ਰਿਪੋਰਟ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੀ ਗਈ। ਕਿਤੇ ਭੇਜੀ ਨਹੀਂ ਗਈ।'
        : language === 'hi' 
        ? '✓ रिपोर्ट इस फ़ोन में सहेजी गई। कहीं भेजी नहीं गई।' 
        : '✓ Report saved on this device. It was not sent to a service.'
    );
  };

  const draftsCount = reports.filter(r => r.status === 'draft').length;
  const submittedCount = reports.filter(r => r.status === 'submitted').length;

  return (
    <div className="farmer-desk-root app-layout">
      {onExit && <button type="button" className="workflow-home-link" onClick={onExit}>← Home</button>}
      {/* Top Banner & Navigation */}
      <Header
        draftCount={draftsCount}
        submittedCount={submittedCount}
        onOpenDrafts={() => setIsDraftsModalOpen(true)}
        onNewReport={handleStartNewReport}
        language={language}
        onSelectLanguage={selectLanguage}
      />

      {/* Main Container */}
      <div className="main-content">
        <div className="content-container">
          {/* Step Progress Bar */}
          <StepIndicator
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
            language={language}
            consentGiven={currentReport.consentGiven}
          />

          {/* Screen 1: Consent Screen */}
          {currentStep === 'consent' && (
            <ConsentScreen
              consentGiven={currentReport.consentGiven}
              onConsentChange={handleConsentChange}
              onProceed={() => setCurrentStep('farmer')}
              language={language}
            />
          )}

          {/* Screen 2: Farmer Details Form */}
          {currentStep === 'farmer' && (
            <FarmerDetailsForm
              farmer={currentReport.farmer}
              onChange={(updatedFarmer) => setCurrentReport(prev => ({ ...prev, farmer: updatedFarmer }))}
              onNext={() => setCurrentStep('damage')}
              onBack={() => setCurrentStep('consent')}
              onSaveDraft={handleSaveDraft}
              language={language}
            />
          )}

          {/* Screen 3: Crop Damage Selection */}
          {currentStep === 'damage' && (
            <DamageSelection
              damageType={currentReport.damageType}
              customDamageType={currentReport.customDamageType}
              lossPercentage={currentReport.lossPercentage}
              incidentDate={currentReport.incidentDate}
              onChange={({ damageType, customDamageType, lossPercentage, incidentDate }) => {
                setCurrentReport(prev => ({
                  ...prev,
                  damageType,
                  customDamageType,
                  lossPercentage,
                  incidentDate
                }));
              }}
              onNext={() => setCurrentStep('photos')}
              onBack={() => setCurrentStep('farmer')}
              onSaveDraft={handleSaveDraft}
              language={language}
            />
          )}

          {/* Screen 4: Camera Capture, Evidence & Location */}
          {currentStep === 'photos' && (
            <CameraEvidence
              photos={currentReport.photos}
              location={currentReport.location}
              damageDescription={currentReport.damageDescription}
              farmer={currentReport.farmer}
              damageType={currentReport.damageType}
              customDamageType={currentReport.customDamageType}
              incidentDate={currentReport.incidentDate}
              onPhotosChange={(photos) => setCurrentReport(prev => ({ ...prev, photos }))}
              onLocationChange={(location) => setCurrentReport(prev => ({ ...prev, location }))}
              onDescriptionChange={(damageDescription) => setCurrentReport(prev => ({ ...prev, damageDescription }))}
              onNext={() => setCurrentStep('preview')}
              onBack={() => setCurrentStep('damage')}
              onSaveDraft={handleSaveDraft}
              language={language}
            />
          )}

          {/* Screen 5: Evidence Preview & Verification */}
          {currentStep === 'preview' && (
            <EvidencePreview
              report={currentReport}
              onEditStep={(step) => setCurrentStep(step)}
              onSubmit={handleSubmitClaim}
              onSaveDraft={handleSaveDraft}
              onBack={() => setCurrentStep('photos')}
              language={language}
            />
          )}

          {/* Screen 6: Submission Success Receipt */}
          {currentStep === 'success' && (
            <SubmissionSuccess
              report={currentReport}
              onNewReport={handleStartNewReport}
              onViewDrafts={() => setIsDraftsModalOpen(true)}
              language={language}
            />
          )}
        </div>
      </div>

      {/* Saved Drafts / Records Drawer Modal */}
      <SavedDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        reports={reports}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReport}
        onResetDemoData={handleResetDemoData}
        onNewReport={handleStartNewReport}
        language={language}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-bounce-in">
          {toastMessage}
        </div>
      )}

      {/* Footer Branding */}
      <footer className="farmer-footer">
        <p>AapdaSetu Farmer Prototype • Disaster Management & Crop Loss Verification Portal</p>
        <p className="footer-sub">Optimized for rural mobile devices • Local Offline Storage Active</p>
      </footer>
    </div>
  );
}
