// src/officer/OfficerPage.tsx
// ─── Officer Console — Review, verify, and assess crop-loss evidence ───

import { useState, useEffect, useCallback, useMemo } from "preact/hooks";
import type { EvidenceRecord, EvidenceStatus, DamageType } from "@shared/types";
import { saveRecord, getRecords } from "@shared/db";
import {
  getDemoRecords,
  getStatusBadgeClass,
  getStatusLabel,
  getDamageIcon,
  getDamageLabel,
  formatDateTime,
} from "./officerUtils";
import { playClick, playHover, playSealSound, playAlertSound } from "@shared/sound";
import "./officer.css";

export default function OfficerPage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<EvidenceRecord | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [damageFilter, setDamageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "urgent">("newest");

  // Officer Review Form State in detail modal
  const [officerNotesInput, setOfficerNotesInput] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EvidenceStatus | null>(null);

  // Load records from IndexedDB; fallback to demo data if empty
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const dbRecords = await getRecords();
      if (dbRecords && dbRecords.length > 0) {
        setRecords(dbRecords);
      } else {
        // Fallback: Show demo cases inline
        setRecords(getDemoRecords());
      }
    } catch {
      setRecords(getDemoRecords());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Seed demo records into local DB on demand
  const handleSeedDemoData = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const demos = getDemoRecords();
      for (const d of demos) {
        await saveRecord(d);
      }
      setActionSuccess("Seeded 4 demo cases into local IndexedDB!");
      setTimeout(() => setActionSuccess(null), 3500);
      await loadCases();
    } catch (err) {
      console.error(err);
      setActionError("Sample cases could not be saved on this device. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Sync selected case notes when opening modal
  const openCaseDetails = (c: EvidenceRecord) => {
    setSelectedCase(c);
    setOfficerNotesInput(c.officerNotes || "");
    setActionSuccess(null);
    setActionError(null);
    setPendingStatus(null);
  };

  const closeCaseDetails = () => {
    setSelectedCase(null);
    setOfficerNotesInput("");
    setActionSuccess(null);
    setActionError(null);
    setPendingStatus(null);
  };

  // Update Status and Notes
  const handleUpdateStatus = async (newStatus: EvidenceStatus) => {
    if (!selectedCase || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    if (newStatus === "verified") playSealSound();
    else if (newStatus === "rejected") playAlertSound();
    else playClick();

    const now = Date.now();
    const updated: EvidenceRecord = {
      ...selectedCase,
      status: newStatus,
      officerNotes: officerNotesInput.trim() || null,
      reviewedAt: now,
      updatedAt: now,
    };

    try {
      await saveRecord(updated);
      setSelectedCase(updated);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setActionSuccess(`Case status updated to ${getStatusLabel(newStatus)}`);
      setPendingStatus(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setActionError("Could not save this local review. The previous status is unchanged.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCase || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    const now = Date.now();
    const updated: EvidenceRecord = {
      ...selectedCase,
      officerNotes: officerNotesInput.trim() || null,
      updatedAt: now,
    };

    try {
      await saveRecord(updated);
      setSelectedCase(updated);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setActionSuccess("Officer assessment notes saved to IndexedDB.");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save notes:", err);
      setActionError("Could not save these notes on this device. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCase) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeCaseDetails(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCase]);

  // Metrics counts
  const stats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter(
        (r) => r.status === "submitted" || r.status === "under_review" || r.status === "draft"
      ).length,
      sealed: records.filter((r) => !!r.photoHash).length,
      verified: records.filter((r) => r.status === "verified").length,
      rejected: records.filter((r) => r.status === "rejected").length,
    };
  }, [records]);

  // Regional calamity loss distribution stats
  const damageStats = useMemo(() => {
    const counts = {
      flood: 0,
      drought: 0,
      hailstorm: 0,
      pest_attack: 0,
      other: 0,
    };
    records.forEach((r) => {
      if (r.damageType in counts) {
        counts[r.damageType as keyof typeof counts]++;
      } else {
        counts.other++;
      }
    });
    const maxVal = Math.max(1, ...Object.values(counts));
    return { counts, maxVal };
  }, [records]);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Status filter
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        // Damage filter
        if (damageFilter !== "all" && r.damageType !== damageFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = r.farmerName.toLowerCase().includes(q);
          const matchesId = r.farmerId.toLowerCase().includes(q);
          const matchesDesc = r.description.toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return b.createdAt - a.createdAt;
        if (sortBy === "oldest") return a.createdAt - b.createdAt;
        if (sortBy === "urgent") {
          // Unreviewed items first
          const rankA = a.status === "submitted" ? 0 : 1;
          const rankB = b.status === "submitted" ? 0 : 1;
          return rankA - rankB || b.createdAt - a.createdAt;
        }
        return 0;
      });
  }, [records, statusFilter, damageFilter, searchQuery, sortBy]);

  return (
    <div class="officer-container">
      {/* Demo Alert Banner (Saboot inspired) */}
      <div class="officer-alert-banner">
        <div class="officer-alert-content">
          <span class="officer-alert-badge">⚠️ DEMO ALERT</span>
          <span class="officer-alert-text">
            <strong>Sample data only:</strong> This local prototype has no live disaster feed. Do not use sample cases for real decisions.
          </span>
        </div>
        <button
          class="btn btn-sm btn-outline-amber"
          onClick={handleSeedDemoData}
          disabled={actionLoading}
        >
          📥 Seed Demo Cases in DB
        </button>
      </div>
      {!selectedCase && actionSuccess && <div class="officer-toast-banner" role="status">✅ {actionSuccess}</div>}
      {!selectedCase && actionError && <div class="officer-error-banner" role="alert">⚠️ {actionError}</div>}

      {/* Header & Title */}
      <div class="officer-header-row">
        <div>
          <h1 class="officer-title">Local review desk</h1>
          <p class="officer-subtitle">
            Review saved reports and add notes on this device. This demo is not connected to a government office.
          </p>
        </div>
        <div class="officer-mode-pill">
          <span class="pulse-dot"></span>
          <span>Local Review Station</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div class="officer-stats-grid">
        <div class="officer-stat-card">
          <div class="officer-stat-num">{stats.total}</div>
          <div class="officer-stat-label">Total Cases</div>
        </div>
        <div class="officer-stat-card stat-pending">
          <div class="officer-stat-num">{stats.pending}</div>
          <div class="officer-stat-label">Saved / in local review</div>
        </div>
        <div class="officer-stat-card stat-sealed">
          <div class="officer-stat-num">{stats.sealed}</div>
          <div class="officer-stat-label">Sealed locally</div>
        </div>
        <div class="officer-stat-card stat-verified">
          <div class="officer-stat-num">{stats.verified}</div>
          <div class="officer-stat-label">Review complete here</div>
        </div>
        <div class="officer-stat-card stat-rejected">
          <div class="officer-stat-num">{stats.rejected}</div>
          <div class="officer-stat-label">Flagged / Rejected</div>
        </div>
      </div>

      {/* Regional Calamity Distribution Visualizer */}
      <div class="officer-loss-visualizer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--cyber-lime)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ⚡ LOCAL REPORTS // DAMAGE TYPES
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Local saved reports by damage type — select a bar to filter
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(0,0,0,0.3)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-xs)" }}>
              Total: {records.length} Reports
            </span>
            {damageFilter !== "all" && (
              <button
                class="btn btn-xs btn-outline-cyan"
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                onClick={() => {
                  playClick();
                  setDamageFilter("all");
                }}
              >
                Reset Filter ✕
              </button>
            )}
          </div>
        </div>

        <div class="loss-chart-wrap">
          {[
            { key: "flood", label: "Flood", icon: "🌊", count: damageStats.counts.flood },
            { key: "hailstorm", label: "Hailstorm", icon: "🌨️", count: damageStats.counts.hailstorm },
            { key: "drought", label: "Drought", icon: "☀️", count: damageStats.counts.drought },
            { key: "pest_attack", label: "Pest Attack", icon: "🐛", count: damageStats.counts.pest_attack },
            { key: "other", label: "Other Perils", icon: "🌾", count: damageStats.counts.other },
          ].map((item) => {
            const heightPct = Math.round((item.count / damageStats.maxVal) * 100);
            const isSelected = damageFilter === item.key;
            return (
              <div
                key={item.key}
                class="loss-bar-col"
                style={{
                  cursor: "pointer",
                  opacity: damageFilter === "all" || isSelected ? 1 : 0.4,
                  transition: "opacity 0.2s ease",
                }}
                onClick={() => {
                  playClick();
                  setDamageFilter(damageFilter === item.key ? "all" : item.key);
                }}
                onMouseEnter={() => playHover()}
                title={`Filter by ${item.label} (${item.count} claims)`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDamageFilter(damageFilter === item.key ? "all" : item.key); } }}
              >
                <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: isSelected ? "var(--cyber-lime)" : "var(--text-secondary)" }}>
                  {item.count}
                </div>
                <div
                  class="loss-bar-fill"
                  style={{
                    height: `${Math.max(8, heightPct)}%`,
                    background: isSelected
                      ? "linear-gradient(180deg, #facc15 0%, #ca8a04 100%)"
                      : undefined,
                    boxShadow: isSelected
                      ? "0 0 16px rgba(250, 204, 21, 0.4)"
                      : undefined,
                  }}
                />
                <div class="loss-bar-label" style={{ color: isSelected ? "var(--cyber-lime)" : undefined }}>
                  <span>{item.icon}</span> {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div class="officer-filter-bar">
        <div class="officer-search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search farmer name, ID, or description..."
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            class="officer-search-input"
          />
          {searchQuery && (
            <button class="clear-search-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div class="officer-filter-group">
          <div class="filter-item">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
            >
              <option value="all">All Statuses ({records.length})</option>
              <option value="draft">Draft (Unsealed)</option>
              <option value="sealed">Sealed</option>
              <option value="submitted">Saved locally</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Local review complete</option>
              <option value="rejected">Rejected / Flagged</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Disaster:</label>
            <select
              value={damageFilter}
              onChange={(e) => setDamageFilter((e.target as HTMLSelectElement).value)}
            >
              <option value="all">All Disasters</option>
              <option value="flood">🌊 Flood</option>
              <option value="drought">🏜️ Drought</option>
              <option value="hailstorm">🌨️ Hailstorm</option>
              <option value="pest_attack">🐛 Pest Attack</option>
              <option value="other">❓ Other</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy((e.target as HTMLSelectElement).value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="urgent">Urgent First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case Worklist Table / Cards */}
      {loading ? (
        <div class="officer-loading-state">
          <div class="spinner"></div>
          <p>Loading assessment cases from local IndexedDB...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div class="officer-empty-state">
          <div class="empty-icon">📋</div>
          <h3>No matching cases found</h3>
          <p>Try clearing filters or search query, or seed sample cases.</p>
          <button class="btn btn-outline" onClick={() => { setStatusFilter("all"); setDamageFilter("all"); setSearchQuery(""); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div class="officer-case-grid">
          {filteredRecords.map((c) => (
            <CaseCard
              key={c.id}
              item={c}
              onInspect={() => openCaseDetails(c)}
            />
          ))}
        </div>
      )}

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div class="officer-modal-backdrop" onClick={closeCaseDetails}>
          <div
            class="officer-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div class="officer-modal-header">
              <div class="modal-title-wrap">
                <span class="damage-emoji-large">
                  {getDamageIcon(selectedCase.damageType)}
                </span>
                <div>
                  <h2 class="modal-title">{selectedCase.farmerName}</h2>
                  <span class="modal-sub">
                    ID: {selectedCase.farmerId} · Saved: {formatDateTime(selectedCase.createdAt)}
                  </span>
                </div>
              </div>
              <button class="modal-close-btn" onClick={closeCaseDetails} aria-label="Close case review">
                ✕
              </button>
            </div>

            {actionSuccess && (
              <div class="officer-toast-banner">
                ✅ {actionSuccess}
              </div>
            )}
            {actionError && <div class="officer-error-banner" role="alert">⚠️ {actionError}</div>}

            {/* Modal Body */}
            <div class="officer-modal-body">
              {/* Left Column: Photo & Cryptography */}
              <div class="modal-col modal-left">
                <div class="evidence-photo-box">
                  <h4 class="section-label">{selectedCase.id.startsWith("demo-") ? "Sample evidence image" : "Field Evidence Photograph"}</h4>
                  <CasePhotoViewer blob={selectedCase.photoBlob} />
                  <div class="photo-timestamp-tag">
                    📸 {selectedCase.id.startsWith("demo-") ? "Sample time" : "Captured"}: {formatDateTime(selectedCase.photoTimestamp)}
                  </div>
                </div>

                <div class="crypto-seal-box">
                  <h4 class="section-label">Cryptographic Integrity Seal</h4>
                  {selectedCase.id.startsWith("demo-") ? (
                    <div class="seal-details">
                      <div class="seal-status-pill seal-missing">🧪 Demo only · no real seal</div>
                      <p class="crypto-hint">This sample contains example hash/signature text. It was not calculated from this sample image. Use a real photo report in the Seal Evidence tool to create a local integrity seal.</p>
                    </div>
                  ) : selectedCase.photoHash ? (
                    <div class="seal-details">
                      <div class="seal-status-pill seal-intact">
                        🔒 SHA-256 Digest Recorded
                      </div>
                      <div class="hash-display">
                        <label>Digest:</label>
                        <code>{selectedCase.photoHash}</code>
                      </div>
                      {selectedCase.signature && (
                        <div class="hash-display">
                          <label>Digital Signature (ECDSA):</label>
                          <code>{selectedCase.signature.substring(0, 48)}...</code>
                        </div>
                      )}
                      <p class="crypto-hint">
                        Byte-level integrity seal is present. You can re-verify raw photo bytes in the <strong>Verify</strong> module.
                      </p>
                    </div>
                  ) : (
                    <div class="seal-details">
                      <div class="seal-status-pill seal-missing">
                        ⚠️ Unsealed Evidence (Draft)
                      </div>
                      <p class="crypto-hint">
                        This record has not yet received a cryptographic SHA-256 seal. Visit the <strong>Engine</strong> module to seal it.
                      </p>
                    </div>
                  )}
                </div>

                {/* Location Box */}
                <div class="location-box">
                  <h4 class="section-label">Geo-Location Coordinates</h4>
                  {selectedCase.location ? (
                    <div class="geo-details">
                      <div class="geo-coords">
                        📍 {selectedCase.id.startsWith("demo-") ? "Sample location" : "Lat"}: {selectedCase.location.latitude.toFixed(6)}, {selectedCase.id.startsWith("demo-") ? "Sample" : "Lng"}: {selectedCase.location.longitude.toFixed(6)}
                      </div>
                      {selectedCase.id.startsWith("demo-") ? (
                        <div class="geo-missing">Example coordinates only · not a farmer's location.</div>
                      ) : (
                        <>
                          <div class="geo-accuracy">GPS Accuracy: ±{selectedCase.location.accuracy.toFixed(1)} metres</div>
                          <a href={`https://www.google.com/maps?q=${selectedCase.location.latitude},${selectedCase.location.longitude}`} target="_blank" rel="noreferrer" class="map-link">🗺️ View map ↗</a>
                        </>
                      )}
                    </div>
                  ) : (
                    <div class="geo-missing">
                      ⚠️ No GPS coordinates captured for this record.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Case Details & Assessment */}
              <div class="modal-col modal-right">
                {/* Farmer & Consent Profile */}
                <div class="detail-section">
                  <h4 class="section-label">Farmer & Crop Details</h4>
                  <div class="detail-grid">
                    <div class="detail-cell">
                      <span class="cell-label">Phone</span>
                      <span class="cell-value">{selectedCase.phone || "Not provided"}</span>
                    </div>
                    <div class="detail-cell">
                      <span class="cell-label">Disaster Type</span>
                      <span class="cell-value">
                        {getDamageIcon(selectedCase.damageType)} {getDamageLabel(selectedCase.damageType)}
                      </span>
                    </div>
                    <div class="detail-cell">
                      <span class="cell-label">Informed Consent</span>
                      <span class="cell-value consent-ok">
                        {selectedCase.id.startsWith("demo-") ? "Sample consent value" : selectedCase.consentGiven ? "✅ Granted by Farmer" : "❌ No Consent"}
                      </span>
                    </div>
                    <div class="detail-cell">
                      <span class="cell-label">Consent Recorded</span>
                      <span class="cell-value">
                        {formatDateTime(selectedCase.consentTimestamp)}
                      </span>
                    </div>
                  </div>

                  <div class="description-box">
                    <span class="cell-label">Damage Description:</span>
                    <p class="desc-text">{selectedCase.description}</p>
                  </div>
                </div>

                {/* Current Status Pill */}
                <div class="status-summary-box">
                  <span class="cell-label">Current Assessment Status:</span>
                  <span class={`status-badge-lg ${getStatusBadgeClass(selectedCase.status)}`}>
                    {selectedCase.id.startsWith("demo-") ? "Sample status · demo only" : getStatusLabel(selectedCase.status)}
                  </span>
                  {selectedCase.reviewedAt && !selectedCase.id.startsWith("demo-") && (
                    <span class="review-date-label">
                      Last reviewed: {formatDateTime(selectedCase.reviewedAt)}
                    </span>
                  )}
                </div>

                {/* Officer Assessment Actions */}
                <div class="review-action-section">
                  <h4 class="section-label">Officer Assessment Station</h4>
                  <div class="notes-form">
                    <label class="notes-label">Officer Notes / Survey Observations:</label>
                    <textarea
                      class="officer-notes-textarea"
                      placeholder="Enter verification findings, estimated crop loss percentage, survey observations, or reasons for rejection..."
                      value={officerNotesInput}
                      onInput={(e) => setOfficerNotesInput((e.target as HTMLTextAreaElement).value)}
                      rows={4}
                    />
                    <div class="notes-btn-row">
                      <button
                        class="btn btn-sm btn-outline"
                        onClick={handleSaveNotes}
                        disabled={actionLoading}
                      >
                        💾 Save Notes Only
                      </button>
                    </div>
                  </div>

                  <div class="decision-buttons-row">
                    <button
                      class="btn btn-action-review"
                      onClick={() => setPendingStatus("under_review")}
                      disabled={actionLoading || selectedCase.status === "under_review"}
                    >
                        🔍 Mark for local review
                    </button>
                    <button
                      class="btn btn-action-approve"
                      onClick={() => setPendingStatus("verified")}
                      disabled={actionLoading || selectedCase.status === "verified"}
                    >
                        ✅ Mark review complete
                    </button>
                    <button
                      class="btn btn-action-reject"
                      onClick={() => setPendingStatus("rejected")}
                      disabled={actionLoading || selectedCase.status === "rejected"}
                    >
                      ❌ Flag for Follow-up
                    </button>
                  </div>
                  {pendingStatus && (
                    <div class="officer-confirm-review" role="alertdialog" aria-labelledby="review-confirm-title" aria-describedby="review-confirm-copy">
                      <div><h4 id="review-confirm-title">Confirm local review update</h4><p id="review-confirm-copy">This changes the status saved on this device only. It does not notify an office or approve assistance.</p></div>
                      <div class="officer-confirm-actions">
                        <button class="btn btn-sm btn-outline" type="button" onClick={() => setPendingStatus(null)} disabled={actionLoading}>Cancel</button>
                        <button class="btn btn-sm btn-primary" type="button" onClick={() => handleUpdateStatus(pendingStatus)} disabled={actionLoading}>{actionLoading ? "Saving…" : "Confirm local update"}</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Honest Prototype Notice */}
                <div class="disclaimer-note">
                  🔒 <strong>Local Offline Verification:</strong> Assessment actions update local browser storage (IndexedDB). No mock data or personal farmer records are sent to central government servers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Case Card in the Grid ──────────────────────────────────
function CaseCard({
  item,
  onInspect,
}: {
  item: EvidenceRecord;
  onInspect: () => void;
}) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (item.photoBlob) {
      const url = URL.createObjectURL(item.photoBlob);
      setThumb(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.photoBlob]);

  const isDemo = item.id.startsWith("demo-");

  return (
    <div class="officer-case-card" onClick={onInspect} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onInspect(); } }}>
      <div class="card-thumb-container">
        {thumb ? (
          <img src={thumb} alt="Evidence thumbnail" class="card-thumb-img" />
        ) : (
          <div class="card-thumb-placeholder">📸 No Photo</div>
        )}
        <span class={`card-status-badge ${getStatusBadgeClass(item.status)}`}>
          {isDemo ? "DEMO · example status" : getStatusLabel(item.status)}
        </span>
        {isDemo && <span class="card-demo-tag">DEMO</span>}
      </div>

      <div class="card-content">
        <div class="card-damage-row">
          <span class="damage-tag">
            {getDamageIcon(item.damageType)} {getDamageLabel(item.damageType)}
          </span>
          <span class="date-tag">{formatDateTime(item.createdAt)}</span>
        </div>

        <h3 class="card-farmer-name">{item.farmerName}</h3>
        <p class="card-farmer-id">ID: {item.farmerId}</p>

        <p class="card-desc-snippet">{item.description}</p>

        <div class="card-footer-meta">
          <div class="card-meta-indicators">
            {isDemo ? (
              <span class="indicator-chip chip-unsealed" title="Sample record, not real evidence">🧪 Sample</span>
            ) : item.photoHash ? (
              <span class="indicator-chip chip-sealed" title="Sealed with SHA-256">
                🔒 Sealed
              </span>
            ) : (
              <span class="indicator-chip chip-unsealed" title="Unsealed Draft">
                ⚠️ Draft
              </span>
            )}
            {item.location ? (
              <span class="indicator-chip chip-gps" title="GPS Captured">
                📍 GPS Active
              </span>
            ) : (
              <span class="indicator-chip chip-no-gps" title="No GPS">
                No GPS
              </span>
            )}
          </div>
          <button class="btn btn-sm btn-inspect">Inspect →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Photo Viewer in Modal ────────────────────────────────────────
function CasePhotoViewer({ blob }: { blob: Blob }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [blob]);

  if (!imgUrl) {
    return <div class="photo-viewer-empty">No Photo Blob Available</div>;
  }

  return (
    <div class="photo-viewer-wrap scanner-viewport">
      <div class="scanner-laser-line" />
      <img src={imgUrl} alt="High resolution crop loss evidence" class="photo-viewer-img" />
    </div>
  );
}
