import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { mapPayrollPeriod, updatePayrollPeriodStatus } from "@/lib/payroll/periods";
import { z } from "zod";

const payPeriodPaySchema = z.object({
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const rawBody = await request.json().catch(() => ({}));
    const payParsed = payPeriodPaySchema.safeParse(rawBody);
    const body = payParsed.success
      ? payParsed.data
      : { paymentMethod: "", reference: "", notes: "" };
    const noteParts = [
      body.paymentMethod ? `Payment method: ${body.paymentMethod}` : "",
      body.reference ? `Reference: ${body.reference}` : "",
      body.notes ? `${body.notes}` : ""
    ].filter(Boolean);

    const updated = await updatePayrollPeriodStatus({
      tenantId,
      id,
      status: "PAID",
      note: noteParts.join("\n")
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    console.error("Error marking payroll period as paid:", error);
    return NextResponse.json({ error: "Failed to mark payroll period as paid" }, { status: 500 });
  }
}
