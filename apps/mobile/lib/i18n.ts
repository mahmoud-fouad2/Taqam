import type { AppLanguage } from "@/lib/settings-storage";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  login_title: { ar: "أهلاً بك في طاقم", en: "Welcome to Taqam" },
  login_subtitle: { ar: "سجل الدخول للمتابعة", en: "Sign in to continue" },
  email_label: { ar: "البريد الإلكتروني", en: "Email" },
  password_label: { ar: "كلمة المرور", en: "Password" },
  sign_in: { ar: "تسجيل الدخول", en: "Sign in" },
  dev_base_url_hint: { ar: "أثناء التطوير: اضبط EXPO_PUBLIC_API_BASE_URL على عنوان السيرفر. في بناء الإنتاج سيُستخدم https://taqam.net افتراضيًا إذا لم تضبط قيمة صريحة.", en: "In development, set EXPO_PUBLIC_API_BASE_URL to your server URL. Production builds fall back to https://taqam.net if no explicit value is provided." },

  attendance_title: { ar: "الحضور", en: "Attendance" },
  attendance_subtitle: { ar: "تسجيل حضور/انصراف مع تحقق الموقع (Geofence) من السيرفر.", en: "Check in/out with server-side geofence validation." },
  today: { ar: "حالة اليوم", en: "Today" },
  loading: { ar: "جارٍ التحميل...", en: "Loading..." },
  check_in: { ar: "تسجيل حضور", en: "Check in" },
  check_out: { ar: "تسجيل انصراف", en: "Check out" },
  status_none: { ar: "لم يتم تسجيل حضور اليوم", en: "Not checked in today" },
  status_checked_in: { ar: "تم تسجيل الحضور", en: "Checked in" },
  status_checked_out: { ar: "تم تسجيل الانصراف", en: "Checked out" },
  last_check_in: { ar: "آخر حضور", en: "Last check-in" },
  last_check_out: { ar: "آخر انصراف", en: "Last check-out" },
  refresh: { ar: "تحديث", en: "Refresh" },

  location_required: { ar: "الموقع مطلوب لتسجيل الحضور", en: "Location is required" },
  location_services_off: { ar: "خدمات الموقع (GPS) مغلقة", en: "Location services are off" },
  open_settings: { ar: "فتح الإعدادات", en: "Open settings" },
  try_again: { ar: "حاول مرة أخرى", en: "Try again" },

  history_title: { ar: "سجل الحضور", en: "My attendance" },
  empty_history: { ar: "لا توجد سجلات بعد", en: "No records yet" },
  last_7_days: { ar: "آخر 7 أيام", en: "Last 7 days" },
  last_30_days: { ar: "آخر 30 يوم", en: "Last 30 days" },
  last_90_days: { ar: "آخر 90 يوم", en: "Last 90 days" },
  load_more: { ar: "تحميل المزيد", en: "Load more" },
  no_more: { ar: "لا يوجد المزيد", en: "No more" },

  // Requests / Leaves
  my_requests_title: { ar: "طلباتي", en: "My requests" },
  no_requests: { ar: "لا توجد طلبات بعد", en: "No requests yet" },
  new_ticket_title: { ar: "تذكرة دعم جديدة", en: "New support ticket" },
  ticket_subject_label: { ar: "الموضوع", en: "Subject" },
  ticket_desc_label: { ar: "التفاصيل", en: "Details" },
  ticket_subject_ph: { ar: "موضوع التذكرة...", en: "Ticket subject..." },
  ticket_desc_ph: { ar: "اشرح مشكلتك أو استفسارك...", en: "Describe your issue or question..." },
  submit: { ar: "إرسال", en: "Submit" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  filter_all: { ar: "الكل", en: "All" },
  filter_leave: { ar: "إجازات", en: "Leaves" },
  filter_ticket: { ar: "تذاكر", en: "Tickets" },
  filter_training: { ar: "تدريب", en: "Training" },
  type_leave: { ar: "إجازة", en: "Leave" },
  type_ticket: { ar: "تذكرة دعم", en: "Support ticket" },
  type_training: { ar: "تدريب", en: "Training" },
  status_pending: { ar: "قيد المراجعة", en: "Pending" },
  status_approved: { ar: "موافق عليه", en: "Approved" },
  status_rejected: { ar: "مرفوض", en: "Rejected" },
  status_cancelled: { ar: "ملغي", en: "Cancelled" },
  submit_success: { ar: "✓ تم إرسال طلبك بنجاح!", en: "✓ Request submitted successfully!" },

  // Profile
  profile_title: { ar: "ملفي الشخصي", en: "My profile" },
  email_info_label: { ar: "البريد الإلكتروني", en: "Email" },
  role_info_label: { ar: "الدور الوظيفي", en: "Role" },
  company_info_label: { ar: "الشركة", en: "Company" },
  language_section_title: { ar: "اللغة", en: "Language" },
  lang_ar: { ar: "🇸🇦 العربية", en: "🇸🇦 Arabic" },
  lang_en: { ar: "🇬🇧 English", en: "🇬🇧 English" },
  restart_required: { ar: "سيُعاد تحميل التطبيق لتطبيق اتجاه الكتابة.", en: "The app will reload to apply text direction." },
  signout_confirm_title: { ar: "تسجيل الخروج", en: "Sign out" },
  signout_confirm_msg: { ar: "هل أنت متأكد من تسجيل الخروج؟", en: "Are you sure you want to sign out?" },
  confirm: { ar: "تأكيد", en: "Confirm" },

  settings_title: { ar: "الإعدادات", en: "Settings" },
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  logout_all: { ar: "تسجيل الخروج من كل الأجهزة", en: "Sign out from all devices" },
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "English", en: "English" },

  // Settings screen: Biometrics
  security_verification: { ar: "الأمان والتحقق", en: "Security and verification" },
  biometric_confirm: { ar: "تأكيد الحضور بالبصمة", en: "Biometric attendance confirmation" },
  biometric_loading: { ar: "جارٍ فحص البصمة على هذا الجهاز...", en: "Checking biometric support on this device..." },
  biometric_enabled: { ar: "البصمة مفعلة لتأكيد الحضور والانصراف.", en: "Biometrics are enabled for attendance confirmation." },
  biometric_available: { ar: "البصمة متاحة لكن معطلة من إعدادات التطبيق.", en: "Biometrics are available but disabled in app settings." },
  biometric_not_enrolled: { ar: "الجهاز يدعم البصمة لكن لا توجد بصمة أو وجه مسجلان عليه.", en: "This device supports biometrics, but none are enrolled." },
  biometric_unsupported: { ar: "هذا الجهاز لا يدعم المصادقة الحيوية.", en: "This device does not support biometric authentication." },

  // Settings screen: Session
  session_section: { ar: "الجلسة", en: "Session" },
  not_signed_in: { ar: "غير مسجل الدخول", en: "Not signed in" },

  // Settings screen: Diagnostics
  runtime_diagnostics: { ar: "تشخيص التشغيل", en: "Runtime diagnostics" },
  app_version_label: { ar: "إصدار التطبيق", en: "App version" },
  package_id_label: { ar: "معرّف الحزمة", en: "Package ID" },
  api_url_label: { ar: "عنوان الخادم", en: "API base URL" },
  config_source_label: { ar: "مصدر الإعداد", en: "Config source" },
  config_source_env: { ar: "ملف البيئة EXPO_PUBLIC_API_BASE_URL", en: "EXPO_PUBLIC_API_BASE_URL" },
  config_source_default: { ar: "الافتراضي الإنتاجي المدمج (taqam.net)", en: "Built-in production default (taqam.net)" },
  config_source_fallback: { ar: "Fallback محلي مؤقت", en: "Temporary localhost fallback" },
  config_warning_localhost: { ar: "هذا البناء ما زال يعتمد على localhost كاحتياط. اضبط EXPO_PUBLIC_API_BASE_URL قبل مشاركة التطبيق خارج جهاز التطوير.", en: "This build is still using localhost as a fallback. Set EXPO_PUBLIC_API_BASE_URL before sharing the app outside the dev machine." },
  config_ok_explicit: { ar: "التطبيق مربوط حاليًا بعنوان خادم صريح ويمكن مراجعته من هذه الشاشة.", en: "The app is currently wired to an explicit backend URL visible on this screen." },

  // Attendance screen
  greeting: { ar: "مرحبًا", en: "Welcome" },
  geofence_note: { ar: "🔒 إذا كان نظام Geofence مفعلاً، التسجيل خارج مواقع العمل سيتم رفضه.", en: "🔒 If geofence is enabled, check-ins outside allowed locations will be rejected." },
  biometric_prompt_checkin: { ar: "تأكيد البصمة لتسجيل الحضور", en: "Confirm biometrics to check in" },
  biometric_prompt_checkout: { ar: "تأكيد البصمة لتسجيل الانصراف", en: "Confirm biometrics to check out" },
  biometric_failed: { ar: "لم يتم تأكيد البصمة", en: "Biometric verification failed" },
  challenge_failed: { ar: "فشل إنشاء التحدي", en: "Failed to create challenge" },
  checked_in_msg: { ar: "تم تسجيل الحضور", en: "Checked in" },
  checked_out_msg: { ar: "تم تسجيل الانصراف", en: "Checked out" },

  // Leaves screen
  new_request: { ar: "طلب جديد", en: "New request" },
  leave_request: { ar: "طلب إجازة", en: "Leave request" },
  leave_type_label: { ar: "نوع الإجازة", en: "Leave type" },
  no_leave_types: { ar: "لا توجد أنواع إجازات", en: "No leave types available" },
  leave_annual: { ar: "سنوية، مرضية، بدون راتب...", en: "Annual, sick, unpaid..." },
  support_ticket: { ar: "تذكرة دعم", en: "Support ticket" },
  support_ticket_sub: { ar: "استفسار أو مشكلة", en: "Question or issue" },
  fill_all_fields: { ar: "الرجاء ملء جميع الحقول", en: "Please fill all fields" },
  select_leave_type: { ar: "يرجى اختيار نوع الإجازة", en: "Please select a leave type" },
  end_after_start: { ar: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء", en: "End date must be after start date" },
  start_date_label: { ar: "تاريخ البدء", en: "Start date" },
  end_date_label: { ar: "تاريخ الانتهاء", en: "End date" },
  reason_label: { ar: "السبب (اختياري)", en: "Reason (optional)" },
  reason_placeholder: { ar: "سبب الإجازة...", en: "Reason for leave..." },
  back: { ar: "رجوع", en: "Back" },

  // More screen
  more_title: { ar: "المزيد", en: "More" },
  payslips_title: { ar: "كشوف الرواتب", en: "Payslips" },
  no_payslips: { ar: "لا توجد كشوف رواتب", en: "No payslips found" },
  basic_salary: { ar: "الأساسي", en: "Basic" },
  total_earnings: { ar: "الاستحقاقات", en: "Earnings" },
  total_deductions: { ar: "الخصومات", en: "Deductions" },
  net_salary: { ar: "الصافي", en: "Net Salary" },
  payment_date: { ar: "تاريخ الدفع", en: "Payment date" },

  // Approvals
  approvals_title: { ar: "الموافقات", en: "Approvals" },
  no_pending_approvals: { ar: "لا توجد طلبات معلقة", en: "No pending approvals" },
  approve: { ar: "موافقة", en: "Approve" },
  reject: { ar: "رفض", en: "Reject" },
  approved_success: { ar: "تمت الموافقة ✓", en: "Approved ✓" },
  rejected_success: { ar: "تم الرفض", en: "Rejected" },
  rejection_reason: { ar: "سبب الرفض", en: "Rejection reason" },
  optional: { ar: "اختياري", en: "Optional" },

  // Notifications
  notifications_title: { ar: "الإشعارات", en: "Notifications" },
  no_notifications: { ar: "لا توجد إشعارات", en: "No notifications yet" },
  mark_all_read: { ar: "قراءة الكل", en: "Mark all read" },
  just_now: { ar: "الآن", en: "Just now" },

  // Dashboard
  leave_balances: { ar: "رصيد الإجازات", en: "Leave Balances" },
  pending_requests: { ar: "طلبات معلقة", en: "Pending" },
  need_approval: { ar: "بانتظار موافقتك", en: "Need approval" },
  home: { ar: "الرئيسية", en: "Home" },

  // Profile screen
  account_info: { ar: "معلومات الحساب", en: "Account info" },
  signout_all_confirm_msg: { ar: "سيتم تسجيل خروجك من جميع الأجهزة. هل أنت متأكد؟", en: "You will be signed out from all devices. Are you sure?" },
  copyright: { ar: "© 2025 طاقم. جميع الحقوق محفوظة.", en: "© 2025 Taqam. All rights reserved." },
};

