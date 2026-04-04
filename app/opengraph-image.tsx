import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
              "radial-gradient(circle at 20% 30%, rgba(34,197,94,0.20), transparent 45%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.22), transparent 40%), radial-gradient(circle at 70% 80%, rgba(168,85,247,0.20), transparent 42%)",
          }}
        />

        <div
          style={{
            width: 1040,
            height: 510,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(10, 22, 39, 0.75)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(90deg, #22c55e, #3b82f6, #a855f7)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1 }}>Taqam | طاقم</div>
              <div style={{ fontSize: 20, opacity: 0.85 }}>HR • Payroll • Attendance</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>
              منصة موارد بشرية ورواتب
            </div>
            <div style={{ fontSize: 26, opacity: 0.9, maxWidth: 820 }}>
              إدارة الموظفين، الحضور، الرواتب، وتقارير احترافية — عربي/إنجليزي ومتعدد الشركات.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              opacity: 0.9,
              fontSize: 18,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                Multi-tenant
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                Saudi-ready
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.25)",
                }}
              >
                Secure
              </div>
            </div>
            <div style={{ opacity: 0.7 }}>taqam.com</div>
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
