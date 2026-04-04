import apiClient from "@/lib/api/client";
import type {
  Applicant,
  ApplicantSearchFilters,
  ApplicationStatus,
  Interview,
  InterviewSearchFilters,
  JobOffer,
  JobPosting,
  JobSearchFilters,
  OfferStatus,
  OnboardingProcess,
  OnboardingStatus,
  OnboardingTemplate,
  RecruitmentPipeline,
  RecruitmentStats,
} from "@/lib/types/recruitment";

type ApiResult<T> = { success: boolean; data?: T; error?: string };

const dataOr = <T>(res: ApiResult<T>, fallback: T): T =>
  res.success && res.data !== undefined ? res.data : fallback;

const dataOrNull = <T>(res: ApiResult<T>): T | null =>
  res.success && res.data !== undefined ? res.data : null;

const mustData = <T>(res: ApiResult<T>): T => {
  if (res.success && res.data !== undefined) return res.data;
  throw new Error(res.error || "Request failed");
};

const jobFiltersToParams = (filters?: JobSearchFilters) =>
  filters
    ? {
        query: filters.query,
        departmentId: filters.departmentId,
        postedAfter: filters.postedAfter,
        postedBefore: filters.postedBefore,
        status: filters.status?.join(","),
        jobType: filters.jobType?.join(","),
        experienceLevel: filters.experienceLevel?.join(","),
      }
    : undefined;

const applicantFiltersToParams = (filters?: ApplicantSearchFilters) =>
  filters
    ? {
        query: filters.query,
        jobPostingId: filters.jobPostingId,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        appliedAfter: filters.appliedAfter,
        appliedBefore: filters.appliedBefore,
        status: filters.status?.join(","),
        source: filters.source?.join(","),
      }
    : undefined;

const interviewFiltersToParams = (filters?: InterviewSearchFilters) =>
  filters
    ? {
        applicantId: filters.applicantId,
        jobPostingId: filters.jobPostingId,
        interviewerId: filters.interviewerId,
        scheduledAfter: filters.scheduledAfter,
        scheduledBefore: filters.scheduledBefore,
        type: filters.type?.join(","),
        status: filters.status?.join(","),
      }
    : undefined;

