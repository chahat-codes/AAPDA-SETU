// src/shared/voice.ts
// ─── Voice Engine: Punjabi / Hindi / English TTS & Speech Recognition ───

export type AppLanguage = "en" | "pa" | "hi";
let speechRequest = 0;

/**
 * Checks if browser supports SpeechSynthesis (Text-to-Speech)
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis?.speak === "function" && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Checks if browser supports SpeechRecognition (Dictation)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Speaks text using the browser SpeechSynthesis API.
 * Configured with Punjabi (pa-IN), Hindi (hi-IN), or English.
 */
export function speakText(
  text: string,
  lang: AppLanguage = "pa",
  onEnd?: () => void,
  onError?: (message: string) => void,
  onPunjabiFallback?: () => void,
): void {
  if (!isSpeechSynthesisSupported()) {
    onError?.(lang === "pa" ? "ਇਸ ਡਿਵਾਈਸ ਵਿੱਚ ਆਵਾਜ਼ ਸਹਾਇਤਾ ਉਪਲਬਧ ਨਹੀਂ।" : lang === "hi" ? "इस डिवाइस में आवाज़ सहायता उपलब्ध नहीं है।" : "Spoken help is unavailable on this device.");
    if (onEnd) onEnd();
    return;
  }

  const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
  if (!cleanText) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  const requestId = ++speechRequest;
  try { synth.cancel(); } catch { /* still attempt a fresh utterance */ }

  const languageTag = lang === "pa" ? "pa-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  const normalize = (value: string) => value.toLowerCase().replace(/_/g, "-").trim();
  const languageCode = lang === "pa" ? /^(pa|pan)(-|$)/ : lang === "hi" ? /^hi(-|$)/ : /^en(-|$)/;
  const voices = synth.getVoices();
  const candidates = voices.filter((voice) => {
    const code = normalize(voice.lang);
    const name = normalize(voice.name);
    return languageCode.test(code) || (lang === "pa" && /punjabi|panjabi/.test(name)) ||
      (lang === "hi" && /hindi/.test(name)) || (lang === "en" && /english/.test(name));
  });
  const voice = candidates.find((candidate) => normalize(candidate.lang) === normalize(languageTag)) ||
    candidates.find((candidate) => candidate.localService) || candidates[0];

  // Speak directly from the user's click. Waiting for voiceschanged can lose
  // browser gesture permission, causing the speech request to be dropped.
  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = languageTag;
    if (voice) utterance.voice = voice;
    else if (lang === "pa") onPunjabiFallback?.();
    utterance.rate = 0.88;
    utterance.pitch = 1;
    let finished = false;
    let started = false;
    let startupTimer = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(startupTimer);
      onEnd?.();
    };
    utterance.onstart = () => { started = true; window.clearTimeout(startupTimer); };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      const error = (event as SpeechSynthesisErrorEvent).error;
      if (requestId === speechRequest && error !== "canceled" && error !== "interrupted") {
        onError?.(lang === "pa" ? "ਆਵਾਜ਼ ਨਹੀਂ ਚੱਲੀ। ਫੋਨ ਦੀ Punjabi speech voice ਚਾਲੂ ਕਰੋ ਜਾਂ ਲਿਖਤੀ ਹਦਾਇਤਾਂ ਵਰਤੋ।" : lang === "hi" ? "आवाज़ नहीं चली। फ़ोन की Hindi speech voice चालू करें या लिखे निर्देश पढ़ें।" : "Speech could not play. Check device voice settings or use the written instructions.");
      }
      finish();
    };
    if (synth.paused) synth.resume();
    synth.speak(utterance);
    startupTimer = window.setTimeout(() => {
      if (!started && requestId === speechRequest) {
        onError?.(lang === "pa" ? "Punjabi ਆਵਾਜ਼ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋਈ। ਲਿਖਤੀ ਹਦਾਇਤਾਂ ਵਰਤੋ ਜਾਂ ਫੋਨ ਦੀ speech voice ਜਾਂਚੋ।" : lang === "hi" ? "आवाज़ शुरू नहीं हुई। लिखे निर्देश पढ़ें या फ़ोन की speech voice जाँचें।" : "Speech did not start. Check device voice settings or use the written instructions.");
        finish();
      }
    }, 4000);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
    onError?.(lang === "pa" ? "ਆਵਾਜ਼ ਸਹਾਇਤਾ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋ ਸਕੀ।" : lang === "hi" ? "आवाज़ सहायता शुरू नहीं हो सकी।" : "Spoken help could not start.");
    onEnd?.();
  }
}

/**
 * Stops any active speech synthesis
 */
