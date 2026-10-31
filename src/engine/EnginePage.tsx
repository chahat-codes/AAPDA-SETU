// src/engine/EnginePage.tsx
// ─── Evidence Engine — Cryptographic Sealing & Tamper-Evidence Station ───

import { useState, useEffect, useCallback } from "preact/hooks";
import { getRecords, saveRecord } from "@shared/db";
import type { EvidenceRecord } from "@shared/types";
import { hashEvidencePhoto } from "./hashEvidence";
import { sealWithSignature } from "./signEvidence";
import { hashBlob } from "@shared/crypto";
import { formatDateTime } from "@officer/officerUtils";
import { ROUTES } from "@shared/constants";
import { playClick, playSealSound } from "@shared/sound";
import "./engine.css";

export default function EnginePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sealingId, setSealingId] = useState<string | null>(null);
  const [batchSealing, setBatchSealing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Live byte hasher playground state
  const [testInput, setTestInput] = useState("AapdaSetu Emergency Field Telemetry 2024");
  const [testHash, setTestHash] = useState<string>("");
  const [testHashing, setTestHashing] = useState(false);

  // Load records from IndexedDB
  const refreshRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecords();
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasUsablePhoto = (record: EvidenceRecord) =>
    !!record.consentGiven &&
    !!record.photoBlob &&
    record.photoBlob.type.startsWith("image/") &&
    record.photoBlob.size > 64;

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Compute test hash whenever testInput changes
  useEffect(() => {
    const computeTest = async () => {
      setTestHashing(true);
      try {
        const blob = new Blob([testInput], { type: "text/plain" });
        const h = await hashBlob(blob);
        setTestHash(h);
      } catch {
        setTestHash("Error computing digest");
      } finally {
        setTestHashing(false);
      }
    };
    computeTest();
  }, [testInput]);

  // Seal a single record with SHA-256 + ECDSA P-256
  const handleSealRecord = async (rec: EvidenceRecord) => {
    if (!hasUsablePhoto(rec)) {
      setFeedback({ type: "error", msg: "A consented photo is required. Draft placeholders cannot be sealed." });
      return;
    }
    setSealingId(rec.id);
    setFeedback(null);
    try {
      // 1. Calculate SHA-256 hash of the photoBlob
      const hash = await hashEvidencePhoto(rec);

      // 2. Generate ECDSA P-256 key pair and sign the hash
      const { signature, publicKey } = await sealWithSignature(hash);

      // 3. Update the record
      const now = Date.now();
      const updated: EvidenceRecord = {
        ...rec,
        photoHash: hash,
        signature: signature,
        publicKey: publicKey,
        status: rec.status === "draft" ? "sealed" : rec.status,
        updatedAt: now,
      };

      // 4. Save to IndexedDB
      await saveRecord(updated);
      playSealSound();

      // 5. Update local state
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setFeedback({
        type: "success",
        msg: `Successfully sealed evidence for ${rec.farmerName}! (Digest: ${hash.slice(0, 16)}...)`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error("Sealing failed:", err);
      setFeedback({
        type: "error",
        msg: `Failed to seal evidence: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setSealingId(null);
    }
  };

  // Batch seal all unsealed drafts
  const handleBatchSeal = async () => {
    const unsealed = records.filter((r) => !r.photoHash && hasUsablePhoto(r));
    if (unsealed.length === 0) {
      setFeedback({ type: "error", msg: "No consented photo records are ready to seal yet." });
      return;
    }

    setBatchSealing(true);
    setFeedback(null);
    let count = 0;

    try {
      for (const rec of unsealed) {
        const hash = await hashEvidencePhoto(rec);
        const { signature, publicKey } = await sealWithSignature(hash);
        const now = Date.now();
        const updated: EvidenceRecord = {
          ...rec,
          photoHash: hash,
          signature: signature,
          publicKey: publicKey,
          status: rec.status === "draft" ? "sealed" : rec.status,
          updatedAt: now,
        };
        await saveRecord(updated);
        count++;
      }
      await refreshRecords();
      setFeedback({
        type: "success",
        msg: `Batch sealed ${count} draft record(s) with SHA-256 hashes & ECDSA signatures!`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        msg: `Batch sealing interrupted: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setBatchSealing(false);
    }
  };

  const unsealedRecords = records.filter((r) => !r.photoHash && hasUsablePhoto(r));
  const waitingForPhoto = records.filter((r) => !r.photoHash && !hasUsablePhoto(r));
  const sealedRecords = records.filter((r) => !!r.photoHash);

  return (
    <div class="engine-container">
      {/* Page Title & Explanation */}
      <div class="engine-header">
        <div>
          <h1 class="engine-title">Seal photo evidence</h1>
          <p class="engine-subtitle">
            Create a local SHA-256 photo digest and a device-generated signature. This helps detect later file changes; it does not verify the photo or submit a report.
          </p>
        </div>
        <div class="engine-crypto-badge">
            <span>Runs on this device</span>
        </div>
      </div>

      {feedback && (
        <div class={`engine-feedback feedback-${feedback.type}`}>
          {feedback.type === "success" ? "✅" : "⚠️"} {feedback.msg}
        </div>
      )}

      {/* Explanatory Architecture Card (Civic Tech Transparency) */}
      <div class="engine-concept-card">
        <h3 class="concept-title">🔒 How AapdaSetu Cryptographic Sealing Works</h3>
        <div class="concept-flow">
          <div class="flow-step">
            <div class="flow-step-icon">📸</div>
            <div class="flow-step-text">
              <strong>Raw Evidence Bytes</strong>
              <span>Farmer photo captured on device</span>
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-icon">🔢</div>
            <div class="flow-step-text">
              <strong>SHA-256 Hashing</strong>
              <span>One-way 256-bit cryptographic digest</span>
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-icon">✍️</div>
            <div class="flow-step-text">
              <strong>ECDSA P-256 Signing</strong>
              <span>Asymmetric key pair signs the digest</span>
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="flow-step-icon">🛡️</div>
            <div class="flow-step-text">
              <strong>Tamper-Evident Record</strong>
              <span>Stored in IndexedDB ready for audit</span>
            </div>
          </div>
        </div>

        {/* Honest Limitations Callout */}
        <div class="engine-caveat-box">
          <div class="caveat-item">
            <strong>✅ What sealing can show:</strong> If the stored photo bytes change after sealing, a later hash comparison can detect that difference.
          </div>
          <div class="caveat-item">
            <strong>⚠️ What it does not prove:</strong> A local hash/signature does not prove when or where a photo was taken, that damage is genuine, or that an office reviewed it. The signing key is created for this local demo.
          </div>
        </div>
      </div>

      {/* Live Metrics Row */}
      <div class="engine-metrics-row">
        <div class="metric-card">
          <span class="metric-num">{records.length}</span>
          <span class="metric-label">Total Records in DB</span>
        </div>
        <div class="metric-card metric-amber">
          <span class="metric-num">{unsealedRecords.length}</span>
          <span class="metric-label">Unsealed Drafts (Action Needed)</span>
        </div>
        <div class="metric-card metric-emerald">
          <span class="metric-num">{sealedRecords.length}</span>
          <span class="metric-label">Hashed and signed locally</span>
        </div>
      </div>

      {/* Section 1: Unsealed Drafts Queue */}
      <section class="engine-section">
        <div class="section-header-row">
          <div>
            <h2 class="section-heading">Unsealed Drafts Queue</h2>
            <p class="section-subtext">
              Consented photo records ready for a local integrity seal.
            </p>
          </div>
          {unsealedRecords.length > 0 && (
            <button
              class="btn btn-primary"
              onClick={handleBatchSeal}
              disabled={batchSealing || !!sealingId}
            >
            {batchSealing ? "🔄 Sealing photos…" : "⚡ Seal ready photos"}
            </button>
          )}
        </div>

        {loading ? (
          <div class="engine-empty-box">Loading draft queue...</div>
        ) : unsealedRecords.length === 0 ? (
          <div class="engine-empty-box success-empty">
            <span class="empty-icon">🌿</span>
            <h4>No consented photos are ready to seal.</h4>
            <p>Save a report with a real photo and consent. Empty drafts and placeholder images are not sealable.</p>
          </div>
        ) : (
          <div class="engine-queue-list">
            {unsealedRecords.map((r) => (
              <div key={r.id} class="engine-queue-item">
                <div class="queue-left">
                  <div class="queue-farmer">{r.farmerName}</div>
                  <div class="queue-meta">
                    ID: <code>{r.farmerId}</code> · Created: {formatDateTime(r.createdAt)} · Type: {r.damageType}
                  </div>
                  <div class="queue-desc">{r.description}</div>
                </div>
                <div class="queue-right">
                  <button
                    class="btn btn-seal"
                    onClick={() => handleSealRecord(r)}
                    disabled={sealingId === r.id || batchSealing}
                  >
                    {sealingId === r.id ? "⏳ Computing SHA-256..." : "🔒 Seal Evidence"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && waitingForPhoto.length > 0 && (
          <p class="engine-waiting-note">{waitingForPhoto.length} draft{waitingForPhoto.length === 1 ? "" : "s"} need a consented photo before a seal can be created.</p>
        )}
      </section>

      {/* Section 2: Sealed Evidence Registry */}
      <section class="engine-section">
        <div class="section-header-row">
          <div>
            <h2 class="section-heading">Sealed Evidence Registry</h2>
            <p class="section-subtext">
              Local photo digests and signatures. Verification checks integrity only, not authenticity or government approval.
            </p>
          </div>
          <a href={ROUTES.verify} class="btn btn-outline-emerald">
            🔍 Go to Independent Verifier →
          </a>
        </div>

        {sealedRecords.length === 0 ? (
          <div class="engine-empty-box">
            No sealed records found. Seal records in the queue above to see them registered here.
          </div>
        ) : (
          <div class="engine-sealed-table-wrap">
            <table class="engine-sealed-table">
              <thead>
                <tr>
                  <th>Farmer / Case</th>
                  <th>Damage</th>
                  <th>SHA-256 Photo Digest</th>
                  <th>Public Key</th>
                  <th>Sealed At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sealedRecords.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div class="tbl-name">{s.farmerName}</div>
                      <div class="tbl-id"><code>{s.id}</code></div>
                    </td>
                    <td>
                      <span class="tbl-damage-tag">{s.damageType}</span>
                    </td>
                    <td>
                      <div class="tbl-hash-cell">
                        <code>{s.photoHash}</code>
                        <button
                          class="copy-btn"
                          title="Copy SHA-256 Hash"
                          onClick={() => {
                            if (s.photoHash) navigator.clipboard.writeText(s.photoHash);
                            setFeedback({ type: "success", msg: "Hash copied to clipboard!" });
                            setTimeout(() => setFeedback(null), 2500);
                          }}
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td>
                      <code class="tbl-pubkey">
                        {s.publicKey ? s.publicKey.substring(0, 24) + "..." : "None"}
                      </code>
                    </td>
                    <td class="tbl-date">{formatDateTime(s.updatedAt)}</td>
                    <td>
                      <a href={ROUTES.verify} class="btn btn-sm btn-verify-link">
                        Audit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 3: Interactive Cryptographic Hasher Playground */}
      <section class="engine-section">
        <h2 class="section-heading">🧪 Live Web Crypto SHA-256 Hasher</h2>
        <p class="section-subtext">
          Interactive educational tool: Type any string or telemetry below to see the Web Crypto engine calculate a real SHA-256 digest live.
        </p>

        <div class="hasher-playground">
          <div class="hasher-field">
            <label>Input Message / Telemetry Bytes:</label>
            <input
              type="text"
              class="hasher-input"
              value={testInput}
              onInput={(e) => setTestInput((e.target as HTMLInputElement).value)}
              placeholder="Type any text to test..."
            />
          </div>

          <div class="hasher-result-box">
            <div class="hasher-result-label">
              <span>SHA-256 Hex Digest (256-bit):</span>
              {testHashing && <span class="calc-pulse">Computing...</span>}
            </div>
            <code class="hasher-digest-code">{testHash}</code>
            <p class="hasher-note">
              Notice how modifying even one single character completely changes the 64-character hexadecimal digest (the avalanche effect).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