type ApiJobPosting = {
  id: string;
  title: string;
  titleAr?: string | null;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  department?: { id?: string; name?: string | null; nameAr?: string | null } | null;
  jobTitleId?: string | null;
  jobTitleName?: string | null;
  jobTitle?: { id?: string; name?: string | null; nameAr?: string | null } | null;
  status?: string | null;
  jobType?: string | null;
  experienceLevel?: string | null;
  positions?: number | null;
  location?: string | null;
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryCurrency?: string | null;
  postedAt?: string | null;
  expiresAt?: string | null;
  applicantsCount?: number | null;
  createdBy?: { id?: string; name?: string | null; firstName?: string | null; lastName?: string | null } | string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiApplicant = {
  id: string;
  jobPostingId: string;
  jobTitle?: string | null;
  jobPosting?: { id: string; title?: string | null } | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  coverLetter?: string | null;
  source?: string | null;
  rating?: number | null;
  notes?: string | null;
  status?: string | null;
  appliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiInterview = {
  id: string;
  applicantId: string;
  applicantName?: string | null;
  applicant?: { firstName?: string | null; lastName?: string | null } | null;
  jobPostingId: string;
  jobTitle?: string | null;
  jobPosting?: { title?: string | null } | null;
  type?: string | null;
  status?: string | null;
  scheduledAt?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  duration?: number | null;
  location?: string | null;
  meetingLink?: string | null;
  interviewerId?: string | null;
  interviewerName?: string | null;
  interviewers?: Array<{ id: string; name: string; role?: string | null; avatar?: string | null }> | null;
  feedback?: unknown;
  createdAt: string;
  updatedAt: string;
};

function splitMultiline(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const parts = value
    .split(/\r?\n|•/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [value.trim()];
}

function joinMultiline(value: string[] | undefined): string | null {
  const parts = (value ?? []).map((item) => item.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : null;
}

function toNumber(value: number | string | null | undefined): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeJobStatus(value: string | null | undefined): JobPosting["status"] {
  switch ((value || "").trim().toLowerCase()) {
    case "active":
      return "active";
    case "filled":
      return "filled";
    case "closed":
      return "closed";
    case "draft":
    default:
      return "draft";
  }
}

function normalizeJobType(value: string | null | undefined): JobPosting["jobType"] {
  switch ((value || "").trim().toLowerCase()) {
    case "part-time":
      return "part-time";
    case "contract":
      return "contract";
    case "internship":
      return "internship";
    case "temporary":
      return "temporary";
    case "full-time":
    default:
      return "full-time";
  }
}

function normalizeExperienceLevel(value: string | null | undefined): JobPosting["experienceLevel"] {
  switch ((value || "").trim().toLowerCase()) {
    case "entry":
      return "entry";
    case "junior":
      return "junior";
    case "senior":
      return "senior";
    case "lead":
      return "lead";
    case "executive":
      return "executive";
    case "mid":
    default:
      return "mid";
  }
}

function normalizeApplicationStatus(value: string | null | undefined): Applicant["status"] {
  switch ((value || "").trim().toLowerCase()) {
    case "screening":
      return "screening";
    case "shortlisted":
      return "shortlisted";
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    case "withdrawn":
      return "withdrawn";
    case "new":
    default:
      return "new";
  }
}

function normalizeSourceChannel(value: string | null | undefined): Applicant["source"] {
  switch ((value || "").trim().toLowerCase()) {
    case "website":
      return "website";
    case "career-portal":
    case "career_portal":
      return "career-portal";
    case "linkedin":
      return "linkedin";
    case "indeed":
      return "indeed";
    case "referral":
      return "referral";
    case "agency":
      return "agency";
    case "social":
      return "social";
    case "direct":
      return "direct";
    case "other":
    default:
      return "other";
  }
}

function normalizeInterviewType(value: string | null | undefined): Interview["type"] {
  switch ((value || "").trim().toLowerCase()) {
    case "phone":
      return "phone";
    case "video":
      return "video";
    case "in-person":
      return "in-person";
    case "technical":
      return "technical";
    case "final":
      return "final";
    case "hr":
    default:
      return "hr";
  }
}

function normalizeInterviewStatus(value: string | null | undefined): Interview["status"] {
  switch ((value || "").trim().toLowerCase()) {
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "no-show":
      return "no-show";
    case "scheduled":
    default:
      return "scheduled";
  }
}

function mapRecommendation(value: unknown): NonNullable<Interview["feedback"]>[number]["recommendation"] {
  switch (String(value || "").trim().toLowerCase()) {
    case "strongly-recommend":
      return "strong-hire";
    case "recommend":
      return "hire";
    case "not-recommend":
      return "no-hire";
    case "strongly-not-recommend":
      return "strong-no-hire";
    case "neutral":
    default:
      return "no-decision";
  }
}

function mapInterviewFeedback(
  feedback: unknown,
  interviewerId?: string | null,
  interviewerName?: string | null
): Interview["feedback"] | undefined {
  if (!feedback || typeof feedback !== "object") {
    return undefined;
  }

  const rawItems = Array.isArray(feedback) ? feedback : [feedback];
  const mapped = rawItems.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const overallRating = Number(record.overallRating ?? record.rating ?? 0);
    if (!Number.isFinite(overallRating) || overallRating <= 0) {
      return [];
    }

    return [
      {
        interviewerId: String(record.interviewerId ?? interviewerId ?? "unknown"),
        interviewerName: String(record.interviewerName ?? interviewerName ?? "غير محدد"),
        overallRating,
        strengths: Array.isArray(record.strengths) ? record.strengths.map(String) : [],
        weaknesses: Array.isArray(record.weaknesses) ? record.weaknesses.map(String) : [],
        recommendation: mapRecommendation(record.recommendation),
        comments: typeof record.comments === "string" ? record.comments : typeof record.notes === "string" ? record.notes : undefined,
        submittedAt: typeof record.submittedAt === "string" ? record.submittedAt : new Date().toISOString(),
      },
    ];
  });

  return mapped.length > 0 ? mapped : undefined;
}

function mapJobPostingFromApi(job: ApiJobPosting): JobPosting {
  const createdByName =
    typeof job.createdBy === "string"
      ? job.createdBy
      : job.createdBy?.name || [job.createdBy?.firstName, job.createdBy?.lastName].filter(Boolean).join(" ");

  return {
    id: job.id,
    title: job.title,
    titleEn: job.titleAr ?? undefined,
    description: job.description,
    requirements: splitMultiline(job.requirements),
    responsibilities: splitMultiline(job.responsibilities),
    departmentId: job.departmentId || job.department?.id || "",
    departmentName: job.department?.nameAr || job.departmentName || job.department?.name || "غير محدد",
    jobTitleId: job.jobTitleId || job.jobTitle?.id || undefined,
    location: job.location ?? "غير محدد",
    jobType: normalizeJobType(job.jobType),
    experienceLevel: normalizeExperienceLevel(job.experienceLevel),
    salaryMin: toNumber(job.salaryMin),
    salaryMax: toNumber(job.salaryMax),
    currency: job.salaryCurrency || "SAR",
    showSalary: job.salaryMin != null || job.salaryMax != null,
    status: normalizeJobStatus(job.status),
    skills: [],
    benefits: splitMultiline(job.benefits),
    openPositions: Math.max(1, Number(job.positions ?? 1)),
    filledPositions: normalizeJobStatus(job.status) === "filled" ? Math.max(1, Number(job.positions ?? 1)) : 0,
    applicationDeadline: job.expiresAt ?? undefined,
    postedDate: job.postedAt || job.createdAt,
    createdBy: createdByName || "",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

function mapApplicantFromApi(applicant: ApiApplicant): Applicant {
  return {
    id: applicant.id,
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    phone: applicant.phone ?? "",
    jobPostingId: applicant.jobPostingId,
    jobTitle: applicant.jobTitle || applicant.jobPosting?.title || "غير محدد",
    resumeUrl: applicant.resumeUrl ?? undefined,
    portfolioUrl: applicant.portfolioUrl ?? undefined,
    linkedinUrl: applicant.linkedinUrl ?? undefined,
    coverLetter: applicant.coverLetter ?? undefined,
    source: normalizeSourceChannel(applicant.source),
    status: normalizeApplicationStatus(applicant.status),
    rating: applicant.rating ?? undefined,
    notes: applicant.notes ?? undefined,
    skills: [],
    appliedAt: applicant.appliedAt || applicant.createdAt,
    updatedAt: applicant.updatedAt,
  };
}

function mapInterviewFromApi(interview: ApiInterview): Interview {
  const scheduledAt = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
  const scheduledDate =
    interview.scheduledDate ||
    (scheduledAt
      ? `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, "0")}-${String(scheduledAt.getDate()).padStart(2, "0")}`
      : "");
  const scheduledTime =
    interview.scheduledTime ||
    (scheduledAt
      ? `${String(scheduledAt.getHours()).padStart(2, "0")}:${String(scheduledAt.getMinutes()).padStart(2, "0")}`
      : "00:00");

  return {
    id: interview.id,
    applicantId: interview.applicantId,
    applicantName:
      interview.applicantName ||
      [interview.applicant?.firstName, interview.applicant?.lastName].filter(Boolean).join(" ") ||
      "غير محدد",
    jobPostingId: interview.jobPostingId,
    jobTitle: interview.jobTitle || interview.jobPosting?.title || "غير محدد",
    type: normalizeInterviewType(interview.type),
    status: normalizeInterviewStatus(interview.status),
    scheduledDate,
    scheduledTime,
    duration: Number(interview.duration ?? 60),
    location: interview.location ?? undefined,
    meetingLink: interview.meetingLink ?? undefined,
    interviewers:
      interview.interviewers?.map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role || "Interviewer",
        avatar: item.avatar ?? undefined,
      })) ||
      (interview.interviewerId || interview.interviewerName
        ? [
            {
              id: interview.interviewerId || "unknown",
              name: interview.interviewerName || "غير محدد",
              role: "Interviewer",
            },
          ]
        : []),
    feedback: mapInterviewFeedback(interview.feedback, interview.interviewerId, interview.interviewerName),
    notes: undefined,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
}

function toJobPostingPayload(data: Partial<JobPosting>) {
  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.titleEn !== undefined) payload.titleAr = data.titleEn || null;
  if (data.description !== undefined) payload.description = data.description;
  if (data.requirements !== undefined) payload.requirements = joinMultiline(data.requirements);
  if (data.responsibilities !== undefined) payload.responsibilities = joinMultiline(data.responsibilities);
  if (data.benefits !== undefined) payload.benefits = joinMultiline(data.benefits);
  if (data.departmentId !== undefined) payload.departmentId = data.departmentId || null;
  if (data.jobTitleId !== undefined) payload.jobTitleId = data.jobTitleId || null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.jobType !== undefined) payload.jobType = data.jobType;
  if (data.experienceLevel !== undefined) payload.experienceLevel = data.experienceLevel;
  if (data.openPositions !== undefined) payload.positions = data.openPositions;
  if (data.location !== undefined) payload.location = data.location || null;
  if (data.salaryMin !== undefined) payload.salaryMin = data.salaryMin ?? null;
  if (data.salaryMax !== undefined) payload.salaryMax = data.salaryMax ?? null;
  if (data.currency !== undefined) payload.salaryCurrency = data.currency;
  if (data.postedDate !== undefined) payload.postedAt = data.postedDate || null;
  if (data.applicationDeadline !== undefined) payload.expiresAt = data.applicationDeadline || null;

  return payload;
}

