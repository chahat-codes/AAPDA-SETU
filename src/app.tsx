import { useEffect, useState } from 'preact/hooks';
import Router, { Route, route } from 'preact-router';
import { ClipboardList, House, Sprout, UserRound, Volume2 } from 'lucide-preact';
import { ROUTES } from '@shared/constants';
import { isSpeechSynthesisSupported, speakText, stopSpeaking, type AppLanguage } from '@shared/voice';
import { playClick } from '@shared/sound';
import FarmerPage from '@farmer/FarmerPage';
import FarmerHome from '@farmer/consumer/FarmerHome';
import GuidesPage from '@farmer/consumer/GuidesPage';
import MyReportsPage from '@farmer/consumer/MyReportsPage';
import MyFarmPage from '@farmer/consumer/MyFarmPage';
import ProfilePage from '@farmer/consumer/ProfilePage';
import HelperPage from '@helper/HelperPage';
import OfficerPage from '@officer/OfficerPage';
import EnginePage from '@engine/EnginePage';
import VerifyPage from '@verify/VerifyPage';
import './farmer/consumer/consumer.css';

const CORE_TABS = [
  { path: ROUTES.home, label: { en: 'Home', hi: 'होम', pa: 'ਘਰ' }, Icon: House },
  { path: ROUTES.reports, label: { en: 'My Reports', hi: 'मेरी रिपोर्ट', pa: 'ਮੇਰੀਆਂ ਰਿਪੋਰਟਾਂ' }, Icon: ClipboardList },
  { path: ROUTES.farm, label: { en: 'My Farm', hi: 'मेरा खेत', pa: 'ਮੇਰਾ ਖੇਤ' }, Icon: Sprout },
];
const LANGUAGE_LABELS: Record<AppLanguage, string> = { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ' };

function readLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem('aapdasetu-language');
    if (saved === 'en' || saved === 'hi' || saved === 'pa') return saved;
  } catch { /* use the accessible default */ }
  return 'pa';
}

