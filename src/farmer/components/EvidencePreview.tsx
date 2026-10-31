import { DamageReport, Language } from '../types/damageReport';
import { CheckCircle2, User, AlertTriangle, Camera, MapPin, ShieldCheck, ArrowLeft, Save, Send, Edit2, Download, Clock3, Info } from 'lucide-preact';
import { SimulatedBadge } from './SimulatedBadge';

interface EvidencePreviewProps {
  report: DamageReport;
  onEditStep: (step: 'farmer' | 'damage' | 'photos') => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  language: Language;
}

export function EvidencePreview({
  report,
  onEditStep,
  onSubmit,
  onSaveDraft,
  onBack,
  language
}: EvidencePreviewProps) {
  const { farmer, damageType, customDamageType, lossPercentage, damageDescription, incidentDate, location, photos } = report;
  const isDemoRecord = report.id.toLowerCase().includes('demo');

  const hasRealPhoto = photos.some((photo) => photo.source !== 'simulated' && !(isDemoRecord && photo.id.toLowerCase().includes('mock')));
  const hasIncidentType = damageType !== 'Other' || Boolean(customDamageType?.trim());
  const completeness = [hasIncidentType, Boolean(incidentDate), Boolean(farmer.cropName), Boolean(farmer.affectedArea), Boolean(damageDescription.trim()), hasRealPhoto];
  const completedCount = completeness.filter(Boolean).length;
  const timeline = [
    ...(report.createdAt ? [{ label: isDemoRecord ? 'Demo record created' : 'Record started on this device', at: report.createdAt, source: isDemoRecord ? 'Demo data' : 'App timestamp' }] : []),
    ...(report.consentTimestamp ? [{ label: isDemoRecord ? 'Demo consent timestamp' : 'Consent recorded on this device', at: report.consentTimestamp, source: isDemoRecord ? 'Demo data' : 'App timestamp' }] : []),
    ...photos.map((photo) => ({ label: photo.source === 'simulated' || (isDemoRecord && photo.id.toLowerCase().includes('mock')) ? 'Demo photo timestamp' : photo.source ? 'Photo added to record' : 'Photo timestamp in saved record', at: photo.timestamp, source: photo.source === 'simulated' || (isDemoRecord && photo.id.toLowerCase().includes('mock')) ? 'Demo data' : photo.source ? 'App timestamp' : 'Not recorded in older record' })),
    ...(report.updatedAt && report.updatedAt !== report.createdAt ? [{ label: isDemoRecord ? 'Demo save timestamp' : 'Most recent local save', at: report.updatedAt, source: isDemoRecord ? 'Demo data' : 'App timestamp' }] : [])
  ].filter((event) => Number.isFinite(Date.parse(event.at))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const downloadSummary = () => {
    const summary = [
      'AAPDASETU · LOCAL INCIDENT SUMMARY',
      'Saved on this device. This file has not been submitted to an authority or insurer.',
      ...(isDemoRecord ? ['DEMO RECORD · synthetic example data'] : []),
      '',
      `Local record: ${report.id}`,
      `Crop: ${farmer.cropName || 'Not provided'} (${farmer.cropSeason || 'season not provided'})`,
      `Incident type: ${damageType === 'Other' ? customDamageType || 'Other' : damageType}`,
      `Incident date (farmer-provided): ${incidentDate || 'Not provided'}`,
      `Affected area (farmer-provided): ${farmer.affectedArea ? `${farmer.affectedArea} acres` : 'Not provided'}`,
      `Estimated loss (farmer estimate): ${lossPercentage}%`,
      `Description (farmer-provided): ${damageDescription || 'Not provided'}`,
      `Place (entered): ${farmer.village || location.addressText || 'Not provided'}`,
      `Coordinates: ${location.latitude !== null && location.longitude !== null ? `${location.latitude}, ${location.longitude} (${location.isSimulated ? 'demo coordinates' : 'device location permission'})` : 'Not recorded'}`,
      `Photos: ${photos.length}`,
      ...photos.map((photo, index) => `  ${index + 1}. ${photo.category}; added ${new Date(photo.timestamp).toLocaleString()}; source: ${photo.source || 'not recorded in older report'}${photo.source === 'simulated' || (isDemoRecord && photo.id.toLowerCase().includes('mock')) ? ' (DEMO)' : ''}`),
      '',
      'A photo, date, location, or farmer estimate does not independently verify the cause or extent of crop damage.'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aapdasetu-incident-${report.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="card preview-card">
      <div className="card-header justify-between">
        <div className="flex-row items-center gap-3">
          <div className="card-icon-tag bg-emerald">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="card-title">
              {language === 'pa' ? 'ਰਿਪੋਰਟ ਦੀ ਅੰਤਿਮ ਜਾਂਚ' : language === 'hi' ? 'रिपोर्ट की अंतिम जाँच' : 'Review your report'}
            </h2>
            <p className="card-subtitle">
              {language === 'pa'
                ? 'ਵੇਰਵੇ ਅਤੇ ਫੋਟੋਆਂ ਜਾਂਚੋ। ਰਿਪੋਰਟ ਸਿਰਫ਼ ਇਸ ਡਿਵਾਈਸ ਵਿੱਚ ਸੰਭਾਲੀ ਜਾਵੇਗੀ।'
                : language === 'hi'
                ? 'जानकारी और तस्वीरें जाँचें। रिपोर्ट केवल इसी डिवाइस में सहेजी जाएगी।'
                : 'Check the details and photos. The report will be saved on this device only.'}
            </p>
          </div>
        </div>

        <SimulatedBadge label={language === 'pa' ? 'ਸਥਾਨਕ ਡੈਮੋ · ਭੇਜਿਆ ਨਹੀਂ ਗਿਆ' : language === 'hi' ? 'स्थानीय डेमो · भेजा नहीं गया' : 'Local demo · not sent'} />
      </div>

      <section className="evidence-completeness" aria-labelledby="evidence-completeness-title">
        <div className="evidence-completeness-heading">
          <div><h3 id="evidence-completeness-title">{language === 'pa' ? 'ਰਿਪੋਰਟ ਦੀ ਤਿਆਰੀ' : language === 'hi' ? 'रिपोर्ट की तैयारी' : 'Report completeness'}</h3><p>{completedCount} of 6 details present · not independently verified</p></div>
          <button type="button" className="edit-step-btn" onClick={downloadSummary}><Download size={16} />{language === 'pa' ? 'ਸੰਖੇਪ ਡਾਊਨਲੋਡ' : language === 'hi' ? 'सारांश डाउनलोड' : 'Download summary'}</button>
        </div>
        <div className="evidence-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={completedCount} aria-label={`${completedCount} of 6 report details present`}><span style={{ width: `${completedCount / 6 * 100}%` }} /></div>
        <div className="evidence-checklist">
          {[
            ['Incident type', hasIncidentType], ['Incident date', Boolean(incidentDate)], ['Crop', Boolean(farmer.cropName)],
            ['Affected area', Boolean(farmer.affectedArea)], ['Damage details', Boolean(damageDescription.trim())], ['At least one photo', hasRealPhoto]
          ].map(([label, complete]) => <span key={label} className={complete ? 'evidence-check-complete' : 'evidence-check-missing'}><span aria-hidden="true">{complete ? '✓' : '○'}</span>{label}</span>)}
        </div>
        <p className="evidence-provenance-note"><Info size={16} />{language === 'pa' ? 'ਫਸਲ, ਘਟਨਾ ਅਤੇ ਨੁਕਸਾਨ ਦਾ ਵੇਰਵਾ ਤੁਹਾਡੇ ਵੱਲੋਂ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਫੋਟੋ ਦਾ ਸਮਾਂ ਐਪ ਵਿੱਚ ਜੋੜਨ ਦਾ ਸਮਾਂ ਹੈ। GPS ਕੇਵਲ ਜਦੋਂ ਉਪਲਬਧ ਹੋਵੇ।' : language === 'hi' ? 'फसल, घटना और नुकसान का विवरण आपने दिया है। फोटो का समय ऐप में जोड़ने का समय है। GPS केवल उपलब्ध होने पर।' : 'Crop, incident and damage details are farmer-provided. Photo time is when the app added it to this record. GPS appears only when available.'}</p>
      </section>

      {/* Review Section 1: Farmer & Land Parcel */}
      <div className="review-section-box">
        <div className="review-sec-header">
          <div className="flex-row items-center gap-2">
            <User size={18} className="text-emerald" />
            <h3 className="review-sec-title">
              {language === 'hi' ? '1. किसान एवं भूमि का विवरण' : '1. Farmer & Land Information'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onEditStep('farmer')}
            className="edit-step-btn"
          >
            <Edit2 size={14} />
            <span>{language === 'hi' ? 'सुधारें (Edit)' : 'Edit'}</span>
          </button>
        </div>

        <div className="review-data-grid">
          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'किसान का नाम' : 'Farmer Name'}</span>
            <span className="review-val font-semibold">{farmer.fullName || '—'}</span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}</span>
            <span className="review-val font-mono">{farmer.phoneNumber || '—'}</span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'किसान आईडी' : 'Kisan ID'}</span>
            <span className="review-val font-mono">{farmer.kisanId || 'Not specified'}</span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'गाँव / ब्लॉक / जिला' : 'Village / Block / District'}</span>
            <span className="review-val">
              {farmer.village ? `${farmer.village}, ` : ''}
              {farmer.block ? `${farmer.block}, ` : ''}
              {farmer.district}, {farmer.state}
            </span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'खसरा / सर्वे संख्या' : 'Khasra / Plot No.'}</span>
            <span className="review-val font-bold text-green">{farmer.khasraNumber || '—'}</span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'फसल व मौसम' : 'Crop & Season'}</span>
            <span className="review-val">{farmer.cropName} ({farmer.cropSeason})</span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'प्रभावित रकबा' : 'Affected Area'}</span>
            <span className="review-val font-bold text-amber">
              {farmer.affectedArea} {language === 'hi' ? 'एकड़' : 'Acres'} 
              {farmer.totalArea ? ` (कुल: ${farmer.totalArea} एकड़)` : ''}
            </span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'बुवाई तिथि' : 'Sowing Date'}</span>
            <span className="review-val">{farmer.sowingDate || '—'}</span>
          </div>
        </div>
      </div>

      {/* Review Section 2: Damage Severity & Cause */}
      <div className="review-section-box">
        <div className="review-sec-header">
          <div className="flex-row items-center gap-2">
            <AlertTriangle size={18} className="text-amber" />
            <h3 className="review-sec-title">
              {language === 'hi' ? '2. क्षति का प्रकार एवं मूल्यांकन' : '2. Damage Assessment'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onEditStep('damage')}
            className="edit-step-btn"
          >
            <Edit2 size={14} />
            <span>{language === 'hi' ? 'सुधारें (Edit)' : 'Edit'}</span>
          </button>
        </div>

        <div className="review-data-grid">
          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'आपदा का प्रकार' : 'Damage Type'}</span>
            <span className="review-val font-bold text-red">
              {damageType === 'Other' && customDamageType ? `Other: ${customDamageType}` : damageType}
            </span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'अनुमानित क्षति' : 'Estimated Loss'}</span>
            <span className="review-val">
              <span className="badge-loss-pill">{lossPercentage}% Loss</span>
            </span>
          </div>

          <div className="review-item">
            <span className="review-label">{language === 'hi' ? 'घटना की तिथि' : 'Incident Date'}</span>
            <span className="review-val">{incidentDate || '—'}</span>
          </div>

          <div className="review-item col-span-full">
            <span className="review-label">{language === 'hi' ? 'नुकसान का विवरण' : 'Description'}</span>
            <p className="review-val desc-preview-text">
              {damageDescription || '(No additional description provided)'}
            </p>
          </div>
        </div>
      </div>

      {/* Review Section 3: Field Photographs */}
      <div className="review-section-box">
        <div className="review-sec-header">
          <div className="flex-row items-center gap-2">
            <Camera size={18} className="text-emerald" />
            <h3 className="review-sec-title">
              {language === 'hi' ? `3. जोड़ी गई तस्वीरें (${photos.length})` : language === 'pa' ? `3. ਜੋੜੀਆਂ ਫੋਟੋਆਂ (${photos.length})` : `3. Photos added (${photos.length})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onEditStep('photos')}
            className="edit-step-btn"
          >
            <Edit2 size={14} />
            <span>{language === 'hi' ? 'फोटो बदलें' : 'Manage Photos'}</span>
          </button>
        </div>

        {photos.length === 0 ? (
          <p className="text-muted text-sm italic">{language === 'hi' ? 'कोई फोटो संलग्न नहीं है' : 'No photos attached'}</p>
        ) : (
          <div className="preview-photos-grid">
            {photos.map((item, idx) => (
              <div key={item.id} className="preview-photo-card">
                <img src={item.dataUrl} alt={`Photo ${idx + 1}`} className="preview-thumb" />
                <div className="preview-photo-meta">
                  <div className="meta-tag">{item.category}</div>
                  <div className="meta-coords font-mono text-xs">
                    {item.source === 'simulated' || (isDemoRecord && item.id.toLowerCase().includes('mock')) ? 'Demo image · not field evidence' : item.gpsLocation ? `GPS recorded${location.isSimulated ? ' · DEMO' : ''}: ${item.gpsLocation.latitude.toFixed(4)}, ${item.gpsLocation.longitude.toFixed(4)}` : location.latitude !== null && location.longitude !== null ? `Report location${location.isSimulated ? ' · DEMO' : ''}: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'No GPS coordinates recorded'}
                  </div>
                  <div className="meta-time text-xs text-muted">
                    {item.source === 'simulated' || (isDemoRecord && item.id.toLowerCase().includes('mock')) ? 'DEMO · ' : item.source === 'camera' ? 'Camera capture · ' : item.source === 'upload' ? 'Gallery upload · ' : !item.source ? 'Saved time · ' : 'Added to record · '}{new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="evidence-timeline-section" aria-labelledby="evidence-timeline-title">
        <div className="review-sec-header"><div className="flex-row items-center gap-2"><Clock3 size={18} className="text-emerald" /><h3 id="evidence-timeline-title" className="review-sec-title">{language === 'pa' ? 'ਰਿਕਾਰਡ ਦੀ ਸਮਾਂ-ਰੇਖਾ' : language === 'hi' ? 'रिकॉर्ड की समयरेखा' : 'Record timeline'}</h3></div></div>
        {timeline.length ? <ol className="evidence-timeline-list">{timeline.map((event) => <li key={`${event.label}-${event.at}`}><span className="evidence-timeline-dot" /><div><strong>{event.label}</strong><small>{new Date(event.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · {event.source}</small></div></li>)}</ol> : <p>No app-recorded events yet.</p>}
        <p className="evidence-timeline-note">The incident date above is provided by the farmer. The timestamps here come from the device clock when an app action was recorded.</p>
      </section>

      {/* Review Section 4: Location details and evidence limits */}
      <div className="review-section-box">
        <div className="review-sec-header">
          <div className="flex-row items-center gap-2">
            <MapPin size={18} className="text-blue" />
            <h3 className="review-sec-title">
              {language === 'hi' ? '4. जगह और रिकॉर्ड की जानकारी' : language === 'pa' ? '4. ਥਾਂ ਅਤੇ ਰਿਕਾਰਡ ਦੀ ਜਾਣਕਾਰੀ' : '4. Location & record details'}
            </h3>
          </div>
        </div>

        <div className="evidence-provenance-grid">
          <div><strong>Farmer-provided</strong><span>Crop, incident type/date, affected area, loss estimate, and description.</span></div>
          <div><strong>Device/app recorded</strong><span>App record and photo-add times. GPS only when permission and device location are available.</span></div>
          <div><strong>Not verified here</strong><span>Cause and extent of damage. This local record is not reviewed or submitted by an authority.</span></div>
        </div>
        <p className="evidence-location-line">{location.latitude !== null && location.longitude !== null ? `Coordinates: ${location.latitude}, ${location.longitude}${location.accuracy !== null ? ` · device-reported accuracy ±${location.accuracy} m` : ''}${location.isSimulated ? ' · DEMO LOCATION' : ' · device location'}` : location.addressText ? `Place entered: ${location.addressText} · no GPS coordinates recorded` : 'No location added. You can still save this local record.'}</p>
      </div>

      {/* Confirmation & Submission Actions */}
      <div className="card-actions flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={18} />
          <span>{language === 'hi' ? 'पीछे (फोटो व स्थान)' : 'Back to Evidence'}</span>
        </button>

        <div className="flex-row gap-2 ml-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="btn btn-outline"
          >
            <Save size={18} />
            <span>{language === 'hi' ? 'ड्राफ्ट के रूप में सहेजें' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="btn btn-primary btn-submit-claim"
          >
            <Send size={18} />
            <span>{language === 'pa' ? 'ਰਿਪੋਰਟ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੋ' : language === 'hi' ? 'रिपोर्ट इस फ़ोन में सहेजें' : 'Save Report on This Device'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