function toInterviewPayload(data: Partial<Interview>) {
  const payload: Record<string, unknown> = {};

  if (data.applicantId !== undefined) payload.applicantId = data.applicantId;
  if (data.jobPostingId !== undefined) payload.jobPostingId = data.jobPostingId;
  if (data.type !== undefined) payload.type = data.type;
  if (data.status !== undefined) payload.status = data.status;
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.location !== undefined) payload.location = data.location || null;
  if (data.meetingLink !== undefined) payload.meetingLink = data.meetingLink || null;
  if (data.interviewers?.[0]?.id) payload.interviewerId = data.interviewers[0].id;

  if (data.scheduledDate) {
    const time = data.scheduledTime || "00:00";
    payload.scheduledAt = `${data.scheduledDate}T${time}:00`;
  }

  return payload;
}

// ==================== الوظائف الشاغرة ====================

export async function getJobPostings(filters?: JobSearchFilters): Promise<JobPosting[]> {
  const params = jobFiltersToParams(filters);
  const res = await apiClient.get<ApiJobPosting[]>(
    "/recruitment/job-postings",
    params ? { params } : undefined
  );
  return dataOr(res, []).map(mapJobPostingFromApi);
}

export async function getJobPosting(id: string): Promise<JobPosting | null> {
  if (!id) return null;
  const res = await apiClient.get<ApiJobPosting>(`/recruitment/job-postings/${encodeURIComponent(id)}`);
  return res.success && res.data ? mapJobPostingFromApi(res.data) : null;
}

