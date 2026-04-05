/**
 * NextAuth Configuration & Auth Utilities
 * Credentials-based authentication with Prisma
 */

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  hasRole as roleMatches,
  isSuperAdminRole,
  type LegacyUserRole,
  type TenantDashboardRole,
  type UserRole,
} from "@/lib/access-control";
import { isSuperAdminBootstrapEnabled } from "@/lib/security/bootstrap";
import {
  getTenantAccessIssue,
  getTenantAccessMessage,
  getTenantIssueQueryValue,
  validateTenantAccess,
} from "@/lib/tenant-access";
import { redirect } from "next/navigation";

// ============================================
// NextAuth Configuration
// ============================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
        }

        const normalizedEmail = credentials.email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                slug: true,
                status: true,
                plan: true,
                planExpiresAt: true,
              },
            },
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                avatar: true,
                departmentId: true,
                jobTitleId: true,
              },
            },
          },
        });

        if (!user) {
          // Bootstrap: if DB has zero users, allow creating the first SUPER_ADMIN
          // using Render env vars. This avoids being blocked when seeding isn't run.
          const bootstrapEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
          const bootstrapPassword = process.env.SUPER_ADMIN_PASSWORD;

          if (isSuperAdminBootstrapEnabled() && bootstrapEmail && bootstrapPassword) {
            const usersCount = await prisma.user.count();
            const isBootstrapMatch =
              usersCount === 0 &&
              normalizedEmail === bootstrapEmail &&
              credentials.password === bootstrapPassword;

            if (isBootstrapMatch) {
              const created = await prisma.user.create({
                data: {
                  email: bootstrapEmail,
                  password: await hash(credentials.password, 12),
                  firstName: "Super",
                  lastName: "Admin",
                  role: "SUPER_ADMIN",
                  status: "ACTIVE",
                  permissions: [],
                  lastLoginAt: new Date(),
                },
              });

              await prisma.auditLog.create({
                data: {
                  tenantId: null,
                  userId: created.id,
                  action: "BOOTSTRAP_CREATE_SUPER_ADMIN",
                  entity: "User",
                  entityId: created.id,
                },
              });

              return {
                id: created.id,
                email: created.email,
                firstName: created.firstName,
                lastName: created.lastName,
                avatar: created.avatar,
                role: created.role,
                permissions: created.permissions,
                tenantId: created.tenantId,
                tenant: null,
                employee: null,
              };
            }
          }

          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        // Check if user is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("تم تعليق الحساب مؤقتاً. حاول مرة أخرى لاحقاً");
        }

        // Check user status
        if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
          throw new Error("الحساب معطل. تواصل مع الدعم الفني");
        }

        if (user.status === "PENDING_VERIFICATION") {
          throw new Error("يرجى تأكيد البريد الإلكتروني أولاً");
        }

        // Verify password
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Increment failed attempts
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              // Lock after 5 failed attempts for 30 minutes
              lockedUntil:
                user.failedLoginAttempts >= 4
                  ? new Date(Date.now() + 30 * 60 * 1000)
                  : undefined,
            },
          });
          
          logger.auth("login_failed", credentials.email, {
            reason: "invalid_credentials",
            attempts: user.failedLoginAttempts,
          });
          
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }

        if (!isSuperAdminRole(user.role)) {
          const tenantIssue = getTenantAccessIssue(user.tenantId ? user.tenant : null);
          if (tenantIssue) {
            logger.auth("login_failed", user.id, {
              reason: tenantIssue,
              tenantId: user.tenantId,
            });
            throw new Error(getTenantAccessMessage(tenantIssue, "ar"));
          }
        }

        // Reset failed attempts and update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        // Log successful login
        await prisma.auditLog.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
          },
        });

        logger.auth("login", user.id, {
          tenantId: user.tenantId,
          role: user.role,
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: user.role,
          permissions: user.permissions,
          tenantId: user.tenantId,
          tenant: user.tenant,
          employee: user.employee,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.avatar = user.avatar;
        token.role = user.role;
        token.permissions = user.permissions;
        token.tenantId = user.tenantId;
        token.tenant = user.tenant;
        token.employee = user.employee;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          avatar: token.avatar as string | null,
          role: token.role as string,
          permissions: token.permissions as string[],
          tenantId: token.tenantId as string | null,
          tenant: token.tenant as SessionTenant | null,
          employee: token.employee as SessionEmployee | null,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

// ============================================
// Types
// ============================================

export type { LegacyUserRole, TenantDashboardRole, UserRole } from "@/lib/access-control";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: UserRole;
  permissions: string[];
  tenantId: string | null;
  tenant: SessionTenant | null;
  employee: SessionEmployee | null;
}

export interface SessionTenant {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  status: string;
  plan: string;
  planExpiresAt?: string | Date | null;
}

export interface SessionEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
  avatar: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get current session (server-side)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current user or null
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return (session?.user as SessionUser) ?? null;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

   if (!isSuperAdminRole(user.role)) {
    const tenantAccess = await validateTenantAccess(user.tenantId);
    if (!tenantAccess.ok) {
      redirect(`/support?issue=${getTenantIssueQueryValue(tenantAccess.issue)}`);
    }
  }

  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(
  allowedRoles: LegacyUserRole | readonly LegacyUserRole[]
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!roleMatches(user.role, allowedRoles)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user;
}

/**
 * Require platform admin only.
 */
export async function requirePlatformAdmin(): Promise<SessionUser & { role: "SUPER_ADMIN" }> {
  const user = await requireAuth();

  if (!isSuperAdminRole(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user as SessionUser & { role: "SUPER_ADMIN" };
}

/**
 * Require a tenant-backed workspace and block platform-only users.
 */
export async function requireTenantAccess(): Promise<SessionUser & { tenantId: string }> {
  const user = await requireAuth();

  if (isSuperAdminRole(user.role)) {
    redirect("/dashboard/super-admin");
  }

  if (!user.tenantId) {
    redirect("/select-tenant?next=/dashboard");
  }

  return user as SessionUser & { tenantId: string };
}

/**
 * Require a tenant-backed role for tenant dashboard modules.
 */
export async function requireTenantRole(
  allowedRoles: TenantDashboardRole | readonly TenantDashboardRole[]
): Promise<SessionUser & { role: TenantDashboardRole; tenantId: string }> {
  const user = await requireTenantAccess();

  if (!roleMatches(user.role, allowedRoles)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user as SessionUser & { role: TenantDashboardRole; tenantId: string };
}

/**
 * Check if user is authenticated (without redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Check if user has role (without redirect)
 */
export async function hasRole(allowedRoles: UserRole | readonly UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  return roleMatches(user.role, allowedRoles);
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Auth routes config
 */
export const authRoutes = {
  login: "/login",
  logout: "/api/auth/signout",
  dashboard: "/dashboard",
  unauthorized: "/dashboard?error=unauthorized",
};

export default authOptions;

