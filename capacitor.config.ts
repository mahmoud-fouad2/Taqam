import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAP_SERVER_URL;
const isHttp = typeof serverUrl === "string" && /^http:\/\//i.test(serverUrl);

const config: CapacitorConfig = {
  // Keep the package identifier stable until a coordinated app-id migration is planned.
  appId: "com.ujoor.app",
  appName: "Taqam",
  // This project is a Next.js app (not statically exportable because of API routes/DB/auth).
  // For APK testing we typically point the Android WebView at a running server.
  webDir: "public",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          // Allow http:// for LAN testing. Use https in production.
          cleartext: isHttp,
        },
      }
    : {}),
};

export default config;