export async function createJobPosting(data: Partial<JobPosting>): Promise<JobPosting> {
  const res = await apiClient.post<{ id: string }>("/recruitment/job-postings", toJobPostingPayload(data));
  const created = mustData(res);
  const fullRecord = await getJobPosting(created.id);
  if (!fullRecord) {
    throw new Error("Failed to load created job posting");
  }
  return fullRecord;
}

export async function updateJobPosting(id: string, data: Partial<JobPosting>): Promise<JobPosting> {
  const res = await apiClient.put<ApiJobPosting>(
    `/recruitment/job-postings/${encodeURIComponent(id)}`,
    toJobPostingPayload(data)
  );
  return mapJobPostingFromApi(mustData(res));
}

export async function deleteJobPosting(id: string): Promise<void> {
  if (!id) return;
  const res = await apiClient.delete<void>(`/recruitment/job-postings/${encodeURIComponent(id)}`);
  if (!res.success) throw new Error(res.error || "Request failed");
}

// ==================== المتقدمين ====================

export async function getApplicants(filters?: ApplicantSearchFilters): Promise<Applicant[]> {
  const params = applicantFiltersToParams(filters);
  const res = await apiClient.get<ApiApplicant[]>(
    "/recruitment/applicants",
    params ? { params } : undefined
  );
  return dataOr(res, []).map(mapApplicantFromApi);
}

