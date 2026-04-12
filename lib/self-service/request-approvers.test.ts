import { describe, expect, it } from "vitest";

import {
  buildAssignedRequestApprovers,
  buildManagedRequestApprovers,
  pickFallbackApprover
} from "@/lib/self-service/request-approvers";

describe("buildManagedRequestApprovers", () => {
  it("uses the direct manager for pending managed requests", () => {
    const approvers = buildManagedRequestApprovers({
      requestStatus: "pending",
      directManager: {
        id: "emp-manager",
        userId: "user-manager",
        firstName: "Mona",
        lastName: "Hassan",
        firstNameAr: "منى",
        lastNameAr: "حسن"
      }
    });

    expect(approvers).toEqual([
      expect.objectContaining({
        id: "user-manager",
        name: "منى حسن",
        role: "المدير المباشر",
        status: "pending"
      })
    ]);
  });

  it("uses the actual resolver when the request was approved by HR", () => {
    const approvers = buildManagedRequestApprovers({
      requestStatus: "approved",
      directManager: {
        id: "emp-manager",
        userId: "user-manager",
        firstName: "Mona",
        lastName: "Hassan"
      },
      resolvedBy: {
        id: "user-hr",
        firstName: "Nour",
        lastName: "Ali",
        role: "HR_MANAGER"
      },
      actionAt: "2025-01-15T10:00:00.000Z"
    });

    expect(approvers).toEqual([
      expect.objectContaining({
        id: "user-hr",
        name: "Nour Ali",
        role: "مدير الموارد البشرية",
        status: "approved",
        actionAt: "2025-01-15T10:00:00.000Z"
      })
    ]);
  });

  it("keeps rejection comments on the approval path", () => {
    const approvers = buildManagedRequestApprovers({
      requestStatus: "rejected",
      fallbackApprover: {
        id: "user-admin",
        firstName: "Omar",
        lastName: "Khaled",
        role: "TENANT_ADMIN"
      },
      rejectionReason: "Missing document"
    });

    expect(approvers[0]?.status).toBe("rejected");
    expect(approvers[0]?.comments).toBe("Missing document");
  });
});

describe("pickFallbackApprover", () => {
  it("prioritizes HR before other fallback approvers and excludes the requester", () => {
    const approver = pickFallbackApprover(
      [
        { id: "manager", firstName: "Manager", lastName: "User", role: "MANAGER" },
        { id: "tenant-admin", firstName: "Tenant", lastName: "Admin", role: "TENANT_ADMIN" },
        { id: "hr", firstName: "HR", lastName: "Lead", role: "HR_MANAGER" }
      ],
      "tenant-admin"
    );

    expect(approver?.id).toBe("hr");
  });
});

describe("buildAssignedRequestApprovers", () => {
  it("maps assignee-based workflows such as tickets", () => {
    const approvers = buildAssignedRequestApprovers({
      requestStatus: "approved",
      assignee: {
        id: "user-support",
        firstName: "Salma",
        lastName: "Yasser",
        role: "TENANT_ADMIN"
      },
      actionAt: "2025-01-20T12:00:00.000Z"
    });

    expect(approvers).toEqual([
      expect.objectContaining({
        id: "user-support",
        role: "مسؤول الشركة",
        status: "approved",
        actionAt: "2025-01-20T12:00:00.000Z"
      })
    ]);
  });
});