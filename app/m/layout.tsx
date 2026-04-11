import type { Metadata, Viewport } from "next";
import MobileBottomNav from "@/components/mobile/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Taqam",
  description: "Taqam HR Mobile"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc"
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f8fafc]">
      <main className="mx-auto w-full max-w-[430px] px-5 pt-[max(env(safe-area-inset-top),12px)] pb-24">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
