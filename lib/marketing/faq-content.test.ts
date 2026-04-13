import { describe, expect, it } from "vitest";

import { faqCategories } from "@/lib/marketing/faq";

function assertUnique(values: string[], label: string) {
  const set = new Set(values);
  expect(set.size, `${label} should be unique`).toBe(values.length);
}

describe("marketing FAQ content", () => {
  it("ships non-empty categories and questions", () => {
    expect(faqCategories.length).toBeGreaterThan(0);

    assertUnique(
      faqCategories.map((cat) => cat.titleEn),
      "faq category titleEn"
    );

    const allQuestionsAr: string[] = [];
    const allQuestionsEn: string[] = [];

    for (const category of faqCategories) {
      expect(category.emoji.trim().length, `${category.titleEn}.emoji`).toBeGreaterThan(0);
      expect(category.titleAr.trim().length, `${category.titleEn}.titleAr`).toBeGreaterThan(0);
      expect(category.titleEn.trim().length, `${category.titleEn}.titleEn`).toBeGreaterThan(0);
      expect(category.faqs.length, `${category.titleEn}.faqs`).toBeGreaterThan(0);

      for (const faq of category.faqs) {
        expect(faq.qAr.trim().length, `${category.titleEn}.qAr`).toBeGreaterThan(0);
        expect(faq.qEn.trim().length, `${category.titleEn}.qEn`).toBeGreaterThan(0);
        expect(faq.aAr.trim().length, `${category.titleEn}.aAr`).toBeGreaterThan(0);
        expect(faq.aEn.trim().length, `${category.titleEn}.aEn`).toBeGreaterThan(0);

        allQuestionsAr.push(faq.qAr.trim());
        allQuestionsEn.push(faq.qEn.trim());
      }
    }

    assertUnique(allQuestionsAr, "faq questions (ar)");
    assertUnique(allQuestionsEn, "faq questions (en)");
  });
});
