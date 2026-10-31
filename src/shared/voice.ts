// src/shared/voice.ts
// ─── Voice Engine: Punjabi / Hindi / English TTS & Speech Recognition ───

export type AppLanguage = "en" | "pa" | "hi";
let speechRequest = 0;
let cloudSpeechAbort: AbortController | null = null;
let currentPunjabiOnEnd: (() => void) | undefined;
const recentPunjabiAudio = new Map<string, Blob>();

function publishPunjabiStatus(status: "loading" | "ready" | "error", message: string, audioUrl?: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aapdasetu:punjabi-tts", { detail: { status, message, audioUrl } }));
  }
}

function translateTtsError(code: string, lang: AppLanguage): string {
  const messages = {
    en: {
      service_not_configured: "Punjabi voice service is not configured. Use the written instructions or contact support.",
      credentials_unavailable: "Punjabi voice service credentials are unavailable. Please try again later.",
      quota_exceeded: "Punjabi voice service is busy or out of quota. Please try again later.",
      permission_denied: "Punjabi voice service is not enabled for this app. Please contact support.",
      unsupported_voice: "The Punjabi voice is currently unavailable. Please use the written instructions.",
      provider_unavailable: "Punjabi audio could not be generated right now. Check your connection and try again.",
      network_error: "Could not reach the Punjabi voice service. Check your internet connection and try again.",
      invalid_audio: "The Punjabi voice service returned an invalid audio file. Please try again.",
      request_failed: "Punjabi audio could not be generated. Please try again.",
    },
    hi: {
      service_not_configured: "पंजाबी आवाज़ सेवा सेट नहीं है। लिखे निर्देश पढ़ें या सहायता लें।",
      credentials_unavailable: "पंजाबी आवाज़ सेवा की पहुँच उपलब्ध नहीं है। बाद में फिर कोशिश करें।",
      quota_exceeded: "पंजाबी आवाज़ सेवा अभी व्यस्त है या उसकी सीमा पूरी हो गई है। बाद में कोशिश करें।",
      permission_denied: "इस ऐप के लिए पंजाबी आवाज़ सेवा चालू नहीं है। सहायता लें।",
      unsupported_voice: "पंजाबी आवाज़ अभी उपलब्ध नहीं है। लिखे निर्देश पढ़ें।",
      provider_unavailable: "अभी पंजाबी आवाज़ नहीं बन पाई। इंटरनेट जाँचें और फिर कोशिश करें।",
      network_error: "पंजाबी आवाज़ सेवा तक पहुँच नहीं मिली। इंटरनेट जाँचें और फिर कोशिश करें।",
      invalid_audio: "पंजाबी आवाज़ सेवा से सही ऑडियो नहीं मिला। फिर कोशिश करें।",
      request_failed: "पंजाबी आवाज़ नहीं बन पाई। फिर कोशिश करें।",
    },
    pa: {
      service_not_configured: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਸੈੱਟ ਨਹੀਂ ਹੈ। ਲਿਖਤੀ ਹਦਾਇਤਾਂ ਪੜ੍ਹੋ ਜਾਂ ਮਦਦ ਲਵੋ।",
      credentials_unavailable: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਦੀ ਪਹੁੰਚ ਨਹੀਂ ਮਿਲੀ। ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      quota_exceeded: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਵਿਅਸਤ ਹੈ ਜਾਂ ਇਸਦੀ ਹੱਦ ਪੂਰੀ ਹੋ ਗਈ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      permission_denied: "ਇਸ ਐਪ ਲਈ ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਚਾਲੂ ਨਹੀਂ। ਮਦਦ ਲਵੋ।",
      unsupported_voice: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ। ਲਿਖਤੀ ਹਦਾਇਤਾਂ ਪੜ੍ਹੋ।",
      provider_unavailable: "ਹੁਣੇ ਪੰਜਾਬੀ ਆਡੀਓ ਨਹੀਂ ਬਣ ਸਕਿਆ। ਇੰਟਰਨੈੱਟ ਜਾਂਚੋ ਅਤੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      network_error: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਇੰਟਰਨੈੱਟ ਜਾਂਚੋ ਅਤੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      invalid_audio: "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੇਵਾ ਤੋਂ ਠੀਕ ਆਡੀਓ ਨਹੀਂ ਮਿਲਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      request_failed: "ਪੰਜਾਬੀ ਆਡੀਓ ਨਹੀਂ ਬਣ ਸਕਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    },
  } as const;
  const key = code in messages.en ? code as keyof typeof messages.en : "request_failed";
  return messages[lang][key];
}

async function speakPunjabiWithCloud(text: string, requestId: number, onEnd?: () => void, onError?: (message: string) => void): Promise<void> {
  cloudSpeechAbort?.abort();
  cloudSpeechAbort = new AbortController();
  const normalizedText = text.trim();
  const cachedAudio = recentPunjabiAudio.get(normalizedText);
  publishPunjabiStatus("loading", "ਪੰਜਾਬੀ ਆਵਾਜ਼ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ…");

  try {
    let audioBlob = cachedAudio;
    if (!audioBlob) {
      const response = await fetch("/api/tts/punjabi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: normalizedText }),
        signal: cloudSpeechAbort.signal,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code || (response.status === 404 ? "service_not_configured" : "request_failed");
        throw Object.assign(new Error("Punjabi TTS request failed"), { code });
      }
      if (!response.headers.get("content-type")?.toLowerCase().includes("audio/mpeg") ||
          !response.headers.get("x-aapdasetu-voice")?.startsWith("pa-IN-")) {
        throw Object.assign(new Error("Punjabi TTS returned an unexpected audio format or voice"), { code: "invalid_audio" });
      }
      audioBlob = await response.blob();
      if (!audioBlob.size) throw Object.assign(new Error("Punjabi TTS returned empty audio"), { code: "invalid_audio" });
      recentPunjabiAudio.set(normalizedText, audioBlob);
      if (recentPunjabiAudio.size > 12) recentPunjabiAudio.delete(recentPunjabiAudio.keys().next().value!);
    }
    if (requestId !== speechRequest) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    currentPunjabiOnEnd = onEnd;
    publishPunjabiStatus("ready", "ਪੰਜਾਬੀ ਆਡੀਓ ਤਿਆਰ ਹੈ। ਸੁਣਨ ਲਈ ਹੇਠਾਂ Play ਦਬਾਓ।", audioUrl);
  } catch (error) {
    if (requestId !== speechRequest || (error as Error).name === "AbortError") return;
    const rawCode = (error as { code?: string }).code || "network_error";
    const code = rawCode === "configuration_missing" ? "service_not_configured" : rawCode;
    const message = translateTtsError(code, "pa");
    publishPunjabiStatus("error", message);
    if (onError) onError(message);
    else if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("aapdasetu:voice-error", { detail: message }));
    onEnd?.();
  }
}

