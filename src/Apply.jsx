import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSharedLanguage } from "./i18n";
import {
  checkEligibility,
  createApplication,
  getApplicationById,
  getApplicationPrecheck,
  getSchemes,
  submitApplication as submitApplicationApi,
  uploadDocuments,
} from "./api/api";
import "./Apply.css";

const STEPS = [
  "Profile",
  "Eligibility",
  "Academic Details",
  "Bank Details",
  "Documents",
  "AI Pre-Check",
  "Preview",
  "Submit",
];

const STEPS_HI = [
  "प्रोफ़ाइल",
  "पात्रता",
  "शैक्षणिक विवरण",
  "बैंक विवरण",
  "दस्तावेज़",
  "AI पूर्व-जांच",
  "पूर्वावलोकन",
  "जमा करें",
];

/*
 * Local fallback list.
 * This is used only if the backend scheme endpoint is unavailable.
 */
const FALLBACK_SCHEMES = [
  {
    id: 1,
    name: "Pre-Matric Scholarship for ST Students",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
      "identity_proof",
    ],
  },
  {
    id: 2,
    name: "Post-Matric Scholarship for ST Students",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
      "admission_letter",
      "identity_proof",
    ],
  },
  {
    id: 3,
    name: "Top Class Education for ST Students",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
      "admission_letter",
      "identity_proof",
    ],
  },
  {
    id: 4,
    name: "National Fellowship for ST Students",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
      "admission_letter",
      "identity_proof",
    ],
  },
  {
    id: 5,
    name: "National Overseas Scholarship",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
      "admission_letter",
      "identity_proof",
    ],
  },
];

const DOC_META = {
  caste_certificate: [
    "ST Caste / Tribe Certificate",
    "Issued by the competent authority",
  ],
  income_certificate: [
    "Family Income Certificate",
    "Current certificate as required by the scheme",
  ],
  marksheet: [
    "Latest Marksheet / Academic Record",
    "Latest qualifying examination record",
  ],
  bank_passbook: [
    "Bank Passbook / Account Proof",
    "Name, account number and IFSC must be readable",
  ],
  admission_letter: [
    "Admission / Joining Letter",
    "Issued by the institution / university",
  ],
  identity_proof: [
    "Identity Proof",
    "Aadhaar or another accepted identity document",
  ],
};

const blankForm = {
  name: "",
  fatherName: "",
  dob: "",
  gender: "",
  category: "ST",
  tribe: "",
  mobile: "",
  email: "",
  state: "",
  district: "",
  pincode: "",
  address: "",

  scheme_id: "",
  income: "",
  education_level: "",
  college: "",
  course: "",
  year: "",
  cgpa: "",
  aishe: "",
  admissionYear: "",

  bankName: "",
  accountNo: "",
  ifsc: "",
  aadhaar: "",
};

function money(value) {
  return value === "" || value === null || value === undefined
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN")}`;
}

function ageFromDob(dob) {
  if (!dob) return "";

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) return "";

  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() &&
      now.getDate() < birth.getDate());

  if (beforeBirthday) age -= 1;

  return age;
}

