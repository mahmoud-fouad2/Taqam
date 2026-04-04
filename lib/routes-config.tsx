type PageRoutesType = {
  title: string;
  items: PageRoutesItemType;
};

type PageRoutesItemType = {
  title: string;
  href: string;
  icon?: string;
  isComing?: boolean;
  items?: PageRoutesItemType;
}[];

export const page_routes: PageRoutesType[] = [
  {
    title: "القائمة الرئيسية",
    items: [
      {
        title: "لوحة التحكم",
        href: "/dashboard",
        icon: "PieChart"
      },
      { title: "المستخدمون", href: "/dashboard/users", icon: "Users" },
      {
        title: "الإعدادات",
        href: "/dashboard/settings",
        icon: "Settings"
      }
    ]
  },
  {
    title: "الموارد البشرية",
    items: [
      {
        title: "الموظفون",
        href: "/dashboard/employees",
        icon: "Users"
      },
      {
        title: "الأقسام",
        href: "/dashboard/departments",
        icon: "Building"
      },
      {
        title: "المسميات الوظيفية",
        href: "/dashboard/job-titles",
        icon: "Briefcase"
      },
      {
        title: "الهيكل التنظيمي",
        href: "/dashboard/organization",
        icon: "Building2"
      },
      {
        title: "المستندات",
        href: "/dashboard/documents",
        icon: "FileText"
      },
      {
        title: "استيراد البيانات",
        href: "/dashboard/import",
        icon: "Upload"
      }
    ]
  },
  {
    title: "الحضور والانصراف",
    items: [
      {
        title: "الحضور اليومي",
        href: "/dashboard/attendance",
        icon: "Clock"
      },
      {
        title: "الورديات",
        href: "/dashboard/shifts",
        icon: "Calendar"
      },
      {
        title: "الطلبات",
        href: "/dashboard/requests",
        icon: "FileCheck"
      },
      {
        title: "التقويم",
        href: "/dashboard/calendar",
        icon: "CalendarDays"
      },
      {
        title: "التقارير",
        href: "/dashboard/reports",
        icon: "BarChart"
      }
    ]
  },
  {
    title: "الإجازات",
    items: [
      {
        title: "أنواع الإجازات",
        href: "/dashboard/leave-types",
        icon: "ListDetails"
      },
      {
        title: "طلبات الإجازات",
        href: "/dashboard/leave-requests",
        icon: "FileCheck"
      },
      {
        title: "أرصدة الإجازات",
        href: "/dashboard/leave-balances",
        icon: "Scale"
      },
      {
        title: "تقويم الإجازات",
        href: "/dashboard/leave-calendar",
        icon: "CalendarEvent"
      }
    ]
  },
  {
    title: "الرواتب والمسيرات",
    items: [
      {
        title: "هياكل الرواتب",
        href: "/dashboard/salary-structures",
        icon: "DollarSign"
      },
      {
        title: "مسير الرواتب",
        href: "/dashboard/payroll",
        icon: "Wallet"
      },
      {
        title: "قسائم الرواتب",
        href: "/dashboard/payslips",
        icon: "Receipt"
      },
      {
        title: "تقارير الرواتب",
        href: "/dashboard/payroll-reports",
        icon: "TrendingUp"
      },
      {
        title: "القروض والسلف",
        href: "/dashboard/loans",
        icon: "CreditCard"
      }
    ]
  },
  {
    title: "التقييم والأداء",
    items: [
      {
        title: "نماذج التقييم",
        href: "/dashboard/evaluation-templates",
        icon: "ClipboardList"
      },
      {
        title: "أهداف الأداء",
        href: "/dashboard/performance-goals",
        icon: "Target"
      },
      {
        title: "تقييمات الموظفين",
        href: "/dashboard/employee-evaluations",
        icon: "ClipboardCheck"
      },
      {
        title: "تقارير الأداء",
        href: "/dashboard/performance-reports",
        icon: "TrendingUp"
      }
    ]
  },
  {
    title: "التوظيف والتعيين",
    items: [
      {
        title: "الوظائف الشاغرة",
        href: "/dashboard/job-postings",
        icon: "Briefcase"
      },
      {
        title: "المتقدمون",
        href: "/dashboard/applicants",
        icon: "Users"
      },
      {
        title: "العروض الوظيفية",
        href: "/dashboard/job-offers",
        icon: "FileText"
      },
      {
        title: "المقابلات",
        href: "/dashboard/interviews",
        icon: "Calendar"
      },
      {
        title: "إلحاق الموظفين",
        href: "/dashboard/onboarding",
        icon: "UserPlus"
      }
    ]
  },
  {
    title: "التدريب والتطوير",
    items: [
      {
        title: "الدورات التدريبية",
        href: "/dashboard/training-courses",
        icon: "Book"
      },
      {
        title: "تسجيلات التدريب",
        href: "/dashboard/training-enrollments",
        icon: "Users"
      },
      {
        title: "خطط التطوير",
        href: "/dashboard/development-plans",
        icon: "Target"
      }
    ]
  },
  {
    title: "الخدمة الذاتية",
    items: [
      {
        title: "ملفي الشخصي",
        href: "/dashboard/my-profile",
        icon: "User"
      },
      {
        title: "طلباتي",
        href: "/dashboard/my-requests",
        icon: "FileText"
      },
      {
        title: "الإشعارات",
        href: "/dashboard/notifications",
        icon: "Bell"
      }
    ]
  },
  {
    title: "التقارير والتحليلات",
    items: [
      {
        title: "التحليلات",
        href: "/dashboard/analytics",
        icon: "BarChart3"
      }
    ]
  },
  {
    title: "الإعدادات المتقدمة",
    items: [
      {
        title: "إعدادات النظام",
        href: "/dashboard/settings-advanced",
        icon: "Settings"
      }
    ]
  },
  {
    title: "Super Admin",
    items: [
      {
        title: "إدارة الشركات",
        href: "/dashboard/super-admin",
        icon: "Building2"
      },
      {
        title: "قائمة الشركات",
        href: "/dashboard/super-admin/tenants",
        icon: "Building2"
      },
      {
        title: "طلبات الاشتراك",
        href: "/dashboard/super-admin/requests",
        icon: "Inbox"
      }
    ]
  }
];
