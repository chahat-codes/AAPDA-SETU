import { useState } from 'preact/hooks';
import { ArrowLeft, Bug, CloudRain, Droplets, Leaf, Sprout, Sun, Volume2, Wind } from 'lucide-preact';
import type { AppLanguage } from '@shared/voice';

type GuideKind = 'crop' | 'water';
interface GuidesPageProps { kind: GuideKind; language: AppLanguage; onSpeak: (text: string) => void; }
type Guide = { id: string; icon: typeof Leaf; title: Record<AppLanguage, string>; hint: Record<AppLanguage, string>; steps: Record<AppLanguage, string[]> };

const cropGuides: Guide[] = [
  { id: 'standing-water', icon: CloudRain, title: { en: 'Water in the field', hi: 'खेत में पानी भरना', pa: 'ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਭਰਨਾ' }, hint: { en: 'Flood or waterlogging', hi: 'बाढ़ या जलभराव', pa: 'ਹੜ੍ਹ ਜਾਂ ਪਾਣੀ ਖੜ੍ਹਨਾ' }, steps: { en: ['Stay out of deep or fast-moving water.', 'When it is safe, take a clear photo of the field.', 'Note the date and ask your local agriculture worker what to do next.'], hi: ['गहरे या तेज़ बहते पानी में न जाएँ।', 'सुरक्षित होने पर खेत की साफ़ तस्वीर लें।', 'तारीख लिखें और स्थानीय कृषि कार्यकर्ता से अगला कदम पूछें।'], pa: ['ਡੂੰਘੇ ਜਾਂ ਤੇਜ਼ ਵਗਦੇ ਪਾਣੀ ਵਿੱਚ ਨਾ ਜਾਓ।', 'ਸੁਰੱਖਿਅਤ ਹੋਣ ’ਤੇ ਖੇਤ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਲਵੋ।', 'ਤਾਰੀਖ ਲਿਖੋ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਤੋਂ ਅਗਲਾ ਕਦਮ ਪੁੱਛੋ।'] } },
  { id: 'insects', icon: Bug, title: { en: 'Insects or leaf spots', hi: 'कीड़े या पत्तों पर धब्बे', pa: 'ਕੀੜੇ ਜਾਂ ਪੱਤਿਆਂ ਉੱਤੇ ਧੱਬੇ' }, hint: { en: 'Pests or unusual marks', hi: 'कीट या अजीब निशान', pa: 'ਕੀੜੇ ਜਾਂ ਅਜੀਬ ਨਿਸ਼ਾਨ' }, steps: { en: ['Take a close photo of the affected leaves.', 'Keep one healthy and one affected leaf for comparison.', 'Do not mix or spray unknown chemicals. Ask a local crop expert.'], hi: ['प्रभावित पत्तों की पास से तस्वीर लें।', 'तुलना के लिए एक स्वस्थ और एक प्रभावित पत्ता रखें।', 'अनजान दवा न मिलाएँ या छिड़कें। स्थानीय कृषि विशेषज्ञ से पूछें।'], pa: ['ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਦੀ ਨੇੜਿਓਂ ਫੋਟੋ ਲਵੋ।', 'ਤੁਲਨਾ ਲਈ ਇੱਕ ਸਿਹਤਮੰਦ ਅਤੇ ਇੱਕ ਪ੍ਰਭਾਵਿਤ ਪੱਤਾ ਰੱਖੋ।', 'ਅਣਜਾਣ ਦਵਾਈ ਨਾ ਮਿਲਾਓ ਤੇ ਨਾ ਛਿੜਕੋ। ਸਥਾਨਕ ਮਾਹਰ ਤੋਂ ਪੁੱਛੋ।'] } },
  { id: 'dry-weather', icon: Sun, title: { en: 'Dry weather', hi: 'सूखा मौसम', pa: 'ਸੁੱਕਾ ਮੌਸਮ' }, hint: { en: 'Very little rain or dry plants', hi: 'कम बारिश या सूखे पौधे', pa: 'ਘੱਟ ਮੀਂਹ ਜਾਂ ਸੁੱਕੇ ਪੌਦੇ' }, steps: { en: ['Check the soil near the roots, not just the surface.', 'Take a photo and note when you last watered.', 'Ask locally before changing irrigation or using a treatment.'], hi: ['जड़ों के पास की मिट्टी देखें, सिर्फ ऊपर की नहीं।', 'तस्वीर लें और आख़िरी सिंचाई का दिन लिखें।', 'सिंचाई बदलने या दवा से पहले स्थानीय सलाह लें।'], pa: ['ਜੜ੍ਹਾਂ ਨੇੜੇ ਮਿੱਟੀ ਵੇਖੋ, ਸਿਰਫ਼ ਉੱਪਰਲੀ ਨਹੀਂ।', 'ਫੋਟੋ ਲਵੋ ਅਤੇ ਆਖ਼ਰੀ ਸਿੰਚਾਈ ਦੀ ਤਾਰੀਖ ਲਿਖੋ।', 'ਸਿੰਚਾਈ ਬਦਲਣ ਜਾਂ ਦਵਾਈ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'wind-hail', icon: Wind, title: { en: 'Wind or hail damage', hi: 'आँधी या ओले का नुकसान', pa: 'ਹਨੇਰੀ ਜਾਂ ਗੜਿਆਂ ਦਾ ਨੁਕਸਾਨ' }, hint: { en: 'Broken or flattened plants', hi: 'टूटे या गिरे पौधे', pa: 'ਟੁੱਟੇ ਜਾਂ ਡਿੱਗੇ ਪੌਦੇ' }, steps: { en: ['Wait until the weather is safe before going outside.', 'Photograph the field from a safe place.', 'Note the date and contact your local agriculture worker.'], hi: ['बाहर जाने से पहले मौसम सुरक्षित होने दें।', 'सुरक्षित जगह से खेत की तस्वीर लें।', 'तारीख लिखें और स्थानीय कृषि कार्यकर्ता से संपर्क करें।'], pa: ['ਬਾਹਰ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਮੌਸਮ ਸੁਰੱਖਿਅਤ ਹੋਣ ਦਿਓ।', 'ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੋਂ ਖੇਤ ਦੀ ਫੋਟੋ ਲਵੋ।', 'ਤਾਰੀਖ ਲਿਖੋ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'] } },
];
const farmGuides: Guide[] = [
  { id: 'heavy-rain-prep', icon: CloudRain, title: { en: 'Prepare for heavy rain', hi: 'भारी बारिश की तैयारी', pa: 'ਭਾਰੀ ਮੀਂਹ ਲਈ ਤਿਆਰੀ' }, hint: { en: 'A simple checklist · no live weather alert', hi: 'आसान सूची · लाइव मौसम चेतावनी नहीं', pa: 'ਸੌਖੀ ਸੂਚੀ · ਲਾਈਵ ਮੌਸਮ ਚੇਤਾਵਨੀ ਨਹੀਂ' }, steps: { en: ['Check your local weather warning; this app does not provide live forecasts.', 'Before rain, check field drains and clear blockages only if it is safe.', 'Move seeds and fertiliser to a dry, raised place.', 'Stay away from deep or fast-moving floodwater.'], hi: ['अपने इलाके की मौसम चेतावनी देखें; इस ऐप में लाइव पूर्वानुमान नहीं है।', 'बारिश से पहले खेत की नालियाँ देखें। रुकावट तभी हटाएँ जब सुरक्षित हो।', 'बीज और खाद को सूखी, ऊँची जगह रखें।', 'गहरे या तेज़ बहते बाढ़ के पानी से दूर रहें।'], pa: ['ਆਪਣੇ ਇਲਾਕੇ ਦੀ ਮੌਸਮ ਚੇਤਾਵਨੀ ਵੇਖੋ; ਇਸ ਐਪ ਵਿੱਚ ਲਾਈਵ ਮੌਸਮ ਜਾਣਕਾਰੀ ਨਹੀਂ।', 'ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਦੀਆਂ ਨਾਲੀਆਂ ਵੇਖੋ। ਰੁਕਾਵਟ ਸਿਰਫ਼ ਸੁਰੱਖਿਅਤ ਹੋਣ ਤੇ ਹਟਾਓ।', 'ਬੀਜ ਅਤੇ ਖਾਦ ਸੁੱਕੀ, ਉੱਚੀ ਥਾਂ ਰੱਖੋ।', 'ਡੂੰਘੇ ਜਾਂ ਤੇਜ਼ ਵਗਦੇ ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਤੋਂ ਦੂਰ ਰਹੋ।'] } },
  { id: 'water', icon: Droplets, title: { en: 'Save water', hi: 'पानी बचाएँ', pa: 'ਪਾਣੀ ਬਚਾਓ' }, hint: { en: 'Water conservation', hi: 'जल संरक्षण', pa: 'ਪਾਣੀ ਦੀ ਬਚਤ' }, steps: { en: ['Check soil moisture before watering.', 'Water near the plant roots when possible.', 'Ask your local agriculture worker which method suits your crop and soil.'], hi: ['पानी देने से पहले मिट्टी की नमी देखें।', 'हो सके तो पौधे की जड़ों के पास पानी दें।', 'अपनी फसल और मिट्टी के लिए सही तरीके की स्थानीय सलाह लें।'], pa: ['ਪਾਣੀ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ ਵੇਖੋ।', 'ਹੋ ਸਕੇ ਤਾਂ ਪੌਦੇ ਦੀਆਂ ਜੜ੍ਹਾਂ ਕੋਲ ਪਾਣੀ ਦਿਓ।', 'ਫਸਲ ਅਤੇ ਮਿੱਟੀ ਮੁਤਾਬਕ ਤਰੀਕੇ ਲਈ ਸਥਾਨਕ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'soil', icon: Sprout, title: { en: 'Care for soil', hi: 'मिट्टी की देखभाल', pa: 'ਮਿੱਟੀ ਦੀ ਸੰਭਾਲ' }, hint: { en: 'Soil health', hi: 'मिट्टी की सेहत', pa: 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ' }, steps: { en: ['Keep a simple note of what you grow in each season.', 'Ask about a soil test at your local agriculture office.', 'Use only advice suited to your soil test and crop.'], hi: ['हर मौसम में कौन-सी फसल बोई, इसका छोटा नोट रखें।', 'स्थानीय कृषि कार्यालय में मिट्टी जाँच के बारे में पूछें।', 'मिट्टी जाँच और फसल के अनुसार ही सलाह अपनाएँ।'], pa: ['ਹਰ ਮੌਸਮ ਵਿੱਚ ਕਿਹੜੀ ਫਸਲ ਬੀਜੀ, ਇਸਦਾ ਛੋਟਾ ਨੋਟ ਰੱਖੋ।', 'ਸਥਾਨਕ ਖੇਤੀ ਦਫ਼ਤਰ ਵਿੱਚ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਬਾਰੇ ਪੁੱਛੋ।', 'ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਅਤੇ ਫਸਲ ਮੁਤਾਬਕ ਹੀ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'residue', icon: Leaf, title: { en: 'Manage crop residue', hi: 'फसल अवशेष सँभालें', pa: 'ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਸੰਭਾਲੋ' }, hint: { en: 'Crop-residue management', hi: 'फसल अवशेष प्रबंधन', pa: 'ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਦਾ ਪ੍ਰਬੰਧ' }, steps: { en: ['Do not burn crop residue.', 'Ask your local agriculture office about collection or reuse options.', 'Choose a method that fits your crop, tools, and local rules.'], hi: ['फसल के अवशेष न जलाएँ।', 'स्थानीय कृषि कार्यालय से इकट्ठा करने या दोबारा उपयोग के तरीके पूछें।', 'अपनी फसल, औज़ार और स्थानीय नियमों के अनुसार तरीका चुनें।'], pa: ['ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਨਾ ਸਾੜੋ।', 'ਇਕੱਠੀ ਕਰਨ ਜਾਂ ਮੁੜ ਵਰਤੋਂ ਬਾਰੇ ਸਥਾਨਕ ਖੇਤੀ ਦਫ਼ਤਰ ਤੋਂ ਪੁੱਛੋ।', 'ਆਪਣੀ ਫਸਲ, ਸੰਦਾਂ ਅਤੇ ਸਥਾਨਕ ਨਿਯਮਾਂ ਮੁਤਾਬਕ ਤਰੀਕਾ ਚੁਣੋ।'] } },
];

const ui = {
  en: { cropTitle: 'What is happening to your crop?', farmTitle: 'Choose a guide', back: 'Back to choices', noteTitle: 'General guidance', note: 'This is general information, not verified local or crop-specific advice.', missing: 'Verified local advice is not connected yet. Ask your local agriculture worker for crop-specific treatment.', listen: 'Listen to steps', chooseProblem: 'Choose one problem', chooseGuide: 'Choose one simple guide' },
  hi: { cropTitle: 'फसल में क्या समस्या है?', farmTitle: 'एक आसान जानकारी चुनें', back: 'विकल्पों पर वापस जाएँ', noteTitle: 'सामान्य जानकारी', note: 'यह सामान्य जानकारी है, स्थानीय या फसल-विशेष सत्यापित सलाह नहीं।', missing: 'स्थानीय सत्यापित सलाह अभी उपलब्ध नहीं है। फसल के उपचार के लिए स्थानीय कृषि कार्यकर्ता से पूछें।', listen: 'निर्देश सुनें', chooseProblem: 'एक समस्या चुनें', chooseGuide: 'एक आसान जानकारी चुनें' },
  pa: { cropTitle: 'ਫਸਲ ਨੂੰ ਕੀ ਸਮੱਸਿਆ ਹੈ?', farmTitle: 'ਇੱਕ ਸੌਖੀ ਜਾਣਕਾਰੀ ਚੁਣੋ', back: 'ਚੋਣਾਂ ਵੱਲ ਵਾਪਸ', noteTitle: 'ਆਮ ਜਾਣਕਾਰੀ', note: 'ਇਹ ਆਮ ਜਾਣਕਾਰੀ ਹੈ, ਸਥਾਨਕ ਜਾਂ ਫਸਲ-ਮੁਤਾਬਕ ਪੱਕੀ ਸਲਾਹ ਨਹੀਂ।', missing: 'ਸਥਾਨਕ ਪੱਕੀ ਸਲਾਹ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ। ਫਸਲ ਦੇ ਇਲਾਜ ਲਈ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ।', listen: 'ਹਦਾਇਤਾਂ ਸੁਣੋ', chooseProblem: 'ਇੱਕ ਸਮੱਸਿਆ ਚੁਣੋ', chooseGuide: 'ਇੱਕ ਸੌਖੀ ਜਾਣਕਾਰੀ ਚੁਣੋ' },
} as const;

export default function GuidesPage({ kind, language, onSpeak }: GuidesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const guides = kind === 'crop' ? cropGuides : farmGuides;
  const selected = guides.find((guide) => guide.id === selectedId);
  const t = ui[language];

  if (selected) {
    const spoken = `${selected.title[language]}. ${selected.steps[language].join('. ')}`;
    const SelectedIcon = selected.icon;
    return (
      <main class="simple-page guide-detail-page">
        <button class="back-link" onClick={() => setSelectedId(null)}><ArrowLeft size={20} />{t.back}</button>
        <div class="guide-detail-card">
          <span class="guide-detail-icon"><SelectedIcon size={38} /></span>
          <h1>{selected.title[language]}</h1>
          <div class="guidance-status"><span aria-hidden="true">ℹ️</span><strong>{t.noteTitle}</strong><span>{t.note}</span></div>
          <ol class="guide-steps">{selected.steps[language].map((step, i) => <li key={i}><span class="guide-step-number">{i + 1}</span><span>{step}</span></li>)}</ol>
          <div class="guidance-unavailable"><strong>{language === 'pa' ? 'ਪੱਕੀ ਸਥਾਨਕ ਸਲਾਹ ਉਪਲਬਧ ਨਹੀਂ' : language === 'hi' ? 'स्थानीय सत्यापित सलाह उपलब्ध नहीं' : 'Verified local advice unavailable'}</strong><p>{t.missing}</p></div>
          <button class="guide-audio-button" onClick={() => onSpeak(spoken)}><Volume2 size={20} />{t.listen}</button>
        </div>
      </main>
    );
  }

  return (
    <main class="simple-page">
      <div class="simple-page-heading">
        <span class="farmer-eyebrow">{kind === 'crop' ? '🌿' : '💧'} AapdaSetu</span>
        <h1>{kind === 'crop' ? ui[language].cropTitle : ui[language].farmTitle}</h1>
        <p>{kind === 'crop' ? ui[language].chooseProblem : ui[language].chooseGuide}</p>
      </div>
      <div class="guide-choice-list">
        {guides.map(({ id, icon: Icon, title, hint }) => (
          <button class="guide-choice-card" key={id} onClick={() => setSelectedId(id)}>
            <span class="guide-choice-icon"><Icon size={30} /></span>
            <span><strong>{title[language]}</strong><small>{hint[language]}</small></span>
            <span class="guide-choice-arrow">›</span>
          </button>
        ))}
      </div>
    </main>
  );
}
