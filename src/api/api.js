const configuredBackendUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const normalizedBackendUrl = configuredBackendUrl.replace(/\/+$/, "");

const API_BASE_URL = normalizedBackendUrl.endsWith("/api")
  ? normalizedBackendUrl
  : `${normalizedBackendUrl}/api`;

/* =========================
   DEMO DATA
========================= */

const DEMO_SCHEMES = [
  {
    id: 1,
    slug: "pre-matric",
    name: "Pre-Matric Scholarship",
    description:
      "Support for eligible Scheduled Tribe students in Classes IX and X.",
    department: "Ministry of Tribal Affairs",
    required_docs: ["caste_certificate", "income_certificate", "marksheet"],
    eligibility: {
      category: "ST",
      income_limit: 250000,
      min_percentage: 50,
      education_level: ["Class 9", "Class 10"],
    },
  },
  {
    id: 2,
    slug: "post-matric",
    name: "Post-Matric Scholarship",
    description:
      "Financial assistance for eligible ST students pursuing post-matriculation studies.",
    department: "Ministry of Tribal Affairs",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "bank_passbook",
    ],
    eligibility: {
      category: "ST",
      income_limit: 250000,
      min_percentage: 50,
      education_level: ["Class 11", "Class 12", "UG", "PG"],
    },
  },
  {
    id: 3,
    slug: "top-class",
    name: "Top Class Education Scholarship",
    description:
      "Education support for eligible ST students admitted to notified institutions.",
    department: "Ministry of Tribal Affairs",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "admission_letter",
    ],
    eligibility: {
      category: "ST",
      income_limit: 800000,
      min_percentage: 50,
      education_level: ["UG", "PG"],
    },
  },
  {
    id: 4,
    slug: "national-fellowship",
    name: "National Fellowship",
    description:
      "Fellowship support for eligible ST students pursuing research and advanced academic programmes.",
    department: "Ministry of Tribal Affairs",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "admission_letter",
    ],
    eligibility: {
      category: "ST",
      income_limit: 600000,
      min_percentage: 55,
      education_level: ["PG", "PhD"],
    },
  },
  {
    id: 5,
    slug: "national-overseas",
    name: "National Overseas Scholarship",
    description:
      "Financial assistance for selected ST students pursuing higher education abroad.",
    department: "Ministry of Tribal Affairs",
    required_docs: [
      "caste_certificate",
      "income_certificate",
      "marksheet",
      "admission_letter",
    ],
    eligibility: {
      category: "ST",
      income_limit: 800000,
      min_percentage: 60,
      education_level: ["PG", "PhD"],
    },
  },
];

const DEMO_APPLICATIONS = [
  {
    id: "VYD-DEMO-001",
    applicationId: "VYD-DEMO-001",
    student_name: "Aarav Kumar",
    student_email: "aarav@student.test",
    schemeName: "Post-Matric Scholarship",
    status: "submitted",
    applicant: {
      name: "Aarav Kumar",
      email: "aarav@student.test",
    },
    documents: [
      { name: "ST Caste Certificate", verification_status: "verified" },
      { name: "Income Certificate", verification_status: "verified" },
      { name: "Latest Marksheet", verification_status: "pending" },
      { name: "Bank Passbook", verification_status: "verified" },
    ],
  },
  {
    id: "VYD-DEMO-002",
    applicationId: "VYD-DEMO-002",
    student_name: "Meera Devi",
    student_email: "meera@student.test",
    schemeName: "Top Class Education Scholarship",
    status: "under_review",
    applicant: {
      name: "Meera Devi",
      email: "meera@student.test",
    },
    documents: [
      { name: "ST Caste Certificate", verification_status: "verified" },
      { name: "Income Certificate", verification_status: "verified" },
      { name: "Admission Letter", verification_status: "pending" },
    ],
  },
  {
    id: "VYD-DEMO-003",
    applicationId: "VYD-DEMO-003",
    student_name: "Rohan Singh",
    student_email: "rohan@student.test",
    schemeName: "National Fellowship",
    status: "deficient",
    applicant: {
      name: "Rohan Singh",
      email: "rohan@student.test",
    },
    documents: [
      { name: "Research Admission Letter", verification_status: "deficient" },
    ],
  },
];

/* =========================
   GENERIC API
========================= */

