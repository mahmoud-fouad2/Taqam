export type MarketingNavItem = {
  href: string;
  labelAr: string;
  labelEn: string;
  children?: { href: string; labelAr: string; labelEn: string; descAr?: string; descEn?: string }[];
};

export const marketingNav: MarketingNavItem[] = [
  { href: "/", labelAr: "الرئيسية", labelEn: "Home" },
  { href: "/features", labelAr: "المميزات", labelEn: "Features" },
  { href: "/careers", labelAr: "الوظائف", labelEn: "Careers" },
  { href: "/pricing", labelAr: "الأسعار", labelEn: "Pricing" },
  { href: "/plans", labelAr: "الباقات", labelEn: "Plans" },
  { href: "/screenshots", labelAr: "استعراض النظام", labelEn: "Product Tour" },
  {
    href: "/help-center",
    labelAr: "المساعدة",
    labelEn: "Help",
    children: [
      { href: "/help-center", labelAr: "مركز المساعدة", labelEn: "Help Center", descAr: "أدلة الاستخدام والإعداد السريع", descEn: "Usage guides and quick setup" },
      { href: "/faq", labelAr: "الأسئلة الشائعة", labelEn: "FAQ", descAr: "إجابات على الأسئلة الأكثر شيوعًا", descEn: "Answers to common questions" },
      { href: "/support", labelAr: "تواصل معنا", labelEn: "Contact Support", descAr: "أرسل لنا رسالة مباشرة", descEn: "Send us a direct message" },
    ],
  },
];
