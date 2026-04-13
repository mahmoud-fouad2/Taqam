import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  getCommercialClaimsRegistry,
  getCommercialFeatureCatalog
} from "../lib/marketing/commercial-registry";

type InventoryRow = {
  id: string;
  family: string;
  status: string;
  tier: string;
  availability: string;
  claims: number;
  owner: string;
  evidence: string;
};

function escapeTableCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function buildInventoryRows(): InventoryRow[] {
  const features = getCommercialFeatureCatalog();
  const claims = getCommercialClaimsRegistry();

  const claimCountByFeature = new Map<string, number>();
  for (const claim of claims) {
    for (const featureId of claim.linkedFeatureIds) {
      claimCountByFeature.set(featureId, (claimCountByFeature.get(featureId) ?? 0) + 1);
    }
  }

  return features
    .slice()
    .sort((a, b) => {
      const family = a.family.localeCompare(b.family, "en");
      if (family !== 0) return family;
      return a.id.localeCompare(b.id, "en");
    })
    .map((feature) => ({
      id: feature.id,
      family: feature.family,
      status: feature.status,
      tier: feature.commercialTier,
      availability: feature.availability.join(", "),
      claims: claimCountByFeature.get(feature.id) ?? 0,
      owner: feature.owner,
      evidence: feature.evidencePaths.join(", ")
    }));
}

function buildMarkdown(rows: InventoryRow[]) {
  const date = new Date();
  const isoDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

  const lines: string[] = [];

  lines.push("# جدول تدقيق الميزات (Feature Inventory)");
  lines.push("");
  lines.push(
    `> مولّد تلقائياً من lib/marketing/commercial-registry.ts — تاريخ التوليد: ${isoDay}`
  );
  lines.push("");
  lines.push("## ملخص");
  lines.push("");
  lines.push(`- إجمالي الميزات: ${rows.length}`);
  lines.push("");
  lines.push("## Features");
  lines.push("");
  lines.push(
    "| ID | Family | Status | Tier | Availability | Claims | Owner | Evidence paths |"
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  );

  for (const row of rows) {
    lines.push(
      `| ${escapeTableCell(row.id)} | ${escapeTableCell(row.family)} | ${escapeTableCell(
        row.status
      )} | ${escapeTableCell(row.tier)} | ${escapeTableCell(
        row.availability
      )} | ${row.claims} | ${escapeTableCell(row.owner)} | ${escapeTableCell(row.evidence)} |`
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("### ملاحظات");
  lines.push("");
  lines.push(
    "- هذا الملف يُستخدم كـ master sheet مرجعي لمواءمة (المنتج ↔ التسويق) ويُفضّل إعادة توليده بعد أي تعديل على الكاتالوج."
  );
  lines.push(
    "- للتوليد: pnpm exec tsx scripts/export-feature-inventory.ts"
  );

  return lines.join("\n");
}

function main() {
  const rows = buildInventoryRows();
  const outputPath = resolve(process.cwd(), "docs", "FEATURE_INVENTORY.md");

  const markdown = buildMarkdown(rows);
  writeFileSync(outputPath, markdown, "utf8");

  console.log(`[feature inventory] wrote ${outputPath}`);
  console.log(`[feature inventory] rows=${rows.length}`);
}

main();
