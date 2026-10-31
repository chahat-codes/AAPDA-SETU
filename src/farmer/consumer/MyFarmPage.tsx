import { useEffect, useState } from 'preact/hooks';
import { Check, Droplets, Leaf, MapPin, Save, Sprout } from 'lucide-preact';
import type { AppLanguage } from '@shared/voice';

const PROFILE_KEY = 'aapdasetu-farm-profile-v1';
const ACTIVITY_KEY = 'aapdasetu-farm-activities-v1';
type FarmProfile = { crop: string; village: string; area: string };
type Activities = { water: string | null; soil: string | null; residue: string | null };
const emptyProfile: FarmProfile = { crop: '', village: '', area: '' };
const emptyActivities: Activities = { water: null, soil: null, residue: null };
const copy = {
  en: { title: 'My farm', intro: 'Keep a few useful details and simple activity records.', crop: 'Main crop', village: 'Village', area: 'Farm size (acres)', save: 'Save farm details', saved: 'Saved on this phone', placeholderCrop: 'Choose or enter a crop', placeholderVillage: 'Enter village', placeholderArea: 'For example, 2.5', records: 'Farm activities', recordsHint: 'Tap after you do an activity. These are your notes, not verified measurements.', water: 'Saved water', waterHint: 'I checked the soil before watering', soil: 'Cared for soil', soilHint: 'I kept a crop or soil note / asked about a soil test', residue: 'Managed crop residue', residueHint: 'I reused or arranged collection of crop residue', mark: 'Mark done', undo: 'Undo', recorded: 'Recorded', local: 'Your details stay on this phone.' },
  hi: { title: 'मेरा खेत', intro: 'कुछ काम की जानकारी और खेती के काम का रिकॉर्ड रखें।', crop: 'मुख्य फसल', village: 'गाँव', area: 'खेत का आकार (एकड़)', save: 'खेत की जानकारी सहेजें', saved: 'इस फ़ोन में सहेजी गई', placeholderCrop: 'फसल चुनें या लिखें', placeholderVillage: 'गाँव लिखें', placeholderArea: 'जैसे, 2.5', records: 'खेती के काम', recordsHint: 'काम करने के बाद चुनें। ये आपके नोट हैं, जाँचे हुए माप नहीं।', water: 'पानी बचाया', waterHint: 'पानी देने से पहले मिट्टी की नमी देखी', soil: 'मिट्टी की देखभाल की', soilHint: 'फसल/मिट्टी का नोट रखा या मिट्टी जाँच के बारे में पूछा', residue: 'फसल अवशेष सँभाले', residueHint: 'फसल अवशेष का दोबारा उपयोग या संग्रह तय किया', mark: 'पूरा हुआ', undo: 'हटाएँ', recorded: 'दर्ज', local: 'जानकारी इसी फ़ोन में रहती है।' },
  pa: { title: 'ਮੇਰਾ ਖੇਤ', intro: 'ਕੰਮ ਦੀ ਜਾਣਕਾਰੀ ਅਤੇ ਖੇਤੀ ਦੇ ਕੰਮ ਦਾ ਸੌਖਾ ਰਿਕਾਰਡ ਰੱਖੋ।', crop: 'ਮੁੱਖ ਫਸਲ', village: 'ਪਿੰਡ', area: 'ਖੇਤ ਦਾ ਆਕਾਰ (ਏਕੜ)', save: 'ਖੇਤ ਦੀ ਜਾਣਕਾਰੀ ਸੰਭਾਲੋ', saved: 'ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੀ', placeholderCrop: 'ਫਸਲ ਚੁਣੋ ਜਾਂ ਲਿਖੋ', placeholderVillage: 'ਪਿੰਡ ਲਿਖੋ', placeholderArea: 'ਜਿਵੇਂ, 2.5', records: 'ਖੇਤੀ ਦੇ ਕੰਮ', recordsHint: 'ਕੰਮ ਕਰਨ ਤੋਂ ਬਾਅਦ ਚੁਣੋ। ਇਹ ਤੁਹਾਡੇ ਨੋਟ ਹਨ, ਜਾਂਚੇ ਹੋਏ ਮਾਪ ਨਹੀਂ।', water: 'ਪਾਣੀ ਬਚਾਇਆ', waterHint: 'ਪਾਣੀ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ ਵੇਖੀ', soil: 'ਮਿੱਟੀ ਦੀ ਸੰਭਾਲ ਕੀਤੀ', soilHint: 'ਫਸਲ/ਮਿੱਟੀ ਦਾ ਨੋਟ ਰੱਖਿਆ ਜਾਂ ਮਿੱਟੀ ਜਾਂਚ ਬਾਰੇ ਪੁੱਛਿਆ', residue: 'ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਸੰਭਾਲੀ', residueHint: 'ਰਹਿੰਦ-ਖੂੰਹਦ ਮੁੜ ਵਰਤੀ ਜਾਂ ਇਕੱਠੀ ਕਰਨ ਦਾ ਪ੍ਰਬੰਧ ਕੀਤਾ', mark: 'ਹੋ ਗਿਆ', undo: 'ਹਟਾਓ', recorded: 'ਦਰਜ ਕੀਤਾ', local: 'ਜਾਣਕਾਰੀ ਸਿਰਫ਼ ਇਸ ਫੋਨ ਵਿੱਚ ਰਹੇਗੀ।' },
} as const;

