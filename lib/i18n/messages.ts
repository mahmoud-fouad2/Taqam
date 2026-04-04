import type { AppLocale } from "./types";

export type WebMessageKey =
  | "common.loading"
  | "common.loadingAr"
  | "footer.developedBy"
  | "footer.privacy"
  | "footer.terms"
  | "footer.support"
  | "footer.rights"
  | "footer.stack.ar"
  | "footer.stack.en"
  | "marketing.requestDemo"
  | "marketing.exploreFeatures"
  | "marketing.productTour"
  | "marketing.viewPricing"
  | "marketing.contactUs"
  | "form.submit"
  | "form.submitting"
  | "form.agreePrefix"
  | "form.and"
  | "form.privacyPolicy"
  | "form.terms"
  | "captcha.required"
  | "captcha.missingConfig";

const webMessages: Record<WebMessageKey, { ar: string; en: string }> = {
  "common.loading": { ar: "جاري التحميل…", en: "Loading…" },
  "common.loadingAr": { ar: "جاري التحميل...", en: "Loading..." },

  "footer.developedBy": { ar: "تطوير: ma-fo.info", en: "Developed by ma-fo.info" },
  "footer.privacy": { ar: "سياسة الخصوصية", en: "Privacy" },
  "footer.terms": { ar: "الشروط والأحكام", en: "Terms" },
  "footer.support": { ar: "الدعم", en: "Support" },
  "footer.rights": { ar: "طاقم (Taqam). جميع الحقوق محفوظة.", en: "Taqam. All rights reserved." },
  "footer.stack.ar": { ar: "موارد بشرية • رواتب • حضور • امتثال سعودي", en: "" },
  "footer.stack.en": { ar: "", en: "HR • Payroll • Attendance • Saudi Compliance" },

  "marketing.requestDemo": { ar: "طلب عرض تجريبي", en: "Request a demo" },
  "marketing.exploreFeatures": { ar: "استكشف المميزات", en: "Explore features" },
  "marketing.productTour": { ar: "استعراض النظام", en: "Product tour" },
  "marketing.viewPricing": { ar: "عرض الأسعار", en: "View pricing" },
  "marketing.contactUs": { ar: "تواصل معنا", en: "Contact us" },

  "form.submit": { ar: "إرسال الطلب", en: "Submit request" },
  "form.submitting": { ar: "جاري الإرسال...", en: "Submitting..." },
  "form.agreePrefix": { ar: "بإرسال هذا النموذج، أنت توافق على ", en: "By submitting this form, you agree to the " },
  "form.and": { ar: "و", en: "and " },
  "form.privacyPolicy": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "form.terms": { ar: "شروط الاستخدام", en: "Terms" },

  "captcha.required": { ar: "يرجى إكمال التحقق (reCAPTCHA) قبل الإرسال.", en: "Please complete the reCAPTCHA verification before submitting." },
  "captcha.missingConfig": { ar: "reCAPTCHA غير مُهيأ. تواصل مع الإدارة لإضافة المفاتيح.", en: "reCAPTCHA is not configured. Please contact the admin to add the keys." },
};

export function t(locale: AppLocale, key: WebMessageKey, vars?: Record<string, string | number>): string {
  const template = webMessages[key]?.[locale] ?? webMessages[key]?.en ?? String(key);
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = vars[name];
    return value === undefined || value === null ? "" : String(value);
  });
}
