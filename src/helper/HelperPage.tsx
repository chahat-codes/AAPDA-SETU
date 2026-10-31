// src/helper/HelperPage.tsx
// ─── Volunteer Field HUD — Rapid mobile-first documentation for rural field agents ───

import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { saveRecord, getRecords } from "@shared/db";
import type { EvidenceRecord, DamageType, GeoLocation } from "@shared/types";
import { playClick, playSealSound, playHover } from "@shared/sound";
import { startDictation, speakText, isSpeechRecognitionSupported, AppLanguage } from "@shared/voice";

const DAMAGE_OPTIONS: { value: DamageType; icon: string; labelEn: string; labelPa: string; labelHi: string }[] = [
  { value: "flood", icon: "🌊", labelEn: "Flood Inundation", labelPa: "ਹੜ੍ਹ / ਪਾਣੀ ਭਰਨਾ", labelHi: "बाढ़ / जलभराव" },
  { value: "drought", icon: "🏜️", labelEn: "Drought Stress", labelPa: "ਸੋਕਾ / ਪਾਣੀ ਦੀ ਘਾਟ", labelHi: "सूखा / जल संकट" },
  { value: "hailstorm", icon: "🌨️", labelEn: "Hailstorm", labelPa: "ਗੜੇਮਾਰੀ / ਝੱਖੜ", labelHi: "ओलावृष्टि / आंधी" },
  { value: "pest_attack", icon: "🐛", labelEn: "Pest / Blight", labelPa: "ਕੀਟ ਹਮਲਾ / ਸੁੰਡੀ", labelHi: "कीट प्रकोप / इल्ली" },
  { value: "other", icon: "❓", labelEn: "Other Damage", labelPa: "ਹੋਰ ਨੁਕਸਾਨ", labelHi: "अन्य क्षति" },
];

function blankForm() {
  return {
    farmerName: "",
    farmerId: "",
    phone: "",
    damageType: "flood" as DamageType,
    description: "",
    photoFile: null as File | null,
    photoPreview: "" as string,
    location: null as GeoLocation | null,
  };
}

