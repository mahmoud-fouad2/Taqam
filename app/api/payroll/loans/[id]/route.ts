import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { getScopedLoan, mapLoan } from "@/lib/payroll/loans";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { id } = await params;
    const result = await getScopedLoan({
      tenantId,
      loanId: id,
      userId: session.user.id,
      role: session.user.role
    });

    if (!("loan" in result)) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.status });
    }

    if (!result.loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapLoan(result.loan) });
  } catch (error) {
    console.error("Error fetching payroll loan:", error);
    return NextResponse.json({ error: "Failed to fetch payroll loan" }, { status: 500 });
  }
}
