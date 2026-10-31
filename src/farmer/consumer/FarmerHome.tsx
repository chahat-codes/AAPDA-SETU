import { Camera, Droplets, Leaf, ChevronRight, Volume2, HandHelping, Clock3, BadgeCheck, LockKeyhole, ScanLine, ClipboardList, Sprout, CircleHelp } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import type { AppLanguage } from '@shared/voice';
import { ROUTES } from '@shared/constants';
import { storageService } from '../services/storageService';

interface FarmerHomeProps {
  language: AppLanguage;
  onOpen: (path: string) => void;
  onSpeak: (text: string) => void;
}

const copy = {
  en: {
    greeting: 'How can we help your farm today?', help: 'Report damage, protect your crops, and learn simple ways to care for your farm.',
    report: 'Report crop damage', reportHint: 'Save photos and details about damage.', reportAction: 'Start a report',
    crop: 'Save my crop', cropHint: 'Find simple next steps for a crop problem.', cropAction: 'Find crop help',
    water: 'Save water & soil', waterHint: 'Explore practical care for water and soil.', waterAction: 'See simple guides',
    listen: 'Listen to these choices', spoken: 'Choose: report crop damage, save my crop, or save water and soil.',
    volunteer: 'Seek volunteer help', volunteerHint: 'A field helper can guide you through the app.',
    timer: 'Report timer', elapsedReport: 'Time since your latest saved report', elapsedSession: 'Time since this visit started', localTimer: 'Local timer · not a government deadline',
    tools: 'More help and tools', officer: 'Officer review', officerHint: 'Local demo · no official review', seal: 'Seal evidence files', sealHint: 'Create an integrity seal on this device', verify: 'Check a report', verifyHint: 'Check a saved photo or its seal', reports: 'My Reports', reportsHint: 'View saved reports', farm: 'My Farm', farmHint: 'Track your farm', support: 'Help & Support', supportHint: 'Get help using the app', badge: 'YOUR FARM, OUR PRIORITY',
  },
  pa: {
    greeting: 'ਅੱਜ ਤੁਹਾਡੇ ਖੇਤ ਲਈ ਕੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?', help: 'ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ ਕਰੋ, ਫਸਲ ਬਚਾਓ ਅਤੇ ਖੇਤ ਦੀ ਸੰਭਾਲ ਲਈ ਸੌਖੇ ਤਰੀਕੇ ਜਾਣੋ।',
    report: 'ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ', reportHint: 'ਨੁਕਸਾਨ ਦੀਆਂ ਫੋਟੋਆਂ ਅਤੇ ਜਾਣਕਾਰੀ ਸੰਭਾਲੋ।', reportAction: 'ਰਿਪੋਰਟ ਸ਼ੁਰੂ ਕਰੋ',
    crop: 'ਮੇਰੀ ਫਸਲ ਬਚਾਓ', cropHint: 'ਫਸਲ ਦੀ ਸਮੱਸਿਆ ਲਈ ਸੌਖੇ ਅਗਲੇ ਕਦਮ ਵੇਖੋ।', cropAction: 'ਫਸਲ ਲਈ ਮਦਦ',
    water: 'ਪਾਣੀ ਅਤੇ ਮਿੱਟੀ ਬਚਾਓ', waterHint: 'ਪਾਣੀ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸੰਭਾਲ ਦੇ ਸੌਖੇ ਤਰੀਕੇ।', waterAction: 'ਸੌਖੇ ਸੁਝਾਅ ਵੇਖੋ',
    listen: 'ਇਹ ਚੋਣਾਂ ਸੁਣੋ', spoken: 'ਚੁਣੋ: ਫਸਲ ਦੇ ਨੁਕਸਾਨ ਦੀ ਰਿਪੋਰਟ, ਮੇਰੀ ਫਸਲ ਬਚਾਓ, ਜਾਂ ਪਾਣੀ ਅਤੇ ਮਿੱਟੀ ਬਚਾਓ।',
    volunteer: 'ਵਲੰਟੀਅਰ ਤੋਂ ਮਦਦ ਲਵੋ', volunteerHint: 'ਖੇਤ ਸਹਾਇਕ ਐਪ ਵਰਤਣ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    timer: 'ਰਿਪੋਰਟ ਟਾਈਮਰ', elapsedReport: 'ਤੁਹਾਡੀ ਨਵੀਂ ਸੰਭਾਲੀ ਰਿਪੋਰਟ ਤੋਂ ਬੀਤਿਆ ਸਮਾਂ', elapsedSession: 'ਇਸ ਵਾਰ ਐਪ ਖੋਲ੍ਹਣ ਤੋਂ ਬੀਤਿਆ ਸਮਾਂ', localTimer: 'ਫੋਨ ਦਾ ਟਾਈਮਰ · ਸਰਕਾਰੀ ਮਿਆਦ ਨਹੀਂ',
    tools: 'ਹੋਰ ਮਦਦ ਅਤੇ ਸਹੂਲਤਾਂ', officer: 'ਅਧਿਕਾਰੀ ਸਮੀਖਿਆ', officerHint: 'ਸਥਾਨਕ ਡੈਮੋ · ਸਰਕਾਰੀ ਜਾਂਚ ਨਹੀਂ', seal: 'ਸਬੂਤ ਫਾਈਲਾਂ ਸੀਲ ਕਰੋ', sealHint: 'ਇਸ ਫੋਨ ਉੱਤੇ ਇੰਟੀਗ੍ਰਿਟੀ ਸੀਲ ਬਣਾਓ', verify: 'ਰਿਪੋਰਟ ਜਾਂਚੋ', verifyHint: 'ਸੰਭਾਲੀ ਫੋਟੋ ਜਾਂ ਸੀਲ ਜਾਂਚੋ', reports: 'ਮੇਰੀਆਂ ਰਿਪੋਰਟਾਂ', reportsHint: 'ਸੰਭਾਲੀਆਂ ਰਿਪੋਰਟਾਂ ਵੇਖੋ', farm: 'ਮੇਰਾ ਖੇਤ', farmHint: 'ਆਪਣੇ ਖੇਤ ਦੀ ਜਾਣਕਾਰੀ', support: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ', supportHint: 'ਐਪ ਵਰਤਣ ਲਈ ਮਦਦ ਲਵੋ', badge: 'ਤੁਹਾਡਾ ਖੇਤ, ਸਾਡੀ ਪਹਿਲ',
  },
  hi: {
    greeting: 'आज आपके खेत के लिए क्या मदद चाहिए?', help: 'नुकसान की रिपोर्ट करें, फसल बचाएँ और खेत की देखभाल के आसान तरीके जानें।',
    report: 'फसल नुकसान की रिपोर्ट', reportHint: 'नुकसान की तस्वीरें और जानकारी सहेजें।', reportAction: 'रिपोर्ट शुरू करें',
    crop: 'मेरी फसल बचाएँ', cropHint: 'फसल की समस्या के आसान अगले कदम देखें।', cropAction: 'फसल की मदद देखें',
    water: 'पानी और मिट्टी बचाएँ', waterHint: 'पानी और मिट्टी की देखभाल के आसान तरीके।', waterAction: 'आसान सुझाव देखें',
    listen: 'ये विकल्प सुनें', spoken: 'चुनें: फसल नुकसान की रिपोर्ट, मेरी फसल बचाएँ, या पानी और मिट्टी बचाएँ।',
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
    { className: 'choice-report', icon: Camera, title: t.report, hint: t.reportHint, action: t.reportAction, path: ROUTES.farmer },
    { className: 'choice-crop', icon: Leaf, title: t.crop, hint: t.cropHint, action: t.cropAction, path: ROUTES.cropHelp },
    { className: 'choice-water', icon: Droplets, title: t.water, hint: t.waterHint, action: t.waterAction, path: ROUTES.waterSoil },
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
        </div>
      </header>

      <div class="farmer-choice-list" aria-label={language === 'pa' ? 'ਮੁੱਖ ਚੋਣਾਂ' : language === 'hi' ? 'मुख्य विकल्प' : 'Main choices'}>
        {choices.map(({ className, icon: Icon, title, hint, action, path }) => (
          <button class={`farmer-choice-card ${className}`} onClick={() => onOpen(path)} key={path}>
            <span class="farmer-choice-art" aria-hidden="true"><Icon size={34} strokeWidth={1.9} /></span>
            <span class="farmer-choice-copy"><strong>{title}</strong><small>{hint}</small></span>
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
