import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginAdmin, loginOfficer } from "./api/api";
import { useSharedLanguage } from "./i18n";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("role") === "officer" ? "officer" : "admin");
  const [lang, setLang] = useSharedLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const hi = lang === "hi";

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");
    if (!email || !password) { setNotice(hi ? "ईमेल और पासवर्ड दर्ज करें।" : "Enter your email and password."); return; }
    setLoading(true);
    try {
      const result = mode === "admin" ? await loginAdmin({ email, password }) : await loginOfficer({ email, password });
      const data = result?.data || result;
      const token = data?.token;
      const user = data?.user;
      const role = String(user?.role || "").toLowerCase();
      if (!token) throw new Error(hi ? "लॉगिन सेवा ने एक्सेस टोकन नहीं दिया।" : "The login service did not return an access token.");
      if (mode === "admin" && role !== "admin") throw new Error(hi ? "यह खाता एडमिन के लिए अधिकृत नहीं है।" : "This account is not authorised for the administrator portal.");
      if (mode === "officer" && role !== "officer") throw new Error(hi ? "यह खाता अधिकारी के लिए अधिकृत नहीं है।" : "This account is not authorised for the officer portal.");
      localStorage.setItem("vidyarthAdminToken", token);
      localStorage.setItem("vidyarthAdminUser", JSON.stringify(user));
      navigate("/admin");
    } catch (err) {
      setNotice(err?.message || (hi ? "लॉगिन असफल रहा।" : "Login failed."));
    } finally { setLoading(false); }
  }

  return <div className="admin-login-page">
    <div className="admin-login-topbar"><div className="admin-login-container"><span>{hi ? "भारत सरकार | जनजातीय कार्य मंत्रालय" : "Government of India | Ministry of Tribal Affairs"}</span><div><button type="button" onClick={() => setLang("hi")}>हिन्दी</button><button type="button" onClick={() => setLang("en")}>English</button><Link to="/">{hi ? "मुखपृष्ठ" : "Back to Home"}</Link></div></div></div>
    <header className="admin-login-header"><div className="admin-login-container admin-login-brand-row"><Link to="/" className="admin-login-brand"><img src="/vidyarth-logo.svg" alt="VIDYARTH"/><span><strong>VIDYARTH</strong><small>{hi ? "छात्रवृत्ति एवं फेलोशिप प्रबंधन प्रणाली" : "Scholarship & Fellowship Management System"}</small></span></Link><span className="admin-login-department">{hi ? "अधिकृत प्रवेश" : "AUTHORISED ACCESS"}</span></div></header>
    <main className="admin-login-main"><section className="admin-login-card">
      <div className="admin-login-card-label">VIDYARTH • {hi ? "सुरक्षित पोर्टल" : "SECURE PORTAL"}</div>
      <h1>{mode === "admin" ? (hi ? "एडमिन लॉगिन" : "Admin Login") : (hi ? "अधिकारी लॉगिन" : "Officer Login")}</h1>
      <p>{mode === "admin" ? (hi ? "प्रशासन और योजना प्रबंधन के लिए अधिकृत प्रवेश।" : "Authorised access for administration and scheme management.") : (hi ? "आवेदन जांच, दस्तावेज़ सत्यापन और समीक्षा के लिए प्रवेश।" : "Access application scrutiny, document verification and review.")}</p>
      <div className="role-tabs"><button type="button" className={mode === "officer" ? "active" : ""} onClick={() => {setMode("officer");setNotice("")}}>{hi ? "अधिकारी" : "Officer"}</button><button type="button" className={mode === "admin" ? "active" : ""} onClick={() => {setMode("admin");setNotice("")}}>{hi ? "एडमिन" : "Admin"}</button></div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-email">{hi ? "आधिकारिक ईमेल" : "Official email"}</label><input id="admin-email" value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" placeholder="name@ministry.gov.in" required/>
        <label htmlFor="admin-password">{hi ? "पासवर्ड" : "Password"}</label><input id="admin-password" value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder={hi ? "पासवर्ड दर्ज करें" : "Enter password"} required/>
        <button type="submit" disabled={loading}>{loading ? (hi ? "लॉगिन हो रहा है…" : "Signing in…") : (mode === "admin" ? (hi ? "एडमिन पोर्टल खोलें" : "Sign in to Admin Portal") : (hi ? "अधिकारी पोर्टल खोलें" : "Sign in to Officer Portal"))}</button>
      </form>
      {notice && <p className="admin-login-notice" role="alert">{notice}</p>}
      <div className="demo-credentials"><b>{hi ? "डेमो क्रेडेंशियल" : "Demo credentials"}</b><span>{mode === "admin" ? "admin@sih.test / Password123" : "officer@sih.test / Password123"}</span></div>
      <div className="admin-login-security"><strong>{hi ? "केवल अधिकृत उपयोगकर्ता" : "Authorised users only"}</strong><span>{hi ? "रिकॉर्ड तक पहुंच audit logged है।" : "Access to applicant records is monitored and audit logged."}</span></div>
    </section></main>
    <footer className="admin-login-footer">© 2026 VIDYARTH • Ministry of Tribal Affairs</footer>
  </div>;
}
