# Commercial Taxonomy (Feature Statuses & Claim Gating)

> الهدف: توحيد اللغة والمعايير بين (المنتج ↔ التسويق ↔ البيع) بحيث لا تظهر claims عامة قبل أن تكون capabilities فعلاً جاهزة.

## 1) Feature Status (داخل Feature Catalog)

المصدر: `commercialFeatureStatusSchema` في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)

- `live`
  - الميزة موجودة وقابلة للاستخدام اليومي.
  - مسموح ربطها بـ claims عامة بشرط الالتزام بـ `statusGate: live-only`.

- `beta`
  - الميزة موجودة لكن درجة النضج أقل (قد تحتاج توجيه/ضبط/متابعة).
  - لا تظهر في الأسطح العامة إلا عند استخدام `statusGate: allow-beta` (ويُفضّل أن تكون `visibility: sales-assisted`).

- `gated`
  - الميزة موجودة لكن لا تُفتح للجميع تلقائياً (تتطلب تفعيل/اتفاق/ضبط/قرار تجاري).
  - تُعرض فقط في سياقات `sales-assisted` أو `enterprise-only` ولا يجب أن تكون headline عامة.

- `planned`
  - غير متاحة بعد.
  - لا تُستخدم في claims عامة، ويمكن الإشارة إليها فقط داخلياً (إذا لزم) مع وضع واضح أنها “قيد التخطيط”.

## 2) Claim Status Gate (داخل Claims Registry)

المصدر: `commercialClaimStatusGateSchema` في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)

- `live-only`
  - قاعدة صارمة: كل `linkedFeatureIds` لازم تكون `status: live`.
  - هذا هو الافتراضي لأي surface عامة.

- `allow-beta`
  - يسمح بربط claim بميزات `live` و`beta`.
  - يُستخدم بحذر، ويفضّل ألا يظهر في صفحات عامة إلا مع صياغة واضحة أو مسار Sales-assisted.

- `internal-only`
  - Claim داخلية (للتجارب/التوثيق/الفرق الداخلية).
  - لا تُعرض للزائر العام.

## 3) Claim Visibility (من يظهر له الوعد)

المصدر: `commercialClaimVisibilitySchema` في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)

- `public`: يظهر للجميع في صفحات التسويق العامة.
- `sales-assisted`: يظهر في سياقات يقودها فريق المبيعات/التفعيل.
- `enterprise-only`: يظهر فقط لعملاء المؤسسات أو عند الطلب.

## 4) Integrations Availability

المصدر: `marketingIntegrationAvailabilitySchema` في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)

- `live`: تكامل موجود فعلاً.
- `enterprise-custom`: تكامل مخصص عند الطلب (ليس وعداً عاماً بأنه متاح لكل العملاء).

## 5) Plan Availability

المصدر: `commercialPlanSchema` في [lib/marketing/commercial-registry.ts](../lib/marketing/commercial-registry.ts)

- `starter` / `business` / `enterprise` / `add-on`

## 6) Mapping (للتوافق مع لغة الخطة القديمة)

- **Live** ⟵ `feature.status: live`
- **Partial** ⟵ `feature.status: beta` أو `gated`
- **Planned** ⟵ `feature.status: planned`
- **Enterprise custom** ⟵ `integration.availability: enterprise-custom` أو `claim.visibility: enterprise-only`

## 7) قواعد تشغيلية مختصرة

- أي claim على surfaces عامة يجب أن تكون `visibility: public` و`statusGate: live-only`.
- أي claim تربط ميزات `beta/gated` يجب أن تكون على الأقل `allow-beta` وغالباً `sales-assisted`.
- أي claim جديدة لا تدخل الصفحات العامة قبل إضافتها إلى Feature Catalog وربطها بـ evidence paths واضحة.
