import { Camera, CloudRain, Leaf, ChevronRight, Volume2, HandHelping, Clock3, BadgeCheck, LockKeyhole, ScanLine, ClipboardList, Sprout, CircleHelp, HeartPulse } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import type { AppLanguage } from '@shared/voice';
import { ROUTES } from '@shared/constants';
import { storageService } from '../services/storageService';

interface FarmerHomeProps {
  language: AppLanguage;
  onOpen: (path: string) => void;
  onSpeak: (text: string, language?: AppLanguage) => void;
}

const copy = {
  en: {
    greeting: 'From crop loss to climate resilience', help: 'Prepare before risk. Document damage. Find recovery guidance. Build a more resilient farm.',
    prepare: 'Prepare for weather', prepareHint: 'Read prevention tips. Live weather alerts are not connected.', prepareAction: 'See precautions',
    report: 'Report crop damage', reportHint: 'Save crop, damage, date and photo details on this phone.', reportAction: 'Start a report',
    recover: 'Get recovery guidance', recoverHint: 'Read general crop-problem steps. Ask a local expert about treatment.', recoverAction: 'See crop guidance',
    rebuild: 'Rebuild with better practices', rebuildHint: 'Record water, soil and crop-residue activities. These are your notes.', rebuildAction: 'Track practices',
    prepareStage: 'PREPARE', reportStage: 'REPORT', recoverStage: 'RECOVER', rebuildStage: 'REBUILD',
    listen: 'Listen to these choices', spoken: 'Prepare for weather, report crop damage, read recovery guidance, or record farm practices.',
    volunteer: 'Seek volunteer help', volunteerHint: 'A field helper can guide you through the app.',
    timer: 'Report timer', elapsedReport: 'Time since your latest saved report', elapsedSession: 'Time since this visit started', localTimer: 'Local timer · not a government deadline',
    tools: 'More help and tools', officer: 'Officer review', officerHint: 'Local demo · no official review', seal: 'Seal evidence files', sealHint: 'Create an integrity seal on this device', verify: 'Check a report', verifyHint: 'Check a saved photo or its seal', reports: 'My Reports', reportsHint: 'View saved reports', farm: 'My Farm', farmHint: 'Track your farm', support: 'Help & Support', supportHint: 'Get help using the app', badge: 'YOUR FARM, OUR PRIORITY',
  },
  pa: {
    greeting: 'ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਤੋਂ ਜਲਵਾਯੂ ਲਈ ਤਿਆਰੀ ਵੱਲ', help: 'ਖਤਰੇ ਤੋਂ ਪਹਿਲਾਂ ਤਿਆਰ ਹੋਵੋ। ਨੁਕਸਾਨ ਦਰਜ ਕਰੋ। ਅਗਲੇ ਕਦਮ ਜਾਣੋ ਅਤੇ ਖੇਤ ਨੂੰ ਮਜ਼ਬੂਤ ਬਣਾਓ।',
    prepare: 'ਮੌਸਮ ਲਈ ਤਿਆਰੀ', prepareHint: 'ਬਚਾਅ ਦੇ ਸੁਝਾਅ ਵੇਖੋ। ਲਾਈਵ ਮੌਸਮ ਚੇਤਾਵਨੀ ਉਪਲਬਧ ਨਹੀਂ।', prepareAction: 'ਬਚਾਅ ਦੇ ਕਦਮ',
    report: 'ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ', reportHint: 'ਫਸਲ, ਨੁਕਸਾਨ, ਤਾਰੀਖ ਅਤੇ ਫੋਟੋ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੋ।', reportAction: 'ਰਿਪੋਰਟ ਸ਼ੁਰੂ ਕਰੋ',
    recover: 'ਮੁੜ ਸੰਭਾਲ ਲਈ ਜਾਣਕਾਰੀ', recoverHint: 'ਫਸਲ ਦੀ ਸਮੱਸਿਆ ਲਈ ਆਮ ਕਦਮ ਵੇਖੋ। ਇਲਾਜ ਲਈ ਸਥਾਨਕ ਮਾਹਰ ਤੋਂ ਪੁੱਛੋ।', recoverAction: 'ਫਸਲ ਬਾਰੇ ਜਾਣਕਾਰੀ',
    rebuild: 'ਚੰਗੇ ਤਰੀਕਿਆਂ ਨਾਲ ਮੁੜ ਬਣਾਓ', rebuildHint: 'ਪਾਣੀ, ਮਿੱਟੀ ਅਤੇ ਰਹਿੰਦ-ਖੂੰਹਦ ਦੇ ਕੰਮ ਦਰਜ ਕਰੋ। ਇਹ ਤੁਹਾਡੇ ਨੋਟ ਹਨ।', rebuildAction: 'ਖੇਤੀ ਦੇ ਕੰਮ ਦਰਜ ਕਰੋ',
    prepareStage: 'ਤਿਆਰੀ', reportStage: 'ਰਿਪੋਰਟ', recoverStage: 'ਸੰਭਾਲ', rebuildStage: 'ਮੁੜ ਬਣਾਓ',
    listen: 'ਇਹ ਚੋਣਾਂ ਸੁਣੋ', spoken: 'ਮੌਸਮ ਲਈ ਤਿਆਰ ਹੋਵੋ, ਫਸਲ ਦਾ ਨੁਕਸਾਨ ਦਰਜ ਕਰੋ, ਸੰਭਾਲ ਬਾਰੇ ਜਾਣੋ ਜਾਂ ਖੇਤੀ ਦੇ ਕੰਮ ਲਿਖੋ।',
    volunteer: 'ਵਲੰਟੀਅਰ ਤੋਂ ਮਦਦ ਲਵੋ', volunteerHint: 'ਖੇਤ ਸਹਾਇਕ ਐਪ ਵਰਤਣ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    timer: 'ਰਿਪੋਰਟ ਟਾਈਮਰ', elapsedReport: 'ਤੁਹਾਡੀ ਨਵੀਂ ਸੰਭਾਲੀ ਰਿਪੋਰਟ ਤੋਂ ਬੀਤਿਆ ਸਮਾਂ', elapsedSession: 'ਇਸ ਵਾਰ ਐਪ ਖੋਲ੍ਹਣ ਤੋਂ ਬੀਤਿਆ ਸਮਾਂ', localTimer: 'ਫੋਨ ਦਾ ਟਾਈਮਰ · ਸਰਕਾਰੀ ਮਿਆਦ ਨਹੀਂ',
    tools: 'ਹੋਰ ਮਦਦ ਅਤੇ ਸਹੂਲਤਾਂ', officer: 'ਅਧਿਕਾਰੀ ਸਮੀਖਿਆ', officerHint: 'ਸਥਾਨਕ ਡੈਮੋ · ਸਰਕਾਰੀ ਜਾਂਚ ਨਹੀਂ', seal: 'ਸਬੂਤ ਫਾਈਲਾਂ ਸੀਲ ਕਰੋ', sealHint: 'ਇਸ ਫੋਨ ਉੱਤੇ ਇੰਟੀਗ੍ਰਿਟੀ ਸੀਲ ਬਣਾਓ', verify: 'ਰਿਪੋਰਟ ਜਾਂਚੋ', verifyHint: 'ਸੰਭਾਲੀ ਫੋਟੋ ਜਾਂ ਸੀਲ ਜਾਂਚੋ', reports: 'ਮੇਰੀਆਂ ਰਿਪੋਰਟਾਂ', reportsHint: 'ਸੰਭਾਲੀਆਂ ਰਿਪੋਰਟਾਂ ਵੇਖੋ', farm: 'ਮੇਰਾ ਖੇਤ', farmHint: 'ਆਪਣੇ ਖੇਤ ਦੀ ਜਾਣਕਾਰੀ', support: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ', supportHint: 'ਐਪ ਵਰਤਣ ਲਈ ਮਦਦ ਲਵੋ', badge: 'ਤੁਹਾਡਾ ਖੇਤ, ਸਾਡੀ ਪਹਿਲ',
  },
  hi: {
    greeting: 'फसल नुकसान से जलवायु तैयारी की ओर', help: 'जोखिम से पहले तैयारी करें। नुकसान दर्ज करें। आगे की सलाह देखें और खेत को मजबूत बनाएँ।',
    prepare: 'मौसम के लिए तैयारी', prepareHint: 'बचाव के सुझाव देखें। लाइव मौसम चेतावनी जुड़ी नहीं है।', prepareAction: 'बचाव के कदम',
    report: 'फसल नुकसान की रिपोर्ट', reportHint: 'फसल, नुकसान, तारीख और फोटो इसी फ़ोन में सहेजें।', reportAction: 'रिपोर्ट शुरू करें',
    recover: 'फसल सँभालने की सलाह', recoverHint: 'फसल की समस्या के सामान्य कदम देखें। उपचार के लिए स्थानीय विशेषज्ञ से पूछें।', recoverAction: 'फसल की सलाह देखें',
    rebuild: 'बेहतर तरीकों से फिर बनाएँ', rebuildHint: 'पानी, मिट्टी और फसल अवशेष के काम दर्ज करें। ये आपके नोट हैं।', rebuildAction: 'खेती के काम दर्ज करें',
    prepareStage: 'तैयारी', reportStage: 'रिपोर्ट', recoverStage: 'सँभाल', rebuildStage: 'फिर बनाएँ',
    listen: 'ये विकल्प सुनें', spoken: 'मौसम की तैयारी करें, फसल नुकसान दर्ज करें, आगे की सलाह देखें, या खेती के काम लिखें।',
    volunteer: 'स्वयंसेवक से मदद लें', volunteerHint: 'मैदानी सहायक ऐप चलाने में मदद कर सकता है।',
    timer: 'रिपोर्ट टाइमर', elapsedReport: 'आपकी सबसे नई सहेजी रिपोर्ट से बीता समय', elapsedSession: 'इस बार ऐप खोलने से बीता समय', localTimer: 'फ़ोन का टाइमर · सरकारी समय-सीमा नहीं',
    tools: 'और मदद व साधन', officer: 'अधिकारी समीक्षा', officerHint: 'स्थानीय डेमो · सरकारी जाँच नहीं', seal: 'सबूत फ़ाइल सील करें', sealHint: 'इस फ़ोन पर इंटीग्रिटी सील बनाएँ', verify: 'रिपोर्ट जाँचें', verifyHint: 'सहेजी तस्वीर या सील जाँचें', reports: 'मेरी रिपोर्ट', reportsHint: 'सहेजी रिपोर्ट देखें', farm: 'मेरा खेत', farmHint: 'अपने खेत की जानकारी', support: 'मदद और सहायता', supportHint: 'ऐप इस्तेमाल करने में मदद लें', badge: 'आपका खेत, हमारी प्राथमिकता',
  },
} as const;

