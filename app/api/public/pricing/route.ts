/**
 * Public Pricing API (For Frontend)
 * GET - Get active pricing plans (no auth required)
 */

import { NextResponse } from "next/server";
import { getPricingData } from "@/lib/marketing/pricing";

// GET active pricing plans for frontend
export async function GET() {
  const { plans, comparison } = await getPricingData();

  return NextResponse.json({
    data: {
      plans,
      comparison
    }
  });
}
