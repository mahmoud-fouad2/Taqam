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
};

export function t(lang: AppLanguage, key: keyof typeof dict): string {
  return dict[key][lang];
}

export function humanizeApiError(lang: AppLanguage, message: string): string {
  const m = message || "";

  const map: Array<[string, { ar: string; en: string }]> = [
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