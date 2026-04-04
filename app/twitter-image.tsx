import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1220 0%, #0f172a 100%)",
          position: "relative",
          color: "white",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 25% 35%, rgba(34,197,94,0.20), transparent 45%), radial-gradient(circle at 80% 25%, rgba(59,130,246,0.22), transparent 40%), radial-gradient(circle at 70% 85%, rgba(168,85,247,0.20), transparent 42%)",
          }}
        />

        <div
          style={{
            width: 1040,
            height: 470,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10, 22, 39, 0.75)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 52,
            boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "linear-gradient(90deg, #22c55e, #3b82f6, #a855f7)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>Taqam | طاقم</div>
              <div style={{ fontSize: 18, opacity: 0.85 }}>HR • Payroll • Attendance</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.1 }}>
              HR & Payroll for Saudi businesses
            </div>
            <div style={{ fontSize: 24, opacity: 0.9, maxWidth: 860 }}>
              Employees, attendance, payroll, reports — Arabic/English and multi-tenant.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.75, fontSize: 16 }}>
            <div>taqam.com</div>
            <div>Request a demo</div>
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