export default function HelperPage({ language = "pa", onLanguageChange }: { language?: AppLanguage; onLanguageChange?: (language: AppLanguage) => void }) {
  const [lang, setLang] = useState<AppLanguage>(language);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(0);

  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const dictationRef = useRef<{ stop: () => void } | null>(null);

  // Load saved count
  const refreshCount = useCallback(async () => {
    try {
      const records = await getRecords();
      setSavedCount(records.length);
    } catch {
      setSavedCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  const handleConsent = (checked: boolean) => {
    playClick();
    setConsentGiven(checked);
    setConsentTimestamp(checked ? Date.now() : 0);
  };

  const updateField = (key: keyof ReturnType<typeof blankForm>, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // Location capture
  const handleGetLocation = () => {
    playClick();
    setLocationLoading(true);
    setLocationError("");

    if (!("geolocation" in navigator)) {
      setLocationError("GPS hardware not detected on this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false);
        updateField("location", {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: Date.now(),
        });
      },
      (error) => {
        setLocationLoading(false);
        const denied = error.code === error.PERMISSION_DENIED;
        setLocationError(lang === "pa"
          ? denied ? "ਟਿਕਾਣੇ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਤੁਸੀਂ ਥਾਂ ਹੱਥੀਂ ਦਰਜ ਕਰ ਸਕਦੇ ਹੋ।" : "ਟਿਕਾਣਾ ਨਹੀਂ ਮਿਲ ਸਕਿਆ। GPS ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਥਾਂ ਹੱਥੀਂ ਲਿਖੋ।"
          : lang === "hi"
          ? denied ? "स्थान की अनुमति नहीं मिली। आप जगह हाथ से लिख सकते हैं।" : "स्थान नहीं मिल सका। GPS फिर कोशिश करें या जगह हाथ से लिखें।"
          : denied ? "Location permission was denied. You can enter a place manually." : "Location could not be found. Retry GPS or enter a place manually.");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Photo capture
  const handlePhotoUpload = (e: Event) => {
    playClick();
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const previewUrl = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: previewUrl,
      }));
    }
  };

  // Voice dictation
  const toggleVoiceDictation = () => {
    playClick();
    if (isRecordingMic) {
      if (dictationRef.current) dictationRef.current.stop();
      setIsRecordingMic(false);
      setMicStatus("");
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setIsRecordingMic(false);
      setMicStatus(lang === "pa" ? "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਨਾਲ ਲਿਖਣਾ ਉਪਲਬਧ ਨਹੀਂ। ਵੇਰਵਾ ਹੱਥੀਂ ਲਿਖੋ।" : lang === "hi" ? "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है। कृपया विवरण हाथ से लिखें।" : "Voice typing is unavailable in this browser. Please type the description.");
      return;
    }

    setIsRecordingMic(true);
    setMicStatus(lang === "pa" ? "ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ..." : lang === "hi" ? "हिन्दी में बोलें..." : "Listening...");
    const baseDescription = form.description.trim();

    dictationRef.current = startDictation(
      lang,
      (text) => {
        setForm((current) => ({ ...current, description: `${baseDescription}${baseDescription ? " " : ""}${text}` }));
      },
      (err) => {
        setMicStatus(err);
        setIsRecordingMic(false);
      },
      (hadError) => {
        setIsRecordingMic(false);
        if (!hadError) setMicStatus("");
        else window.setTimeout(() => setMicStatus(""), 5000);
      }
    );
  };

  // Save report to IndexedDB
  const handleSave = async () => {
    playClick();
    const errs: string[] = [];
    if (!consentGiven) errs.push("Farmer informed consent is mandatory.");
    if (!form.farmerName.trim()) errs.push("Farmer full name is required.");
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) errs.push(lang === "pa" ? "ਵੈਧ 10 ਅੰਕਾਂ ਵਾਲਾ ਫੋਨ ਨੰਬਰ ਲਿਖੋ।" : lang === "hi" ? "मान्य 10 अंकों का फ़ोन नंबर लिखें।" : "Enter a valid 10-digit phone number.");
    if (!form.damageType) errs.push("Please select calamity damage type.");
    if (!form.photoFile) errs.push(lang === "pa" ? "ਅਸਲ ਫੋਟੋ ਜੋੜੋ। ਨਮੂਨਾ ਫੋਟੋ ਸਬੂਤ ਵਜੋਂ ਨਹੀਂ ਵਰਤੀ ਜਾ ਸਕਦੀ।" : lang === "hi" ? "असली तस्वीर जोड़ें। नमूना तस्वीर को सबूत की तरह उपयोग नहीं कर सकते।" : "Attach a real photo. A placeholder image cannot be used as evidence.");

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      const now = Date.now();
      const recordId = `AS-FIELD-${now.toString().slice(-6)}`;
      const photoBlob = form.photoFile;
      if (!photoBlob) throw new Error("A real photo is required before saving a field record.");

      const newRecord: EvidenceRecord = {
        id: recordId,
        farmerName: form.farmerName.trim(),
        farmerId: form.farmerId.trim() || `LOCAL-${now.toString().slice(-6)}`,
        phone: form.phone.trim(),
        photoBlob,
        photoTimestamp: now,
        damageType: form.damageType,
        description: form.description.trim() || "Recorded via Volunteer Field HUD",
        location: form.location,
        consentGiven: true,
        consentTimestamp: consentTimestamp || now,
        photoHash: null,
        signature: null,
        publicKey: null,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        officerNotes: null,
        reviewedAt: null,
      };

      await saveRecord(newRecord);
      playSealSound();
      setSaved(true);
      refreshCount();
    } catch (err) {
      setErrors(["Failed to save report to local IndexedDB. Please retry."]);
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    playClick();
    setForm(blankForm());
    setConsentGiven(false);
    setSaved(false);
    setErrors([]);
  };

  return (
    <div class="field-hud-container">
      {/* Field HUD Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--cyber-lime)", fontWeight: 800 }}>
            TACTICAL FIELD HUD // RAPID CAPTURE
          </span>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            {lang === "pa" ? "ਵਲੰਟੀਅਰ ਫੀਲਡ HUD" : lang === "hi" ? "वॉलंटियर फील्ड HUD" : "Volunteer Field HUD"}
          </h1>
        </div>

        {/* Language selector */}
        <div class="lang-selector-pill">
          <button class={`lang-btn ${lang === "pa" ? "active" : ""}`} onClick={() => { setLang("pa"); onLanguageChange?.("pa"); }}>
            ਪੰਜਾਬੀ
          </button>
          <button class={`lang-btn ${lang === "hi" ? "active" : ""}`} onClick={() => { setLang("hi"); onLanguageChange?.("hi"); }}>
            हिंदी
          </button>
          <button class={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => { setLang("en"); onLanguageChange?.("en"); }}>
            EN
          </button>
        </div>
      </div>

      {saved ? (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--cyber-mint)", borderRadius: "var(--radius-lg)", padding: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ fontSize: "3rem" }}>✅</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff" }}>
            {lang === "pa" ? "ਫੀਲਡ ਰਿਪੋਰਟ ਸਫਲਤਾਪੂਰਵਕ ਸੁਰੱਖਿਅਤ ਹੋਈ!" : "Field Report Saved to Local IndexedDB!"}
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "540px", margin: "0 auto" }}>
            {lang === "pa"
              ? "ਇਹ ਰਿਪੋਰਟ ਡਿਵਾਈਸ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਹੈ ਅਤੇ ਅਫਸਰ ਕੰਸੋਲ ਅਤੇ ਐਵੀਡੈਂਸ ਇੰਜਣ ਵਿੱਚ ਸੀਲ ਕਰਨ ਲਈ ਤਿਆਰ ਹੈ।"
              : "Record is safely persisted in browser IndexedDB. Ready for cryptographic sealing in Evidence Engine or review in Officer Console."}
          </p>
          <div>
            <button class="btn btn-primary btn-lg" onClick={handleStartOver}>
              + {lang === "pa" ? "ਨਵਾਂ ਕਿਸਾਨ ਰਿਕਾਰਡ ਲਓ" : "Record Another Farmer"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Section 1: Farmer Consent */}
          <div style={{ background: consentGiven ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)", border: `1px solid ${consentGiven ? "var(--cyber-mint)" : "rgba(245, 158, 11, 0.4)"}`, borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
              {lang === "pa" ? "1. ਕਿਸਾਨ ਸਹਿਮਤੀ (Informed Consent)" : "1. Farmer Informed Consent"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {lang === "pa"
                ? "ਜਾਣਕਾਰੀ ਦਰਜ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕਿਸਾਨ ਦੀ ਪ੍ਰਵਾਨਗੀ ਲਾਜ਼ਮੀ ਹੈ।"
                : "Consent must be explicitly obtained before capturing photographs or location data."}
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontWeight: 700, color: "#ffffff" }}>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => handleConsent((e.target as HTMLInputElement).checked)}
                style={{ width: "20px", height: "20px", accentColor: "#10b981" }}
              />
              <span>
                {lang === "pa"
                  ? "ਕਿਸਾਨ ਨੇ ਫਸਲ ਨੁਕਸਾਨ ਦੇ ਸਬੂਤ ਦਰਜ ਕਰਨ ਦੀ ਸਹਿਮਤੀ ਦਿੱਤੀ ਹੈ"
                  : "Farmer explicitly agrees to have crop damage and GPS documented"}
              </span>
            </label>
          </div>

          {/* Section 2: Form */}
          <div style={{ opacity: consentGiven ? 1 : 0.45, pointerEvents: consentGiven ? "auto" : "none", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Farmer Info */}
            <div style={{ background: "var(--void-glass)", border: "1px solid var(--void-glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                {lang === "pa" ? "2. ਕਿਸਾਨ ਵੇਰਵਾ" : "2. Farmer Information"}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    {lang === "pa" ? "ਕਿਸਾਨ ਦਾ ਨਾਮ *" : "Farmer Name *"}
                  </label>
                  <input
                    type="text"
                    style={{ width: "100%" }}
                    placeholder="e.g. Gurdeep Singh"
                    value={form.farmerName}
                    onInput={(e) => updateField("farmerName", (e.target as HTMLInputElement).value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    {lang === "pa" ? "ਮੋਬਾਈਲ ਨੰਬਰ *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    style={{ width: "100%" }}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onInput={(e) => updateField("phone", (e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  {lang === "pa" ? "ਕਿਸਾਨ ਆਈਡੀ / ਆਧਾਰ ਅਖੀਰਲੇ 4 ਅੰਕ" : "Farmer / Kisan ID"}
                </label>
                <input
                  type="text"
                  style={{ width: "100%" }}
                  placeholder="e.g. KSN-PB-9941 or XXXX-4821"
                  value={form.farmerId}
                  onInput={(e) => updateField("farmerId", (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            {/* Calamity Type Selector */}
            <div style={{ background: "var(--void-glass)", border: "1px solid var(--void-glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                {lang === "pa" ? "3. ਆਫ਼ਤ ਦੀ ਕਿਸਮ ਚੁਣੋ" : "3. Calamity Damage Type"}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                {DAMAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      playClick();
                      updateField("damageType", opt.value);
                    }}
                    style={{
                      background: form.damageType === opt.value ? "rgba(16, 185, 129, 0.25)" : "rgba(3, 18, 11, 0.8)",
                      border: `2px solid ${form.damageType === opt.value ? "var(--cyber-lime)" : "var(--void-glass-border)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "1rem 0.5rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "#ffffff",
                      transition: "var(--transition)",
                    }}
                  >
                    <span style={{ fontSize: "1.8rem" }}>{opt.icon}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                      {lang === "pa" ? opt.labelPa : lang === "hi" ? opt.labelHi : opt.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Dictation & Description */}
            <div class="tactical-voice-dictation-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                  {lang === "pa" ? "4. ਨੁਕਸਾਨ ਦਾ ਵੇਰਵਾ (ਆਵਾਜ਼ / ਲਿਖਤੀ)" : "4. Damage Description & Voice Dictation"}
                </h3>
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  class={`btn btn-sm ${isRecordingMic ? "mic-active-pulse" : "btn-secondary"}`}
                >
                  {isRecordingMic ? "⏹️ Stop Mic" : "🎤 Speak (Dictate)"}
                </button>
              </div>

              {micStatus && (
                <div style={{ fontSize: "0.8rem", color: isRecordingMic ? "#4ade80" : "#f59e0b", fontWeight: 700 }}>
                  {micStatus}
                </div>
              )}

              <textarea
                rows={3}
                style={{ width: "100%" }}
                placeholder={lang === "pa" ? "ਮਾਈਕ ਬਟਨ ਦਬਾ ਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ..." : "Describe crop loss, water depth, or lodging..."}
                value={form.description}
                onInput={(e) => updateField("description", (e.target as HTMLTextAreaElement).value)}
              />
            </div>

            {/* Evidence Photo & GPS */}
            <div style={{ background: "var(--void-glass)", border: "1px solid var(--void-glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Photo Input */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  📸 {lang === "pa" ? "ਖੇਤ ਦੀ ਫੋਟੋ ਲਵੋ" : "Capture Evidence Photo"}
                </label>
                <label class="btn btn-outline" style={{ width: "100%", cursor: "pointer" }}>
                  <span>{form.photoFile ? "✓ Photo Attached" : "Open Camera / File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handlePhotoUpload}
                  />
                </label>
                {form.photoPreview && (
                  <img
                    src={form.photoPreview}
                    alt="Preview"
                    style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "var(--radius-sm)", marginTop: "0.5rem" }}
                  />
                )}
              </div>

              {/* GPS Geolocation */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  📍 {lang === "pa" ? "ਸੈਟੇਲਾਈਟ ਜੀਪੀਐਸ ਲੌਕ" : "GPS Satellite Lock"}
                </label>
                <button
                  type="button"
                  class="btn btn-outline"
                  style={{ width: "100%" }}
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? "Acquiring..." : form.location ? `✓ Lat ${form.location.latitude}°` : "Acquire Field GPS"}
                </button>
                {locationError && (
                  <span style={{ fontSize: "0.75rem", color: "#f87171", display: "block", marginTop: "0.25rem" }}>
                    {locationError}
                  </span>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {errors.length > 0 && (
              <div style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "var(--radius-md)", padding: "1rem", color: "#fecaca" }}>
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save Button */}
            <button
              type="button"
              class="btn btn-primary btn-xl"
              style={{ width: "100%", fontSize: "1.15rem", padding: "1.1rem" }}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "🔄 Saving to IndexedDB..." : "💾 Save Field Evidence (Offline)"}
            </button>
          </div>
        </div>
      )}

      {/* Footer stats badge */}
      <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1rem" }}>
        <span>📋 {savedCount} Evidence Records stored in local IndexedDB on this device</span>
      </div>
    </div>
  );
}