function FarmerWorkflowRoute({ onExit, language, onLanguageChange }: { onExit: () => void; language: AppLanguage; onLanguageChange: (language: AppLanguage) => void }) {
  const reportId = new URLSearchParams(window.location.search).get('report') || undefined;
  return <FarmerPage initialReportId={reportId} onExit={onExit} initialLanguage={language} onLanguageChange={onLanguageChange} />;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [language, setLanguage] = useState<AppLanguage>(readLanguage);
  const [entryStage, setEntryStage] = useState<'splash' | 'language' | 'app'>(() => {
    try { return localStorage.getItem('aapdasetu-onboarding-v1') === 'complete' ? 'app' : 'splash'; }
    catch { return 'splash'; }
  });
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState('');
  const path = currentPath.split('?')[0];
  const isWorkflow = path === ROUTES.farmer;
  const isConsumerRoute = [ROUTES.home, ROUTES.reports, ROUTES.farm, ROUTES.profile, ROUTES.cropHelp, ROUTES.waterSoil].includes(path as never);

  useEffect(() => {
    if (entryStage !== 'app') return;
    try { localStorage.setItem('aapdasetu-language', language); } catch { /* language remains active for this visit */ }
  }, [language, entryStage]);

  useEffect(() => {
    if (entryStage !== 'splash') return;
    const timer = window.setTimeout(() => setEntryStage('language'), 900);
    return () => window.clearTimeout(timer);
  }, [entryStage]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const go = (to: string) => {
    playClick();
    route(to);
  };
  const chooseStartupLanguage = (nextLanguage: AppLanguage) => {
    playClick();
    setLanguage(nextLanguage);
    try { localStorage.setItem('aapdasetu-language', nextLanguage); localStorage.setItem('aapdasetu-onboarding-v1', 'complete'); }
    catch { /* continue into the app even when browser storage is unavailable */ }
    setEntryStage('app');
  };
  const handleRouteChange = (event: { url: string }) => {
    setCurrentPath(event.url.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const speak = (text: string) => {
    if (!isSpeechSynthesisSupported()) {
      setNotice(language === 'pa' ? 'ਇਸ ਫੋਨ ਵਿੱਚ ਆਵਾਜ਼ ਸਹਾਇਤਾ ਉਪਲਬਧ ਨਹੀਂ।' : language === 'hi' ? 'इस फ़ोन में आवाज़ सहायता उपलब्ध नहीं है।' : 'Spoken guidance is not supported on this device.');
      return;
    }
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakText(
      text,
      language,
      () => setSpeaking(false),
      (message) => { setSpeaking(false); setNotice(message); },
      language === 'pa' ? () => setNotice('Punjabi voice ਨਹੀਂ ਮਿਲੀ। ਐਪ ਹੁਣ ਫੋਨ ਦੀ ਮੂਲ ਆਵਾਜ਼ ਨਾਲ ਕੋਸ਼ਿਸ਼ ਕਰੇਗੀ। Punjabi speech voice ਲਈ ਫੋਨ ਦੀ voice settings ਵੇਖੋ; ਆਵਾਜ਼ ਨਾ ਚੱਲੇ ਤਾਂ ਲਿਖਤੀ ਹਦਾਇਤਾਂ ਵਰਤੋ।') : undefined,
    );
  };

  if (entryStage !== 'app') {
    return (
      <main class={`entry-screen ${entryStage === 'splash' ? 'entry-splash' : 'entry-language'}`}>
        {entryStage === 'splash' ? (
          <section class="entry-brand-card" aria-label="AapdaSetu logo">
            <img class="entry-logo-art" src="/aapdasetu-logo.jpg" alt="AapdaSetu" />
          </section>
        ) : (
          <section class="entry-language-card" aria-labelledby="entry-language-title">
            <span class="entry-logo-mark entry-logo-small" aria-hidden="true">🌾</span>
            <p class="entry-brand-name">AapdaSetu</p>
            <h1 id="entry-language-title">Choose your language</h1>
            <p class="entry-language-subtitle">ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ · अपनी भाषा चुनें</p>
            <div class="entry-language-options" role="group" aria-label="Choose your language">
              {(['pa', 'hi', 'en'] as AppLanguage[]).map((lang) => (
                <button key={lang} type="button" onClick={() => chooseStartupLanguage(lang)}>
                  <span>{LANGUAGE_LABELS[lang]}</span><span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <div class={`app-layout ${isConsumerRoute ? 'consumer-app' : 'legacy-app'}`}>
      {!isWorkflow && (
        <header class="farmer-topbar">
          <button class="app-brand" onClick={() => go(ROUTES.home)} aria-label="AapdaSetu home">
            <span class="app-brand-mark" aria-hidden="true">🌾</span><span>AapdaSetu</span>
          </button>
          <div class="topbar-controls">
            <label class="language-switcher" aria-label="Choose language">
              <select aria-label="Choose language" value={language} onChange={(event) => { playClick(); setLanguage((event.currentTarget as HTMLSelectElement).value as AppLanguage); }}>
                {(['pa', 'hi', 'en'] as AppLanguage[]).map((lang) => <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>)}
              </select>
            </label>
            <button class={`topbar-voice ${speaking ? 'voice-active' : ''}`} aria-label={speaking ? 'Stop spoken help' : 'Listen to help'} onClick={() => speak(language === 'pa' ? 'ਆਪਦਾ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਆਪਣੀ ਲੋੜ ਚੁਣੋ।' : language === 'hi' ? 'आपदा सेतु में आपका स्वागत है। अपनी ज़रूरत चुनें।' : 'Welcome to AapdaSetu. Choose what you need.') }>
              <Volume2 size={20} /><span>{speaking ? '■' : ''}</span>
            </button>
            <button class="topbar-profile" onClick={() => go(ROUTES.profile)} aria-label={language === 'pa' ? 'ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਮਦਦ' : language === 'hi' ? 'प्रोफ़ाइल और मदद' : 'Profile and help'}><UserRound size={20} /></button>
          </div>
        </header>
      )}

      <main class={`app-main ${isWorkflow ? 'workflow-main' : ''}`}>
        <Router onChange={handleRouteChange}>
          <Route path={ROUTES.home} component={() => <FarmerHome language={language} onOpen={go} onSpeak={speak} />} />
          <Route path={ROUTES.farmer} component={() => <FarmerWorkflowRoute onExit={() => go(ROUTES.home)} language={language} onLanguageChange={setLanguage} />} />
          <Route path={ROUTES.reports} component={() => <MyReportsPage language={language} onStart={() => go(ROUTES.farmer)} onOpen={(id) => go(`${ROUTES.farmer}?report=${encodeURIComponent(id)}`)} />} />
          <Route path={ROUTES.farm} component={() => <MyFarmPage language={language} />} />
          <Route path={ROUTES.profile} component={() => <ProfilePage language={language} onOpen={go} />} />
          <Route path={ROUTES.cropHelp} component={() => <GuidesPage kind="crop" language={language} onSpeak={speak} />} />
          <Route path={ROUTES.waterSoil} component={() => <GuidesPage kind="water" language={language} onSpeak={speak} />} />
          <Route path={ROUTES.helper} component={() => <HelperPage language={language} onLanguageChange={setLanguage} />} />
          <Route path={ROUTES.officer} component={OfficerPage} />
          <Route path={ROUTES.engine} component={EnginePage} />
          <Route path={ROUTES.verify} component={VerifyPage} />
        </Router>
      </main>

      {!isWorkflow && (
        <nav class="farmer-bottom-nav" aria-label="Main navigation">
          {CORE_TABS.map(({ path: tabPath, label, Icon }) => {
            const active = path === tabPath;
            return <button key={tabPath} class={active ? 'bottom-tab bottom-tab-active' : 'bottom-tab'} aria-current={active ? 'page' : undefined} onClick={() => go(tabPath)}><Icon size={21} strokeWidth={active ? 2.4 : 1.8} /><span>{label[language]}</span></button>;
          })}
        </nav>
      )}
      {notice && <div class="farmer-notice" role="status">{notice}</div>}
    </div>
  );
}
