"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  WifiOff,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  clearMobileAuth,
  loadMobileAuth,
  mobileAuthFetch,
  mobileLogoutAll,
} from "@/lib/mobile/web-client";
import { getInitials } from "@/components/mobile/mobile-utils";
import { ProfileSkeleton } from "@/components/mobile/mobile-skeletons";
import { AnimatedPage, AnimatedItem, AnimatedCard } from "@/components/mobile/mobile-animations";

type Profile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  tenant?: { name: string; nameAr: string | null } | null;
  employee?: { employeeNumber: string | null; firstName: string; lastName: string } | null;
};

export default function MobileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const didFetch = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await mobileAuthFetch<{ data: Profile }>("/api/mobile/me");
      setProfile(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      const auth = loadMobileAuth();
      if (!auth) {
        router.replace("/m/login");
        return;
      }
      fetchProfile();
    }
  }, [router, fetchProfile]);

  /* ── Avatar Upload ── */
  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await mobileAuthFetch<{ data: { url: string } }>("/api/mobile/me/avatar", {
        method: "POST",
        body: form,
      });
      if (res.data?.url) {
        setProfile((p) => (p ? { ...p, avatar: res.data.url } : p));
      }
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setAvatarBusy(false);
    }
  }

  /* ── Logout ── */
  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await mobileLogoutAll();
    } catch {
      clearMobileAuth();
    }
    router.replace("/m/login");
  }

  /* Skeleton */
  if (loading) return <ProfileSkeleton />;

  /* Error */
  if (error && !profile) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4" dir="rtl">
        <WifiOff className="size-12 text-slate-200" />
        <p className="text-sm text-slate-400">تعذر تحميل الملف الشخصي</p>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={fetchProfile}>
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const initials = getInitials(profile?.firstName, profile?.lastName);
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "مستخدم";
  const companyName = profile?.tenant?.nameAr || profile?.tenant?.name || "—";

  return (
    <AnimatedPage className="space-y-5 pb-4" dir="rtl">
      {/* Header */}
      <AnimatedItem>
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="الرجوع"
            title="الرجوع"
            className="flex size-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform active:scale-90"
          >
            <ChevronRight className="size-5 text-slate-400" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">الملف الشخصي</h1>
        </div>
      </AnimatedItem>

      {/* Avatar Card */}
      <AnimatedCard>
        <div className="flex flex-col items-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="relative">
            <Avatar className="size-24 ring-4 ring-primary/10">
              <AvatarImage src={profile?.avatar || ""} alt="" />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label="تغيير الصورة الشخصية"
              title="تغيير الصورة الشخصية"
              className="absolute -bottom-1 -left-1 flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 transition active:scale-90"
            >
              {avatarBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              aria-label="اختيار صورة شخصية"
              title="اختيار صورة شخصية"
              className="hidden"
            />
          </div>
          <h2 className="mt-4 text-[17px] font-bold text-slate-800">{fullName}</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">{profile?.email}</p>
        </div>
      </AnimatedCard>

      {/* Info rows */}
      <AnimatedItem>
        <div className="space-y-2">
          <InfoRow icon={<Building2 className="size-[18px] text-slate-400" />} label="الشركة" value={companyName} />
          <InfoRow icon={<Hash className="size-[18px] text-slate-400" />} label="الرقم الوظيفي" value={profile?.employee?.employeeNumber || "—"} />
          <InfoRow icon={<Shield className="size-[18px] text-slate-400" />} label="الدور" value={profile?.role || "—"} />
          <InfoRow icon={<Mail className="size-[18px] text-slate-400" />} label="البريد" value={profile?.email || "—"} />
        </div>
      </AnimatedItem>

      {/* Logout */}
      <AnimatedItem>
        <Button
          variant="outline"
          className="h-12 w-full gap-2 rounded-2xl border-red-100 text-[14px] font-semibold text-red-500 transition-transform active:scale-[0.98] hover:bg-red-50 hover:text-red-600"
          disabled={logoutBusy}
          onClick={handleLogout}
        >
          {logoutBusy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          تسجيل الخروج
        </Button>
      </AnimatedItem>
    </AnimatedPage>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="truncate text-[14px] font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
