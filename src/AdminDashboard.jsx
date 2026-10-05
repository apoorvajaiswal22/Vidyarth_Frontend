import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getAdminApplications,
  getApplicationAuditLog,
  updateApplicationStatus,
  getApplicationById,
  API_BASE_URL,
} from "./api/api";
import "./AdminDashboard.css";

const statusOptions = [
  "submitted",
  "under_review",
  "deficient",
  "selected",
  "rejected",
];

function getApplicationId(application) {
  return application?._id || application?.id || application?.applicationId || "";
}

function getApplicationList(response) {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  return data?.applications || data?.items || [];
}

function getDocumentEntries(application) {
  const documents = application?.documents || application?.files || [];
  if (Array.isArray(documents)) {
    return documents.map((document, index) => ({
      name: document?.name || document?.original_name || document?.filename || `Document ${index + 1}`,
      url: document?.url || document?.fileUrl || (document?.file_path ? `${API_BASE_URL.replace(/\/api$/, "")}/uploads/${document.file_path.split('/').pop()}` : ""),
      status: document?.verification_status || "pending",
      confidence: document?.confidence_score,
    }));
  }
  if (documents && typeof documents === "object") {
    return Object.entries(documents).map(([name, value]) => ({
      name,
      url: typeof value === "string" ? value : value?.url || value?.fileUrl || value?.path || "",
    }));
  }
  return [];
}

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [statusDraft, setStatusDraft] = useState("");
  const [remarks, setRemarks] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  async function loadApplications(preferredId = "") {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminApplications();
      const records = getApplicationList(response);
      setApplications(records);
      const nextSelected = records.find((item) => getApplicationId(item) === preferredId) || records[0] || null;
      setSelected(nextSelected);
      setStatusDraft(nextSelected?.status || "submitted");
      setAuditEntries([]);
    } catch (requestError) {
      setError(requestError?.message || "Could not load applications from the admin service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("vidyarthAdminToken")) {
      navigate("/admin-login", { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("vidyarthAdminToken")) return;
    let active = true;
    getAdminApplications()
      .then((response) => {
        if (!active) return;
        const records = getApplicationList(response);
        const firstApplication = records[0] || null;
        setApplications(records);
        setSelected(firstApplication);
        setStatusDraft(firstApplication?.status || "submitted");
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || "Could not load applications from the admin service.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (!localStorage.getItem("vidyarthAdminToken")) {
    return <Navigate to="/admin-login" replace />;
  }

  const filteredApplications = applications.filter((application) => {
    const applicant = application?.applicant || application?.student || application?.user || { name: application?.student_name, email: application?.student_email };
    const searchable = [
      getApplicationId(application),
      applicant.name,
      applicant.email,
      application?.scheme,
      application?.schemeName,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = searchable.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || application?.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const counts = {
    total: applications.length,
    review: applications.filter((item) => ["submitted", "under_review"].includes(item?.status)).length,
    deficient: applications.filter((item) => item?.status === "deficient").length,
    selected: applications.filter((item) => item?.status === "selected").length,
  };
  const schemeCounts = applications.reduce((result, application) => {
    const scheme = application?.schemeName || application?.scheme || "Unspecified scheme";
    result[scheme] = (result[scheme] || 0) + 1;
    return result;
  }, {});
  const selectedDocuments = getDocumentEntries(selected);

  async function saveStatus() {
    const id = getApplicationId(selected);
    if (!id) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await updateApplicationStatus(id, { status: statusDraft, remarks });
      setNotice("Application status updated.");
      setRemarks("");
      await loadApplications(getApplicationId(selected));
    } catch (requestError) {
      setError(requestError?.message || "Status could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function showAuditLog() {
    const id = getApplicationId(selected);
    if (!id) return;
    setError("");
    try {
      const response = await getApplicationAuditLog(id);
      const data = response?.data ?? response;
      setAuditEntries(Array.isArray(data) ? data : data?.logs || data?.entries || []);
    } catch (requestError) {
      setError(requestError?.message || "Audit history could not be loaded.");
    }
  }

  function signOut() {
    localStorage.removeItem("vidyarthAdminToken");
    localStorage.removeItem("vidyarthAdminUser");
    navigate("/admin-login", { replace: true });
  }

  async function selectApplication(application) {
    setSelected(application);
    setStatusDraft(application?.status || "submitted");
    setAuditEntries([]);
    setNotice("");
    const id = getApplicationId(application);
    if (!id) return;
    try {
      const response = await getApplicationById(id);
      const detail = response?.data?.application || response?.application;
      const docs = response?.data?.documents || response?.documents || [];
      if (detail) setSelected({ ...application, ...detail, documents: docs, applicant: { name: detail.student_name, email: detail.student_email } });
    } catch (requestError) {
      setError(requestError?.message || "Could not load application details.");
    }
  }

  return (
    <div className="admin-dashboard-page">
      <aside className="admin-side-nav">
        <Link to="/admin" className="admin-side-brand"><img src="/vidyarth-logo.svg" alt="" /><span><strong>VIDYARTH</strong><small>MoTA • MIS</small></span></Link>
        <div className="admin-side-section">APPLICATION MANAGEMENT</div>
        <button className="active" type="button">▣ <span>Dashboard</span></button>
        <button type="button" onClick={() => document.getElementById('application-list-title')?.scrollIntoView({ behavior: 'smooth' })}>▤ <span>Application Queue</span></button>
        <button type="button" onClick={() => document.getElementById('admin-document-links')?.scrollIntoView({ behavior: 'smooth' })}>✓ <span>Document Verification</span></button>
        <button type="button" onClick={() => document.getElementById('admin-status')?.scrollIntoView({ behavior: 'smooth' })}>! <span>Deficiency & Resubmission</span></button>
        <div className="admin-side-section">REPORTING</div>
        <button type="button" onClick={() => window.alert('Merit & Selection module is available through the configured selection service.')}>★ <span>Merit & Selection</span></button>
        <button type="button" onClick={() => window.alert('Grievance desk is available from the public portal.')}>? <span>Grievances</span></button>
        <button type="button" onClick={() => window.alert('MIS reports are generated from the live application records.')}>▥ <span>Reports & Analytics</span></button>
        <button type="button" onClick={showAuditLog} disabled={!selected}>◷ <span>Audit Trail</span></button>
        <Link to="/" className="admin-side-public">← Public portal</Link>
      </aside>
      <div className="admin-dashboard-content">
      <header className="admin-dashboard-header">
        <Link to="/" className="admin-dashboard-brand">
          <img src="/vidyarth-logo.svg" alt="" />
          <span><strong>VIDYARTH</strong><small>{String(JSON.parse(localStorage.getItem("vidyarthAdminUser") || "{}").role || "admin").toUpperCase()} • Ministry of Tribal Affairs</small></span>
        </Link>
        <div className="admin-dashboard-header-actions">
          <Link to="/">Public portal</Link>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <main className="admin-dashboard-main">
        <div className="admin-dashboard-title-row">
          <div>
            <span className="admin-dashboard-kicker">OFFICIAL WORKSPACE</span>
            <h1>Application administration</h1>
            <p>Review submissions, record deficiencies, and manage application status.</p>
          </div>
          <button type="button" onClick={loadApplications} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh applications"}
          </button>
        </div>

        <section className="admin-dashboard-metrics" aria-label="Application summary">
          <div><span>Total applications</span><strong>{counts.total}</strong></div>
          <div><span>Awaiting review</span><strong>{counts.review}</strong></div>
          <div><span>Deficiencies</span><strong>{counts.deficient}</strong></div>
          <div><span>Selected</span><strong>{counts.selected}</strong></div>
        </section>

        <section className="admin-scheme-summary" aria-labelledby="admin-scheme-summary-title">
          <h2 id="admin-scheme-summary-title">Applications by scheme</h2>
          <div>
            {Object.entries(schemeCounts).length === 0
              ? <span>No scheme data available</span>
              : Object.entries(schemeCounts).map(([scheme, count]) => (
                <span key={scheme}><strong>{count}</strong>{scheme}</span>
              ))}
          </div>
        </section>

        {(error || notice) && (
          <p className={`admin-dashboard-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>
            {error || notice}
          </p>
        )}

        <div className="admin-dashboard-workspace">
          <section className="admin-application-list" aria-labelledby="application-list-title">
            <div className="admin-list-heading">
              <h2 id="application-list-title">Applications</h2>
              <span>{filteredApplications.length} records</span>
            </div>
            <div className="admin-list-filters">
              <label className="admin-search-label">
                <span className="visually-hidden">Search applications</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, scheme" />
              </label>
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </div>

            {loading ? <p className="admin-list-empty">Loading applications...</p> : null}
            {!loading && filteredApplications.length === 0 ? (
              <p className="admin-list-empty">{error ? "Application records are unavailable." : "No applications match these filters."}</p>
            ) : null}

            <div className="admin-application-rows">
              {filteredApplications.map((application) => {
                const applicant = application?.applicant || application?.student || application?.user || { name: application?.student_name, email: application?.student_email };
                const id = getApplicationId(application);
                return (
                  <button
                    type="button"
                    key={id}
                    className={`admin-application-row ${getApplicationId(selected) === id ? "is-selected" : ""}`}
                    onClick={() => selectApplication(application)}
                  >
                    <span className="admin-row-primary">
                      <strong>{applicant.name || applicant.fullName || "Applicant details unavailable"}</strong>
                      <small>{id || "No application ID"} · {application?.schemeName || application?.scheme || "Scheme not specified"}</small>
                    </span>
                    <span className={`admin-status-badge status-${String(application?.status || "unknown").toLowerCase()}`}>
                      {String(application?.status || "unknown").replaceAll("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="admin-application-detail" aria-label="Selected application details">
            {selected ? (
              <>
                <span className="admin-dashboard-kicker">SELECTED APPLICATION</span>
                <h2>{selected?.applicant?.name || selected?.student_name || selected?.student?.name || selected?.user?.name || selected?.fullName || "Applicant"}</h2>
                <dl>
                  <div><dt>Application ID</dt><dd>{getApplicationId(selected) || "Not provided"}</dd></div>
                  <div><dt>Email</dt><dd>{selected?.applicant?.email || selected?.student_email || selected?.student?.email || selected?.user?.email || selected?.email || "Not provided"}</dd></div>
                  <div><dt>Scheme</dt><dd>{selected?.schemeName || selected?.scheme || "Not provided"}</dd></div>
                  <div><dt>Current status</dt><dd>{String(selected?.status || "unknown").replaceAll("_", " ")}</dd></div>
                </dl>

                <section className="admin-document-links" aria-label="Applicant documents">
                  <h3>Submitted documents</h3>
                  {selectedDocuments.length === 0
                    ? <p>No document links were returned for this application.</p>
                    : selectedDocuments.map((document) => (
                      <div className="admin-doc-item" key={`${document.name}-${document.url}`}>
                        {document.url ? <a href={document.url} target="_blank" rel="noreferrer">{document.name} ↗</a> : <span>{document.name}</span>}
                        <small>{document.status}{document.confidence != null ? ` · ${document.confidence}% confidence` : ""}</small>
                      </div>
                    ))}
                </section>

                <label className="admin-detail-label" htmlFor="admin-status">Update status</label>
                <select id="admin-status" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                  {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
                <label className="admin-detail-label" htmlFor="admin-remarks">Remarks / deficiency message</label>
                <textarea id="admin-remarks" rows="3" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add a note for the application record" />
                <button className="admin-save-status" type="button" onClick={saveStatus} disabled={saving}>
                  {saving ? "Saving..." : "Save status update"}
                </button>
                <button className="admin-audit-button" type="button" onClick={showAuditLog}>View audit history</button>
                {auditEntries.length > 0 && (
                  <ol className="admin-audit-list">
                    {auditEntries.map((entry, index) => (
                      <li key={entry.id || entry._id || index}>
                        <strong>{entry.action || entry.status || "Record updated"}</strong>
                        <span>{entry.remarks || entry.message || entry.createdAt || ""}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <p>Select an application to review its details.</p>
            )}
          </aside>
        </div>
      </main>
      </div>
    </div>
  );
}

export default AdminDashboard;