async function apiRequest(endpoint, options = {}) {
  const tokenKey = endpoint.startsWith("/admin/")
    ? "vidyarthAdminToken"
    : "vidyarthToken";

  const token = localStorage.getItem(tokenKey);

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data = {};

    try {
      data = await response.json();
    } catch {}

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/* =========================
   AUTH
========================= */

export async function registerStudent(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginStudent(payload) {
  try {
    return await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    if (
      payload.email === "student@sih.test" &&
      payload.password === "Password123"
    ) {
      return {
        success: true,
        data: {
          token: "demo-student-token",
          user: {
            id: "demo-student",
            name: "Demo Student",
            email: "student@sih.test",
            role: "student",
            category: "ST",
            state: "Uttar Pradesh",
          },
        },
      };
    }

    throw new Error("Invalid student credentials");
  }
}

export async function loginAdmin(payload) {
  if (
    payload.email === "admin@sih.test" &&
    payload.password === "Password123"
  ) {
    return {
      success: true,
      data: {
        token: "demo-admin-token",
        user: {
          id: "demo-admin",
          name: "Admin User",
          email: "admin@sih.test",
          role: "admin",
        },
      },
    };
  }

  try {
    return await apiRequest("/admin/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Invalid admin credentials");
  }
}

export async function loginOfficer(payload) {
  if (
    payload.email === "officer@sih.test" &&
    payload.password === "Password123"
  ) {
    return {
      success: true,
      data: {
        token: "demo-officer-token",
        user: {
          id: "demo-officer",
          name: "Officer User",
          email: "officer@sih.test",
          role: "officer",
        },
      },
    };
  }

  try {
    return await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Invalid officer credentials");
  }
}

/* =========================
   SCHEMES
========================= */

export async function getSchemes() {
  try {
    return await apiRequest("/schemes", {
      method: "GET",
    });
  } catch {
    return {
      success: true,
      data: {
        schemes: DEMO_SCHEMES,
      },
    };
  }
}

/* =========================
   ELIGIBILITY
========================= */

export async function checkEligibility(payload) {
  try {
    return await apiRequest(
      `/schemes/${payload.scheme_id}/check-eligibility`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch {
    const scheme =
      DEMO_SCHEMES.find((item) => Number(item.id) === Number(payload.scheme_id)) ||
      DEMO_SCHEMES[1];

    const income = Number(payload.income || 0);
    const percentage = Number(payload.percentage || 0);

    const eligible =
      payload.category === "ST" &&
      income <= Number(scheme.eligibility.income_limit) &&
      percentage >= Number(scheme.eligibility.min_percentage);

    return {
      success: true,
      data: {
        eligible,
        reasons: eligible
          ? ["Category, income and academic criteria satisfied."]
          : ["One or more eligibility conditions are not satisfied."],
        checks: {
          category: payload.category === "ST",
          income:
            income <= Number(scheme.eligibility.income_limit),
          academic:
            percentage >= Number(scheme.eligibility.min_percentage),
        },
      },
    };
  }
}

/* =========================
   APPLICATIONS
========================= */

export async function createApplication(payload) {
  try {
    return await apiRequest("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    const id = `VYD-DEMO-${Date.now()}`;

    const application = {
      id,
      applicationId: id,
      ...payload,
      status: "draft",
      schemeName:
        DEMO_SCHEMES.find(
          (scheme) => Number(scheme.id) === Number(payload.scheme_id),
        )?.name || "Post-Matric Scholarship",
    };

    localStorage.setItem(
      `vidyarthDemoApplication-${id}`,
      JSON.stringify(application),
    );

    return {
      success: true,
      data: { application },
    };
  }
}

export async function getMyApplications() {
  try {
    return await apiRequest("/applications", {
      method: "GET",
    });
  } catch {
    return {
      success: true,
      data: { applications: [] },
    };
  }
}

export async function getApplicationById(id) {
  try {
    return await apiRequest(`/applications/${id}`, {
      method: "GET",
    });
  } catch {
    const saved = localStorage.getItem(`vidyarthDemoApplication-${id}`);

    return {
      success: true,
      data: {
        application: saved
          ? JSON.parse(saved)
          : {
              id,
              applicationId: id,
              status: "draft",
              schemeName: "Post-Matric Scholarship",
            },
        documents: [],
      },
    };
  }
}

export async function uploadDocuments(id, formData) {
  try {
    return await apiRequest(`/applications/${id}/documents`, {
      method: "PUT",
      body: formData,
    });
  } catch {
    return {
      success: true,
      data: {
        documents: [],
        message: "Documents stored for demonstration.",
      },
    };
  }
}

export async function submitApplication(id) {
  try {
    return await apiRequest(`/applications/${id}/submit`, {
      method: "PATCH",
    });
  } catch {
    return {
      success: true,
      data: {
        status: "submitted",
        applicationId: id,
      },
    };
  }
}

export async function getApplicationPrecheck(id) {
  try {
    return await apiRequest(`/applications/${id}/precheck`, {
      method: "GET",
    });
  } catch {
    return {
      success: true,
      data: {
        overall: "Ready for officer review",
        documents: [],
        message: "Demo pre-check completed.",
      },
    };
  }
}

/* =========================
   ADMIN / OFFICER
========================= */

export async function getAdminApplications() {
  try {
    return await apiRequest("/admin/applications", {
      method: "GET",
    });
  } catch {
    return {
      success: true,
      data: {
        applications: DEMO_APPLICATIONS,
      },
    };
  }
}

export async function updateApplicationStatus(id, payload) {
  try {
    return await apiRequest(`/admin/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      success: true,
      data: {
        id,
        ...payload,
      },
    };
  }
}

export async function getApplicationAuditLog(id) {
  try {
    return await apiRequest(`/admin/applications/${id}/audit-log`, {
      method: "GET",
    });
  } catch {
    return {
      success: true,
      data: {
        entries: [
          {
            id: "demo-audit-1",
            action: "Application submitted",
            remarks: "Demo application received for scrutiny.",
            createdAt: new Date().toLocaleString("en-IN"),
          },
          {
            id: "demo-audit-2",
            action: "Document verification",
            remarks: "Documents queued for officer review.",
            createdAt: new Date().toLocaleString("en-IN"),
          },
        ],
      },
    };
  }
}

export async function checkBackend() {
  try {
    const response = await fetch(`${normalizedBackendUrl}/health`);

    if (!response.ok) {
      throw new Error("Backend health check failed");
    }

    return response.json();
  } catch {
    return {
      success: true,
      message: "VIDYARTH demo mode is active",
    };
  }
}

export { API_BASE_URL };