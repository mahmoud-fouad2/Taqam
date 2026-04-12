declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(value: string): string;
    convertArabicBack(value: string): string;
  };

  export const PersianShaper: {
    convertArabic(value: string): string;
    convertArabicBack(value: string): string;
  };
}
