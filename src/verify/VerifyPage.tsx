// src/verify/VerifyPage.tsx
// ─── Independent Verification Module — Re-compute hashes & audit signatures ───

import { useState, useEffect, useCallback } from "preact/hooks";
import { getRecords } from "@shared/db";
import type { EvidenceRecord } from "@shared/types";
import { hashBlob, verifySignature } from "@shared/crypto";
import { getDemoRecords, formatDateTime } from "@officer/officerUtils";
import { playClick, playSuccessSound, playAlertSound } from "@shared/sound";
import { fireConfetti } from "@shared/confetti";

interface AuditResult {
  computedHash: string;
  storedHash: string | null;
  hashMatch: boolean;
  signatureChecked: boolean;
  signatureValid: boolean;
  tamperSimulated: boolean;
  checkedAt: number;
}

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<"record" | "file">("record");
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Mode A: Stored Record Audit State
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [auditing, setAuditing] = useState(false);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Mode B: File Drop Hasher State
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [droppedFileHash, setDroppedFileHash] = useState<string>("");
  const [fileHashing, setFileHashing] = useState(false);
  const [expectedHashInput, setExpectedHashInput] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  // Load records from IndexedDB (fallback to demo records)
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecords();
      if (data && data.length > 0) {
        setRecords(data);
        setSelectedRecordId(data[0].id);
      } else {
        const demos = getDemoRecords();
        setRecords(demos);
        setSelectedRecordId(demos[0].id);
      }
    } catch {
      const demos = getDemoRecords();
      setRecords(demos);
      setSelectedRecordId(demos[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Run audit on selected record
  const handleRunAudit = async () => {
    if (!selectedRecord) return;
    setAuditing(true);
    setAuditResult(null);

    try {
      let blobToHash = selectedRecord.photoBlob;

      // If simulateTamper is active, append 1 byte to demonstrate tampering detection
      if (simulateTamper) {
        const buffer = await selectedRecord.photoBlob.arrayBuffer();
        const tampered = new Uint8Array(buffer.byteLength + 1);
        tampered.set(new Uint8Array(buffer));
        tampered[tampered.length - 1] = 0xff; // altered byte
        blobToHash = new Blob([tampered], { type: selectedRecord.photoBlob.type || "image/jpeg" });
      }

      // 1. Re-calculate SHA-256 hash from raw blob bytes
      const computedHash = await hashBlob(blobToHash);

      // 2. Check if hash matches recorded hash
      const hashMatch =
        !!selectedRecord.photoHash &&
        computedHash.toLowerCase() === selectedRecord.photoHash.toLowerCase();

      // 3. Check digital signature if available
      let signatureChecked = false;
      let signatureValid = false;

      if (selectedRecord.photoHash && selectedRecord.signature && selectedRecord.publicKey) {
        signatureChecked = true;
        try {
          // Verify original signature against computed hash
          signatureValid = await verifySignature(
            computedHash,
            selectedRecord.signature,
            selectedRecord.publicKey
          );
        } catch (sigErr) {
          console.warn("Signature check error:", sigErr);
          signatureValid = false;
        }
      }

      const result: AuditResult = {
        computedHash,
        storedHash: selectedRecord.photoHash,
        hashMatch,
        signatureChecked,
        signatureValid,
        tamperSimulated: simulateTamper,
        checkedAt: Date.now(),
      };

      setAuditResult(result);
      if (hashMatch) {
        playSuccessSound();
        fireConfetti();
      } else {
        playAlertSound();
      }
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setAuditing(false);
    }
  };

  // Mode B: File drop handler
  const handleProcessFile = async (file: File) => {
    setDroppedFile(file);
    setFileHashing(true);
    setDroppedFileHash("");
    try {
      const hash = await hashBlob(file);
      setDroppedFileHash(hash);
    } catch (err) {
      console.error(err);
      setDroppedFileHash("Error calculating file hash");
    } finally {
      setFileHashing(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Compare dropped file hash with expected hash
  const compareMatch =
    droppedFileHash && expectedHashInput.trim()
      ? droppedFileHash.toLowerCase() === expectedHashInput.trim().toLowerCase()
      : null;

  return (
    <div class="verify-container">
      {/* Header */}
      <div class="verify-header">
        <div>
          <h1 class="verify-title">Independent Verification</h1>
          <p class="verify-subtitle">
            Zero-Trust Evidence Auditor: Re-compute SHA-256 cryptographic digests directly in your browser without contacting any external server.
          </p>
        </div>
        <div class="verify-zero-trust-badge">
          🛡️ Zero-Trust Verification
        </div>
      </div>

      {/* Tabs */}
      <div class="verify-tab-bar">
        <button
          class={`verify-tab-btn ${activeTab === "record" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("record")}
        >
          📂 Audit Stored Case Record
        </button>
        <button
          class={`verify-tab-btn ${activeTab === "file" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("file")}
        >
          📄 Verify Any File / Photo
        </button>
      </div>

      {/* Mode A: Stored Record Audit */}
      {activeTab === "record" && (
        <div class="verify-mode-section">
          {loading ? (
            <div class="verify-loading">Loading records from IndexedDB...</div>
          ) : (
            <div class="record-audit-grid">
              {/* Left Column: Record Selector & Parameters */}
              <div class="audit-left-col">
                <div class="audit-card">
                  <h3 class="card-heading">1. Select Case to Audit</h3>

                  <div class="form-group">
                    <label>Stored Case Record:</label>
                    <select
                      class="verify-select"
                      value={selectedRecordId}
                      onChange={(e) => {
                        setSelectedRecordId((e.target as HTMLSelectElement).value);
                        setAuditResult(null);
                      }}
                    >
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.farmerName} — {r.damageType.toUpperCase()} ({r.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedRecord && (
                    <div class="case-meta-preview">
                      <div class="meta-row">
                        <span class="meta-k">Farmer:</span>
                        <span class="meta-v">{selectedRecord.farmerName}</span>
                      </div>
                      <div class="meta-row">
                        <span class="meta-k">Damage:</span>
                        <span class="meta-v">{selectedRecord.damageType}</span>
                      </div>
                      <div class="meta-row">
                        <span class="meta-k">Captured:</span>
                        <span class="meta-v">{formatDateTime(selectedRecord.photoTimestamp)}</span>
                      </div>
                      <div class="meta-row">
                        <span class="meta-k">Sealed Status:</span>
                        <span class="meta-v">
                          {selectedRecord.photoHash ? "🔒 Sealed (Hash Present)" : "⚠️ Draft (No Hash)"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tampering Simulation Toggle (Interactive Hackathon Feature) */}
                  <div class="tamper-sim-box">
                    <label class="tamper-toggle-label">
                      <input
                        type="checkbox"
                        checked={simulateTamper}
                        onChange={(e) => {
                          setSimulateTamper((e.target as HTMLInputElement).checked);
                          setAuditResult(null);
                        }}
                      />
                      <span>🧪 Simulate 1-Byte File Tampering</span>
                    </label>
                    <p class="tamper-hint">
                      Turn this ON to inject a single modified byte into the photo before verification. Watch how SHA-256 instantly flags tampering!
                    </p>
                  </div>

                  <button
                    class="btn btn-primary btn-audit"
                    onClick={handleRunAudit}
                    disabled={auditing || !selectedRecord}
                  >
                    {auditing ? "🔄 Computing SHA-256 Hash..." : "🔍 Run Integrity Audit"}
                  </button>
                </div>
              </div>

              {/* Right Column: Audit Scorecard & Result */}
              <div class="audit-right-col">
                <div class={`audit-card ${auditResult && !auditResult.hashMatch ? "auditor-siren-active" : ""}`}>
                  <h3 class="card-heading">2. Cryptographic Audit Results</h3>

                  {!auditResult && !auditing && (
                    <div class="audit-prompt-box">
                      <div class="prompt-icon">⚖️</div>
                      <h4>Ready to Audit</h4>
                      <p>
                        Click <strong>"Run Integrity Audit"</strong> to compute the raw SHA-256 digest of this record's photo and verify the digital signature against the recorded public key.
                      </p>
                    </div>
                  )}

                  {auditing && (
                    <div class="audit-prompt-box">
                      <div class="spinner"></div>
                      <h4>Reading raw ArrayBuffer & computing SHA-256...</h4>
                    </div>
                  )}

                  {auditResult && (
                    <div class="audit-result-display">
                      {/* Overall Status Banner */}
                      {auditResult.hashMatch ? (
                        <div class="verdict-banner verdict-pass">
                          <span class="verdict-icon">✅</span>
                          <div>
                            <h4>INTEGRITY AUDIT PASSED</h4>
                            <p>
                              Zero byte alterations detected. The photograph bytes match the sealed cryptographic hash with 100% precision.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div class="verdict-banner verdict-fail">
                          <span class="verdict-icon">❌</span>
                          <div>
                            <h4>TAMPERING DETECTED / HASH MISMATCH</h4>
                            <p>
                              The current photo bytes do NOT match the original sealed hash. Data has been modified, corrupted, or replaced.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Signature Sub-Check */}
                      {auditResult.signatureChecked && (
                        <div class={`sig-banner ${auditResult.signatureValid ? "sig-valid" : "sig-invalid"}`}>
                          <span>{auditResult.signatureValid ? "✍️ Signature Verified (ECDSA P-256)" : "⚠️ Signature Invalid"}</span>
                        </div>
                      )}

                      {/* Side-by-side Digest Comparison */}
                      <div class="hash-comparison-table">
                        <div class="hash-row">
                          <span class="hash-label">Stored Baseline Hash:</span>
                          <code class="hash-val">
                            {auditResult.storedHash || "No baseline hash recorded (Draft record)"}
                          </code>
                        </div>
                        <div class="hash-row">
                          <span class="hash-label">
                            Live Re-computed Hash:
                            {auditResult.tamperSimulated && (
                              <span class="tamper-tag"> (1-byte injected)</span>
                            )}
                          </span>
                          <code class="hash-val highlight-computed">
                            {auditResult.computedHash}
                          </code>
                        </div>
                      </div>

                      <div class="audit-timestamp-note">
                        Audit conducted on local client at {formatDateTime(auditResult.checkedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Any File Hasher */}
      {activeTab === "file" && (
        <div class="verify-mode-section">
          <div class="file-audit-wrap">
            <div
              class={`file-drop-zone ${dragOver ? "drop-active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div class="drop-icon">📁</div>
              <h3>Drag & drop any evidence file or photo here</h3>
              <p>Supports JPEG, PNG, PDF, or telemetry data files</p>
              <label class="btn btn-outline file-browse-btn">
                Browse File
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (input.files && input.files.length > 0) {
                      handleProcessFile(input.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {droppedFile && (
              <div class="dropped-file-card">
                <h4>Analyzed File: {droppedFile.name}</h4>
                <div class="file-meta-row">
                  <span>Size: {(droppedFile.size / 1024).toFixed(1)} KB</span>
                  <span>Type: {droppedFile.type || "application/octet-stream"}</span>
                </div>

                <div class="hash-output-box">
                  <label>SHA-256 Digest:</label>
                  {fileHashing ? (
                    <span>Computing SHA-256...</span>
                  ) : (
                    <code class="file-digest">{droppedFileHash}</code>
                  )}
                </div>

                {/* Compare With Expected Hash */}
                <div class="compare-hash-box">
                  <label>Compare with expected hash (optional):</label>
                  <input
                    type="text"
                    class="compare-input"
                    placeholder="Paste 64-character SHA-256 hash here to test match..."
                    value={expectedHashInput}
                    onInput={(e) => setExpectedHashInput((e.target as HTMLInputElement).value)}
                  />

                  {compareMatch !== null && (
                    <div class={`match-alert ${compareMatch ? "match-ok" : "match-fail"}`}>
                      {compareMatch ? "✅ Exact Match: The file matches the expected hash!" : "❌ Mismatch: The file does not match the expected hash."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational Civic Disclaimer (Saboot integrity principle) */}
      <div class="verify-disclaimer-card">
        <h3>ℹ️ Understanding Evidence Integrity vs Ground Truth</h3>
        <div class="disclaimer-grid">
          <div class="disclaimer-col">
            <h4>What Hashing Guarantees:</h4>
            <p>
              Cryptographic hashes (SHA-256) act as digital fingerprints. If a photo or document is modified by even a single bit after capture, the recalculated hash will be completely different. This proves the file has not been altered in transit or storage.
            </p>
          </div>
          <div class="disclaimer-col">
            <h4>What Hashing Cannot Guarantee:</h4>
            <p>
              A matching hash does <strong>not</strong> prove that the disaster physically took place, nor that the photo was not staged before capture. Cryptography verifies data integrity, not physical truth. Officers use satellite telemetry and field visits alongside cryptographic evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
