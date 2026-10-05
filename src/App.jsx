import { useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./enhanced.css";
import { LANGUAGE_OPTIONS, translate, useSharedLanguage } from "./i18n";
import VoiceAssistant from "./VoiceAssistant";
import About from "./About";
import DashboardPage from "./Dashboard";
import Documents from "./Documents";
import Grievance from "./Grievance";
import Help from "./Help";
import LoginPage from "./Login";
import Notices from "./Notices";
import NoticeDetails from "./NoticeDetails";
import Notifications from "./Notifications";
import Register from "./Register";
import SchemeDetails from "./SchemeDetails";
import Schemes from "./Schemes";
import Track from "./Track";
import ApplyPage from "./Apply";
import AdminLoginPage from "./AdminLogin";
import AdminDashboardPage from "./AdminDashboard";

const schemes = [
  { id:"post-matric", title:"Post-Matric Scholarship for ST Students", tag:"Scholarship", level:"Post-Matric", income:"₹2.50 lakh", text:"Financial assistance for eligible Scheduled Tribe students pursuing studies after Class X.", award:"Tuition + maintenance support" },
  { id:"pre-matric", title:"Pre-Matric Scholarship for ST Students", tag:"Scholarship", level:"Class IX–X", income:"₹2.50 lakh", text:"Support for eligible ST students at the secondary school level.", award:"Scholarship assistance" },
  { id:"top-class", title:"Top Class Education Scholarship", tag:"Scholarship", level:"Higher Education", income:"₹8.00 lakh", text:"Support for eligible ST students admitted to notified premier institutions.", award:"Fees + living support" },
  { id:"fellowship", title:"National Fellowship for ST Students", tag:"Fellowship", level:"Research", income:"₹6.00 lakh", text:"Fellowship support for eligible ST scholars pursuing advanced research.", award:"Fellowship + contingency" },
  { id:"overseas", title:"National Overseas Scholarship", tag:"Scholarship", level:"Overseas", income:"As per guidelines", text:"Financial assistance for eligible ST students pursuing higher education abroad.", award:"Study + travel support" },
];

function GovBar(){
  const [lang,setLang]=useSharedLanguage();
  const t=(key)=>translate(lang,key);
  return <div className="govbar"><div>{t("gov")} | {t("ministry")}</div><div className="govlinks"><span>{t("skip")}</span><span>{t("screenReader")}</span><label className="language-picker"><span className="sr-only">{t("language")}</span><select value={lang} onChange={(e)=>setLang(e.target.value)} aria-label={t("language")}>{LANGUAGE_OPTIONS.map((item)=><option key={item.code} value={item.code}>{item.native} — {item.label}</option>)}</select></label></div></div>;
}

function Header({portal='student'}){
  const [lang]=useSharedLanguage();
  const t=(key)=>translate(lang,key);
  return <><GovBar/><header className="site-header"><div className="brand"><img src="/india-emblem.svg" alt="Government emblem"/><div><b>VIDYARTH</b><span>{t("portal")}</span><small>{t("ministry")}</small></div></div><div className="header-tools"><div className="search">⌕ <input aria-label={t("search")} placeholder={t("search")}/></div><Link className="login-mini" to={portal==='student'?'/login':'/admin-login'}>{portal==='student'?t("applicantLogin"):t("adminLogin")}</Link></div></header><nav className="nav"><div className="nav-inner"><Link to="/">{t("home")}</Link><Link to="/schemes">{t("schemes")}</Link><Link to="/apply">{t("application")}</Link><Link to="/track">{t("track")}</Link><Link to="/documents">{t("documents")}</Link><Link to="/grievance">{t("grievance")}</Link><Link to="/help">{t("help")}</Link><Link to="/admin-login" className="nav-admin">{t("admin")}</Link><Link className="nav-cta" to="/apply">{t("applyTrack")}</Link></div></nav></>;
}

function Footer(){
  const [lang]=useSharedLanguage(); const hi=lang==='hi';
  return <footer><div><strong>VIDYARTH</strong><p>{hi?'अनुसूचित जनजातियों के लिए एकीकृत छात्रवृत्ति एवं फेलोशिप प्रबंधन प्रणाली':'Unified Scholarship & Fellowship Management System for Scheduled Tribes'}</p></div><div><b>{hi?'त्वरित लिंक':'Quick Links'}</b><Link to="/schemes">{hi?'योजनाएं':'Schemes'}</Link><Link to="/track">{hi?'आवेदन ट्रैक करें':'Track Application'}</Link><Link to="/grievance">{hi?'शिकायत':'Grievance'}</Link></div><div><b>{hi?'मंत्रालय':'Ministry'}</b><span>{hi?'जनजातीय कार्य मंत्रालय':'Ministry of Tribal Affairs'}</span><span>{hi?'भारत सरकार':'Government of India'}</span></div><div><b>{hi?'सहायता':'Support'}</b><span>Helpdesk: 1800-XXX-XXXX</span><span>support@vidyarth.gov.in</span></div><div className="footer-bottom">© 2026 VIDYARTH • SIH PS26239 • Prototype</div></footer>;
}

function SchemeCard({s}){return <article className="scheme-card"><div className="scheme-tag">{s.tag}</div><h3>{s.title}</h3><p>{s.text}</p><div className="scheme-meta"><span><b>LEVEL</b>{s.level}</span><span><b>INCOME</b>{s.income}</span></div><div className="scheme-award">✓ {s.award}</div><Link to={`/scheme/${s.id}`}>View scheme details →</Link></article>}

function Home(){
 const [lang]=useSharedLanguage(); const hi=lang==='hi';
 const [education,setEducation]=useState('All Education Levels');
 const [income,setIncome]=useState('Any Annual Income');
 const [purpose,setPurpose]=useState('All Categories');
 const matches=schemes.filter(s=>{
   const educationOk=education==='All Education Levels'||(education==='School'&&/Pre-Matric|Class IX/.test(s.title+s.level))||(education==='Higher Education'&&/Post-Matric|Top Class/.test(s.title+s.level))||(education==='Research'&&/Fellowship|Research/.test(s.title+s.level))||(education==='Overseas'&&/Overseas/.test(s.title+s.level));
   const purposeOk=purpose==='All Categories'||s.tag===purpose||(purpose==='Overseas Education'&&s.id==='overseas');
   const incomeValue=s.income==='₹2.50 lakh'?2.5:s.income==='₹6.00 lakh'?6:s.income==='₹8.00 lakh'?8:99;
   const incomeOk=income==='Any Annual Income'||(income==='Up to ₹2.50 lakh'&&incomeValue<=2.5)||(income==='₹2.50–6.00 lakh'&&incomeValue>2.5&&incomeValue<=6)||(income==='₹6.00–8.00 lakh'&&incomeValue>6&&incomeValue<=8)||(income==='Above ₹8.00 lakh'&&incomeValue>8);
   return educationOk&&purposeOk&&incomeOk;
 });
 return <><Header/><main><section className="hero"><div className="hero-copy"><div className="eyebrow">{hi?'जनजातीय कार्य मंत्रालय • भारत सरकार':'MINISTRY OF TRIBAL AFFAIRS • GOVERNMENT OF INDIA'}</div><h1>{hi?'छात्रवृत्ति एवं फेलोशिप योजनाएं':'Scholarship & Fellowship Schemes'}</h1><p>{hi?'अनुसूचित जनजाति विद्यार्थियों के लिए स्कूल, उच्च शिक्षा, शोध और विदेश में अध्ययन हेतु वित्तीय सहायता एवं फेलोशिप अवसर।':'Financial assistance and fellowship opportunities for Scheduled Tribe students across secondary, professional, research and international higher education.'}</p><div className="hero-actions"><Link to="/schemes" className="btn primary">{hi?'योजनाएं देखें →':'Explore Schemes →'}</Link><Link to="/apply" className="btn yellow">{hi?'अभी आवेदन करें':'Apply Now'}</Link><Link to="/track" className="btn ghost">◉ {hi?'आवेदन ट्रैक करें':'Track Application'}</Link></div><div className="hero-points"><span>▣ 5 core schemes</span><span>◉ Fellowship pathways</span><span>◌ Overseas support</span><span>✦ AI document verification</span></div></div><div className="hero-panel"><div className="panel-head">{hi?'विद्यार्थी सेवाएं':'APPLICANT SERVICES'}</div><Link to="/schemes">{hi?'उपयुक्त योजना खोजें':'Find a suitable scheme'} <b>→</b></Link><Link to="/apply">{hi?'नया आवेदन शुरू करें':'Start an application'} <b>→</b></Link><Link to="/track">{hi?'जमा आवेदन ट्रैक करें':'Track submitted application'} <b>→</b></Link><Link to="/documents">{hi?'मेरे दस्तावेज़ और OCR':'My Documents & OCR'} <b>→</b></Link></div></section>
 <section className="discovery"><div className="section-title"><span>⌖ {hi?'सही छात्रवृत्ति खोजें (स्मार्ट योजना खोज)':'FIND THE RIGHT SCHOLARSHIP (SMART SCHEME DISCOVERY)'}</span><h2>{hi?'व्यक्तिगत योजना खोज':'Personalised scheme discovery'}</h2><p>{hi?'अपनी शैक्षणिक और वित्तीय जानकारी चुनें और उपयुक्त योजनाएं तुरंत देखें।':'Select your academic and financial criteria to instantly identify relevant MoTA schemes.'}</p></div><div className="filter-grid"><label>{hi?'वर्तमान अध्ययन स्तर':'I AM CURRENTLY STUDYING'}<select value={education} onChange={e=>setEducation(e.target.value)}><option>All Education Levels</option><option>School</option><option>Higher Education</option><option>Research</option><option>Overseas</option></select></label><label>{hi?'वार्षिक पारिवारिक आय':'ANNUAL FAMILY INCOME'}<select value={income} onChange={e=>setIncome(e.target.value)}><option>Any Annual Income</option><option>Up to ₹2.50 lakh</option><option>₹2.50–6.00 lakh</option><option>₹6.00–8.00 lakh</option><option>Above ₹8.00 lakh</option></select></label><label>{hi?'योजना श्रेणी':'SCHEME CATEGORY'}<select value={purpose} onChange={e=>setPurpose(e.target.value)}><option>All Categories</option><option>Scholarship</option><option>Fellowship</option><option>Overseas Education</option></select></label><button className="btn navy" onClick={()=>document.getElementById('eligible-results')?.scrollIntoView({behavior:'smooth'})}>{hi?'पात्र योजनाएं खोजें':'Find Eligible Schemes'}</button></div><div id="eligible-results" className="discovery-result"><b>{matches.length}</b> {hi?'पात्र योजना मिली':'matching scheme(s) found'} <Link to="/schemes">{hi?'सभी देखें →':'View all →'}</Link></div></section>
 <section className="notice-strip"><b>{hi?'नवीनतम सूचना':'LATEST UPDATES'}</b><span>{hi?'योजना दिशानिर्देश, आवेदन विंडो, सत्यापन और DBT सूचनाएं यहां प्रकाशित होती हैं।':'Scheme guidelines, application windows, verification notices and DBT advisories are published here.'}</span><Link to="/notices">{hi?'सभी सूचनाएं →':'View all notices →'}</Link></section>
 <section className="schemes-preview"><div className="section-title inline"><div><span>{hi?'विशेष अवसर':'FEATURED OPPORTUNITIES'}</span><h2>{hi?'छात्रवृत्ति एवं फेलोशिप योजनाएं':'Scholarship & Fellowship Schemes'}</h2></div><Link to="/schemes">{hi?'सभी योजनाएं देखें →':'View all schemes →'}</Link></div><div className="scheme-grid">{(matches.length?matches:schemes).slice(0,4).map(s=><SchemeCard key={s.id} s={s}/>)}</div></section>
 <section className="workflow"><div className="section-title"><span>{hi?'एक डिजिटल कार्यप्रवाह':'ONE DIGITAL WORKFLOW'}</span><h2>{hi?'आवेदन से निर्णय तक':'From application to decision'}</h2></div><div className="workflow-line">{(hi?[['योजना खोजें','अपनी प्रोफ़ाइल के अनुसार योजना चुनें'],['पात्रता जांचें','नियमों के अनुसार लाइव जांच'],['आवेदन पूरा करें','ड्राफ्ट सहेजें और जारी रखें'],['दस्तावेज़ + OCR','AI-सहायित दस्तावेज़ जांच'],['अधिकारी जांच','कमी और सत्यापन प्रक्रिया'],['चयन + DBT','पारदर्शी निर्णय प्रवाह']]:[['Discover scheme','Match your profile'],['Check eligibility','Use configured rules'],['Complete application','Save and resume anytime'],['Upload & OCR','AI-assisted document checks'],['Officer scrutiny','Deficiency and verification'],['Selection & DBT','Transparent decision flow']]).map(([x,y],i)=><div key={x}><i>{i+1}</i><b>{x}</b><span>{y}</span></div>)}</div></section></main><Footer/></>;
}

function HelpPage(){ return <Help/>; }

function App(){return <BrowserRouter><Routes>
<Route path="/" element={<Home/>}/>
<Route path="/about" element={<About/>}/>
<Route path="/schemes" element={<Schemes/>}/>
<Route path="/scheme/:id" element={<SchemeDetails/>}/>
<Route path="/apply" element={<ApplyPage/>}/>
<Route path="/track" element={<Track/>}/>
<Route path="/documents" element={<Documents/>}/>
<Route path="/grievance" element={<Grievance/>}/>
<Route path="/login" element={<LoginPage/>}/>
<Route path="/register" element={<Register/>}/>
<Route path="/dashboard" element={<DashboardPage/>}/>
<Route path="/notifications" element={<Notifications/>}/>
<Route path="/notices" element={<Notices/>}/>
<Route path="/notices/:id" element={<NoticeDetails/>}/>
<Route path="/help" element={<HelpPage/>}/>
<Route path="/admin-login" element={<AdminLoginPage/>}/>
<Route path="/officer" element={<Navigate to="/admin-login?role=officer" replace/>}/>
<Route path="/officer-login" element={<Navigate to="/admin-login?role=officer" replace/>}/>
<Route path="/admin" element={<AdminDashboardPage/>}/>
<Route path="/officer-dashboard" element={<AdminDashboardPage/>}/>
<Route path="*" element={<Navigate to="/" replace/>}/>
</Routes><VoiceAssistant/></BrowserRouter>}

export default App;