export function finishPunjabiPlayback(): void {
  const onEnd = currentPunjabiOnEnd;
  currentPunjabiOnEnd = undefined;
  onEnd?.();
  publishPunjabiStatus("ready", "ਪੰਜਾਬੀ ਆਡੀਓ ਸੁਣ ਲਿਆ ਗਿਆ।");
}

function readSpeechVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  try { return synth.getVoices(); }
  catch { return []; }
}

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
): void {
  if (lang === "pa") {
    const requestId = ++speechRequest;
    try { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); } catch { /* cloud speech is independent of system voices */ }
    void speakPunjabiWithCloud(text, requestId, onEnd, onError);
    return;
  }

  const reportError = (message: string) => {
    if (onError) onError(message);
    else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("aapdasetu:voice-error", { detail: message }));
    }
  };
  if (!isSpeechSynthesisSupported()) {
    reportError(lang === "hi" ? "इस डिवाइस में आवाज़ सहायता उपलब्ध नहीं है।" : "Spoken help is unavailable on this device.");
    if (onEnd) onEnd();
    return;
  }

  const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
  if (!cleanText) { onEnd?.(); return; }
  const synth = window.speechSynthesis;
  const requestId = ++speechRequest;
  try { synth.cancel(); } catch { /* still attempt a fresh utterance */ }

  const languageTag = lang === "hi" ? "hi-IN" : "en-IN";
  const normalize = (value: string) => value.toLowerCase().replace(/_/g, "-").trim();
  const languageCode = lang === "hi" ? /^hi(-|$)/ : /^en(-|$)/;
  const startSpeech = (voices: SpeechSynthesisVoice[]) => {
    if (requestId !== speechRequest) return;
    const candidates = voices.filter((voice) => {
      const code = normalize(voice.lang);
      const name = normalize(voice.name);
      return languageCode.test(code) || (lang === "hi" && /hindi/.test(name)) || (lang === "en" && /english/.test(name));
    });
    const voice = candidates.find((candidate) => normalize(candidate.lang) === normalize(languageTag)) ||
      candidates.find((candidate) => candidate.localService) || candidates[0];

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = languageTag;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.88;
      utterance.pitch = 1;
      let finished = false;
      let started = false;
      let startupTimer = 0;
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(startupTimer);
        if (requestId === speechRequest) onEnd?.();
      };
      utterance.onstart = () => { started = true; window.clearTimeout(startupTimer); };
      utterance.onend = finish;
      utterance.onerror = (event) => {
        const error = (event as SpeechSynthesisErrorEvent).error;
        if (requestId === speechRequest && error !== "canceled" && error !== "interrupted") {
          reportError(lang === "hi" ? "आवाज़ नहीं चली। फ़ोन की Hindi speech voice चालू करें या लिखे निर्देश पढ़ें।" : "Speech could not play. Check device voice settings or use the written instructions.");
        }
        finish();
      };
      if (synth.paused) synth.resume();
      synth.speak(utterance);
      startupTimer = window.setTimeout(() => {
        if (!started && requestId === speechRequest) {
          reportError(lang === "hi" ? "आवाज़ शुरू नहीं हुई। लिखे निर्देश पढ़ें या फ़ोन की speech voice जाँचें।" : "Speech did not start. Check device voice settings or use the written instructions.");
          finish();
        }
      }, 4000);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      reportError(lang === "hi" ? "आवाज़ सहायता शुरू नहीं हो सकी।" : "Spoken help could not start.");
      onEnd?.();
    }
  };

  startSpeech(readSpeechVoices(synth));
}

/**
 * Stops any active speech synthesis
 */
export function stopSpeaking(): void {
  speechRequest++;
  const wasPunjabiActive = Boolean(cloudSpeechAbort || currentPunjabiOnEnd);
  cloudSpeechAbort?.abort();
  cloudSpeechAbort = null;
  currentPunjabiOnEnd = undefined;
  if (typeof document !== "undefined") {
    const player = document.getElementById("aapdasetu-punjabi-player") as HTMLAudioElement | null;
    player?.pause();
    if (player) player.currentTime = 0;
  }
  if (wasPunjabiActive) publishPunjabiStatus("ready", "ਪੰਜਾਬੀ ਆਡੀਓ ਰੋਕਿਆ ਗਿਆ।");
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

