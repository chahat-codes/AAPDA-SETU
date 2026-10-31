import { useEffect, useState } from 'preact/hooks';
import { ArrowRight, Camera, FileText, MapPin, Plus } from 'lucide-preact';
import type { DamageReport } from '../types/damageReport';
import type { AppLanguage } from '@shared/voice';
import { storageService } from '../services/storageService';

interface MyReportsProps { language: AppLanguage; onStart: () => void; onOpen: (reportId: string) => void; }
const labels = {
  en: { title: 'My reports', intro: 'Saved on this phone', new: 'Report crop damage', empty: 'No reports yet', emptyHint: 'Your saved drafts and reports will appear here.', draft: 'Draft', saved: 'Saved on this phone · not sent to a server', sample: 'Sample example', details: 'View details', close: 'Hide details', resume: 'Continue draft', crop: 'Crop', damage: 'Problem', place: 'Place', photos: 'photos' },
  hi: { title: 'मेरी रिपोर्ट', intro: 'इस फ़ोन में सहेजी गई', new: 'फसल नुकसान की रिपोर्ट', empty: 'अभी कोई रिपोर्ट नहीं', emptyHint: 'आपके ड्राफ़्ट और रिपोर्ट यहाँ दिखेंगे।', draft: 'ड्राफ़्ट', saved: 'इस फ़ोन में सहेजी · सर्वर पर नहीं भेजी', sample: 'नमूना', details: 'जानकारी देखें', close: 'जानकारी छिपाएँ', resume: 'ड्राफ़्ट जारी रखें', crop: 'फसल', damage: 'समस्या', place: 'जगह', photos: 'तस्वीरें' },
  pa: { title: 'ਮੇਰੀਆਂ ਰਿਪੋਰਟਾਂ', intro: 'ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੀਆਂ', new: 'ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ', empty: 'ਹਾਲੇ ਕੋਈ ਰਿਪੋਰਟ ਨਹੀਂ', emptyHint: 'ਤੁਹਾਡੇ ਡਰਾਫਟ ਅਤੇ ਰਿਪੋਰਟਾਂ ਇੱਥੇ ਦਿਖਣਗੀਆਂ।', draft: 'ਡਰਾਫਟ', saved: 'ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੀ · ਸਰਵਰ ਨੂੰ ਨਹੀਂ ਭੇਜੀ', sample: 'ਨਮੂਨਾ', details: 'ਵੇਰਵੇ ਵੇਖੋ', close: 'ਵੇਰਵੇ ਲੁਕਾਓ', resume: 'ਡਰਾਫਟ ਜਾਰੀ ਰੱਖੋ', crop: 'ਫਸਲ', damage: 'ਸਮੱਸਿਆ', place: 'ਥਾਂ', photos: 'ਫੋਟੋਆਂ' },
} as const;
const isSample = (report: DamageReport) => report.location.isSimulated || report.id.includes('demo') || report.mockDigitalSignature?.startsWith('SIM-');

export default function MyReportsPage({ language, onStart, onOpen }: MyReportsProps) {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = labels[language];
  useEffect(() => {
    const initial = storageService.getReports();
    setReports(initial);
    storageService.syncFromIndexedDB(initial).then(() => setReports(storageService.getReports())).catch(() => {});
  }, []);

  return (
    <main class="simple-page reports-page">
      <div class="simple-page-heading reports-heading">
        <div><span class="farmer-eyebrow">📄 {t.intro}</span><h1>{t.title}</h1></div>
        <button class="primary-action compact-action" onClick={onStart}><Plus size={19} />{t.new}</button>
      </div>
      {reports.length === 0 ? (
        <section class="farmer-empty-state">
          <span class="empty-state-icon"><FileText size={34} /></span>
          <h2>{t.empty}</h2><p>{t.emptyHint}</p>
          <button class="primary-action" onClick={onStart}><Camera size={20} />{t.new}</button>
        </section>
      ) : (
        <div class="report-card-list">
          {reports.map((report) => {
            const sample = isSample(report);
            const isDraft = report.status === 'draft';
            const expanded = expandedId === report.id;
            const photo = report.photos[0]?.dataUrl;
            return (
              <article class="my-report-card" key={report.id}>
                <div class="report-card-image">
                  {photo && !sample ? <img src={photo} alt="Crop damage evidence" /> : <span aria-hidden="true">{sample ? '🧪' : '🌾'}</span>}
                </div>
                <div class="my-report-card-main">
                  <div class="report-status-row">
                    <span class={`report-status ${isDraft ? 'status-draft' : 'status-saved'}`}>{isDraft ? t.draft : t.saved}</span>
                    {sample && <span class="sample-status">{t.sample}</span>}
                  </div>
                  <h2>{report.farmer.cropName || 'Crop'} · {report.damageType}</h2>
                  <p class="report-card-place"><MapPin size={15} />{report.farmer.village || report.location.addressText || 'Place not added'}</p>
                  <button class="text-action" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : report.id)}>{expanded ? t.close : t.details}<ArrowRight size={16} /></button>
                  {expanded && (
                    <div class="report-detail-panel">
                      <p><strong>{t.crop}:</strong> {report.farmer.cropName} ({report.farmer.cropSeason})</p>
                      <p><strong>{t.damage}:</strong> {report.damageType}</p>
                      <p><strong>{t.place}:</strong> {report.farmer.village || report.location.addressText || '—'}</p>
                      <p><strong>{t.photos}:</strong> {report.photos.length}</p>
                      {report.damageDescription && <p>{report.damageDescription}</p>}
                      {isDraft && <button class="primary-action compact-action" onClick={() => onOpen(report.id)}>{t.resume}</button>}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
