/**
 * User Profile API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  dataResponse,
  errorResponse,
  logApiError,
  notFoundResponse,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstNameAr: true,
            lastNameAr: true,
            nationalId: true,
            dateOfBirth: true,
            gender: true,
            nationality: true,
            maritalStatus: true,
            address: true,
            emergencyContact: true,
            hireDate: true,
            employmentType: true,
            workLocation: true,
            salaryRecords: {
              orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
              take: 1,
              select: {
                bankName: true,
                bankAccountNumber: true,
                iban: true,
                swiftCode: true
              }
            },
            department: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            },
            jobTitle: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            },
            shift: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true
              }
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            logo: true
          }
        }
      }
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    const employee = user.employee
      ? {
          ...user.employee,
          bankInfo: user.employee.salaryRecords[0]
            ? {
                bankName: user.employee.salaryRecords[0].bankName ?? "",
                accountNumber: user.employee.salaryRecords[0].bankAccountNumber ?? "",
                iban: user.employee.salaryRecords[0].iban ?? undefined,
                swiftCode: user.employee.salaryRecords[0].swiftCode ?? undefined
              }
            : undefined
        }
      : null;

    return dataResponse({ ...user, employee });
  } catch (error) {
    logApiError("Error fetching profile", error);
    return errorResponse("Failed to fetch profile");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const body = await request.json();

    // Only allow updating certain fields on User
    const userUpdateData: any = {};
    if (body.firstName) userUpdateData.firstName = body.firstName;
    if (body.lastName) userUpdateData.lastName = body.lastName;
    if (body.avatar) userUpdateData.avatar = body.avatar;
    if (body.phone) userUpdateData.phone = body.phone;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true
      }
    });

    return dataResponse(user);
  } catch (error) {
    logApiError("Error updating profile", error);
    return errorResponse("Failed to update profile");
  }
}
