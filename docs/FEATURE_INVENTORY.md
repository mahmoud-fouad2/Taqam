# جدول تدقيق الميزات (Feature Inventory)

> مولّد تلقائياً من lib/marketing/commercial-registry.ts — تاريخ التوليد: 2026-04-13

## ملخص

- إجمالي الميزات: 18

## Features

| ID | Family | Status | Tier | Availability | Claims | Owner | Evidence paths |
| --- | --- | --- | --- | --- | --- | --- | --- |
| analytics.operational-insights | analytics | live | advanced | business, enterprise | 5 | Analytics | /dashboard/analytics, /dashboard/reports |
| analytics.reports-and-exports | analytics | beta | advanced | business, enterprise | 0 | Analytics | /dashboard/reports, /dashboard/payroll-reports, /dashboard/performance-reports |
| attendance.leave-management | attendance | live | core | starter, business, enterprise | 1 | Workflows | /dashboard/leave-requests, /m/requests |
| attendance.time-and-attendance | attendance | live | core | starter, business, enterprise | 7 | Attendance | /dashboard/attendance, /dashboard/shifts, /m/attendance |
| core-hr.employee-management | core-hr | live | core | starter, business, enterprise | 10 | Core HR | /dashboard/employees, /dashboard/departments, /dashboard/job-titles |
| learning.training-academy | learning | beta | advanced | business, enterprise | 0 | Learning | /dashboard/training-courses, /api/training/courses |
| mobile.employee-experience | mobile | live | core | starter, business, enterprise | 4 | Mobile | apps/mobile/app/(tabs), /m |
| payroll.gosi-wps | payroll-compliance | live | core | business, enterprise | 6 | Payroll Compliance | /dashboard/payroll, app/api/payroll/settings/gosi/route.ts, app/api/payroll/periods/[id]/bank-file/route.ts, lib/gosi.ts |
| payroll.saudi-payroll | payroll-compliance | live | core | business, enterprise | 11 | Payroll | /dashboard/payroll, /dashboard/payslips |
| performance.development-plans | performance | beta | advanced | business, enterprise | 0 | Performance | /dashboard/development-plans, /api/performance/goals |
| performance.employee-evaluations | performance | beta | advanced | business, enterprise | 0 | Performance | /dashboard/employee-evaluations, /dashboard/evaluation-templates |
| platform.bilingual-experience | platform | live | core | starter, business, enterprise | 4 | Platform UX | /, /dashboard, apps/mobile |
| platform.data-import-export | platform | live | advanced | starter, business, enterprise | 0 | Platform | /dashboard/import, /dashboard/reports |
| platform.guided-activation | platform | live | advanced | starter, business, enterprise | 2 | Commercial Ops | /request-demo, /register, /dashboard/super-admin/requests, /dashboard/super-admin/tenants/new |
| platform.multi-tenant-workspaces | platform | live | advanced | starter, business, enterprise | 2 | Platform | proxy.ts, /dashboard/super-admin/tenants, lib/tenant.ts |
| platform.roles-audit-logs | platform | live | advanced | business, enterprise | 0 | Security & Compliance | /dashboard/audit-logs, /api/audit-logs |
| recruitment.applicant-tracking | recruitment | live | advanced | business, enterprise | 1 | Recruitment | /dashboard/job-postings, /dashboard/applicants, /dashboard/interviews, /dashboard/job-offers |
| recruitment.company-careers-portal | recruitment | live | differentiator | business, enterprise | 7 | Recruitment | /careers, /dashboard/job-postings, /dashboard/applicants |

---

### ملاحظات

- هذا الملف يُستخدم كـ master sheet مرجعي لمواءمة (المنتج ↔ التسويق) ويُفضّل إعادة توليده بعد أي تعديل على الكاتالوج.
- للتوليد: pnpm exec tsx scripts/export-feature-inventory.ts