export default function MyFarmPage({ language }: { language: AppLanguage }) {
  const [profile, setProfile] = useState<FarmProfile>(emptyProfile);
  const [activities, setActivities] = useState<Activities>(emptyActivities);
  const [saved, setSaved] = useState(false);
  const [activityMessage, setActivityMessage] = useState('');
  const t = copy[language];
  useEffect(() => {
    try {
      const profileValue = localStorage.getItem(PROFILE_KEY);
      const activityValue = localStorage.getItem(ACTIVITY_KEY);
      if (profileValue) setProfile({ ...emptyProfile, ...JSON.parse(profileValue) });
      if (activityValue) setActivities({ ...emptyActivities, ...JSON.parse(activityValue) });
    } catch { /* keep an empty editable profile */ }
  }, []);
  const save = (event: Event) => {
    event.preventDefault();
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); setSaved(true); window.setTimeout(() => setSaved(false), 2500); } catch { setSaved(false); }
  };
  const toggleActivity = (key: keyof Activities) => {
    const next = { ...activities, [key]: activities[key] ? null : new Date().toISOString() };
    setActivities(next);
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
      setActivityMessage(next[key] ? `${t.recorded}: ${t[key]}` : t.undo);
    } catch { setActivityMessage(language === 'pa' ? 'ਸੰਭਾਲਿਆ ਨਹੀਂ ਜਾ ਸਕਿਆ।' : language === 'hi' ? 'सहेजा नहीं जा सका।' : 'Could not save this note.'); }
    window.setTimeout(() => setActivityMessage(''), 2500);
  };
  const activityItems = [
    { key: 'water' as const, icon: Droplets, title: t.water, hint: t.waterHint },
    { key: 'soil' as const, icon: Sprout, title: t.soil, hint: t.soilHint },
    { key: 'residue' as const, icon: Leaf, title: t.residue, hint: t.residueHint },
  ];
  return (
    <main class="simple-page">
      <div class="simple-page-heading"><span class="farmer-eyebrow"><Sprout size={16} /> AapdaSetu</span><h1>{t.title}</h1><p>{t.intro}</p></div>
      <form class="farm-profile-card" onSubmit={save}>
        <label>{t.crop}<input value={profile.crop} placeholder={t.placeholderCrop} onInput={(e) => setProfile({ ...profile, crop: (e.currentTarget as HTMLInputElement).value })} /></label>
        <label>{t.village}<span class="field-with-icon"><MapPin size={18} /><input value={profile.village} placeholder={t.placeholderVillage} onInput={(e) => setProfile({ ...profile, village: (e.currentTarget as HTMLInputElement).value })} /></span></label>
        <label>{t.area}<input inputMode="decimal" value={profile.area} placeholder={t.placeholderArea} onInput={(e) => setProfile({ ...profile, area: (e.currentTarget as HTMLInputElement).value })} /></label>
        <button class="primary-action" type="submit"><Save size={19} />{saved ? `✓ ${t.saved}` : t.save}</button>
      </form>
      <section class="farm-activity-section" aria-labelledby="farm-activity-title">
        <div class="farm-activity-heading"><h2 id="farm-activity-title">{t.records}</h2><p>{t.recordsHint}</p></div>
        <div class="farm-activity-list">
          {activityItems.map(({ key, icon: Icon, title, hint }) => {
            const done = Boolean(activities[key]);
            return <article class={`farm-activity-card ${done ? 'farm-activity-done' : ''}`} key={key}>
              <span class="farm-activity-icon"><Icon size={23} /></span>
              <div class="farm-activity-copy"><strong>{title}</strong><small>{hint}</small>{done && <small class="farm-activity-date">{new Date(activities[key] as string).toLocaleDateString(language === 'pa' ? 'pa-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}</small>}</div>
              <button type="button" class="farm-activity-toggle" aria-pressed={done} onClick={() => toggleActivity(key)}>{done ? <><Check size={17} />{t.undo}</> : t.mark}</button>
            </article>;
          })}
        </div>
        {activityMessage && <p class="activity-feedback" role="status">{activityMessage}</p>}
      </section>
      <p class="local-storage-note">🔒 {t.local}</p>
    </main>
  );
}
