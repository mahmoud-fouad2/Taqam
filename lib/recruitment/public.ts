import { JobPostingStatus, Prisma, UserRole, UserStatus } from "@prisma/client";

import prisma from "@/lib/db";
import { getAppBaseUrl, sendEmail } from "@/lib/email";
import { buildTenantCanonicalUrl } from "@/lib/tenant";
import { findActiveTenantBySlug } from "@/lib/tenant-directory";
import {
  mapDbExperienceLevelToPublic,
  mapDbJobTypeToPublic,
  mapPublicJobTypeToDb,
  PUBLIC_JOB_TYPE_OPTIONS,
  type PublicJobTypeValue
} from "@/lib/recruitment/public-meta";

type PublicTenantEmailSource = {
  settings: Prisma.JsonValue | null;
  organizationProfile: {
    email: string | null;
  } | null;
};

type PublicTenantRecord = PublicTenantEmailSource & {
  id: string;
  slug: string;
  domain: string | null;
  name: string;
  nameAr: string | null;
  logo: string | null;
};

type PublicJobPostingRecord = Prisma.JobPostingGetPayload<{
  include: {
    tenant: {
      select: {
        id: true;
        slug: true;
        domain: true;
        name: true;
        nameAr: true;
        logo: true;
        settings: true;
        organizationProfile: {
          select: {
            email: true;
          };
        };
      };
    };
    department: {
      select: {
        id: true;
        name: true;
        nameAr: true;
      };
    };
    _count: {
      select: {
        applicants: true;
      };
    };
  };
}>;

export type PublicJobPosting = {
  id: string;
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string | null;
  tenantName: string;
  tenantNameAr: string | null;
  tenantLogo: string | null;
  tenantEmail: string | null;
  title: string;
  titleAr: string | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  departmentName: string | null;
  departmentNameAr: string | null;
  jobType: string;
  experienceLevel: string;
  location: string | null;
  positions: number;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  postedAt: string | null;
  expiresAt: string | null;
  applicantsCount: number;
};

export type PublicCareersTenant = {
  id: string;
  slug: string;
  domain: string | null;
  name: string;
  nameAr: string | null;
  logo: string | null;
  email: string | null;
};

export type PublicJobPostingFilters = {
  tenantSlug?: string;
  query?: string;
  location?: string;
  departmentId?: string;
  jobType?: PublicJobTypeValue | string;
  limit?: number;
};

export type PublicJobFiltersCatalog = {
  locations: string[];
  departments: Array<{
    id: string;
    name: string;
    nameAr: string | null;
  }>;
  jobTypes: PublicJobTypeValue[];
};

export type PublicJobApplicationInput = {
  jobPostingId: string;
  tenantSlug?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  coverLetter?: string;
};