export async function getApplicant(id: string): Promise<Applicant | null> {
  if (!id) return null;
  const res = await apiClient.get<ApiApplicant>(`/recruitment/applicants/${encodeURIComponent(id)}`);
  return res.success && res.data ? mapApplicantFromApi(res.data) : null;
}

export async function updateApplicantStatus(id: string, status: ApplicationStatus): Promise<Applicant> {
  const res = await apiClient.patch<ApiApplicant>(
    `/recruitment/applicants/${encodeURIComponent(id)}/status`,
    { status }
  );
  return mapApplicantFromApi(mustData(res));
}

export async function updateApplicantRating(id: string, rating: number): Promise<Applicant> {
  const res = await apiClient.patch<ApiApplicant>(
    `/recruitment/applicants/${encodeURIComponent(id)}/rating`,
    { rating }
  );
  return mapApplicantFromApi(mustData(res));
}

// ==================== المقابلات ====================

export async function getInterviews(filters?: InterviewSearchFilters): Promise<Interview[]> {
  const params = interviewFiltersToParams(filters);
  const res = await apiClient.get<ApiInterview[]>(
    "/recruitment/interviews",
    params ? { params } : undefined
  );
  return dataOr(res, []).map(mapInterviewFromApi);
}

export async function getInterview(id: string): Promise<Interview | null> {
  if (!id) return null;
  const res = await apiClient.get<ApiInterview>(`/recruitment/interviews/${encodeURIComponent(id)}`);
  return res.success && res.data ? mapInterviewFromApi(res.data) : null;
}

export async function scheduleInterview(data: Partial<Interview>): Promise<Interview> {
  const res = await apiClient.post<{ id: string }>("/recruitment/interviews", toInterviewPayload(data));
  const created = mustData(res);
  const fullRecord = await getInterview(created.id);
  if (!fullRecord) {
    throw new Error("Failed to load created interview");
  }
  return fullRecord;
}

export async function updateInterviewStatus(id: string, status: Interview["status"]): Promise<Interview> {
  const res = await apiClient.patch<ApiInterview>(
    `/recruitment/interviews/${encodeURIComponent(id)}/status`,
    { status }
  );
  return mapInterviewFromApi(mustData(res));
}

export async function submitInterviewFeedback(
  interviewId: string,
  feedback: Interview["feedback"]
): Promise<Interview> {
  const payload = Array.isArray(feedback) ? feedback[0] : feedback;
  const res = await apiClient.post<ApiInterview>(
    `/recruitment/interviews/${encodeURIComponent(interviewId)}/feedback`,
    {
      feedback: {
        rating: payload?.overallRating ?? 0,
        strengths: payload?.strengths ?? [],
        weaknesses: payload?.weaknesses ?? [],
        recommendation:
          payload?.recommendation === "strong-hire"
            ? "strongly-recommend"
            : payload?.recommendation === "hire"
              ? "recommend"
              : payload?.recommendation === "no-hire"
                ? "not-recommend"
                : payload?.recommendation === "strong-no-hire"
                  ? "strongly-not-recommend"
                  : "neutral",
        notes: payload?.comments,
      },
    }
  );
  return mapInterviewFromApi(mustData(res));
}

