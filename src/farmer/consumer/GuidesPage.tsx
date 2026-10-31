import { useState } from 'preact/hooks';
import { ArrowLeft, Bug, Check, CloudRain, Droplets, Leaf, Search, Sprout, Sun, Volume2, Wind } from 'lucide-preact';
import type { AppLanguage } from '@shared/voice';

type GuideKind = 'crop' | 'water';
interface GuidesPageProps { kind: GuideKind; language: AppLanguage; onSpeak: (text: string) => void; }
type Guide = { id: string; icon: typeof Leaf; title: Record<AppLanguage, string>; hint: Record<AppLanguage, string>; steps: Record<AppLanguage, string[]> };
type SavedGuide = { checked: number[]; notes: string[] };
const SAVED_GUIDES_KEY = 'aapdasetu.recovery-guides.v1';
const loadSavedGuides = (): Record<string, SavedGuide> => {
  try { return JSON.parse(localStorage.getItem(SAVED_GUIDES_KEY) || '{}') as Record<string, SavedGuide>; } catch { return {}; }
};
const saveGuides = (value: Record<string, SavedGuide>) => {
  try { localStorage.setItem(SAVED_GUIDES_KEY, JSON.stringify(value)); } catch { /* Device storage may be unavailable. */ }
};

const cropGuides: Guide[] = [
  { id: 'standing-water', icon: CloudRain, title: { en: 'Water in the field', hi: 'खेत में पानी भरना', pa: 'ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਭਰਨਾ' }, hint: { en: 'Flood or waterlogging', hi: 'बाढ़ या जलभराव', pa: 'ਹੜ੍ਹ ਜਾਂ ਪਾਣੀ ਖੜ੍ਹਨਾ' }, steps: { en: ['Stay out of deep or fast-moving water.', 'When it is safe, take a clear photo of the field.', 'Note the date and ask your local agriculture worker what to do next.'], hi: ['गहरे या तेज़ बहते पानी में न जाएँ।', 'सुरक्षित होने पर खेत की साफ़ तस्वीर लें।', 'तारीख लिखें और स्थानीय कृषि कार्यकर्ता से अगला कदम पूछें।'], pa: ['ਡੂੰਘੇ ਜਾਂ ਤੇਜ਼ ਵਗਦੇ ਪਾਣੀ ਵਿੱਚ ਨਾ ਜਾਓ।', 'ਸੁਰੱਖਿਅਤ ਹੋਣ ’ਤੇ ਖੇਤ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਲਵੋ।', 'ਤਾਰੀਖ ਲਿਖੋ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਤੋਂ ਅਗਲਾ ਕਦਮ ਪੁੱਛੋ।'] } },
  { id: 'insects', icon: Bug, title: { en: 'Insects or leaf spots', hi: 'कीड़े या पत्तों पर धब्बे', pa: 'ਕੀੜੇ ਜਾਂ ਪੱਤਿਆਂ ਉੱਤੇ ਧੱਬੇ' }, hint: { en: 'Pests or unusual marks', hi: 'कीट या अजीब निशान', pa: 'ਕੀੜੇ ਜਾਂ ਅਜੀਬ ਨਿਸ਼ਾਨ' }, steps: { en: ['Take a close photo of the affected leaves.', 'Keep one healthy and one affected leaf for comparison.', 'Do not mix or spray unknown chemicals. Ask a local crop expert.'], hi: ['प्रभावित पत्तों की पास से तस्वीर लें।', 'तुलना के लिए एक स्वस्थ और एक प्रभावित पत्ता रखें।', 'अनजान दवा न मिलाएँ या छिड़कें। स्थानीय कृषि विशेषज्ञ से पूछें।'], pa: ['ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਦੀ ਨੇੜਿਓਂ ਫੋਟੋ ਲਵੋ।', 'ਤੁਲਨਾ ਲਈ ਇੱਕ ਸਿਹਤਮੰਦ ਅਤੇ ਇੱਕ ਪ੍ਰਭਾਵਿਤ ਪੱਤਾ ਰੱਖੋ।', 'ਅਣਜਾਣ ਦਵਾਈ ਨਾ ਮਿਲਾਓ ਤੇ ਨਾ ਛਿੜਕੋ। ਸਥਾਨਕ ਮਾਹਰ ਤੋਂ ਪੁੱਛੋ।'] } },
  { id: 'dry-weather', icon: Sun, title: { en: 'Dry weather', hi: 'सूखा मौसम', pa: 'ਸੁੱਕਾ ਮੌਸਮ' }, hint: { en: 'Very little rain or dry plants', hi: 'कम बारिश या सूखे पौधे', pa: 'ਘੱਟ ਮੀਂਹ ਜਾਂ ਸੁੱਕੇ ਪੌਦੇ' }, steps: { en: ['Check the soil near the roots, not just the surface.', 'Take a photo and note when you last watered.', 'Ask locally before changing irrigation or using a treatment.'], hi: ['जड़ों के पास की मिट्टी देखें, सिर्फ ऊपर की नहीं।', 'तस्वीर लें और आख़िरी सिंचाई का दिन लिखें।', 'सिंचाई बदलने या दवा से पहले स्थानीय सलाह लें।'], pa: ['ਜੜ੍ਹਾਂ ਨੇੜੇ ਮਿੱਟੀ ਵੇਖੋ, ਸਿਰਫ਼ ਉੱਪਰਲੀ ਨਹੀਂ।', 'ਫੋਟੋ ਲਵੋ ਅਤੇ ਆਖ਼ਰੀ ਸਿੰਚਾਈ ਦੀ ਤਾਰੀਖ ਲਿਖੋ।', 'ਸਿੰਚਾਈ ਬਦਲਣ ਜਾਂ ਦਵਾਈ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'wind-hail', icon: Wind, title: { en: 'Wind or hail damage', hi: 'आँधी या ओले का नुकसान', pa: 'ਹਨੇਰੀ ਜਾਂ ਗੜਿਆਂ ਦਾ ਨੁਕਸਾਨ' }, hint: { en: 'Broken or flattened plants', hi: 'टूटे या गिरे पौधे', pa: 'ਟੁੱਟੇ ਜਾਂ ਡਿੱਗੇ ਪੌਦੇ' }, steps: { en: ['Wait until the weather is safe before going outside.', 'Photograph the field from a safe place.', 'Note the date and contact your local agriculture worker.'], hi: ['बाहर जाने से पहले मौसम सुरक्षित होने दें।', 'सुरक्षित जगह से खेत की तस्वीर लें।', 'तारीख लिखें और स्थानीय कृषि कार्यकर्ता से संपर्क करें।'], pa: ['ਬਾਹਰ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਮੌਸਮ ਸੁਰੱਖਿਅਤ ਹੋਣ ਦਿਓ।', 'ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੋਂ ਖੇਤ ਦੀ ਫੋਟੋ ਲਵੋ।', 'ਤਾਰੀਖ ਲਿਖੋ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'] } },
  { id: 'plant-health', icon: Sprout, title: { en: 'Yellowing or weak growth', hi: 'पत्तों का पीला पड़ना या कमज़ोर बढ़त', pa: 'ਪੱਤੇ ਪੀਲੇ ਹੋਣਾ ਜਾਂ ਕਮਜ਼ੋਰ ਵਾਧਾ' }, hint: { en: 'General plant health changes', hi: 'पौधों की सेहत में बदलाव', pa: 'ਪੌਦਿਆਂ ਦੀ ਸਿਹਤ ਵਿੱਚ ਬਦਲਾਅ' }, steps: { en: ['Look for where symptoms appear and whether they affect a few plants or a larger area.', 'Note when you first noticed the change and any recent rain, irrigation, or field work.', 'Take clear photos and ask a local crop expert before applying a treatment.'], hi: ['देखें कि लक्षण कहाँ हैं और कुछ पौधों में हैं या बड़े हिस्से में।', 'बदलाव पहली बार कब दिखा और हाल की बारिश, सिंचाई या खेत के काम का नोट रखें।', 'साफ़ तस्वीर लें और कोई उपचार करने से पहले स्थानीय कृषि विशेषज्ञ से पूछें।'], pa: ['ਵੇਖੋ ਕਿ ਲੱਛਣ ਕਿੱਥੇ ਹਨ ਅਤੇ ਕੁਝ ਪੌਦਿਆਂ ਵਿੱਚ ਹਨ ਜਾਂ ਵੱਡੇ ਹਿੱਸੇ ਵਿੱਚ।', 'ਬਦਲਾਅ ਪਹਿਲੀ ਵਾਰ ਕਦੋਂ ਦਿਖਿਆ ਅਤੇ ਹਾਲੀਆ ਮੀਂਹ, ਸਿੰਜਾਈ ਜਾਂ ਖੇਤ ਦੇ ਕੰਮ ਦਾ ਨੋਟ ਰੱਖੋ।', 'ਸਾਫ਼ ਫੋਟੋ ਲਵੋ ਅਤੇ ਕੋਈ ਇਲਾਜ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਮਾਹਰ ਤੋਂ ਪੁੱਛੋ।'] } },
];

// Practical, non-diagnostic steps shown for crop recovery. The generic records above
// remain as the separate farm preparation guides and as a fallback for older guide IDs.
const practicalCropGuidance: Record<string, Record<AppLanguage, string[]>> = {
  'standing-water': {
    en: ['Stay out of floodwater. Do not touch wet pumps, wiring, or electrical equipment.', 'From a safe, dry place, note when the water arrived, how long it has remained, and roughly how much of the field is affected. Photograph only from a safe place.', 'Contact a local agriculture worker if water remains, a large area is affected, or plants are lodged or worsening. Ask before draining or applying anything.'],
    hi: ['बाढ़ के पानी से दूर रहें। गीले पंप, तार या बिजली के उपकरण न छुएँ।', 'सुरक्षित और सूखी जगह से लिखें कि पानी कब आया, कितनी देर से है और खेत का लगभग कितना हिस्सा प्रभावित है। तस्वीर केवल सुरक्षित जगह से लें।', 'पानी रुका हो, बड़ा हिस्सा प्रभावित हो या पौधे गिर रहे हों/बिगड़ रहे हों तो कृषि कार्यकर्ता से संपर्क करें। पानी निकालने या कुछ डालने से पहले पूछें।'],
    pa: ['ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਤੋਂ ਦੂਰ ਰਹੋ। ਗਿੱਲੇ ਪੰਪ, ਤਾਰਾਂ ਜਾਂ ਬਿਜਲੀ ਦੇ ਸਾਮਾਨ ਨੂੰ ਨਾ ਛੂਹੋ।', 'ਸੁਰੱਖਿਅਤ ਅਤੇ ਸੁੱਕੀ ਥਾਂ ਤੋਂ ਲਿਖੋ ਕਿ ਪਾਣੀ ਕਦੋਂ ਆਇਆ, ਕਿੰਨਾ ਸਮਾਂ ਰਿਹਾ ਅਤੇ ਖੇਤ ਦਾ ਲਗਭਗ ਕਿੰਨਾ ਹਿੱਸਾ ਪ੍ਰਭਾਵਿਤ ਹੈ। ਫੋਟੋ ਸਿਰਫ਼ ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੋਂ ਲਵੋ।', 'ਪਾਣੀ ਖੜ੍ਹਾ ਰਹੇ, ਵੱਡਾ ਹਿੱਸਾ ਪ੍ਰਭਾਵਿਤ ਹੋਵੇ ਜਾਂ ਪੌਦੇ ਡਿੱਗ ਰਹੇ/ਵਿਗੜ ਰਹੇ ਹੋਣ ਤਾਂ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਪਾਣੀ ਕੱਢਣ ਜਾਂ ਕੁਝ ਪਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਪੁੱਛੋ।'],
  },
  insects: {
    en: ['Do not spray or mix chemicals based on appearance alone. Avoid touching unknown insects or plant material.', 'Note which plants are affected, where marks appear, when they began, and whether the patch is spreading. Take clear photos of the whole plant and affected leaves if safe.', 'Contact a local crop expert if symptoms spread or affect many plants. Ask whether they need a sample and how to collect or carry it safely.'],
    hi: ['केवल देखकर दवा न छिड़कें और रसायन न मिलाएँ। अनजान कीट या पौधे को छूने से बचें।', 'लिखें कि कौन-से पौधे प्रभावित हैं, निशान कहाँ दिखते हैं, कब शुरू हुए और क्या फैल रहे हैं। सुरक्षित हो तो पूरे पौधे और प्रभावित पत्तों की साफ़ तस्वीर लें।', 'लक्षण फैलें या कई पौधे प्रभावित हों तो स्थानीय कृषि विशेषज्ञ से संपर्क करें। नमूना चाहिए या नहीं और उसे सुरक्षित रूप से कैसे ले जाना है, पूछें।'],
    pa: ['ਸਿਰਫ਼ ਵੇਖ ਕੇ ਦਵਾਈ ਨਾ ਛਿੜਕੋ ਅਤੇ ਰਸਾਇਣ ਨਾ ਮਿਲਾਓ। ਅਣਜਾਣ ਕੀੜਿਆਂ ਜਾਂ ਪੌਦਿਆਂ ਨੂੰ ਛੂਹਣ ਤੋਂ ਬਚੋ।', 'ਲਿਖੋ ਕਿ ਕਿਹੜੇ ਪੌਦੇ ਪ੍ਰਭਾਵਿਤ ਹਨ, ਨਿਸ਼ਾਨ ਕਿੱਥੇ ਹਨ, ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਏ ਅਤੇ ਕੀ ਫੈਲ ਰਹੇ ਹਨ। ਸੁਰੱਖਿਅਤ ਹੋਵੇ ਤਾਂ ਪੂਰੇ ਪੌਦੇ ਅਤੇ ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਲਵੋ।', 'ਲੱਛਣ ਫੈਲਣ ਜਾਂ ਕਈ ਪੌਦੇ ਪ੍ਰਭਾਵਿਤ ਹੋਣ ਤਾਂ ਸਥਾਨਕ ਖੇਤੀ ਮਾਹਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਪੁੱਛੋ ਕਿ ਨਮੂਨਾ ਚਾਹੀਦਾ ਹੈ ਜਾਂ ਨਹੀਂ ਅਤੇ ਇਸਨੂੰ ਸੁਰੱਖਿਅਤ ਕਿਵੇਂ ਲਿਜਾਣਾ ਹੈ।'],
  },
  'dry-weather': {
    en: ['Check local water-use rules before changing irrigation. Avoid strenuous field work in dangerous heat.', 'Record the last rain and irrigation, affected parts of the field, and whether symptoms are changing. Do not judge soil moisture from the surface alone.', 'Contact an agriculture worker if symptoms are widespread or worsening, or before a major irrigation or input change.'],
    hi: ['सिंचाई बदलने से पहले स्थानीय पानी-उपयोग नियम देखें। तेज़ गर्मी में कठिन खेत का काम न करें।', 'आख़िरी बारिश और सिंचाई, प्रभावित हिस्से और लक्षण बदल रहे हैं या नहीं—लिखें। केवल ऊपर की मिट्टी देखकर नमी का निर्णय न लें।', 'लक्षण बड़े हिस्से में हों या बढ़ रहे हों, या सिंचाई/कृषि सामग्री में बड़ा बदलाव करने से पहले कृषि कार्यकर्ता से पूछें।'],
    pa: ['ਸਿੰਜਾਈ ਬਦਲਣ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਪਾਣੀ ਵਰਤੋਂ ਦੇ ਨਿਯਮ ਵੇਖੋ। ਤੇਜ਼ ਗਰਮੀ ਵਿੱਚ ਭਾਰੀ ਖੇਤੀ ਕੰਮ ਨਾ ਕਰੋ।', 'ਆਖ਼ਰੀ ਮੀਂਹ ਅਤੇ ਸਿੰਜਾਈ, ਪ੍ਰਭਾਵਿਤ ਹਿੱਸੇ ਅਤੇ ਲੱਛਣ ਬਦਲ ਰਹੇ ਹਨ ਜਾਂ ਨਹੀਂ—ਲਿਖੋ। ਸਿਰਫ਼ ਉੱਪਰਲੀ ਮਿੱਟੀ ਦੇਖ ਕੇ ਨਮੀ ਦਾ ਫੈਸਲਾ ਨਾ ਕਰੋ।', 'ਲੱਛਣ ਵੱਡੇ ਹਿੱਸੇ ਵਿੱਚ ਹੋਣ ਜਾਂ ਵਧ ਰਹੇ ਹੋਣ, ਜਾਂ ਸਿੰਜਾਈ/ਖੇਤੀ ਸਮੱਗਰੀ ਵਿੱਚ ਵੱਡਾ ਬਦਲਾਅ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤੀ ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ।'],
  },
  'wind-hail': {
    en: ['Wait until lightning and strong winds have passed. Keep away from fallen power lines, damaged buildings, and unstable branches.', 'Record the date, affected area, and whether plants are bent, broken, or flattened. Take overview and close-up photos only from a safe place.', 'Contact an agriculture worker if a large area is affected or before deciding what to do ahead of the next farm operation.'],
    hi: ['बिजली और तेज़ हवा थमने तक बाहर न जाएँ। गिरी बिजली की तारों, क्षतिग्रस्त इमारतों और अस्थिर शाखाओं से दूर रहें।', 'तारीख, प्रभावित रकबा और पौधे झुके, टूटे या गिरे हैं—यह लिखें। दूर और पास की तस्वीर केवल सुरक्षित जगह से लें।', 'बड़ा हिस्सा प्रभावित हो या अगली खेती की कार्रवाई से पहले निर्णय लेना हो तो कृषि कार्यकर्ता से संपर्क करें।'],
    pa: ['ਬਿਜਲੀ ਅਤੇ ਤੇਜ਼ ਹਵਾ ਰੁਕਣ ਤੱਕ ਬਾਹਰ ਨਾ ਜਾਓ। ਡਿੱਗੀਆਂ ਬਿਜਲੀ ਤਾਰਾਂ, ਨੁਕਸਾਨੀਆਂ ਇਮਾਰਤਾਂ ਅਤੇ ਕਮਜ਼ੋਰ ਟਾਹਣੀਆਂ ਤੋਂ ਦੂਰ ਰਹੋ।', 'ਤਾਰੀਖ, ਪ੍ਰਭਾਵਿਤ ਰਕਬਾ ਅਤੇ ਪੌਦੇ ਝੁਕੇ, ਟੁੱਟੇ ਜਾਂ ਡਿੱਗੇ ਹਨ—ਇਹ ਲਿਖੋ। ਦੂਰੋਂ ਅਤੇ ਨੇੜਿਓਂ ਫੋਟੋ ਸਿਰਫ਼ ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੋਂ ਲਵੋ।', 'ਵੱਡਾ ਹਿੱਸਾ ਪ੍ਰਭਾਵਿਤ ਹੋਵੇ ਜਾਂ ਅਗਲੇ ਖੇਤੀ ਕੰਮ ਤੋਂ ਪਹਿਲਾਂ ਫੈਸਲਾ ਕਰਨਾ ਹੋਵੇ ਤਾਂ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'],
  },
  'plant-health': {
    en: ['Do not diagnose from leaf colour alone or apply a chemical or fertiliser as a guess.', 'Note crop and variety, growth stage, when changes began, where they occur, and recent weather, irrigation, or field work. Photograph the whole plant and affected leaves.', 'Contact a local agriculture worker if changes are spreading, many plants are affected, or you are considering treatment. Ask whether they need a sample.'],
    hi: ['केवल पत्तों के रंग से बीमारी न पहचानें और अंदाज़े से दवा या खाद न डालें।', 'फसल और किस्म, बढ़त की अवस्था, बदलाव कब शुरू हुए, कहाँ दिखते हैं और हाल का मौसम, सिंचाई या खेत का काम लिखें। पूरे पौधे और प्रभावित पत्तों की तस्वीर लें।', 'बदलाव फैलें, कई पौधे प्रभावित हों या उपचार पर विचार कर रहे हों तो स्थानीय कृषि कार्यकर्ता से पूछें। नमूना चाहिए या नहीं, यह भी पूछें।'],
    pa: ['ਸਿਰਫ਼ ਪੱਤਿਆਂ ਦੇ ਰੰਗ ਤੋਂ ਬਿਮਾਰੀ ਦੀ ਪਛਾਣ ਨਾ ਕਰੋ ਅਤੇ ਅੰਦਾਜ਼ੇ ਨਾਲ ਦਵਾਈ ਜਾਂ ਖਾਦ ਨਾ ਪਾਓ।', 'ਫਸਲ ਅਤੇ ਕਿਸਮ, ਵਾਧੇ ਦੀ ਅਵਸਥਾ, ਬਦਲਾਅ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਏ, ਕਿੱਥੇ ਹਨ ਅਤੇ ਹਾਲੀਆ ਮੌਸਮ, ਸਿੰਜਾਈ ਜਾਂ ਖੇਤ ਦੇ ਕੰਮ ਦਾ ਨੋਟ ਰੱਖੋ। ਪੂਰੇ ਪੌਦੇ ਅਤੇ ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਦੀ ਫੋਟੋ ਲਵੋ।', 'ਬਦਲਾਅ ਫੈਲਣ, ਕਈ ਪੌਦੇ ਪ੍ਰਭਾਵਿਤ ਹੋਣ ਜਾਂ ਇਲਾਜ ਬਾਰੇ ਸੋਚਣ ਤੇ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਪੁੱਛੋ ਕਿ ਨਮੂਨਾ ਚਾਹੀਦਾ ਹੈ ਜਾਂ ਨਹੀਂ।'],
  },
};
const practicalCropSafety: Record<string, Record<AppLanguage, string>> = {
  'standing-water': { en: 'Floodwater can hide drains, strong currents, contamination, and electrical hazards. Keep children and livestock away.', hi: 'बाढ़ के पानी में नालियाँ, तेज़ बहाव, गंदगी और बिजली के खतरे छिपे हो सकते हैं। बच्चों और पशुओं को दूर रखें।', pa: 'ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਨਾਲੀਆਂ, ਤੇਜ਼ ਵਹਾਅ, ਗੰਦਗੀ ਅਤੇ ਬਿਜਲੀ ਦੇ ਖਤਰੇ ਲੁਕੇ ਹੋ ਸਕਦੇ ਹਨ। ਬੱਚਿਆਂ ਅਤੇ ਪਸ਼ੂਆਂ ਨੂੰ ਦੂਰ ਰੱਖੋ।' },
  insects: { en: 'Do not handle unknown chemicals or mix products. Follow label directions and local expert advice.', hi: 'अनजान रसायन न छुएँ और दवाएँ न मिलाएँ। लेबल निर्देश और स्थानीय विशेषज्ञ की सलाह मानें।', pa: 'ਅਣਜਾਣ ਰਸਾਇਣ ਨਾ ਛੂਹੋ ਅਤੇ ਦਵਾਈਆਂ ਨਾ ਮਿਲਾਓ। ਲੇਬਲ ਹਦਾਇਤਾਂ ਅਤੇ ਸਥਾਨਕ ਮਾਹਰ ਦੀ ਸਲਾਹ ਮੰਨੋ।' },
  'dry-weather': { en: 'If heat makes you dizzy, confused, weak, or unwell, stop work, move to shade, and seek local medical help if symptoms persist.', hi: 'गर्मी में चक्कर, भ्रम, कमज़ोरी या तबीयत खराब लगे तो काम रोकें और छाया में जाएँ। लक्षण बने रहें तो स्थानीय चिकित्सा सहायता लें।', pa: 'ਗਰਮੀ ਵਿੱਚ ਚੱਕਰ, ਉਲਝਣ, ਕਮਜ਼ੋਰੀ ਜਾਂ ਤਬੀਅਤ ਖਰਾਬ ਲੱਗੇ ਤਾਂ ਕੰਮ ਰੋਕ ਕੇ ਛਾਂ ਵਿੱਚ ਜਾਓ। ਲੱਛਣ ਰਹਿਣ ਤੇ ਡਾਕਟਰੀ ਮਦਦ ਲਵੋ।' },
  'wind-hail': { en: 'Never approach a fallen power line. Report it to the local electricity utility or emergency service.', hi: 'गिरी बिजली की तार के पास न जाएँ। स्थानीय बिजली विभाग या आपात सेवा को सूचना दें।', pa: 'ਡਿੱਗੀ ਬਿਜਲੀ ਤਾਰ ਦੇ ਨੇੜੇ ਨਾ ਜਾਓ। ਸਥਾਨਕ ਬਿਜਲੀ ਵਿਭਾਗ ਜਾਂ ਐਮਰਜੈਂਸੀ ਸੇਵਾ ਨੂੰ ਦੱਸੋ।' },
  'plant-health': { en: 'Do not mix or apply chemicals or fertiliser without crop-specific advice and label directions.', hi: 'फसल के अनुसार सलाह और लेबल निर्देशों के बिना रसायन या खाद न मिलाएँ और न डालें।', pa: 'ਫਸਲ ਮੁਤਾਬਕ ਸਲਾਹ ਅਤੇ ਲੇਬਲ ਹਦਾਇਤਾਂ ਤੋਂ ਬਿਨਾਂ ਰਸਾਇਣ ਜਾਂ ਖਾਦ ਨਾ ਮਿਲਾਓ ਤੇ ਨਾ ਪਾਓ।' },
};
const farmGuides: Guide[] = [
  { id: 'heavy-rain-prep', icon: CloudRain, title: { en: 'Prepare for heavy rain', hi: 'भारी बारिश की तैयारी', pa: 'ਭਾਰੀ ਮੀਂਹ ਲਈ ਤਿਆਰੀ' }, hint: { en: 'A simple checklist · no live weather alert', hi: 'आसान सूची · लाइव मौसम चेतावनी नहीं', pa: 'ਸੌਖੀ ਸੂਚੀ · ਲਾਈਵ ਮੌਸਮ ਚੇਤਾਵਨੀ ਨਹੀਂ' }, steps: { en: ['Check your local weather warning; this app does not provide live forecasts.', 'Before rain, check field drains and clear blockages only if it is safe.', 'Move seeds and fertiliser to a dry, raised place.', 'Stay away from deep or fast-moving floodwater.'], hi: ['अपने इलाके की मौसम चेतावनी देखें; इस ऐप में लाइव पूर्वानुमान नहीं है।', 'बारिश से पहले खेत की नालियाँ देखें। रुकावट तभी हटाएँ जब सुरक्षित हो।', 'बीज और खाद को सूखी, ऊँची जगह रखें।', 'गहरे या तेज़ बहते बाढ़ के पानी से दूर रहें।'], pa: ['ਆਪਣੇ ਇਲਾਕੇ ਦੀ ਮੌਸਮ ਚੇਤਾਵਨੀ ਵੇਖੋ; ਇਸ ਐਪ ਵਿੱਚ ਲਾਈਵ ਮੌਸਮ ਜਾਣਕਾਰੀ ਨਹੀਂ।', 'ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਦੀਆਂ ਨਾਲੀਆਂ ਵੇਖੋ। ਰੁਕਾਵਟ ਸਿਰਫ਼ ਸੁਰੱਖਿਅਤ ਹੋਣ ਤੇ ਹਟਾਓ।', 'ਬੀਜ ਅਤੇ ਖਾਦ ਸੁੱਕੀ, ਉੱਚੀ ਥਾਂ ਰੱਖੋ।', 'ਡੂੰਘੇ ਜਾਂ ਤੇਜ਼ ਵਗਦੇ ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਤੋਂ ਦੂਰ ਰਹੋ।'] } },
  { id: 'water', icon: Droplets, title: { en: 'Save water', hi: 'पानी बचाएँ', pa: 'ਪਾਣੀ ਬਚਾਓ' }, hint: { en: 'Water conservation', hi: 'जल संरक्षण', pa: 'ਪਾਣੀ ਦੀ ਬਚਤ' }, steps: { en: ['Check soil moisture before watering.', 'Water near the plant roots when possible.', 'Ask your local agriculture worker which method suits your crop and soil.'], hi: ['पानी देने से पहले मिट्टी की नमी देखें।', 'हो सके तो पौधे की जड़ों के पास पानी दें।', 'अपनी फसल और मिट्टी के लिए सही तरीके की स्थानीय सलाह लें।'], pa: ['ਪਾਣੀ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ ਵੇਖੋ।', 'ਹੋ ਸਕੇ ਤਾਂ ਪੌਦੇ ਦੀਆਂ ਜੜ੍ਹਾਂ ਕੋਲ ਪਾਣੀ ਦਿਓ।', 'ਫਸਲ ਅਤੇ ਮਿੱਟੀ ਮੁਤਾਬਕ ਤਰੀਕੇ ਲਈ ਸਥਾਨਕ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'soil', icon: Sprout, title: { en: 'Care for soil', hi: 'मिट्टी की देखभाल', pa: 'ਮਿੱਟੀ ਦੀ ਸੰਭਾਲ' }, hint: { en: 'Soil health', hi: 'मिट्टी की सेहत', pa: 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ' }, steps: { en: ['Keep a simple note of what you grow in each season.', 'Ask about a soil test at your local agriculture office.', 'Use only advice suited to your soil test and crop.'], hi: ['हर मौसम में कौन-सी फसल बोई, इसका छोटा नोट रखें।', 'स्थानीय कृषि कार्यालय में मिट्टी जाँच के बारे में पूछें।', 'मिट्टी जाँच और फसल के अनुसार ही सलाह अपनाएँ।'], pa: ['ਹਰ ਮੌਸਮ ਵਿੱਚ ਕਿਹੜੀ ਫਸਲ ਬੀਜੀ, ਇਸਦਾ ਛੋਟਾ ਨੋਟ ਰੱਖੋ।', 'ਸਥਾਨਕ ਖੇਤੀ ਦਫ਼ਤਰ ਵਿੱਚ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਬਾਰੇ ਪੁੱਛੋ।', 'ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਅਤੇ ਫਸਲ ਮੁਤਾਬਕ ਹੀ ਸਲਾਹ ਲਵੋ।'] } },
  { id: 'residue', icon: Leaf, title: { en: 'Manage crop residue', hi: 'फसल अवशेष सँभालें', pa: 'ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਸੰਭਾਲੋ' }, hint: { en: 'Crop-residue management', hi: 'फसल अवशेष प्रबंधन', pa: 'ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਦਾ ਪ੍ਰਬੰਧ' }, steps: { en: ['Do not burn crop residue.', 'Ask your local agriculture office about collection or reuse options.', 'Choose a method that fits your crop, tools, and local rules.'], hi: ['फसल के अवशेष न जलाएँ।', 'स्थानीय कृषि कार्यालय से इकट्ठा करने या दोबारा उपयोग के तरीके पूछें।', 'अपनी फसल, औज़ार और स्थानीय नियमों के अनुसार तरीका चुनें।'], pa: ['ਫਸਲ ਦੀ ਰਹਿੰਦ-ਖੂੰਹਦ ਨਾ ਸਾੜੋ।', 'ਇਕੱਠੀ ਕਰਨ ਜਾਂ ਮੁੜ ਵਰਤੋਂ ਬਾਰੇ ਸਥਾਨਕ ਖੇਤੀ ਦਫ਼ਤਰ ਤੋਂ ਪੁੱਛੋ।', 'ਆਪਣੀ ਫਸਲ, ਸੰਦਾਂ ਅਤੇ ਸਥਾਨਕ ਨਿਯਮਾਂ ਮੁਤਾਬਕ ਤਰੀਕਾ ਚੁਣੋ।'] } },
];

const ui = {
  en: { cropTitle: 'What is happening to your crop?', farmTitle: 'Choose a guide', back: 'Back to choices', noteTitle: 'General guidance', note: 'General information only. It is not verified local or crop-specific advice.', missing: 'Ask your local agriculture worker for crop-specific advice. Do not apply a treatment based on this guide alone.', listen: 'Listen to guide', chooseProblem: 'Search or filter by problem', chooseGuide: 'Choose one simple guide', search: 'Search crop problems', all: 'All problems', water: 'Waterlogging', weather: 'Weather damage', pests: 'Pests', health: 'Plant health', noResults: 'No guides match your search.', checklist: 'Action checklist', done: 'done', whatToObserve: 'What to observe', cropVariety: 'Crop and variety', symptoms: 'Symptoms and when they started', area: 'Affected area', recentConditions: 'Recent weather or irrigation', photoTitle: 'Taking useful photos safely', photoSteps: ['Take a field overview from a safe place.', 'If safe, take a close-up of affected plants and one healthy comparison.', 'Keep the image clear; do not enter floodwater or approach electrical hazards.'], expertTitle: 'Questions for an agriculture worker', questions: ['What could be causing these signs, and what should I check next?', 'Is a field visit or sample needed before choosing a treatment?', 'Which locally approved advice applies to my crop and growth stage?'], safetyTitle: 'Safety first', safety: 'Stay away from floodwater, lightning, damaged power lines, and unsafe machinery. Never mix or handle unknown chemicals. Follow product labels and local expert guidance.', saved: 'Saved on this device', clear: 'Clear saved notes and checklist', saveHint: 'Your checklist and notes are saved only on this device.', savedBadge: 'Saved checklist' },
  hi: { cropTitle: 'फसल में क्या समस्या है?', farmTitle: 'एक आसान जानकारी चुनें', back: 'विकल्पों पर वापस जाएँ', noteTitle: 'सामान्य जानकारी', note: 'यह केवल सामान्य जानकारी है, स्थानीय या फसल-विशेष सत्यापित सलाह नहीं।', missing: 'फसल के अनुसार सलाह के लिए स्थानीय कृषि कार्यकर्ता से पूछें। केवल इस जानकारी के आधार पर उपचार न करें।', listen: 'जानकारी सुनें', chooseProblem: 'समस्या खोजें या छाँटें', chooseGuide: 'एक आसान जानकारी चुनें', search: 'फसल की समस्या खोजें', all: 'सभी समस्याएँ', water: 'जलभराव', weather: 'मौसम का नुकसान', pests: 'कीट', health: 'पौधों की सेहत', noResults: 'आपकी खोज से मेल खाती जानकारी नहीं मिली।', checklist: 'काम की सूची', done: 'कदम पूरे', whatToObserve: 'क्या ध्यान से देखें', cropVariety: 'फसल और किस्म', symptoms: 'लक्षण और कब शुरू हुए', area: 'प्रभावित रकबा', recentConditions: 'हाल का मौसम या सिंचाई', photoTitle: 'सुरक्षित तरीके से उपयोगी तस्वीरें लें', photoSteps: ['सुरक्षित जगह से पूरे खेत की तस्वीर लें।', 'सुरक्षित हो तो प्रभावित पौधे और तुलना के लिए स्वस्थ पौधे की पास से तस्वीर लें।', 'तस्वीर साफ़ रखें; बाढ़ के पानी में न जाएँ और बिजली के खतरों से दूर रहें।'], expertTitle: 'कृषि कार्यकर्ता से पूछें', questions: ['इन लक्षणों का कारण क्या हो सकता है और आगे क्या देखना चाहिए?', 'उपचार चुनने से पहले खेत का निरीक्षण या नमूना ज़रूरी है?', 'मेरी फसल और अवस्था के लिए कौन-सी स्थानीय स्वीकृत सलाह सही है?'], safetyTitle: 'पहले सुरक्षा', safety: 'बाढ़ के पानी, बिजली गिरने, टूटी बिजली की तारों और असुरक्षित मशीनों से दूर रहें। अनजान रसायन न मिलाएँ या न छुएँ। उत्पाद के लेबल और स्थानीय विशेषज्ञ की सलाह मानें।', saved: 'इस फ़ोन में सहेजा गया', clear: 'सहेजे नोट और सूची मिटाएँ', saveHint: 'आपकी सूची और नोट केवल इसी फ़ोन में सहेजे जाते हैं।', savedBadge: 'सहेजी सूची' },
  pa: { cropTitle: 'ਫਸਲ ਨੂੰ ਕੀ ਸਮੱਸਿਆ ਹੈ?', farmTitle: 'ਇੱਕ ਸੌਖੀ ਜਾਣਕਾਰੀ ਚੁਣੋ', back: 'ਚੋਣਾਂ ਵੱਲ ਵਾਪਸ', noteTitle: 'ਆਮ ਜਾਣਕਾਰੀ', note: 'ਇਹ ਸਿਰਫ਼ ਆਮ ਜਾਣਕਾਰੀ ਹੈ, ਸਥਾਨਕ ਜਾਂ ਫਸਲ-ਮੁਤਾਬਕ ਪੱਕੀ ਸਲਾਹ ਨਹੀਂ।', missing: 'ਫਸਲ ਮੁਤਾਬਕ ਸਲਾਹ ਲਈ ਸਥਾਨਕ ਖੇਤੀ ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ। ਸਿਰਫ਼ ਇਸ ਜਾਣਕਾਰੀ ਦੇ ਆਧਾਰ ਤੇ ਇਲਾਜ ਨਾ ਕਰੋ।', listen: 'ਜਾਣਕਾਰੀ ਸੁਣੋ', chooseProblem: 'ਸਮੱਸਿਆ ਲੱਭੋ ਜਾਂ ਛਾਂਟੋ', chooseGuide: 'ਇੱਕ ਸੌਖੀ ਜਾਣਕਾਰੀ ਚੁਣੋ', search: 'ਫਸਲ ਦੀ ਸਮੱਸਿਆ ਲੱਭੋ', all: 'ਸਾਰੀਆਂ ਸਮੱਸਿਆਵਾਂ', water: 'ਪਾਣੀ ਖੜ੍ਹਨਾ', weather: 'ਮੌਸਮ ਦਾ ਨੁਕਸਾਨ', pests: 'ਕੀੜੇ', health: 'ਪੌਦਿਆਂ ਦੀ ਸਿਹਤ', noResults: 'ਤੁਹਾਡੀ ਖੋਜ ਨਾਲ ਮਿਲਦੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ।', checklist: 'ਕੰਮ ਦੀ ਸੂਚੀ', done: 'ਕਦਮ ਪੂਰੇ', whatToObserve: 'ਕੀ ਧਿਆਨ ਨਾਲ ਵੇਖਣਾ ਹੈ', cropVariety: 'ਫਸਲ ਅਤੇ ਕਿਸਮ', symptoms: 'ਲੱਛਣ ਅਤੇ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਏ', area: 'ਪ੍ਰਭਾਵਿਤ ਰਕਬਾ', recentConditions: 'ਹਾਲੀਆ ਮੌਸਮ ਜਾਂ ਸਿੰਜਾਈ', photoTitle: 'ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਲਾਭਦਾਇਕ ਫੋਟੋਆਂ ਲਵੋ', photoSteps: ['ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੋਂ ਪੂਰੇ ਖੇਤ ਦੀ ਫੋਟੋ ਲਵੋ।', 'ਸੁਰੱਖਿਅਤ ਹੋਵੇ ਤਾਂ ਪ੍ਰਭਾਵਿਤ ਪੌਦੇ ਅਤੇ ਤੁਲਨਾ ਲਈ ਸਿਹਤਮੰਦ ਪੌਦੇ ਦੀ ਨੇੜਿਓਂ ਫੋਟੋ ਲਵੋ।', 'ਫੋਟੋ ਸਾਫ਼ ਰੱਖੋ; ਹੜ੍ਹ ਦੇ ਪਾਣੀ ਵਿੱਚ ਨਾ ਜਾਓ ਅਤੇ ਬਿਜਲੀ ਦੇ ਖਤਰਿਆਂ ਤੋਂ ਦੂਰ ਰਹੋ।'], expertTitle: 'ਖੇਤੀ ਸਹਾਇਕ ਨੂੰ ਪੁੱਛੋ', questions: ['ਇਨ੍ਹਾਂ ਲੱਛਣਾਂ ਦਾ ਕਾਰਨ ਕੀ ਹੋ ਸਕਦਾ ਹੈ ਅਤੇ ਅੱਗੇ ਕੀ ਵੇਖਣਾ ਚਾਹੀਦਾ ਹੈ?', 'ਇਲਾਜ ਚੁਣਨ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਦਾ ਦੌਰਾ ਜਾਂ ਨਮੂਨਾ ਲੋੜੀਂਦਾ ਹੈ?', 'ਮੇਰੀ ਫਸਲ ਅਤੇ ਵਾਧੇ ਦੇ ਪੜਾਅ ਲਈ ਕਿਹੜੀ ਸਥਾਨਕ ਮਨਜ਼ੂਰ ਸਲਾਹ ਢੁੱਕਵੀਂ ਹੈ?'], safetyTitle: 'ਪਹਿਲਾਂ ਸੁਰੱਖਿਆ', safety: 'ਹੜ੍ਹ ਦੇ ਪਾਣੀ, ਬਿਜਲੀ ਡਿੱਗਣ, ਟੁੱਟੀਆਂ ਬਿਜਲੀ ਤਾਰਾਂ ਅਤੇ ਅਸੁਰੱਖਿਅਤ ਮਸ਼ੀਨਾਂ ਤੋਂ ਦੂਰ ਰਹੋ। ਅਣਜਾਣ ਰਸਾਇਣ ਨਾ ਮਿਲਾਓ ਤੇ ਨਾ ਛੂਹੋ। ਉਤਪਾਦ ਦੇ ਲੇਬਲ ਅਤੇ ਸਥਾਨਕ ਮਾਹਰ ਦੀ ਸਲਾਹ ਮੰਨੋ।', saved: 'ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲਿਆ', clear: 'ਸੰਭਾਲੇ ਨੋਟ ਅਤੇ ਸੂਚੀ ਮਿਟਾਓ', saveHint: 'ਤੁਹਾਡੀ ਸੂਚੀ ਅਤੇ ਨੋਟ ਸਿਰਫ਼ ਇਸ ਫੋਨ ਵਿੱਚ ਸੰਭਾਲੇ ਜਾਂਦੇ ਹਨ।', savedBadge: 'ਸੰਭਾਲੀ ਸੂਚੀ' },
} as const;

const actionLabels: Record<AppLanguage, string[]> = {
  en: ['Safety / do first', 'Record and observe', 'Contact local help when'],
  hi: ['सुरक्षा / पहले यह करें', 'ध्यान दें और लिखें', 'स्थानीय मदद कब लें'],
  pa: ['ਸੁਰੱਖਿਆ / ਪਹਿਲਾਂ ਇਹ ਕਰੋ', 'ਧਿਆਨ ਦਿਓ ਅਤੇ ਲਿਖੋ', 'ਸਥਾਨਕ ਮਦਦ ਕਦੋਂ ਲਵੋ'],
};
const observationHints: Record<AppLanguage, string[]> = {
  en: ['For example: wheat, variety if known', 'What changed? Add the first day you noticed it.', 'Approximate area and unit, such as 1 acre or 0.5 hectare', 'Date of last rain or irrigation, if known'],
  hi: ['जैसे: गेहूँ; पता हो तो किस्म', 'क्या बदलाव दिखा? पहली बार दिखने की तारीख लिखें।', 'लगभग रकबा और इकाई, जैसे 1 एकड़ या 0.5 हेक्टेयर', 'पता हो तो आख़िरी बारिश या सिंचाई की तारीख'],
  pa: ['ਉਦਾਹਰਨ: ਕਣਕ; ਪਤਾ ਹੋਵੇ ਤਾਂ ਕਿਸਮ', 'ਕੀ ਬਦਲਿਆ? ਪਹਿਲੀ ਵਾਰ ਦਿਖਣ ਦੀ ਤਾਰੀਖ ਲਿਖੋ।', 'ਲਗਭਗ ਰਕਬਾ ਅਤੇ ਇਕਾਈ, ਜਿਵੇਂ 1 ਏਕੜ ਜਾਂ 0.5 ਹੈਕਟੇਅਰ', 'ਪਤਾ ਹੋਵੇ ਤਾਂ ਆਖ਼ਰੀ ਮੀਂਹ ਜਾਂ ਸਿੰਜਾਈ ਦੀ ਤਾਰੀਖ'],
};

export default function GuidesPage({ kind, language, onSpeak }: GuidesPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [saved, setSaved] = useState<Record<string, SavedGuide>>(loadSavedGuides());
  const guides = kind === 'crop' ? cropGuides : farmGuides;
  const selected = guides.find((guide) => guide.id === selectedId);
  const t = ui[language];

  const updateSaved = (id: string, update: Partial<SavedGuide>) => {
    setSaved((current) => {
      const previous = current[id] || { checked: [], notes: ['', '', '', ''] };
      const next = { ...current, [id]: { ...previous, ...update } };
      saveGuides(next);
      return next;
    });
  };

  if (selected) {
    const steps = practicalCropGuidance[selected.id]?.[language] || selected.steps[language];
    const safety = practicalCropSafety[selected.id]?.[language] || t.safety;
    const spoken = `${selected.title[language]}. ${steps.join('. ')}. ${safety}`;
    const SelectedIcon = selected.icon;
    const current = saved[selected.id] || { checked: [], notes: ['', '', '', ''] };
    const observeLabels = [t.cropVariety, t.symptoms, t.area, t.recentConditions];
    return (
      <main class="simple-page guide-detail-page">
        <button class="back-link" onClick={() => setSelectedId(null)}><ArrowLeft size={20} />{t.back}</button>
        <div class="guide-detail-card">
          <div class="guide-detail-header"><span class="guide-detail-icon"><SelectedIcon size={34} /></span><h1>{selected.title[language]}</h1></div>
          <div class="guidance-status"><span aria-hidden="true">ℹ️</span><strong>{t.noteTitle}</strong><span>{t.note}</span></div>
          <div class="guide-checklist-heading"><strong>{t.checklist}</strong><span>{current.checked.length}/{steps.length} {t.done}</span></div>
          <div class="guide-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={current.checked.length}><span style={{ width: `${(current.checked.length / steps.length) * 100}%` }} /></div>
          <ol class="guide-steps">{steps.map((step, i) => <li key={i} class={current.checked.includes(i) ? 'guide-step-done' : ''}><button class="guide-step-toggle" aria-label={`${i + 1}. ${step}`} aria-pressed={current.checked.includes(i)} onClick={() => updateSaved(selected.id, { checked: current.checked.includes(i) ? current.checked.filter((n) => n !== i) : [...current.checked, i] })}>{current.checked.includes(i) ? <Check size={17} /> : i + 1}</button><span><strong class="guide-action-label">{actionLabels[language][i]}. </strong>{step}</span></li>)}</ol>
          <p class="guide-save-note">{t.saveHint}</p>
          <section class="guide-info-panel"><h2>{t.whatToObserve}</h2>{observeLabels.map((label, i) => <label class="guide-note-field" key={label}>{label}<textarea placeholder={observationHints[language][i]} value={current.notes[i] || ''} rows={2} onInput={(event) => { const notes = [...current.notes]; notes[i] = (event.currentTarget as HTMLTextAreaElement).value; updateSaved(selected.id, { notes }); }} /></label>)}</section>
          <section class="guide-info-panel"><h2>{t.photoTitle}</h2><ol>{t.photoSteps.map((step) => <li key={step}>{step}</li>)}</ol></section>
          <section class="guide-info-panel"><h2>{t.expertTitle}</h2><ul>{t.questions.map((question) => <li key={question}>{question}</li>)}</ul></section>
          <section class="guide-safety-panel"><strong>{t.safetyTitle}</strong><p>{safety}</p></section>
          <div class="guidance-unavailable"><strong>{language === 'pa' ? 'ਪੱਕੀ ਸਥਾਨਕ ਸਲਾਹ ਉਪਲਬਧ ਨਹੀਂ' : language === 'hi' ? 'स्थानीय सत्यापित सलाह उपलब्ध नहीं' : 'Verified local advice unavailable'}</strong><p>{t.missing}</p></div>
          <button class="guide-clear-button" onClick={() => { const next = { ...saved }; delete next[selected.id]; saveGuides(next); setSaved(next); }}>{t.clear}</button>
          <button class="guide-audio-button" onClick={() => onSpeak(spoken)}><Volume2 size={20} />{t.listen}</button>
        </div>
      </main>
    );
  }

  const categories = [
    { id: 'all', label: t.all }, { id: 'water', label: t.water },
    { id: 'weather', label: t.weather }, { id: 'pests', label: t.pests }, { id: 'health', label: t.health },
  ];
  const filteredGuides = kind === 'crop' ? guides.filter((guide) => {
    const guideCategory = guide.id === 'standing-water' ? 'water' : ['wind-hail', 'dry-weather'].includes(guide.id) ? 'weather' : guide.id === 'insects' ? 'pests' : 'health';
    const matchesText = `${guide.title[language]} ${guide.hint[language]}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return (category === 'all' || category === guideCategory) && matchesText;
  }) : guides;

  return (
    <main class="simple-page">
      <div class="simple-page-heading">
        <span class="farmer-eyebrow">{kind === 'crop' ? '🌿' : '💧'} AapdaSetu</span>
        <h1>{kind === 'crop' ? ui[language].cropTitle : ui[language].farmTitle}</h1>
        <p>{kind === 'crop' ? t.chooseProblem : t.chooseGuide}</p>
      </div>
      {kind === 'crop' && <>
        <label class="guide-search"><Search size={19} /><input value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} placeholder={t.search} /></label>
        <div class="guide-filter-list" aria-label={t.chooseProblem}>{categories.map((item) => <button key={item.id} class={category === item.id ? 'guide-filter-active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
      </>}
      <div class="guide-choice-list">
        {filteredGuides.map(({ id, icon: Icon, title, hint }) => (
          <button class="guide-choice-card" key={id} onClick={() => setSelectedId(id)}>
            <span class="guide-choice-icon"><Icon size={30} /></span>
            <span><strong>{title[language]}</strong><small>{hint[language]}</small>{saved[id] && <small class="guide-saved-badge">{t.savedBadge}</small>}</span>
            <span class="guide-choice-arrow">›</span>
          </button>
        ))}
        {filteredGuides.length === 0 && <p class="guide-no-results">{t.noResults}</p>}
      </div>
    </main>
  );
}
