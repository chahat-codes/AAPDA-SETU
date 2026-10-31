import { useState } from 'preact/hooks';
import { DamageReport, Language } from '../types/damageReport';
import { FolderArchive, PlusCircle, Edit3, Trash2, CheckCircle2, Clock, Eye, RotateCcw, X, FileText } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: DamageReport[];
  onSelectReport: (report: DamageReport) => void;
  onDeleteReport: (id: string) => void;
  onResetDemoData: () => void;
  onNewReport: () => void;
  language: Language;
}

export function SavedDraftsModal({
  isOpen,
  onClose,
  reports,
  onSelectReport,
  onDeleteReport,
  onResetDemoData,
  onNewReport,
  language
}: SavedDraftsModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'submitted'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<DamageReport | null>(null);

  const drafts = reports.filter(r => r.status === 'draft');
  const submitted = reports.filter(r => r.status === 'submitted');

  const displayedReports = activeTab === 'all' 
    ? reports 
    : activeTab === 'drafts' 
    ? drafts 
    : submitted;

  return (
    <div className="modal-backdrop">
      <div className="modal-content drafts-modal">
        <div className="modal-header">
          <div className="flex-row items-center gap-2">
            <FolderArchive className="text-emerald" size={22} />
            <h2 className="modal-title">
              {language === 'hi' ? 'मेरी रिपोर्ट और ड्राफ़्ट' : 'My Reports & Drafts'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="modal-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            {language === 'hi' ? 'सभी' : 'All'} ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          >
            {language === 'hi' ? 'अपूर्ण ड्राफ्ट' : 'Drafts'} ({drafts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`tab-btn ${activeTab === 'submitted' ? 'active' : ''}`}
          >
            {language === 'hi' ? 'इस फ़ोन में सहेजी' : 'Saved on this phone'} ({submitted.length})
          </button>
        </div>

        {/* Top actions: New Report & Reset Demo */}
        <div className="drafts-toolbar flex-between items-center">
          <button
            type="button"
            onClick={() => {
              onNewReport();
              onClose();
            }}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={16} />
            <span>{language === 'hi' ? '+ नया नुकसान दर्ज करें' : '+ New Damage Report'}</span>
          </button>

          <button
            type="button"
            onClick={onResetDemoData}
            className="btn btn-secondary btn-sm"
            title="Restore sample demo data in localStorage"
          >
            <RotateCcw size={14} />
            <span>{language === 'hi' ? 'डेमो डेटा रीसेट करें' : 'Reset Demo Records'}</span>
          </button>
        </div>

        {/* List of Reports */}
        <div className="reports-list-container">
          {displayedReports.length === 0 ? (
            <div className="empty-reports-state">
              <FileText size={40} className="text-muted" />
              <p>
                {language === 'hi' 
                  ? 'इस श्रेणी में कोई रिकॉर्ड उपलब्ध नहीं है।' 
                  : 'No records found in this category.'}
              </p>
            </div>
          ) : (
            displayedReports.map((report) => {
              const isDraft = report.status === 'draft';
              const dateFormatted = new Date(report.updatedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={report.id} className={`report-item-card ${isDraft ? 'border-draft' : 'border-submitted'}`}>
                  <div className="report-card-top flex-between">
                    <div className="flex-row items-center gap-2">
                      <span className={`status-badge ${isDraft ? 'badge-draft' : 'badge-submitted'}`}>
                        {isDraft ? (
                          <>
                            <Clock size={12} /> {language === 'hi' ? 'ड्राफ्ट' : 'Draft'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} /> {language === 'hi' ? 'इस फ़ोन में सहेजी' : 'Saved on this phone'}
                          </>
                        )}
                      </span>
                      {report.submissionId && (
                        <span className="submission-id-tag font-mono">
                          {report.submissionId}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-muted font-mono">{dateFormatted}</span>
                  </div>

                  <div className="report-card-body">
                    <h4 className="farmer-report-title">
                      {report.farmer.fullName || (language === 'hi' ? 'अज्ञात किसान (ड्राफ्ट)' : 'Unnamed Farmer (Draft)')}
                    </h4>

                    <div className="report-meta-chips">
                      <span className="meta-chip">
                        🌾 {report.farmer.cropName || 'Crop'} ({report.farmer.affectedArea ? `${report.farmer.affectedArea} Acres` : 'Area unspecified'})
                      </span>
                      <span className="meta-chip">
                        ⚠️ {report.damageType} ({report.lossPercentage}%)
                      </span>
                      {report.farmer.village && (
                        <span className="meta-chip">
                          📍 {report.farmer.village}, {report.farmer.district}
                        </span>
                      )}
                      <span className="meta-chip">
                        📷 {report.photos.length} {language === 'hi' ? 'फोटो' : 'Photos'}
                      </span>
                    </div>
                  </div>

                  <div className="report-card-actions flex-between items-center">
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectReport(report);
                          onClose();
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <Edit3 size={14} />
                        <span>{language === 'hi' ? 'ड्राफ्ट संपादित करें' : 'Resume Editing'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(report)}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye size={14} />
                        <span>{language === 'hi' ? 'रसीद देखें' : 'View Receipt'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(language === 'hi' ? 'क्या आप इस रिकॉर्ड को हटाना चाहते हैं?' : 'Are you sure you want to delete this record?')) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="delete-icon-btn"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Receipt Quick View Drawer */}
        {selectedReceipt && (
          <div className="receipt-overlay">
            <div className="receipt-card animate-scale-up">
              <div className="receipt-header">
                <div>
                  <h3 className="text-lg font-bold">
                    {language === 'hi' ? 'सबमिशन पावती रसीद' : 'Claim Acknowledgement Receipt'}
                  </h3>
                  <span className="font-mono text-emerald font-bold">{selectedReceipt.submissionId}</span>
                </div>
                <button type="button" onClick={() => setSelectedReceipt(null)} className="close-btn">
                  <X size={18} />
                </button>
              </div>

              <div className="receipt-body text-sm">
                <div className="grid-2-col gap-2 my-2">
                  <div>
                    <span className="text-muted block text-xs">{language === 'hi' ? 'किसान' : 'Farmer'}:</span>
                    <strong>{selectedReceipt.farmer.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">{language === 'hi' ? 'मोबाइल' : 'Mobile'}:</span>
                    <strong className="font-mono">{selectedReceipt.farmer.phoneNumber}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">{language === 'hi' ? 'खसरा / गाँव' : 'Plot / Village'}:</span>
                    <span>{selectedReceipt.farmer.khasraNumber}, {selectedReceipt.farmer.village}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">{language === 'hi' ? 'क्षति प्रकार' : 'Damage Type'}:</span>
                    <span className="text-red font-bold">{selectedReceipt.damageType} ({selectedReceipt.lossPercentage}%)</span>
                  </div>
                </div>

                <div className="receipt-signature-box font-mono text-xs">
                  <span className="text-muted block mb-1">MOCK DIGITAL SEAL:</span>
                  <code>{selectedReceipt.mockDigitalSignature}</code>
                </div>
              </div>

              <div className="receipt-footer mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn btn-secondary w-full"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close Receipt'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer flex-between items-center">
          <SimulatedBadge label="LocalStorage Persisted" />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            {language === 'hi' ? 'वापस जाएं' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
