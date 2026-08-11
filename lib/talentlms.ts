/**
 * TalentLMS API v1 client (server-side ONLY — uses the super-admin API key).
 *
 * Auth: HTTP Basic with the API key as username, blank password.
 * GET params ride in the URL path as `key:value` pairs separated by commas.
 * URL-type params (redirects) must be base64-encoded per the API docs.
 *
 * Set TALENTLMS_MOCK=true to exercise the full portal flow with fake data.
 */

const DOMAIN = process.env.TALENTLMS_DOMAIN ?? "";
const API_KEY = process.env.TALENTLMS_API_KEY ?? "";
const MOCK = process.env.TALENTLMS_MOCK === "true";

const BASE = `https://${DOMAIN}.talentlms.com/api/v1`;

// ---------- Types ----------

export interface TlmsCourseSummary {
  id: string;
  name: string;
  role?: string;
  completion_status?: string; // "Completed" | "Incomplete" | "Not attempted"
  completion_percentage?: string;
  last_accessed_unit_url?: string;
  big_avatar?: string;
}

export interface TlmsCertification {
  course_id: string;
  course_name: string;
  unique_id: string;
  issued_date: string;
  download_url: string;
  public_url: string;
}

export interface TlmsUser {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  user_type?: string; // e.g. "SuperAdmin", "Admin-Type", "Learner-Type"
  points?: string;
  level?: string;
  courses?: TlmsCourseSummary[];
  certifications?: TlmsCertification[];
  badges?: TlmsBadge[];
  login_key?: string;
}

export interface LoginResult {
  user_id: string;
  login_key: string; // one-time autologin URL — use immediately, never store
}

export interface GotoCourseResult {
  goto_url: string; // one-time URL that logs in AND opens the course
}

export class TalentLmsError extends Error {
  constructor(
    message: string,
    public status: number,
    public type?: string
  ) {
    super(message);
    this.name = "TalentLmsError";
  }
}

// ---------- Core request helper ----------

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