export function t(lang: AppLanguage, key: keyof typeof dict): string {
  return dict[key][lang];
}

export function humanizeApiError(lang: AppLanguage, message: string): string {
  const m = message || "";

  const map: Array<[string, { ar: string; en: string }]> = [
    ["مخصص للموظفين", { ar: "هذا التطبيق مخصص للموظفين فقط", en: "This app is for employees only" }],
    ["employees only", { ar: "هذا التطبيق مخصص للموظفين فقط", en: "This app is for employees only" }],
    ["Account is temporarily locked", { ar: "الحساب مقفل مؤقتاً، حاول بعد 30 دقيقة", en: "Account temporarily locked, try again in 30 min" }],
    ["Account is disabled", { ar: "الحساب موقوف", en: "Account is disabled" }],
    ["Unauthorized", { ar: "غير مصرح", en: "Unauthorized" }],
    ["Missing device", { ar: "بيانات الجهاز غير متاحة", en: "Device info missing" }],
    ["Device mismatch", { ar: "الجهاز غير مطابق", en: "Device mismatch" }],
    ["Challenge required", { ar: "مطلوب تحدي أمني", en: "Security challenge required" }],
    ["Invalid challenge", { ar: "تحدي غير صالح", en: "Invalid challenge" }],
    ["Tenant required", { ar: "بيانات الشركة غير متاحة", en: "Tenant required" }],
    ["Employee context required", { ar: "بيانات الموظف غير متاحة", en: "Employee context required" }],
    ["Location is required for attendance", { ar: "الموقع مطلوب لتسجيل الحضور", en: "Location is required" }],
    ["Location permission is required", { ar: "مطلوب إذن الموقع", en: "Location permission is required" }],
    ["Location services are off", { ar: "خدمات الموقع (GPS) مغلقة", en: "Location services are off" }],
    ["Location accuracy is too low", { ar: "دقة GPS ضعيفة، حاول مرة أخرى", en: "GPS accuracy is too low" }],
    ["Outside allowed work location", { ar: "أنت خارج نطاق مواقع العمل المسموحة", en: "Outside allowed work locations" }],
    ["Already checked in today", { ar: "تم تسجيل الحضور بالفعل اليوم", en: "Already checked in today" }],
    ["Already checked out today", { ar: "تم تسجيل الانصراف بالفعل اليوم", en: "Already checked out today" }],
    ["Must check in first", { ar: "يجب تسجيل الحضور أولاً", en: "You must check in first" }],
    ["Invalid input", { ar: "بيانات غير صالحة", en: "Invalid input" }],
    ["invalid_payload", { ar: "بيانات غير صالحة", en: "Invalid input" }],
    ["invalid payload", { ar: "بيانات غير صالحة", en: "Invalid input" }],
    ["Validation", { ar: "خطأ في البيانات المدخلة", en: "Validation error" }],
    ["credentials", { ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة", en: "Incorrect email or password" }],
    ["not found", { ar: "البيانات غير موجودة", en: "Not found" }],
    ["Network", { ar: "لا يوجد اتصال بالإنترنت", en: "Network error" }],
    ["fetch", { ar: "تعذّر الاتصال بالسيرفر", en: "Could not reach server" }],
  ];

  const found = map.find(([needle]) => m.includes(needle));
  if (found) return found[1][lang];

  return lang === "ar" ? (m || "حدث خطأ") : (m || "Something went wrong");
}
export function tStr(lang: AppLanguage, ar: string, en: string): string {
  return lang === "ar" ? ar : en;
}