export default function FarmerHome({ language, onOpen, onSpeak }: FarmerHomeProps) {
  const t = copy[language];
  const [sessionStartedAt] = useState(() => Date.now());
  const [reportStartedAt, setReportStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const latest = storageService.getReports()
      .map((report) => Date.parse(report.createdAt))
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];
    if (latest) setReportStartedAt(latest);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - (reportStartedAt ?? sessionStartedAt)) / 1000));
  const timer = [Math.floor(elapsed / 3600), Math.floor((elapsed % 3600) / 60), elapsed % 60]
    .map((part) => String(part).padStart(2, '0')).join(':');
  const choices = [
    { className: 'choice-prepare', stage: t.prepareStage, icon: CloudRain, title: t.prepare, hint: t.prepareHint, action: t.prepareAction, path: ROUTES.waterSoil },
    { className: 'choice-report', stage: t.reportStage, icon: Camera, title: t.report, hint: t.reportHint, action: t.reportAction, path: ROUTES.farmer },
    { className: 'choice-recover', stage: t.recoverStage, icon: HeartPulse, title: t.recover, hint: t.recoverHint, action: t.recoverAction, path: ROUTES.cropHelp },
    { className: 'choice-rebuild', stage: t.rebuildStage, icon: Sprout, title: t.rebuild, hint: t.rebuildHint, action: t.rebuildAction, path: ROUTES.farm },
  ];

  return (
    <section class="farmer-home" aria-labelledby="farmer-home-title">
      <header class="home-hero">
        <img class="home-hero-image" src="/farm-paddy.jpg" alt="" />
        <div class="home-hero-shade" />
        <div class="home-hero-copy">
          <span class="farmer-eyebrow"><Leaf size={16} aria-hidden="true" />{t.badge}</span>
          <h1 id="farmer-home-title">{t.greeting}</h1>
          <p>{t.help}</p>
          <button class="voice-help-button" onClick={() => onSpeak(t.spoken)}><Volume2 size={19} aria-hidden="true" />{t.listen}</button>
          <button class="voice-help-button" type="button" onClick={() => onSpeak('ਸਤ ਸ੍ਰੀ ਅਕਾਲ। ਇਹ ਪੰਜਾਬੀ ਆਵਾਜ਼ ਦੀ ਜਾਂਚ ਹੈ।', 'pa')}>ਪੰਜਾਬੀ ਆਵਾਜ਼ ਜਾਂਚੋ</button>
        </div>
      </header>

      <div class="farmer-choice-list" aria-label={language === 'pa' ? 'ਮੁੱਖ ਚੋਣਾਂ' : language === 'hi' ? 'मुख्य विकल्प' : 'Main choices'}>
        {choices.map(({ className, stage, icon: Icon, title, hint, action, path }) => (
          <button class={`farmer-choice-card ${className}`} onClick={() => onOpen(path)} key={path}>
            <span class="farmer-choice-art" aria-hidden="true"><Icon size={34} strokeWidth={1.9} /></span>
            <span class="farmer-choice-copy"><small class="journey-stage-label">{stage}</small><strong>{title}</strong><small>{hint}</small></span>
            <span class="farmer-choice-action">{action}<ChevronRight size={18} aria-hidden="true" /></span>
          </button>
        ))}
      </div>

      <div class="home-community-row">
        <section class="home-report-timer" aria-label={t.timer}>
          <span class="home-timer-icon"><Clock3 size={22} /></span>
          <div class="home-timer-content"><strong>{t.timer}</strong><span class="home-timer-value" aria-live="off">{timer}</span><small>{reportStartedAt ? t.elapsedReport : t.elapsedSession} · {t.localTimer}</small></div>
        </section>
        <button class="home-volunteer-action" onClick={() => onOpen(ROUTES.helper)}>
          <span class="home-tool-icon"><HandHelping size={23} /></span>
          <span><strong>{t.volunteer}</strong><small>{t.volunteerHint}</small></span>
          <ChevronRight size={21} aria-hidden="true" />
        </button>
      </div>

      <section class="home-tools-section" aria-label={t.tools}>
        <div class="home-tools-heading"><div><h2>{t.tools}</h2><p>{language === 'pa' ? 'ਵਾਧੂ ਸਹੂਲਤਾਂ ਅਤੇ ਜਾਣਕਾਰੀ ਵੇਖੋ' : language === 'hi' ? 'और सुविधाएँ और जानकारी देखें' : 'Access additional features and resources'}</p></div><button onClick={() => onOpen(ROUTES.profile)}>{language === 'pa' ? 'ਸਾਰੇ ਵੇਖੋ' : language === 'hi' ? 'सभी देखें' : 'View all tools'}<ChevronRight size={17} /></button></div>
        <div class="home-tool-grid">
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.reports)}><span class="home-tool-icon"><ClipboardList size={22} /></span><span><strong>{t.reports}</strong><small>{t.reportsHint}</small></span><ChevronRight class="home-tool-arrow" size={17} /></button>
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.farm)}><span class="home-tool-icon"><Sprout size={22} /></span><span><strong>{t.farm}</strong><small>{t.farmHint}</small></span><ChevronRight class="home-tool-arrow" size={17} /></button>
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.officer)}><span class="home-tool-icon"><BadgeCheck size={22} /></span><span><strong>{t.officer}</strong><small>{t.officerHint}</small></span></button>
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.engine)}><span class="home-tool-icon"><LockKeyhole size={22} /></span><span><strong>{t.seal}</strong><small>{t.sealHint}</small></span></button>
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.verify)}><span class="home-tool-icon"><ScanLine size={22} /></span><span><strong>{t.verify}</strong><small>{t.verifyHint}</small></span></button>
          <button class="home-tool-card" onClick={() => onOpen(ROUTES.profile)}><span class="home-tool-icon"><CircleHelp size={22} /></span><span><strong>{t.support}</strong><small>{t.supportHint}</small></span></button>
        </div>
      </section>
    </section>
  );
}
