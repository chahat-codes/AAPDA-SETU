import { ShieldCheck, UsersRound, BadgeCheck, Wrench, Zap } from 'lucide-preact';
import type { AppLanguage } from '@shared/voice';
import { ROUTES } from '@shared/constants';

interface ProfilePageProps { language: AppLanguage; onOpen: (path: string) => void; }
const copy = {
  en: { title: 'Profile & help', privacy: 'Your reports stay on this phone.', privacyHint: 'This demo does not send reports to a government office or insurance company.', language: 'Language', tools: 'More help and tools', helper: 'Get help from a volunteer', officer: 'Demo officer review', officerHint: 'Local demonstration only · no official review', engine: 'Try the evidence seal demo', engineHint: 'A local demo seal does not prove official verification', verify: 'Try report verification demo', verifyHint: 'This does not verify a government report' },
  hi: { title: 'प्रोफ़ाइल और मदद', privacy: 'आपकी रिपोर्ट इसी फ़ोन में रहती हैं।', privacyHint: 'यह डेमो रिपोर्ट सरकारी दफ़्तर या बीमा कंपनी को नहीं भेजता।', language: 'भाषा', tools: 'और मदद व साधन', helper: 'स्वयंसेवक से मदद लें', officer: 'अधिकारी जाँच का डेमो', officerHint: 'सिर्फ़ स्थानीय डेमो · सरकारी जाँच नहीं', engine: 'सबूत सील का डेमो', engineHint: 'स्थानीय डेमो सील सरकारी सत्यापन नहीं है', verify: 'रिपोर्ट जाँच का डेमो', verifyHint: 'इससे सरकारी रिपोर्ट सत्यापित नहीं होती' },
  pa: { title: 'ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਮਦਦ', privacy: 'ਤੁਹਾਡੀਆਂ ਰਿਪੋਰਟਾਂ ਇਸੇ ਫੋਨ ਵਿੱਚ ਰਹਿੰਦੀਆਂ ਹਨ।', privacyHint: 'ਇਹ ਡੈਮੋ ਰਿਪੋਰਟ ਸਰਕਾਰੀ ਦਫ਼ਤਰ ਜਾਂ ਬੀਮਾ ਕੰਪਨੀ ਨੂੰ ਨਹੀਂ ਭੇਜਦਾ।', language: 'ਭਾਸ਼ਾ', tools: 'ਹੋਰ ਮਦਦ ਅਤੇ ਸਹੂਲਤਾਂ', helper: 'ਵਲੰਟੀਅਰ ਤੋਂ ਮਦਦ ਲਵੋ', officer: 'ਅਧਿਕਾਰੀ ਜਾਂਚ ਦਾ ਡੈਮੋ', officerHint: 'ਸਿਰਫ਼ ਸਥਾਨਕ ਡੈਮੋ · ਸਰਕਾਰੀ ਜਾਂਚ ਨਹੀਂ', engine: 'ਸਬੂਤ ਸੀਲ ਦਾ ਡੈਮੋ', engineHint: 'ਸਥਾਨਕ ਡੈਮੋ ਸੀਲ ਸਰਕਾਰੀ ਤਸਦੀਕ ਨਹੀਂ', verify: 'ਰਿਪੋਰਟ ਜਾਂਚ ਦਾ ਡੈਮੋ', verifyHint: 'ਇਸ ਨਾਲ ਸਰਕਾਰੀ ਰਿਪੋਰਟ ਦੀ ਤਸਦੀਕ ਨਹੀਂ ਹੁੰਦੀ' },
} as const;

export default function ProfilePage({ language, onOpen }: ProfilePageProps) {
  const t = copy[language];
  return (
    <main class="simple-page profile-page">
      <div class="simple-page-heading"><span class="farmer-eyebrow">👤 AapdaSetu</span><h1>{t.title}</h1></div>
      <section class="privacy-card"><span class="privacy-icon"><ShieldCheck size={28} /></span><div><h2>{t.privacy}</h2><p>{t.privacyHint}</p></div></section>
      <section class="profile-tool-section"><h2>{t.language}</h2><p>{language === 'pa' ? 'ਉੱਪਰੋਂ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ।' : language === 'hi' ? 'ऊपर से अपनी भाषा चुनें।' : 'Choose your language above.'}</p></section>
      <section class="profile-tool-section"><h2><Wrench size={20} /> {t.tools}</h2>
        <button class="profile-tool-link" onClick={() => onOpen(ROUTES.helper)}><UsersRound size={22} /><span>{t.helper}</span><span aria-hidden="true">›</span></button>
        <button class="profile-tool-link" onClick={() => onOpen(ROUTES.officer)}><BadgeCheck size={22} /><span>{t.officer}<small>{t.officerHint}</small></span><span aria-hidden="true">›</span></button>
        <button class="profile-tool-link" onClick={() => onOpen(ROUTES.engine)}><Zap size={22} /><span>{t.engine}<small>{t.engineHint}</small></span><span aria-hidden="true">›</span></button>
        <button class="profile-tool-link" onClick={() => onOpen(ROUTES.verify)}><ShieldCheck size={22} /><span>{t.verify}<small>{t.verifyHint}</small></span><span aria-hidden="true">›</span></button>
      </section>
    </main>
  );
}