async function tlms<T>(
  path: string,
  init?: { method?: "GET" | "POST"; form?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`,
      ...(init?.form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init?.form ? new URLSearchParams(init.form).toString() : undefined,
    // Never cache: login keys are single-use and progress data goes stale.
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new TalentLmsError(`Non-JSON response from TalentLMS (${res.status})`, res.status);
  }

  if (!res.ok) {
    const err = data as { error?: { message?: string; type?: string } };
    throw new TalentLmsError(
      err?.error?.message ?? `TalentLMS request failed (${res.status})`,
      res.status,
      err?.error?.type
    );
  }
  return data as T;
}

// ---------- Mock data (TALENTLMS_MOCK=true) ----------

const MOCK_USER: TlmsUser = {
  id: "42",
  login: "demo",
  first_name: "Demo",
  last_name: "Advisor",
  email: "demo@example.com",
  status: "active",
  user_type: "SuperAdmin",
  courses: [
    { id: "101", name: "Service Advisor Foundations", completion_status: "Completed", completion_percentage: "100" },
    { id: "102", name: "The Drive: Selling With Integrity", completion_status: "Incomplete", completion_percentage: "45" },
    { id: "103", name: "Leadership for Service Managers", completion_status: "Not attempted", completion_percentage: "0" },
  ],
  certifications: [
    {
      course_id: "101",
      course_name: "Service Advisor Foundations",
      unique_id: "MOCK-CERT-1",
      issued_date: "01/06/2026",
      download_url: "#",
      public_url: "#",
    },
  ],
};

// ---------- Public API ----------

/**
 * Validate credentials against TalentLMS. Returns the user id and a one-time
 * autologin URL. Throws TalentLmsError(400/401-ish) on bad credentials.
 */
export async function userLogin(login: string, password: string): Promise<LoginResult> {
  if (MOCK) {
    if (password !== "demo") throw new TalentLmsError("Invalid mock credentials (use demo/demo)", 400);
    return { user_id: MOCK_USER.id, login_key: "#mock-login" };
  }
  return tlms<LoginResult>("userlogin", {
    method: "POST",
    form: {
      login,
      password,
      logout_redirect: b64(`${process.env.PORTAL_URL}/`),
    },
  });
}

/** Full user record including course enrollments + certificates. */
export async function getUserById(userId: string): Promise<TlmsUser> {
  if (MOCK) return MOCK_USER;
  return tlms<TlmsUser>(`users/id:${userId}`);
}

export interface TlmsUserSummary {
  id: string;
  login: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type?: string;
  status?: string;
  points?: string;
  level?: string;
}

export interface TlmsBadge {
  name?: string;
  type?: string;
  image_url?: string;
  criteria?: string;
  issued_on?: string;
}

let usersCache: { data: TlmsUserSummary[]; ts: number } | null = null;

/** All portal users (summary), cached 5 minutes. */
export async function getUsers(): Promise<TlmsUserSummary[]> {
  if (MOCK) return [MOCK_USER];
  if (usersCache && Date.now() - usersCache.ts < 5 * 60 * 1000) return usersCache.data;
  const data = await tlms<TlmsUserSummary[]>("users");
  usersCache = { data, ts: Date.now() };
  return data;
}

/** Look up a user by email (used to resolve email -> username at login). */
export async function getUserByEmail(email: string): Promise<TlmsUser> {
  if (MOCK) return MOCK_USER;
  return tlms<TlmsUser>(`users/email:${encodeURIComponent(email)}`);
}

/**
 * One-time URL that logs the user in and drops them straight into the course
 * with TalentLMS chrome hidden. Redirect the browser to `goto_url` immediately.
 */
export async function gotoCourse(userId: string, courseId: string): Promise<GotoCourseResult> {
  if (MOCK) return { goto_url: `${process.env.PORTAL_URL}/dashboard?mock_launched=${courseId}` };

  const portal = process.env.PORTAL_URL ?? "";
  const params = [
    `user_id:${userId}`,
    `course_id:${courseId}`,
    `logout_redirect:${b64(`${portal}/`)}`,
    `course_completed_redirect:${b64(`${portal}/dashboard?completed=${courseId}`)}`,
    `header_hidden_options:courseName;units;sharedFiles;moreOptions;certificationIcon`,
  ].join(",");

  return tlms<GotoCourseResult>(`gotocourse/${params}`);
}

// ---------- Catalog ----------

export interface TlmsCatalogCourse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category_id?: string;
  status?: string; // "active" | "inactive"
  hide_from_catalog?: string | boolean;
  avatar?: string;
  big_avatar?: string;
}

const MOCK_CATALOG: TlmsCatalogCourse[] = [
  { id: "101", name: "Service Advisor Foundations", description: "The fundamentals every advisor needs.", status: "active" },
  { id: "102", name: "The Drive: Selling With Integrity", description: "Turn the service lane into a sales engine.", status: "active" },
  { id: "103", name: "Leadership for Service Managers", description: "Run the shop like a business.", status: "active" },
  { id: "104", name: "Hiring Technicians That Stay", description: "Recruit, onboard, and keep great techs.", status: "active" },
];

/** Course catalog. Raw, uncached. */
export async function getCourses(): Promise<TlmsCatalogCourse[]> {
  if (MOCK) return MOCK_CATALOG;
  return tlms<TlmsCatalogCourse[]>("courses");
}

// Simple in-memory cache: /v1/courses has no pagination and rate limits are
// per-hour, so we refresh at most every 10 minutes per server instance.
let catalogCache: { data: TlmsCatalogCourse[]; ts: number } | null = null;
const CATALOG_TTL_MS = 10 * 60 * 1000;

/** Active, catalog-visible courses, cached for 10 minutes. */
export async function getCatalog(): Promise<TlmsCatalogCourse[]> {
  if (catalogCache && Date.now() - catalogCache.ts < CATALOG_TTL_MS) return catalogCache.data;
  const all = await getCourses();
  const visible = all.filter(
    (c) => c.status !== "inactive" && !(c.hide_from_catalog === true || c.hide_from_catalog === "on" || c.hide_from_catalog === "1")
  );
  catalogCache = { data: visible, ts: Date.now() };
  return visible;
}

export interface TlmsCategory {
  id: string;
  name: string;
  parent_category_id?: string | null;
}

let categoryCache: { data: TlmsCategory[]; ts: number } | null = null;

/** Course categories, cached for 10 minutes. */
export async function getCategories(): Promise<TlmsCategory[]> {
  if (MOCK) return [{ id: "1", name: "Service Training" }, { id: "2", name: "Leadership" }];
  if (categoryCache && Date.now() - categoryCache.ts < CATALOG_TTL_MS) return categoryCache.data;
  const data = await tlms<TlmsCategory[]>("categories");
  categoryCache = { data, ts: Date.now() };
  return data;
}

/**
 * Fresh one-time autologin URL for general TalentLMS access (not course-specific).
 * Used to hand members into native TalentLMS surfaces like Discussions.
 */
export async function getAutologinUrl(userId: string): Promise<string> {
  if (MOCK) return `${process.env.PORTAL_URL}/dashboard?mock_sso=1`;
  const user = await tlms<TlmsUser>(`users/id:${userId}`);
  if (!user.login_key) throw new TalentLmsError("No login_key returned for user", 500);
  return user.login_key;
}

export interface TlmsUnit {
  id: string;
  name: string;
  type?: string;
}

export interface TlmsCourseFull extends TlmsCatalogCourse {
  units?: TlmsUnit[];
}

/** Full course detail including its unit (curriculum) list. */
export async function getCourse(courseId: string): Promise<TlmsCourseFull> {
  if (MOCK) {
    const c = MOCK_CATALOG.find((x) => x.id === courseId) ?? MOCK_CATALOG[0];
    return {
      ...c,
      units: [
        { id: "1", name: "Welcome & how to use this course", type: "Video" },
        { id: "2", name: "The mindset of a top advisor", type: "Video" },
        { id: "3", name: "Knowledge check", type: "Test" },
      ],
    };
  }
  return tlms<TlmsCourseFull>(`courses/id:${courseId}`);
}

/** Enroll a user in a course as a learner. Succeeds silently if already enrolled. */
export async function enrollUserInCourse(userId: string, courseId: string): Promise<void> {
  if (MOCK) {
    const already = MOCK_USER.courses?.some((c) => c.id === courseId);
    if (!already) {
      const c = MOCK_CATALOG.find((c) => c.id === courseId);
      MOCK_USER.courses?.push({ id: courseId, name: c?.name ?? "Course", completion_status: "Not attempted", completion_percentage: "0" });
    }
    return;
  }
  try {
    await tlms("addusertocourse", {
      method: "POST",
      form: { user_id: userId, course_id: courseId, role: "learner" },
    });
  } catch (e) {
    // "already enrolled" style rejections are fine — treat as success.
    if (e instanceof TalentLmsError && e.status < 500 && /already|enrolled|exists/i.test(e.message)) return;
    throw e;
  }
}
