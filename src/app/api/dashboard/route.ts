import { NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const stats = await BillingService.getDashboardStats(company.id);

    return NextResponse.json({
      success: true,
      company,
      stats
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}