// ==================== العروض الوظيفية ====================

export async function getJobOffers(status?: OfferStatus[]): Promise<JobOffer[]> {
  const res = await apiClient.get<JobOffer[]>(
    "/recruitment/job-offers",
    status ? { params: { status: status.join(",") } } : undefined
  );
  return dataOr(res, []);
}

export async function getJobOffer(id: string): Promise<JobOffer | null> {
  if (!id) return null;
  const res = await apiClient.get<JobOffer>(`/recruitment/job-offers/${encodeURIComponent(id)}`);
  return dataOrNull(res);
}

export async function createJobOffer(data: Partial<JobOffer>): Promise<JobOffer> {
  const res = await apiClient.post<JobOffer>("/recruitment/job-offers", data);
  return mustData(res);
}

export async function updateJobOffer(id: string, data: Partial<JobOffer>): Promise<JobOffer> {
  const res = await apiClient.patch<JobOffer>(
    `/recruitment/job-offers/${encodeURIComponent(id)}`,
    data
  );
  return mustData(res);
}

export async function deleteJobOffer(id: string): Promise<void> {
  await apiClient.delete<void>(`/recruitment/job-offers/${encodeURIComponent(id)}`);
}

export async function updateOfferStatus(id: string, status: OfferStatus): Promise<JobOffer> {
  const res = await apiClient.patch<JobOffer>(
    `/recruitment/job-offers/${encodeURIComponent(id)}/status`,
    { status }
  );
  return mustData(res);
}

// ==================== الإلحاق ====================

export async function getOnboardingProcesses(status?: OnboardingStatus[]): Promise<OnboardingProcess[]> {
  const res = await apiClient.get<OnboardingProcess[]>(
    "/recruitment/onboarding-processes",
    status ? { params: { status: status.join(",") } } : undefined
  );
  return dataOr(res, []);
}

export async function getOnboardingProcess(id: string): Promise<OnboardingProcess | null> {
  if (!id) return null;
  const res = await apiClient.get<OnboardingProcess>(
    `/recruitment/onboarding-processes/${encodeURIComponent(id)}`
  );
  return dataOrNull(res);
}

export async function createOnboardingProcess(
  employeeId: string,
  templateId?: string
): Promise<OnboardingProcess> {
  const res = await apiClient.post<OnboardingProcess>("/recruitment/onboarding-processes", {
    employeeId,
    templateId,
  });
  return mustData(res);
}

export async function updateOnboardingTask(
  processId: string,
  taskId: string,
  status: "pending" | "in-progress" | "completed"
): Promise<OnboardingProcess> {
  const res = await apiClient.patch<OnboardingProcess>(
    `/recruitment/onboarding-processes/${encodeURIComponent(processId)}/tasks/${encodeURIComponent(taskId)}`,
    { status }
  );
  return mustData(res);
}

// ==================== قوالب الإلحاق ====================

export async function getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
  const res = await apiClient.get<OnboardingTemplate[]>("/recruitment/onboarding-templates");
  return dataOr(res, []);
}

export async function getOnboardingTemplate(id: string): Promise<OnboardingTemplate | null> {
  if (!id) return null;
  const res = await apiClient.get<OnboardingTemplate>(
    `/recruitment/onboarding-templates/${encodeURIComponent(id)}`
  );
  return dataOrNull(res);
}

export async function createOnboardingTemplate(
  data: Partial<OnboardingTemplate>
): Promise<OnboardingTemplate> {
  const res = await apiClient.post<OnboardingTemplate>("/recruitment/onboarding-templates", data);
  return mustData(res);
}

// ==================== الإحصائيات ====================

export async function getRecruitmentStats(): Promise<RecruitmentStats> {
  const res = await apiClient.get<RecruitmentStats>("/recruitment/stats");
  return mustData(res);
}

export async function getRecruitmentPipeline(): Promise<RecruitmentPipeline[]> {
  const res = await apiClient.get<RecruitmentPipeline[]>("/recruitment/pipeline");
  return dataOr(res, []);
}