/*
 * FIXED FIELD COMPONENT
 *
 * It now correctly handles:
 * options={["Female", "Male"]}
 *
 * and:
 * options={[
 *   { value: "1", label: "Post-Matric..." }
 * ]}
 */
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  options,
  required = false,
}) {
  const optionItems = Array.isArray(options)
    ? options.map((option) =>
        typeof option === "string"
          ? { value: option, label: option }
          : {
              value: String(option.value),
              label: option.label,
            }
      )
    : [];

  return (
    <label className="va-field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>

      {options ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">Select {label}</option>

          {optionItems.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}

export default function Apply() {
  const [params] = useSearchParams();

  const [lang, setLang] = useSharedLanguage();

  const hi = lang === "hi";

  const stepLabels = hi ? STEPS_HI : STEPS;

  const [step, setStep] = useState(1);

  const [schemes, setSchemes] = useState([]);

  const [form, setForm] = useState(blankForm);

  const [files, setFiles] = useState({});

  const [applicationId, setApplicationId] = useState(
    params.get("applicationId") || ""
  );

  const [applicationStatus, setApplicationStatus] = useState("");

  const [eligibility, setEligibility] = useState(null);

  const [precheck, setPrecheck] = useState(null);

  const [saving, setSaving] = useState(false);

  const [checking, setChecking] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  /*
   * Find currently selected scheme.
   */
  const selectedScheme = useMemo(() => {
    return schemes.find(
      (s) => String(s.id) === String(form.scheme_id)
    );
  }, [schemes, form.scheme_id]);

  /*
   * Documents required for selected scheme.
   */
  const requiredDocs = useMemo(() => {
    if (!selectedScheme) return [];

    return Array.isArray(selectedScheme.required_docs)
      ? selectedScheme.required_docs
      : [];
  }, [selectedScheme]);

  /*
   * Load schemes.
   *
   * If backend is available -> use backend schemes.
   * If backend fails -> use local fallback schemes.
   */
  useEffect(() => {
    async function boot() {
      try {
        const response = await getSchemes();

        const list =
          response?.data?.schemes ||
          response?.schemes ||
          [];

        if (Array.isArray(list) && list.length > 0) {
          setSchemes(list);
        } else {
          setSchemes(FALLBACK_SCHEMES);
        }

        const requested = params.get("scheme");

        if (!params.get("applicationId") && !form.scheme_id) {
          const sourceList =
            Array.isArray(list) && list.length > 0
              ? list
              : FALLBACK_SCHEMES;

          const match = sourceList.find(
            (s) =>
              String(s.id) === String(requested) ||
              String(s.name)
                .toLowerCase()
                .includes(String(requested || "").toLowerCase())
          );

          if (match) {
            setForm((current) => ({
              ...current,
              scheme_id: String(match.id),
            }));
          }
        }
      } catch (e) {
        /*
         * Do not break the page if backend is unavailable.
         * Use local scheme data for the demo.
         */
        setSchemes(FALLBACK_SCHEMES);

        const requested = params.get("scheme");

        if (!params.get("applicationId") && !form.scheme_id) {
          const match = FALLBACK_SCHEMES.find(
            (s) =>
              String(s.id) === String(requested) ||
              String(s.name)
                .toLowerCase()
                .includes(String(requested || "").toLowerCase())
          );

          if (match) {
            setForm((current) => ({
              ...current,
              scheme_id: String(match.id),
            }));
          }
        }

        setError(
          "Live scheme service is unavailable. Demo scheme data has been loaded."
        );
      }
    }

    boot();
  }, []);

  /*
   * Load signed-in student information.
   */
  useEffect(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem("vidyarthUser") || "null"
      );

      if (user) {
        setForm((current) => ({
          ...current,

          name: current.name || user.name || "",

          email: current.email || user.email || "",

          mobile:
            current.mobile ||
            user.phone ||
            user.mobile ||
            "",

          state: current.state || user.state || "",

          category: user.category || "ST",
        }));
      }
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  /*
   * Load an existing application when applicationId exists.
   */
  useEffect(() => {
    if (!applicationId) return;

    async function loadApplication() {
      try {
        const response =
          await getApplicationById(applicationId);

        const app =
          response?.data?.application ||
          response?.application;

        const docs =
          response?.data?.documents ||
          response?.documents ||
          [];

        if (!app) return;

        const data = app.form_data || {};

        setForm((current) => ({
          ...current,
          ...data,
          scheme_id: String(app.scheme_id),
        }));

        setApplicationStatus(app.status || "");

        const docMap = {};

        docs.forEach((doc) => {
          docMap[doc.doc_type] = {
            ...doc,
            server: true,
          };
        });

        setFiles(docMap);

        if (
          app.status === "draft" ||
          app.status === "deficient" ||
          app.status === "resubmitted"
        ) {
          setStep(5);
        } else {
          setStep(8);
        }
      } catch (e) {
        setError(
          e.message || "Could not load the application."
        );
      }
    }

    loadApplication();
  }, [applicationId]);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function validateProfile() {
    const required = [
      "name",
      "fatherName",
      "dob",
      "gender",
      "tribe",
      "mobile",
      "email",
      "state",
      "district",
      "pincode",
    ];

    const missing = required.filter(
      (key) => !String(form[key] || "").trim()
    );

    if (missing.length) {
      return `Please complete: ${missing.join(", ")}.`;
    }

    return "";
  }

  function validateAcademic() {
    const required = [
      "education_level",
      "college",
      "course",
      "year",
      "cgpa",
      "admissionYear",
    ];

    const missing = required.filter(
      (key) => !String(form[key] || "").trim()
    );

    return missing.length
      ? `Please complete: ${missing.join(", ")}.`
      : "";
  }

  function validateBank() {
    const required = [
      "bankName",
      "accountNo",
      "ifsc",
    ];

    const missing = required.filter(
      (key) => !String(form[key] || "").trim()
    );

    return missing.length
      ? `Please complete: ${missing.join(", ")}.`
      : "";
  }

  /*
   * Create application draft.
   */
  async function createDraftIfNeeded() {
    if (applicationId) return applicationId;

    if (!localStorage.getItem("vidyarthToken")) {
      throw new Error(
        "Please login as an applicant before saving the application."
      );
    }

    if (!form.scheme_id) {
      throw new Error(
        "Select a scholarship / fellowship scheme first."
      );
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        scheme_id: Number(form.scheme_id),

        draft: true,

        income: Number(form.income),

        percentage: Number(form.cgpa),

        age: ageFromDob(form.dob),
      };

      const response = await createApplication(payload);

      const app =
        response?.data?.application ||
        response?.application;

      const id =
        app?.id ||
        app?._id ||
        app?.applicationId;

      if (!id) {
        throw new Error(
          "The server did not return an application ID."
        );
      }

      setApplicationId(String(id));

      setApplicationStatus(
        app.status || "draft"
      );

      localStorage.setItem(
        "vidyarthApplicationId",
        String(id)
      );

      return String(id);
    } finally {
      setSaving(false);
    }
  }

  /*
   * Live eligibility check.
   */
  async function runEligibility() {
    clearMessages();

    if (
      !form.scheme_id ||
      !form.income ||
      !form.education_level ||
      !form.cgpa
    ) {
      setError(
        "Enter scheme, annual family income, education level and academic score before checking eligibility."
      );

      return false;
    }

    setChecking(true);

    try {
      const response = await checkEligibility({
        scheme_id: Number(form.scheme_id),

        category: form.category,

        income: Number(form.income),

        percentage: Number(form.cgpa),

        education_level: form.education_level,

        state: form.state,

        age: ageFromDob(form.dob),
      });

      const result =
        response?.data || response;

      setEligibility(result);

      if (!result?.eligible) {
        setError(
          Array.isArray(result?.reasons)
            ? result.reasons.join(" ")
            : "You do not currently meet all scheme rules."
        );
      } else {
        setMessage(
          "Live eligibility check passed against the scheme rules stored in the backend."
        );
      }

      return Boolean(result?.eligible);
    } catch (e) {
      setError(
        e.message ||
          "Eligibility service is unavailable."
      );

      return false;
    } finally {
      setChecking(false);
    }
  }

  /*
   * Upload document.
   */
  async function handleFile(key, file) {
    if (!file) return;

    clearMessages();

    if (
      !/^(application\/pdf|image\/jpeg|image\/png)$/.test(
        file.type
      )
    ) {
      setError(
        "Only PDF, JPG or PNG files are accepted."
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Each document must be smaller than 10 MB."
      );

      return;
    }

    try {
      const id = await createDraftIfNeeded();

      const body = new FormData();

      body.append(key, file);

      const response =
        await uploadDocuments(id, body);

      const uploaded =
        response?.data?.documents ||
        response?.documents ||
        [];

      const latest =
        uploaded[uploaded.length - 1];

      setFiles((current) => ({
        ...current,

        [key]: {
          file,
          ...(latest || {}),
          local: true,
        },
      }));

      setMessage(
        `${
          DOC_META[key]?.[0] || key
        } uploaded successfully.`
      );
    } catch (e) {
      setError(
        e.message || "Document upload failed."
      );
    }
  }

  /*
   * AI pre-check.
   */
  async function runPrecheck() {
    clearMessages();

    if (!applicationId) {
      setError(
        "Save the application before running the document pre-check."
      );

      return null;
    }

    setChecking(true);

    try {
      const response =
        await getApplicationPrecheck(
          applicationId
        );

      const result =
        response?.data || response;

      setPrecheck(result);

      setMessage(
        result?.message ||
          "Pre-check completed."
      );

      return result;
    } catch (e) {
      setError(
        e.message ||
          "AI pre-check could not be completed."
      );

      return null;
    } finally {
      setChecking(false);
    }
  }

  /*
   * Next step.
   */
  async function goNext() {
    clearMessages();

    try {
      if (step === 1) {
        const errorText =
          validateProfile();

        if (errorText) {
          setError(errorText);
          return;
        }
      }

      if (step === 2) {
        const passed =
          eligibility?.eligible === true
            ? true
            : await runEligibility();

        if (!passed) return;
      }

      if (step === 3) {
        const errorText =
          validateAcademic();

        if (errorText) {
          setError(errorText);
          return;
        }
      }

      if (step === 4) {
        const errorText =
          validateBank();

        if (errorText) {
          setError(errorText);
          return;
        }

        await createDraftIfNeeded();
      }

      if (step === 5) {
        const missing =
          requiredDocs.filter(
            (doc) => !files[doc]
          );

        if (missing.length) {
          setError(
            `Please upload all required documents: ${missing
              .map(
                (d) =>
                  DOC_META[d]?.[0] || d
              )
              .join(", ")}.`
          );

          return;
        }
      }

      if (step === 6) {
        const result =
          precheck || (await runPrecheck());

        if (!result?.ready) {
          setError(
            "Resolve the items shown in the AI pre-check before moving to preview."
          );

          return;
        }
      }

      setStep((current) =>
        Math.min(8, current + 1)
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (e) {
      setError(
        e.message ||
          "Please complete this step before continuing."
      );
    }
  }

  /*
   * Final submission.
   */
  async function finalSubmit() {
    clearMessages();

    if (!applicationId) {
      setError(
        "Application record not found. Go back to the Bank Details step and save the application."
      );

      return;
    }

    setSaving(true);

    try {
      const response =
        await submitApplicationApi(
          applicationId
        );

      const app =
        response?.data?.application ||
        response?.application;

      setApplicationStatus(
        app?.status || "submitted"
      );

      setStep(8);

      setMessage(
        "Application submitted successfully. The officer can now see it in the live queue."
      );

      localStorage.setItem(
        "applicationId",
        String(applicationId)
      );
    } catch (e) {
      setError(
        e.message ||
          "Final submission failed."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Save draft button.
   */
  async function saveDraftButton() {
    clearMessages();

    try {
      await createDraftIfNeeded();

      setMessage(
        "Application saved. You can leave and resume it later using the Application ID."
      );
    } catch (e) {
      setError(
        e.message ||
          "Draft could not be saved."
      );
    }
  }

  const schemeName =
    selectedScheme?.name ||
    "Select a scheme";

  return (
    <div className="va-app">

      {/* GOVERNMENT BAR */}
      <div className="va-govbar">
        <span>
          {hi
            ? "भारत सरकार | जनजातीय कार्य मंत्रालय"
            : "Government of India | Ministry of Tribal Affairs"}
        </span>

        <span>
          {hi
            ? "जनजातीय कार्य मंत्रालय"
            : "Ministry of Tribal Affairs"}
        </span>

        <span>
          Accessibility &nbsp;|&nbsp;
          Screen Reader &nbsp;|&nbsp;
          हिन्दी &nbsp;
          English
        </span>
      </div>

      {/* HEADER */}
      <header className="va-header">

        <Link
          to="/"
          className="va-brand"
        >
          <img
            src="/india-emblem.svg"
            alt="Government emblem"
          />

          <div>
            <strong>VIDYARTH</strong>

            <small>
              {hi
                ? "छात्रवृत्ति एवं फेलोशिप प्रबंधन प्रणाली"
                : "Scholarship & Fellowship Management System"}
            </small>

            <span>
              {hi
                ? "जनजातीय कार्य मंत्रालय"
                : "Ministry of Tribal Affairs"}
            </span>
          </div>
        </Link>

        <div className="va-header-right">

          <button
            type="button"
            className="va-lang"
            onClick={() => setLang("hi")}
          >
            हिन्दी
          </button>

          <button
            type="button"
            className="va-lang"
            onClick={() => setLang("en")}
          >
            English
          </button>

          <span>
            {hi
              ? "विद्यार्थी पोर्टल"
              : "Applicant Portal"}
          </span>

          <b>
            {form.name ||
              (hi
                ? "विद्यार्थी"
                : "Applicant")}
          </b>

          <Link to="/dashboard">
            {hi
              ? "डैशबोर्ड"
              : "Dashboard"}
          </Link>

        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="va-nav">
        <div>

          <Link to="/">
            {hi ? "मुखपृष्ठ" : "Home"}
          </Link>

          <Link to="/schemes">
            {hi ? "योजनाएं" : "Schemes"}
          </Link>

          <Link
            className="active"
            to="/apply"
          >
            {hi ? "आवेदन" : "Application"}
          </Link>

          <Link to="/track">
            {hi
              ? "आवेदन स्थिति"
              : "Application Status"}
          </Link>

          <Link to="/documents">
            {hi
              ? "मेरे दस्तावेज़ और OCR"
              : "My Documents & OCR"}
          </Link>

          <Link to="/grievance">
            {hi
              ? "शिकायत डेस्क"
              : "Grievance Desk"}
          </Link>

          <Link
            className="nav-yellow"
            to="/apply"
          >
            {hi
              ? "सहेजें और ट्रैक करें"
              : "Save & Track"}
          </Link>

        </div>
      </nav>

      <main className="va-main">

        {/* BREADCRUMB */}
        <div className="va-breadcrumb">
          <Link to="/">
            {hi ? "मुखपृष्ठ" : "Home"}
          </Link>

          <span>›</span>

          <Link to="/schemes">
            {hi ? "योजनाएं" : "Schemes"}
          </Link>

          <span>›</span>

          <b>
            {hi
              ? "छात्रवृत्ति / फेलोशिप के लिए आवेदन"
              : "Apply for Scholarship / Fellowship"}
          </b>
        </div>

        {/* TITLE */}
        <section className="va-titlebar">

          <div>
            <span>
              {hi
                ? "ऑनलाइन आवेदन कार्यक्षेत्र"
                : "ONLINE APPLICATION WORKSPACE"}
            </span>

            <h1>
              {hi
                ? "छात्रवृत्ति / फेलोशिप के लिए आवेदन"
                : "Apply for Scholarship / Fellowship"}
            </h1>

            <p>
              {schemeName}

              <i>•</i>

              {hi
                ? "जनजातीय कार्य मंत्रालय"
                : "Ministry of Tribal Affairs"}
            </p>
          </div>

          <div className="va-title-actions">

            <span
              className={`status-chip ${
                applicationId
                  ? "saved"
                  : "new"
              }`}
            >
              {applicationId
                ? `Application ID: ${applicationId}`
                : "New application"}
            </span>

            <button
              type="button"
              onClick={saveDraftButton}
              disabled={saving}
            >
              {hi
                ? "ड्राफ्ट सहेजें"
                : "Save Draft"}
            </button>

          </div>
        </section>

        {/* CONTEXT LINKS */}
        <div className="va-context-links">

          <Link to="/">
            ← {hi ? "वापस" : "Back"}
          </Link>

          <span>
            {hi ? "डैशबोर्ड" : "Dashboard"}
          </span>

          <strong>
            {hi
              ? "योजना के लिए आवेदन"
              : "Apply for Scheme"}
          </strong>

          <Link to="/track">
            {hi
              ? "आवेदन स्थिति"
              : "Application Status"}
          </Link>

          <Link to="/documents">
            {hi
              ? "मेरे दस्तावेज़ और OCR"
              : "My Documents & OCR"}
          </Link>

          <Link to="/grievance">
            {hi
              ? "शिकायत डेस्क"
              : "Grievance Desk"}
          </Link>

        </div>

        {/* STEPPER */}
        <section
          className="va-stepper"
          aria-label="Application progress"
        >
          {stepLabels.map(
            (label, index) => {
              const n = index + 1;

              const clickable =
                n <= step;

              return (
                <button
                  key={label}
                  type="button"
                  className={`${n < step ? "done" : ""} ${
                    n === step
                      ? "current"
                      : ""
                  }`}
                  onClick={() =>
                    clickable &&
                    setStep(n)
                  }
                >
                  <span>
                    {n < step
                      ? "✓"
                      : n}
                  </span>

                  <b>{label}</b>
                </button>
              );
            }
          )}
        </section>

        {/* ALERTS */}
        {error && (
          <div className="va-alert error">
            ⚠ {error}
          </div>
        )}

        {message && (
          <div className="va-alert success">
            ✓ {message}
          </div>
        )}

        <div className="va-layout">

          <div className="va-content">

            {/* STEP 1 */}
            {step === 1 && (
              <section className="va-card">

                <CardHeading
                  number="1"
                  title="Applicant Profile & Identity Verification"
                  text="Enter the applicant's information exactly as it appears on official records. Nothing is pre-filled unless it comes from your signed-in account."
                />

                <div className="va-note green">
                  <b>
                    Account information
                  </b>

                  <span>
                    Your registered name,
                    email, phone, state and
                    category are taken from
                    your VIDYARTH account and
                    can be reviewed here.
                  </span>
                </div>

                <div className="va-grid three">

                  <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(v) =>
                      update("name", v)
                    }
                    required
                  />

                  <Field
                    label="Father's / Guardian's Name"
                    value={form.fatherName}
                    onChange={(v) =>
                      update(
                        "fatherName",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="Gender"
                    value={form.gender}
                    onChange={(v) =>
                      update("gender", v)
                    }
                    options={[
                      "Female",
                      "Male",
                      "Other",
                    ]}
                    required
                  />

                  <Field
                    label="Date of Birth"
                    value={form.dob}
                    onChange={(v) =>
                      update("dob", v)
                    }
                    type="date"
                    required
                  />

                  <Field
                    label="Aadhaar Number"
                    value={form.aadhaar}
                    onChange={(v) =>
                      update(
                        "aadhaar",
                        v
                      )
                    }
                    placeholder="12 digit number"
                  />

                  <Field
                    label="Category"
                    value={form.category}
                    onChange={(v) =>
                      update(
                        "category",
                        v
                      )
                    }
                    options={["ST"]}
                    required
                  />

                  <Field
                    label="Tribe / Community"
                    value={form.tribe}
                    onChange={(v) =>
                      update(
                        "tribe",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="Mobile Number"
                    value={form.mobile}
                    onChange={(v) =>
                      update(
                        "mobile",
                        v
                      )
                    }
                    placeholder="10 digit mobile number"
                    required
                  />

                  <Field
                    label="Email ID"
                    value={form.email}
                    onChange={(v) =>
                      update(
                        "email",
                        v
                      )
                    }
                    type="email"
                    required
                  />

                  <Field
                    label="Domicile State"
                    value={form.state}
                    onChange={(v) =>
                      update(
                        "state",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="District"
                    value={form.district}
                    onChange={(v) =>
                      update(
                        "district",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="Pincode"
                    value={form.pincode}
                    onChange={(v) =>
                      update(
                        "pincode",
                        v
                      )
                    }
                    required
                  />

                  <label className="va-field full">
                    <span>
                      Address
                    </span>

                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        update(
                          "address",
                          e.target.value
                        )
                      }
                      rows="3"
                      placeholder="Current residential address"
                    />
                  </label>

                </div>
              </section>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <section className="va-card">

                <CardHeading
                  number="2"
                  title="Eligibility Check"
                  text="Select the scheme and provide the criteria used by the live rule engine. The result is calculated by the backend, not hardcoded in the interface."
                />

                <div className="va-grid two">

                  <Field
                    label="Scholarship / Fellowship Scheme"
                    value={form.scheme_id}
                    onChange={(v) => {
                      update(
                        "scheme_id",
                        v
                      );

                      setEligibility(null);
                    }}
                    options={schemes.map(
                      (s) => ({
                        value: String(
                          s.id
                        ),
                        label: s.name,
                      })
                    )}
                    required
                  />

                  <Field
                    label="Annual Family Income"
                    value={form.income}
                    onChange={(v) => {
                      update(
                        "income",
                        v
                      );

                      setEligibility(null);
                    }}
                    type="number"
                    placeholder="Enter amount in rupees"
                    required
                  />

                  <Field
                    label="Education Level"
                    value={
                      form.education_level
                    }
                    onChange={(v) => {
                      update(
                        "education_level",
                        v
                      );

                      setEligibility(null);
                    }}
                    options={[
                      "Class 11",
                      "Class 12",
                      "UG",
                      "PG",
                      "Research",
                    ]}
                    required
                  />

                  <Field
                    label="Academic Percentage / Score"
                    value={form.cgpa}
                    onChange={(v) => {
                      update(
                        "cgpa",
                        v
                      );

                      setEligibility(null);
                    }}
                    type="number"
                    placeholder="e.g. 72.5"
                    required
                  />

                </div>

                <div className="va-checkbox-panel">

                  <div>
                    <b>
                      What will be checked?
                    </b>

                    <ul>
                      <li>
                        ST category
                      </li>

                      <li>
                        Income ceiling
                        configured for the
                        selected scheme
                      </li>

                      <li>
                        Minimum academic
                        score
                      </li>

                      <li>
                        Education level /
                        state / age rules
                        where applicable
                      </li>
                    </ul>
                  </div>

                  <button
                    className="va-primary"
                    type="button"
                    onClick={
                      runEligibility
                    }
                    disabled={checking}
                  >
                    {checking
                      ? "Checking…"
                      : "Run Live Eligibility Check →"}
                  </button>

                </div>

                {eligibility && (
                  <div
                    className={`va-result ${
                      eligibility.eligible
                        ? "pass"
                        : "fail"
                    }`}
                  >

                    <strong>
                      {eligibility.eligible
                        ? "✓ Eligible at preliminary rule level"
                        : "✕ Not eligible under the current rules"}
                    </strong>

                    {eligibility.reasons
                      ?.length ? (
                      <ul>
                        {eligibility.reasons.map(
                          (reason) => (
                            <li
                              key={reason}
                            >
                              {reason}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>
                        No failed rules
                        were returned
                        by the backend.
                      </p>
                    )}

                  </div>
                )}

              </section>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <section className="va-card">

                <CardHeading
                  number="3"
                  title="Academic Details"
                  text="Provide your current institution and academic information. These values will be retained with the application record."
                />

                <div className="va-grid three">

                  <Field
                    label="Course / Programme"
                    value={form.course}
                    onChange={(v) =>
                      update(
                        "course",
                        v
                      )
                    }
                    placeholder="B.Tech / M.Phil / Ph.D"
                    required
                  />

                  <Field
                    label="Year of Study"
                    value={form.year}
                    onChange={(v) =>
                      update(
                        "year",
                        v
                      )
                    }
                    options={[
                      "1st Year",
                      "2nd Year",
                      "3rd Year",
                      "4th Year",
                      "Research",
                    ]}
                    required
                  />

                  <Field
                    label="Current / Previous Score"
                    value={form.cgpa}
                    onChange={(v) =>
                      update(
                        "cgpa",
                        v
                      )
                    }
                    type="number"
                    placeholder="Percentage"
                    required
                  />

                  <Field
                    label="Institution / University"
                    value={form.college}
                    onChange={(v) =>
                      update(
                        "college",
                        v
                      )
                    }
                    placeholder="Institution name"
                    required
                  />

                  <Field
                    label="AISHE / Institution Code"
                    value={form.aishe}
                    onChange={(v) =>
                      update(
                        "aishe",
                        v
                      )
                    }
                    placeholder="Enter if applicable"
                  />

                  <Field
                    label="Admission / Joining Year"
                    value={
                      form.admissionYear
                    }
                    onChange={(v) =>
                      update(
                        "admissionYear",
                        v
                      )
                    }
                    placeholder="YYYY"
                    required
                  />

                </div>

                <div className="va-note blue">
                  ⓘ Academic records are
                  checked again against the
                  document uploaded in the
                  Documents step.
                </div>

              </section>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <section className="va-card">

                <CardHeading
                  number="4"
                  title="Bank Details for DBT"
                  text="Enter the bank account that should receive the scholarship / fellowship amount. Do not use another person's account."
                />

                <div className="va-grid three">

                  <Field
                    label="Bank Name"
                    value={form.bankName}
                    onChange={(v) =>
                      update(
                        "bankName",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="Account Number"
                    value={
                      form.accountNo
                    }
                    onChange={(v) =>
                      update(
                        "accountNo",
                        v
                      )
                    }
                    required
                  />

                  <Field
                    label="IFSC Code"
                    value={form.ifsc}
                    onChange={(v) =>
                      update(
                        "ifsc",
                        v
                      )
                    }
                    placeholder="e.g. SBIN0000000"
                    required
                  />

                </div>

                <div className="va-note amber">
                  ⚠ Bank validation is shown
                  as a workflow step in this
                  prototype. Actual account
                  validation / DBT is performed
                  by the authorised government
                  payment system.
                </div>

              </section>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <section className="va-card">

                <CardHeading
                  number="5"
                  title="Enclosure of Mandatory Certificates"
                  text="Upload the documents required by the selected scheme. Each upload is sent to the backend document-verification pipeline."
                />

                <div className="va-doc-summary">

                  <b>
                    {requiredDocs.length}
                  </b>

                  <span>
                    documents required by
                    this scheme
                  </span>

                  <strong>
                    {
                      requiredDocs.filter(
                        (d) => files[d]
                      ).length
                    }
                    /
                    {requiredDocs.length}
                    {" "}
                    uploaded
                  </strong>

                </div>

                <div className="va-doc-list">

                  {requiredDocs.map(
                    (key) => {
                      const meta =
                        DOC_META[key] ||
                        [
                          key.replaceAll(
                            "_",
                            " "
                          ),
                          "Required document",
                        ];

                      const doc =
                        files[key];

                      return (
                        <article
                          className="va-doc"
                          key={key}
                        >

                          <div className="va-doc-icon">
                            PDF
                          </div>

                          <div className="va-doc-copy">

                            <strong>
                              {meta[0]}

                              <em>
                                Required
                              </em>
                            </strong>

                            <p>
                              {meta[1]}
                            </p>

                            <small>
                              {doc?.original_name ||
                                doc?.file
                                  ?.name ||
                                "No file selected"}
                            </small>

                          </div>

                          <label className="va-upload">

                            {doc
                              ? "Replace file"
                              : "Choose file"}

                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(
                                e
                              ) =>
                                handleFile(
                                  key,
                                  e.target
                                    .files?.[0]
                                )
                              }
                            />

                          </label>

                          <span
                            className={`va-doc-status ${
                              doc
                                ? doc.verification_status ||
                                  "uploaded"
                                : "pending"
                            }`}
                          >
                            {doc
                              ? doc.verification_status ||
                                "Uploaded"
                              : "Pending"}
                          </span>

                        </article>
                      );
                    }
                  )}

                </div>

                {!requiredDocs.length && (
                  <div className="va-empty">
                    The selected scheme has
                    no document requirements
                    configured.
                  </div>
                )}

                <div className="va-note blue">
                  ✦ AI-assisted verification
                  runs when each file reaches
                  the backend. If the AI service
                  is unavailable, the document
                  remains <b>pending</b>.
                </div>

              </section>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <section className="va-card">

                <CardHeading
                  number="6"
                  title="AI Document Extraction & Pre-Submission Cross-Check"
                  text="This screen reflects actual application and document records. It does not invent a successful result."
                />

                <div className="va-ai-head">

                  <div>

                    <span>
                      VIDYARTH AI PRE-CHECK
                    </span>

                    <h2>
                      {precheck
                        ? `${precheck.score}% readiness score`
                        : "Ready to analyse"}
                    </h2>

                    <p>
                      {precheck?.message ||
                        "Run the check to inspect missing fields, missing documents and document verification flags."}
                    </p>

                  </div>

                  <button
                    className="va-primary"
                    type="button"
                    onClick={
                      runPrecheck
                    }
                    disabled={checking}
                  >
                    {checking
                      ? "Analysing…"
                      : "Run AI Pre-Check"}
                  </button>

                </div>

                {precheck && (
                  <div className="va-ai-grid">

                    <AiMetric
                      label="Required documents"
                      value={`${precheck.verifiedDocuments?.length || 0}/${precheck.requiredDocuments?.length || 0}`}
                      tone={
                        precheck.missingDocuments
                          ?.length
                          ? "bad"
                          : "good"
                      }
                    />

                    <AiMetric
                      label="Pending documents"
                      value={
                        precheck
                          .pendingDocuments
                          ?.length || 0
                      }
                      tone={
                        precheck
                          .pendingDocuments
                          ?.length
                          ? "warn"
                          : "good"
                      }
                    />

                    <AiMetric
                      label="Flagged documents"
                      value={
                        precheck
                          .flaggedDocuments
                          ?.length || 0
                      }
                      tone={
                        precheck
                          .flaggedDocuments
                          ?.length
                          ? "bad"
                          : "good"
                      }
                    />

                    <AiMetric
                      label="Missing form fields"
                      value={
                        precheck
                          .missingFields
                          ?.length || 0
                      }
                      tone={
                        precheck
                          .missingFields
                          ?.length
                          ? "bad"
                          : "good"
                      }
                    />

                  </div>
                )}

                {precheck?.documents
                  ?.length > 0 && (
                  <div className="va-ai-table">

                    <div className="head">
                      <span>
                        Document
                      </span>

                      <span>
                        Verification
                      </span>

                      <span>
                        Confidence
                      </span>

                      <span>
                        Flags
                      </span>
                    </div>

                    {precheck.documents.map(
                      (doc) => (
                        <div
                          key={doc.id}
                        >

                          <span>
                            {DOC_META[
                              doc.doc_type
                            ]?.[0] ||
                              doc.doc_type}
                          </span>

                          <b
                            className={`doc-state ${doc.verification_status}`}
                          >
                            {
                              doc.verification_status
                            }
                          </b>

                          <span>
                            {doc.confidence_score ==
                            null
                              ? "—"
                              : `${doc.confidence_score}%`}
                          </span>

                          <span>
                            {Array.isArray(
                              doc.verification_flags
                            ) &&
                            doc
                              .verification_flags
                              .length
                              ? doc.verification_flags.join(
                                  ", "
                                )
                              : "None"}
                          </span>

                        </div>
                      )
                    )}

                  </div>
                )}

                {precheck &&
                  !precheck.ready && (
                    <div className="va-result fail">
                      <strong>
                        Action required
                        before preview
                      </strong>

                      <p>
                        Resolve the items
                        above and run the
                        pre-check again.
                      </p>
                    </div>
                  )}

                {precheck?.ready && (
                  <div className="va-result pass">

                    <strong>
                      ✓ No blocking issue
                      detected
                    </strong>

                    <p>
                      You can continue to
                      the preview and final
                      declaration.
                    </p>

                  </div>
                )}

              </section>
            )}

            {/* STEP 7 */}
            {step === 7 && (
              <section className="va-card">

                <CardHeading
                  number="7"
                  title="Application Preview & Declaration"
                  text="Review the values you entered before final submission. The application ID was created as a draft so you can safely return and edit it."
                />

                <PreviewSection
                  title="1. Scheme & Applicant"
                  rows={[
                    [
                      "Scheme",
                      schemeName,
                    ],
                    [
                      "Applicant",
                      form.name,
                    ],
                    [
                      "Father / Guardian",
                      form.fatherName,
                    ],
                    [
                      "Date of Birth",
                      form.dob,
                    ],
                    [
                      "Category",
                      form.category,
                    ],
                    [
                      "Annual Income",
                      money(form.income),
                    ],
                    [
                      "State / District",
                      `${form.state}, ${form.district}`,
                    ],
                    [
                      "Email",
                      form.email,
                    ],
                  ]}
                />

                <PreviewSection
                  title="2. Academic & Bank"
                  rows={[
                    [
                      "Course",
                      form.course,
                    ],
                    [
                      "Institution",
                      form.college,
                    ],
                    [
                      "Education Level",
                      form.education_level,
                    ],
                    [
                      "Score",
                      form.cgpa
                        ? `${form.cgpa}%`
                        : "—",
                    ],
                    [
                      "Bank",
                      form.bankName,
                    ],
                    [
                      "IFSC",
                      form.ifsc,
                    ],
                    [
                      "Account",
                      form.accountNo
                        ? `XXXX${form.accountNo.slice(
                            -4
                          )}`
                        : "—",
                    ],
                  ]}
                />

                <div className="va-preview-block">

                  <h3>
                    3. Documents
                  </h3>

                  {requiredDocs.map(
                    (key) => (
                      <div
                        key={key}
                        className="preview-doc"
                      >
                        <span>
                          {DOC_META[
                            key
                          ]?.[0] || key}
                        </span>

                        <b>
                          {files[key]
                            ? "Uploaded"
                            : "Missing"}
                        </b>
                      </div>
                    )
                  )}

                </div>

                <div className="va-declaration">

                  <input
                    id="declaration"
                    type="checkbox"
                  />

                  <label htmlFor="declaration">
                    I declare that the
                    information provided by
                    me is true and complete. I
                    understand that false
                    information or invalid
                    documents may result in
                    rejection and further
                    action under applicable
                    rules.
                  </label>

                </div>

              </section>
            )}

            {/* STEP 8 */}
            {step === 8 && (
              <section className="va-card va-final">

                <div className="va-final-icon">
                  ✓
                </div>

                <span>
                  STEP 8 OF 8
                </span>

                <h2>
                  {applicationStatus ===
                  "submitted"
                    ? "Application Submitted"
                    : "Application Ready for Submission"}
                </h2>

                <p>
                  {applicationStatus ===
                  "submitted"
                    ? "Your application has been submitted to the department for scrutiny. Track the live status from Application Status."
                    : "Your draft is complete. Use the final submission button below to send it for official scrutiny."}
                </p>

                {applicationId && (
                  <div className="va-id">
                    Application ID{" "}
                    <b>
                      {applicationId}
                    </b>
                  </div>
                )}

                {applicationStatus !==
                  "submitted" && (
                  <button
                    className="va-primary large"
                    type="button"
                    onClick={
                      finalSubmit
                    }
                    disabled={saving}
                  >
                    {saving
                      ? "Submitting…"
                      : "Submit Application →"}
                  </button>
                )}

                {applicationStatus ===
                  "submitted" && (
                  <Link
                    className="va-primary large"
                    to={`/track?applicationId=${applicationId}`}
                  >
                    Track Application →
                  </Link>
                )}

              </section>
            )}

            {/* BOTTOM ACTIONS */}
            {step < 8 && (
              <div className="va-actions">

                <button
                  type="button"
                  className="va-secondary"
                  disabled={step === 1}
                  onClick={() =>
                    setStep((n) =>
                      Math.max(
                        1,
                        n - 1
                      )
                    )
                  }
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  className="va-secondary"
                  onClick={
                    saveDraftButton
                  }
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  className="va-primary"
                  onClick={goNext}
                  disabled={
                    saving ||
                    checking
                  }
                >
                  {step === 7
                    ? "Review & Continue →"
                    : `${
                        hi
                          ? "अगला: "
                          : "Next: "
                      }${
                        stepLabels[
                          step
                        ]
                      } →`}
                </button>

              </div>
            )}

          </div>

          {/* SIDEBAR */}
          <aside className="va-side">

            <div className="va-side-card">

              <span>
                {hi
                  ? "आवेदन सारांश"
                  : "APPLICATION SUMMARY"}
              </span>

              <h3>
                {schemeName}
              </h3>

              <div>
                <b>
                  {hi
                    ? "वर्तमान चरण"
                    : "Current step"}
                </b>

                <strong>
                  {step} / 8
                </strong>
              </div>

              <div>
                <b>
                  {hi
                    ? "आवेदन ID"
                    : "Application ID"}
                </b>

                <strong>
                  {applicationId ||
                    "Not created yet"}
                </strong>
              </div>

              <div>
                <b>
                  {hi
                    ? "स्थिति"
                    : "Status"}
                </b>

                <strong>
                  {applicationStatus ||
                    "In progress"}
                </strong>
              </div>

            </div>

            <div className="va-side-card">

              <span>
                {hi
                  ? "सहायता और मार्गदर्शन"
                  : "HELP & GUIDANCE"}
              </span>

              <Link to="/help">
                {hi
                  ? "आवेदन कैसे करें"
                  : "How to apply"}
              </Link>

              <Link to="/documents">
                {hi
                  ? "दस्तावेज़ आवश्यकताएं"
                  : "Document requirements"}
              </Link>

              <Link to="/grievance">
                {hi
                  ? "शिकायत दर्ज करें"
                  : "Raise a grievance"}
              </Link>

              <a href="mailto:support@vidyarth.gov.in">
                Contact helpdesk
              </a>

            </div>

            <div className="va-side-card security">

              <b>
                🔒{" "}
                {hi
                  ? "सुरक्षित आवेदन"
                  : "Secure application"}
              </b>

              <p>
                Your application is linked
                to your signed-in VIDYARTH
                account. Never share your
                password or OTP.
              </p>

            </div>

          </aside>

        </div>
      </main>

      <footer className="va-footer">
        Government of India • Ministry of Tribal Affairs • VIDYARTH • Prototype for SIH PS26239
      </footer>
    </div>
  );
}

/* =========================
   SMALL REUSABLE COMPONENTS
   ========================= */

function CardHeading({
  number,
  title,
  text,
}) {
  return (
    <div className="va-card-heading">

      <span>{number}</span>

      <div>

        <small>
          STEP {number} OF 8
        </small>

        <h2>{title}</h2>

        <p>{text}</p>

      </div>

    </div>
  );
}

function AiMetric({
  label,
  value,
  tone,
}) {
  return (
    <div
      className={`va-ai-metric ${tone}`}
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function PreviewSection({
  title,
  rows,
}) {
  return (
    <div className="va-preview-block">

      <h3>{title}</h3>

      <div className="va-preview-grid">

        {rows.map(
          ([label, value]) => (
            <span key={label}>

              {label}

              <b>
                {value || "—"}
              </b>

            </span>
          )
        )}

      </div>

    </div>
  );
}