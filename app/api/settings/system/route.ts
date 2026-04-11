import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

type SystemSettings = {
  general: {
    companyName: string;
    companyNameEn?: string;
    companyLogo?: string;
    timezone: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
    currency: string;
    fiscalYearStart: string;
    weekStartDay: 0 | 1 | 5 | 6;
  };
  localization: {
    defaultLanguage: "ar" | "en";
    supportedLanguages: Array<"ar" | "en">;
    direction: "rtl" | "ltr";
    numberFormat: string;
    calendarType: "gregorian" | "hijri" | "both";
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
      preventReuse: number;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: "disabled" | "optional" | "required";
    ipWhitelist: string[];
    auditLogging: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultChannels: Array<"email" | "sms" | "push" | "in-app">;
    digestFrequency: "immediate" | "hourly" | "daily" | "weekly";
  };
  integrations: {
    gosi: { enabled: boolean; subscriberNumber?: string; lastSync?: string; autoSync: boolean };
    mol: { enabled: boolean; establishmentNumber?: string; lastSync?: string; autoSync: boolean };
    muqeem: { enabled: boolean; username?: string; lastSync?: string; autoSync: boolean };
    mudad: { enabled: boolean; organizationId?: string; lastSync?: string; autoSync: boolean };
    erpIntegrations: Array<{
      id: string;
      name: string;
      type: "sap" | "oracle" | "odoo" | "custom";
      status: "connected" | "disconnected" | "error";
      lastSync?: string;
      config?: Record<string, unknown>;
    }>;
  };
  backup: {
    autoBackup: boolean;
    frequency: "daily" | "weekly" | "monthly";
    retentionDays: number;
    includeAttachments: boolean;
    lastBackup?: string;
    nextBackup?: string;
  };
};

function defaultSystemSettings(input: {
  timezone: string;
  currency: string;
  weekStartDay: number;
  tenantName: string;
}): SystemSettings {
  const weekStartDay =
    input.weekStartDay === 0 ||
    input.weekStartDay === 1 ||
    input.weekStartDay === 5 ||
    input.weekStartDay === 6
      ? (input.weekStartDay as 0 | 1 | 5 | 6)
      : 0;

  return {
    general: {
      companyName: input.tenantName,
      companyNameEn: input.tenantName,
      timezone: input.timezone || "Asia/Riyadh",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
      currency: input.currency || "SAR",
      fiscalYearStart: "01-01",
      weekStartDay
    },
    localization: {
      defaultLanguage: "ar",
      supportedLanguages: ["ar", "en"],
      direction: "rtl",
      numberFormat: "ar-SA",
      calendarType: "both"
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expiryDays: 90,
        preventReuse: 3
      },
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      twoFactorAuth: "optional",
      ipWhitelist: [],
      auditLogging: true
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      defaultChannels: ["email", "in-app"],
      digestFrequency: "immediate"
    },
    integrations: {
      gosi: { enabled: false, autoSync: false },
      mol: { enabled: false, autoSync: false },
      muqeem: { enabled: false, autoSync: false },
      mudad: { enabled: false, autoSync: false },
      erpIntegrations: []
    },
    backup: {
      autoBackup: false,
      frequency: "daily",
      retentionDays: 30,
      includeAttachments: true
    }
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        timezone: true,
        currency: true,
        weekStartDay: true,
        settings: true
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const settingsObj =
      tenant.settings && typeof tenant.settings === "object" ? (tenant.settings as any) : {};
    const existing = settingsObj?.systemSettings as SystemSettings | undefined;

    const systemSettings =
      existing ??
      defaultSystemSettings({
        tenantName: tenant.name,
        timezone: tenant.timezone,
        currency: tenant.currency,
        weekStartDay: tenant.weekStartDay
      });

    if (!existing) {
      const nextSettings = { ...settingsObj, systemSettings };
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          settings: nextSettings as unknown as Prisma.InputJsonValue
        }
      });
    }

    return NextResponse.json({ data: systemSettings });
  } catch (e) {
    console.error("GET /api/settings/system failed:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const systemSettings = body?.settings as SystemSettings | undefined;

    if (!systemSettings?.general?.companyName) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settingsObj =
      tenant?.settings && typeof tenant.settings === "object" ? (tenant.settings as any) : {};
    const nextSettings = { ...settingsObj, systemSettings };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        timezone: systemSettings.general.timezone,
        currency: systemSettings.general.currency,
        weekStartDay: Number(systemSettings.general.weekStartDay),
        settings: nextSettings as unknown as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ data: systemSettings });
  } catch (e) {
    console.error("PUT /api/settings/system failed:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
