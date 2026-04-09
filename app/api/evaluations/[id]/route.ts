import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const evaluationUpdateSchema = z.object({
  evaluatorId: z.string().optional().nullable(),
  // NOTE: Prisma enum `EvaluationStatus` does not include ACKNOWLEDGED.
  // We still accept it here as a backwards-compatible action that only sets `employeeAcknowledgedAt`.
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "PENDING_REVIEW", "COMPLETED", "CANCELLED", "ACKNOWLEDGED"])
    .optional(),
  overallScore: z.number().min(0).max(5).optional().nullable(),
  overallRating: z.string().optional().nullable(),
  scores: z.array(z.object({
    criteriaId: z.string(),
    criteriaName: z.string(),
    score: z.number().min(0).max(5),
    weight: z.number().optional(),
    comment: z.string().optional(),
  })).optional(),
  strengths: z.string().optional().nullable(),
  areasForImprovement: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  employeeComments: z.string().optional().nullable(),
});

type Params = Promise<{ id: string }>;

// GET - Get single evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const evaluation = await prisma.employeeEvaluation.findFirst({
      where: { id, tenantId },
      include: {
        cycle: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            employeeNumber: true,
            avatar: true,
            email: true,
            phone: true,
            hireDate: true,
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } },
            manager: {
              select: {
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
              },
            },
          },
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            avatar: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "التقييم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات التقييم" },
      { status: 500 }
    );
  }
}

// PATCH - Update evaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check evaluation exists
    const existingEvaluation = await prisma.employeeEvaluation.findFirst({
      where: { id, tenantId },
    });

    if (!existingEvaluation) {
      return NextResponse.json(
        { error: "التقييم غير موجود" },
        { status: 404 }
      );
    }

    // Validate
    const validatedData = evaluationUpdateSchema.parse(body);
    const { status, ...restValidated } = validatedData;

    // Calculate overall score from scores if provided
    let calculatedOverallScore = validatedData.overallScore;
    if (validatedData.scores && validatedData.scores.length > 0) {
      const totalWeight = validatedData.scores.reduce((sum, s) => sum + (s.weight || 1), 0);
      const weightedScore = validatedData.scores.reduce(
        (sum, s) => sum + s.score * (s.weight || 1),
        0
      );
      calculatedOverallScore = weightedScore / totalWeight;
    }

    // Determine rating based on score
    let overallRating = validatedData.overallRating;
    if (calculatedOverallScore !== null && calculatedOverallScore !== undefined) {
      if (calculatedOverallScore >= 4.5) overallRating = "ممتاز";
      else if (calculatedOverallScore >= 3.5) overallRating = "جيد جداً";
      else if (calculatedOverallScore >= 2.5) overallRating = "جيد";
      else if (calculatedOverallScore >= 1.5) overallRating = "مقبول";
      else overallRating = "ضعيف";
    }

    // Prepare update data
    const updateData: any = {
      ...restValidated,
      overallScore: calculatedOverallScore,
      overallRating,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (status && status !== "ACKNOWLEDGED") {
      updateData.status = status;
    }

    if (status === "PENDING_REVIEW" && existingEvaluation.status !== "PENDING_REVIEW") {
      updateData.submittedAt = new Date();
    }

    if (status === "COMPLETED") {
      if (!existingEvaluation.submittedAt) {
        updateData.submittedAt = new Date();
      }
      updateData.reviewedAt = new Date();
    }

    if (status === "ACKNOWLEDGED" && !existingEvaluation.employeeAcknowledgedAt) {
      updateData.employeeAcknowledgedAt = new Date();
    }

    // Update evaluation
    const updatedEvaluation = await prisma.employeeEvaluation.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "تم تحديث التقييم بنجاح",
      evaluation: updatedEvaluation,
    });
  } catch (error) {
    console.error("Error updating evaluation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في تحديث التقييم" },
      { status: 500 }
    );
  }
}

// DELETE - Delete evaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية حذف التقييم" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check evaluation exists
    const evaluation = await prisma.employeeEvaluation.findFirst({
      where: { id, tenantId },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "التقييم غير موجود" },
        { status: 404 }
      );
    }

    // Cannot delete evaluations acknowledged by employee
    if (evaluation.employeeAcknowledgedAt) {
      return NextResponse.json(
        { error: "لا يمكن حذف تقييم تم تأكيده من قبل الموظف" },
        { status: 400 }
      );
    }

    // Delete evaluation
    await prisma.employeeEvaluation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "تم حذف التقييم بنجاح",
    });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف التقييم" },
      { status: 500 }
    );
  }
}