function splitMultiline(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(/\r?\n|•/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickStringFromSettings(settings: Prisma.JsonValue | null | undefined, keys: string[]) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }

  const record = settings as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getTenantPublicEmail(tenant: PublicTenantEmailSource) {
  return (
    tenant.organizationProfile?.email?.trim() ||
    pickStringFromSettings(tenant.settings, ["contactEmail", "companyEmail"])
  );
}

function buildActivePublicJobsWhere(
  filters: PublicJobPostingFilters = {}
): Prisma.JobPostingWhereInput {
  const now = new Date();
  const tenantWhere: Prisma.TenantWhereInput = {
    status: "ACTIVE",
    ...(filters.tenantSlug ? { slug: filters.tenantSlug } : {})
  };
  const andFilters: Prisma.JobPostingWhereInput[] = [];
  const jobType = mapPublicJobTypeToDb(filters.jobType);

  const where: Prisma.JobPostingWhereInput = {
    status: JobPostingStatus.ACTIVE,
    tenant: tenantWhere,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
  };

  if (filters.query) {
    andFilters.push({
      OR: [
        { title: { contains: filters.query, mode: "insensitive" } },
        { titleAr: { contains: filters.query, mode: "insensitive" } },
        { description: { contains: filters.query, mode: "insensitive" } },
        { location: { contains: filters.query, mode: "insensitive" } },
        { tenant: { name: { contains: filters.query, mode: "insensitive" } } },
        { tenant: { nameAr: { contains: filters.query, mode: "insensitive" } } },
        { department: { name: { contains: filters.query, mode: "insensitive" } } },
        { department: { nameAr: { contains: filters.query, mode: "insensitive" } } }
      ]
    });
  }

  if (filters.location) {
    andFilters.push({
      location: {
        contains: filters.location,
        mode: "insensitive"
      }
    });
  }

  if (filters.departmentId) {
    andFilters.push({
      departmentId: filters.departmentId
    });
  }

  if (jobType) {
    andFilters.push({
      jobType
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
}

function mapPublicJobPosting(job: PublicJobPostingRecord): PublicJobPosting {
  return {
    id: job.id,
    tenantId: job.tenantId,
    tenantSlug: job.tenant.slug,
    tenantDomain: job.tenant.domain,
    tenantName: job.tenant.name,
    tenantNameAr: job.tenant.nameAr,
    tenantLogo: job.tenant.logo,
    tenantEmail: getTenantPublicEmail(job.tenant),
    title: job.title,
    titleAr: job.titleAr,
    description: job.description,
    requirements: splitMultiline(job.requirements),
    responsibilities: splitMultiline(job.responsibilities),
    benefits: splitMultiline(job.benefits),
    departmentName: job.department?.name ?? null,
    departmentNameAr: job.department?.nameAr ?? null,
    jobType: mapDbJobTypeToPublic(job.jobType),
    experienceLevel: mapDbExperienceLevelToPublic(job.experienceLevel),
    location: job.location,
    positions: job.positions,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
    salaryCurrency: job.salaryCurrency,
    postedAt: job.postedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    applicantsCount: job._count.applicants
  };
}

const publicJobInclude = {
  tenant: {
    select: {
      id: true,
      slug: true,
      domain: true,
      name: true,
      nameAr: true,
      logo: true,
      settings: true,
      organizationProfile: {
        select: {
          email: true
        }
      }
    }
  },
  department: {
    select: {
      id: true,
      name: true,
      nameAr: true
    }
  },
  _count: {
    select: {
      applicants: true
    }
  }
} satisfies Prisma.JobPostingInclude;

export async function listPublicJobPostings(filters: PublicJobPostingFilters = {}) {
  const limit = Math.min(Math.max(filters.limit ?? 24, 1), 60);

  const jobs = await prisma.jobPosting.findMany({
    where: buildActivePublicJobsWhere(filters),
    include: publicJobInclude,
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  return jobs.map(mapPublicJobPosting);
}

export async function listPublicJobFilters(
  scope: Pick<PublicJobPostingFilters, "tenantSlug"> = {}
): Promise<PublicJobFiltersCatalog> {
  const where = buildActivePublicJobsWhere({ tenantSlug: scope.tenantSlug });

  try {
    // Keep these reads outside a transaction to avoid pooled Postgres transaction-start failures
    // on low-resource production environments while still returning the same filter catalog.
    const [locationRows, jobTypeRows, departmentRows] = await Promise.all([
      prisma.jobPosting.findMany({
        where: {
          ...where,
          location: {
            not: null
          }
        },
        select: {
          location: true
        },
        distinct: ["location"],
        orderBy: {
          location: "asc"
        }
      }),
      prisma.jobPosting.findMany({
        where,
        select: {
          jobType: true
        },
        distinct: ["jobType"],
        orderBy: {
          jobType: "asc"
        }
      }),
      prisma.jobPosting.findMany({
        where: {
          ...where,
          departmentId: {
            not: null
          }
        },
        select: {
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
              nameAr: true
            }
          }
        },
        distinct: ["departmentId"],
        orderBy: {
          departmentId: "asc"
        }
      })
    ]);

    const locations = Array.from(
      new Set(locationRows.map((row) => row.location?.trim()).filter(Boolean) as string[])
    ).sort((left, right) => left.localeCompare(right, "ar"));
    const jobTypes = PUBLIC_JOB_TYPE_OPTIONS.filter((option) =>
      jobTypeRows.some((row) => row.jobType === option.dbValue)
    ).map((option) => option.value);
    const departments = departmentRows
      .map((row) => row.department)
      .filter(
        (department): department is NonNullable<(typeof departmentRows)[number]["department"]> =>
          Boolean(department)
      )
      .sort((left, right) => left.name.localeCompare(right.name, "ar"));

    return {
      locations,
      departments,
      jobTypes
    };
  } catch (error) {
    console.error("[public jobs] failed to build filters catalog", error);

    return {
      locations: [],
      departments: [],
      jobTypes: []
    };
  }
}

export async function getPublicJobPostingById(id: string, tenantSlug?: string) {
  const job = await prisma.jobPosting.findFirst({
    where: {
      id,
      ...buildActivePublicJobsWhere({ tenantSlug })
    },
    include: publicJobInclude
  });

  return job ? mapPublicJobPosting(job) : null;
}

export async function getPublicCareersTenantBySlug(
  slug: string
): Promise<PublicCareersTenant | null> {
  const tenant = await findActiveTenantBySlug(slug);

  if (!tenant) {
    return null;
  }

  return {
    id: tenant.id,
    slug: tenant.slug,
    domain: tenant.domain,
    name: tenant.name,
    nameAr: tenant.nameAr,
    logo: tenant.logo,
    email: getTenantPublicEmail(tenant)
  };
}

async function getTenantRecruitmentRecipients(tenantId: string, fallbackEmail: string | null) {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      status: UserStatus.ACTIVE,
      role: {
        in: [UserRole.TENANT_ADMIN, UserRole.HR_MANAGER]
      }
    },
    select: {
      email: true
    }
  });

  const recipients = new Set(users.map((user) => user.email.trim().toLowerCase()).filter(Boolean));

  if (recipients.size === 0 && fallbackEmail) {
    recipients.add(fallbackEmail.trim().toLowerCase());
  }

  if (process.env.NEXT_PUBLIC_SUPPORT_EMAIL) {
    recipients.add(process.env.NEXT_PUBLIC_SUPPORT_EMAIL.trim().toLowerCase());
  }

  return Array.from(recipients);
}

export async function createPublicJobApplication(input: PublicJobApplicationInput) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const job = await prisma.jobPosting.findFirst({
    where: {
      id: input.jobPostingId,
      ...buildActivePublicJobsWhere({ tenantSlug: input.tenantSlug })
    },
    include: {
      tenant: {
        select: {
          id: true,
          slug: true,
          domain: true,
          name: true,
          nameAr: true,
          settings: true,
          organizationProfile: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  if (!job) {
    return { ok: false as const, code: 404, error: "الوظيفة غير متاحة حاليًا" };
  }

  const existing = await prisma.applicant.findFirst({
    where: {
      jobPostingId: job.id,
      email: {
        equals: normalizedEmail,
        mode: "insensitive"
      }
    },
    select: {
      id: true
    }
  });

  if (existing) {
    return {
      ok: false as const,
      code: 409,
      error: "تم استلام طلب سابق لهذا البريد على نفس الوظيفة"
    };
  }

  const applicant = await prisma.applicant.create({
    data: {
      tenantId: job.tenantId,
      jobPostingId: job.id,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
      phone: input.phone?.trim() || null,
      resumeUrl: input.resumeUrl.trim(),
      coverLetter: input.coverLetter?.trim() || null,
      source: "career-portal"
    }
  });

  const portalBase = getAppBaseUrl();
  const publicJobUrl = `${portalBase}/careers/${job.id}`;
  const tenantPortalUrl = buildTenantCanonicalUrl(job.tenant, "/careers", {
    baseDomain: portalBase.replace(/^https?:\/\//, "")
  });
  const companyName = job.tenant.nameAr || job.tenant.name;
  const jobTitle = job.titleAr || job.title;
  const applicantName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  const recipientEmails = await getTenantRecruitmentRecipients(
    job.tenantId,
    getTenantPublicEmail(job.tenant)
  );

  await Promise.allSettled([
    sendEmail({
      to: normalizedEmail,
      subject: `تم استلام طلبك على وظيفة ${jobTitle}`,
      text: `مرحبًا ${applicantName},\n\nتم استلام طلبك على وظيفة ${jobTitle} لدى ${companyName}.\nيمكنك مراجعة إعلان الوظيفة من هنا: ${publicJobUrl}\nبوابة الشركة: ${tenantPortalUrl}`,
      html: `<div dir="rtl" style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.8;color:#0f172a"><h2 style="margin:0 0 12px">تم استلام طلبك</h2><p>مرحبًا ${applicantName}،</p><p>تم استلام طلبك على وظيفة <strong>${jobTitle}</strong> لدى <strong>${companyName}</strong>.</p><p><a href="${publicJobUrl}">مراجعة إعلان الوظيفة</a></p><p><a href="${tenantPortalUrl}">بوابة وظائف الشركة</a></p></div>`,
      replyTo: recipientEmails[0] ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    }),
    recipientEmails.length > 0
      ? sendEmail({
          to: recipientEmails,
          subject: `متقدم جديد على ${jobTitle}`,
          text: `وصل متقدم جديد على وظيفة ${jobTitle}.\nالاسم: ${applicantName}\nالبريد: ${normalizedEmail}\nالهاتف: ${input.phone?.trim() || "غير متوفر"}\nالسيرة الذاتية: ${input.resumeUrl.trim()}\nإعلان الوظيفة: ${publicJobUrl}`,
          html: `<div dir="rtl" style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.8;color:#0f172a"><h2 style="margin:0 0 12px">متقدم جديد</h2><p>وصل متقدم جديد على وظيفة <strong>${jobTitle}</strong>.</p><ul><li>الاسم: ${applicantName}</li><li>البريد: ${normalizedEmail}</li><li>الهاتف: ${input.phone?.trim() || "غير متوفر"}</li><li><a href="${input.resumeUrl.trim()}">رابط السيرة الذاتية</a></li></ul><p><a href="${publicJobUrl}">عرض الوظيفة العامة</a></p></div>`
        })
      : Promise.resolve({ sent: false as const, skipped: true as const })
  ]);

  return {
    ok: true as const,
    applicantId: applicant.id,
    job: {
      id: job.id,
      title: jobTitle,
      tenantSlug: job.tenant.slug,
      tenantName: companyName
    }
  };
}
