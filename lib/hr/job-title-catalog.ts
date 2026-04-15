import prisma from "@/lib/db";

type JobTitleCatalogClient = {
  jobTitle: {
    findMany(args: unknown): Promise<Array<{ code: string }>>;
    createMany(args: unknown): Promise<unknown>;
  };
};

export type CuratedJobTitleDefinition = {
  code: string;
  name: string;
  nameAr: string;
  level: number;
  minSalary?: number;
  maxSalary?: number;
};

const curatedJobTitleCatalog: CuratedJobTitleDefinition[] = [
  {
    code: "EMPLOYEE",
    name: "Employee",
    nameAr: "موظف",
    level: 1,
    minSalary: 4000,
    maxSalary: 9000
  },
  {
    code: "CUSTOMER_SUPPORT_SPECIALIST",
    name: "Customer Support Specialist",
    nameAr: "أخصائي خدمة عملاء",
    level: 2,
    minSalary: 4500,
    maxSalary: 9000
  },
  {
    code: "SALES_REPRESENTATIVE",
    name: "Sales Representative",
    nameAr: "مندوب مبيعات",
    level: 2,
    minSalary: 5000,
    maxSalary: 10000
  },
  {
    code: "ACCOUNTANT",
    name: "Accountant",
    nameAr: "محاسب",
    level: 2,
    minSalary: 6000,
    maxSalary: 12000
  },
  {
    code: "HR_SPECIALIST",
    name: "HR Specialist",
    nameAr: "أخصائي موارد بشرية",
    level: 2,
    minSalary: 7000,
    maxSalary: 14000
  },
  {
    code: "RECRUITER",
    name: "Recruiter",
    nameAr: "مسؤول توظيف",
    level: 2,
    minSalary: 7000,
    maxSalary: 14000
  },
  {
    code: "OPERATIONS_COORDINATOR",
    name: "Operations Coordinator",
    nameAr: "منسق عمليات",
    level: 2,
    minSalary: 6500,
    maxSalary: 13000
  },
  {
    code: "SOFTWARE_ENGINEER",
    name: "Software Engineer",
    nameAr: "مهندس برمجيات",
    level: 2,
    minSalary: 12000,
    maxSalary: 22000
  },
  {
    code: "PRODUCT_MANAGER",
    name: "Product Manager",
    nameAr: "مدير منتج",
    level: 3,
    minSalary: 15000,
    maxSalary: 26000
  },
  {
    code: "TEAM_MANAGER",
    name: "Team Manager",
    nameAr: "مدير فريق",
    level: 4,
    minSalary: 14000,
    maxSalary: 24000
  },
  {
    code: "HR_MANAGER",
    name: "HR Manager",
    nameAr: "مدير موارد بشرية",
    level: 4,
    minSalary: 15000,
    maxSalary: 26000
  },
  {
    code: "OPERATIONS_MANAGER",
    name: "Operations Manager",
    nameAr: "مدير عمليات",
    level: 4,
    minSalary: 16000,
    maxSalary: 28000
  }
];

export function getCuratedJobTitleCatalog() {
  return curatedJobTitleCatalog.map((item) => ({ ...item }));
}

export function getDefaultJobTitleCodeForUserRole(role?: string | null) {
  switch (role) {
    case "HR_MANAGER":
      return "HR_MANAGER";
    case "MANAGER":
      return "TEAM_MANAGER";
    case "TENANT_ADMIN":
      return "OPERATIONS_MANAGER";
    default:
      return "EMPLOYEE";
  }
}

export async function ensureTenantJobTitleCatalog(
  tenantId: string,
  client: JobTitleCatalogClient = prisma
) {
  const catalog = getCuratedJobTitleCatalog();
  const codes = catalog.map((item) => item.code);

  const existing = await client.jobTitle.findMany({
    where: {
      tenantId,
      code: { in: codes }
    },
    select: {
      code: true
    }
  });

  const existingCodes = new Set(existing.map((item) => item.code));
  const missing = catalog.filter((item) => !existingCodes.has(item.code));

  if (missing.length > 0) {
    await client.jobTitle.createMany({
      data: missing.map((item) => ({
        tenantId,
        code: item.code,
        name: item.name,
        nameAr: item.nameAr,
        level: item.level,
        minSalary: item.minSalary,
        maxSalary: item.maxSalary,
        isActive: true
      })),
      skipDuplicates: true
    });
  }
}