export function stopSpeaking(): void {
  speechRequest++;
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Starts microphone dictation using Web Speech API with Punjabi (pa-IN) support.
 * Returns an object with `stop()` method to cleanly stop listening.
 */
export function startDictation(
  lang: AppLanguage,
  onResult: (text: string) => void,
  onError: (errMessage: string) => void,
  onEnd: (hadError?: boolean) => void
): { stop: () => void } {
  if (!isSpeechRecognitionSupported()) {
    onError(
      lang === "pa"
        ? "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਮਾਈਕ੍ਰੋਫੋਨ ਬੋਲਣ ਦੀ ਸਹੂਲਤ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।"
        : lang === "hi"
        ? "इस ब्राउज़र में वॉयस टाइपिंग समर्थित नहीं है।"
        : "Speech recognition is not supported in this browser."
    );
    onEnd(true);
    return { stop: () => {} };
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  let recognition: any;
  try {
    recognition = new SpeechRecognitionClass();
  } catch (err) {
    onError("Could not initialize microphone recognition.");
    onEnd(true);
    return { stop: () => {} };
  }

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  if (lang === "pa") {
    recognition.lang = "pa-IN"; // Punjabi (India)
  } else if (lang === "hi") {
    recognition.lang = "hi-IN"; // Hindi (India)
  } else {
    recognition.lang = "en-IN"; // English (India)
  }

  let finalTranscript = "";
  let hadError = false;

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const resultText = (finalTranscript + interim).trim();
    if (resultText) onResult(resultText);
  };

  recognition.onerror = (event: any) => {
    hadError = true;
    let message = "Microphone error";
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      message =
        lang === "pa"
          ? "ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਬ੍ਰਾਊਜ਼ਰ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਮਾਈਕ ਚਾਲੂ ਕਰੋ।"
          : lang === "hi"
          ? "माइक्रोफ़ोन की अनुमति अस्वीकृत हुई। कृपया अनुमति दें।"
          : "Microphone permission denied. Please allow microphone access.";
    } else if (event.error === "no-speech") {
      message =
        lang === "pa"
          ? "ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਸੁਣੀ ਗਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।"
          : lang === "hi"
          ? "कोई आवाज़ नहीं सुनाई दी। कृपया पुनः बोलें।"
          : "No speech detected. Please try speaking again.";
    } else if (event.error === "audio-capture") {
      message = lang === "pa" ? "ਮਾਈਕ੍ਰੋਫੋਨ ਨਹੀਂ ਮਿਲਿਆ। ਫੋਨ ਦਾ ਮਾਈਕ ਜਾਂਚੋ।" : lang === "hi" ? "माइक्रोफ़ोन नहीं मिला। फ़ोन का माइक जाँचें।" : "No microphone was found. Check the device microphone.";
    } else if (event.error === "network") {
      message = lang === "pa" ? "ਆਵਾਜ਼ ਪਛਾਣ ਲਈ ਨੈੱਟਵਰਕ ਉਪਲਬਧ ਨਹੀਂ।" : lang === "hi" ? "आवाज़ पहचान के लिए नेटवर्क उपलब्ध नहीं है।" : "Network is unavailable for speech recognition.";
    }
    onError(message);
  };

  recognition.onend = () => {
    onEnd(hadError);
  };

  try {
    recognition.start();
  } catch (startErr) {
    onError("Microphone is already active or unavailable.");
    onEnd(true);
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}

/**
 * Common bilingual & trilingual translations for core alerts and guidance
 */
export const TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  evidenceClock: {
    en: "72-HOUR EVIDENCE DECAY CLOCK: Floods recede and storm debris rots within 72 hours. Capture tamper-evident proof before evidence vanishes.",
    pa: "72 ਘੰਟੇ ਦਾ ਸਬੂਤ ਘੜੀ: ਹੜ੍ਹਾਂ ਦਾ ਪਾਣੀ ਲਹਿ ਜਾਂਦਾ ਹੈ ਅਤੇ 72 ਘੰਟਿਆਂ ਵਿੱਚ ਫਸਲ ਸੜ ਜਾਂਦੀ ਹੈ। ਸਬੂਤ ਮਿਟਣ ਤੋਂ ਪਹਿਲਾਂ ਰਿਕਾਰਡ ਕਰੋ।",
    hi: "72 घंटे की साक्ष्य घड़ी: बाढ़ का पानी उतर जाता है और फसल सड़ जाती है। सबूत मिटने से पहले तुरंत दर्ज करें।",
  },
  consentNotice: {
    en: "Farmer Informed Consent: All photographic proof and location data are cryptographically sealed and stored locally on this device.",
    pa: "ਕਿਸਾਨ ਸਹਿਮਤੀ: ਸਾਰੀਆਂ ਫੋਟੋਆਂ ਅਤੇ ਜੀਪੀਐਸ ਜਾਣਕਾਰੀ ਇਸ ਡਿਵਾਈਸ 'ਤੇ ਸੁਰੱਖਿਅਤ ਸਟੋਰ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।",
    hi: "किसान सूचित सहमति: सभी फोटो और जीपीएस जानकारी इस डिवाइस पर सुरक्षित रूप से स्थानीय रूप से सहेजी जाती है।",
  },
  listenAudio: {
    en: "🔊 Listen to Instructions",
    pa: "🔊 ਹਦਾਇਤਾਂ ਸੁਣੋ",
    hi: "🔊 निर्देश सुनें",
  },
  dictateVoice: {
    en: "🎤 Speak (Dictate)",
    pa: "🎤 ਬੋਲ ਕੇ ਲਿਖੋ (ਮਾਈਕ)",
    hi: "🎤 बोलकर लिखें (माइक)",
  },
  stopDictation: {
    en: "⏹️ Stop Recording",
    pa: "⏹️ ਰਿਕਾਰਡਿੰਗ ਰੋਕੋ",
    hi: "⏹️ रिकॉर्डिंग रोकें",
  },
};

