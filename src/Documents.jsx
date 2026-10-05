import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApplicationById, getApplicationPrecheck, getMyApplications, uploadDocuments } from "./api/api";
import "./Documents.css";

const labels = { caste_certificate: "ST Caste / Tribe Certificate", income_certificate: "Family Income Certificate", marksheet: "Latest Marksheet / Academic Record", bank_passbook: "Bank Passbook / Account Proof", admission_letter: "Admission / Joining Letter", identity_proof: "Identity Proof" };

export default function Documents() {
  const [params] = useSearchParams();
  const [application, setApplication] = useState(null);
  const [docs, setDocs] = useState([]);
  const [precheck, setPrecheck] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load(id) {
    if (!id) return;
    const response = await getApplicationById(id);
    const app = response?.data?.application || response?.application;
    const records = response?.data?.documents || response?.documents || [];
    setApplication(app);
    setDocs(records);
    try {
      const check = await getApplicationPrecheck(id);
      setPrecheck(check?.data || check);
    } catch { /* precheck is optional until an application exists */ }
  }

  useEffect(() => {
    async function boot() {
      try {
        const requested = params.get("applicationId") || localStorage.getItem("applicationId") || localStorage.getItem("vidyarthApplicationId");
        if (requested) return load(requested);
        const response = await getMyApplications();
        const list = response?.data?.applications || response?.applications || [];
        if (list[0]?.id) await load(list[0].id);
      } catch (e) { setError(e.message || "Could not load your document centre."); }
    }
    boot();
  }, []);

  async function upload(file) {
    if (!file || !application?.id) return;
    if (!/^(application\/pdf|image\/jpeg|image\/png)$/.test(file.type)) return setError("Only PDF, JPG or PNG files are accepted.");
    if (file.size > 10 * 1024 * 1024) return setError("Each file must be under 10 MB.");
    setBusy(true); setError(""); setNotice("");
    try {
      const body = new FormData(); body.append(selectedDoc, file);
      await uploadDocuments(application.id, body);
      await load(application.id);
      setNotice(`${labels[selectedDoc] || selectedDoc} uploaded. Verification status has been refreshed from the backend.`);
    } catch (e) { setError(e.message || "Upload failed."); }
    finally { setBusy(false); }
  }

  return <div className="vd-page">
    <div className="vd-breadcrumb"><Link to="/dashboard">Dashboard</Link><span>›</span><b>My Documents &amp; OCR</b></div>
    <header className="vd-heading"><div><span className="vd-kicker">DOCUMENT CENTRE</span><h1>My Documents &amp; OCR</h1><p>View the documents actually attached to your application and the verification result returned by the backend.</p></div><span className="vd-lock">🔒 Secure document workspace</span></header>
    {error && <div className="vd-notice">⚠ {error}</div>}
    {notice && <div className="vd-notice success">✓ {notice}</div>}
    {!application ? <section className="vd-panel"><div className="vd-empty">No application was found for this account yet. <Link to="/apply">Start an application →</Link></div></section> : <>
      <section className="vd-summary"><div><span>Application ID</span><strong>{application.id}</strong></div><div><span>Scheme</span><strong>{application.scheme_name || "—"}</strong></div><div><span>Documents</span><strong>{docs.length}</strong></div><div><span>Pre-check</span><strong className={precheck?.ready ? "vd-green" : "vd-amber"}>{precheck ? (precheck.ready ? "Ready" : "Action required") : "Not run"}</strong></div></section>
      <section className="vd-panel"><div className="vd-panel-head"><div><h2>Uploaded documents</h2><p>Statuses below are read from the application database. No document is marked verified merely because a file was selected.</p></div></div>
        <div className="vd-doc-list">{docs.length ? docs.map((doc) => <article className="vd-doc" key={doc.id}><div className="vd-doc-icon">PDF</div><div className="vd-doc-copy"><strong>{labels[doc.doc_type] || doc.doc_type}</strong><p>{doc.original_name}</p><small>Uploaded {new Date(doc.uploaded_at).toLocaleString()}</small></div><div className="vd-ocr-result"><b className={`vd-status ${doc.verification_status}`}>{doc.verification_status}</b><span>{doc.confidence_score == null ? "Confidence pending" : `${doc.confidence_score}% confidence`}</span>{Array.isArray(doc.verification_flags) && doc.verification_flags.length > 0 && <small>{doc.verification_flags.join(", ")}</small>}</div><button type="button" className="vd-secondary" onClick={() => setSelectedDoc(doc.doc_type)}>Replace</button></article>) : <div className="vd-empty">No documents uploaded yet.</div>}</div>
        {selectedDoc && <div className="vd-replace"><b>Replace: {labels[selectedDoc] || selectedDoc}</b><label className="vd-primary">Choose new file<input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={(e) => upload(e.target.files?.[0])}/></label><button type="button" onClick={() => setSelectedDoc(null)}>Cancel</button></div>}
      </section>
      {precheck && <section className="vd-panel vd-precheck"><div><span className="vd-kicker">AI PRE-CHECK</span><h2>{precheck.score}% readiness</h2><p>{precheck.message}</p></div><div className="vd-pre-grid"><span>Missing documents <b>{precheck.missingDocuments?.length || 0}</b></span><span>Pending verification <b>{precheck.pendingDocuments?.length || 0}</b></span><span>Flagged documents <b>{precheck.flaggedDocuments?.length || 0}</b></span><span>Missing fields <b>{precheck.missingFields?.length || 0}</b></span></div></section>}
      <div className="vd-actions"><Link className="vd-secondary" to={`/apply?applicationId=${application.id}`}>Open application workspace</Link><Link className="vd-primary" to={`/track?applicationId=${application.id}`}>Track application →</Link></div>
    </>}
  </div>;
}
