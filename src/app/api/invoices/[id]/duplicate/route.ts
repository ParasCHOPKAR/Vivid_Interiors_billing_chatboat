import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const duplicated = await BillingService.duplicateInvoice(id);
    return NextResponse.json({ success: true, invoice: duplicated });
  } catch (error: any) {
    console.error("Duplicate invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to duplicate invoice" },
      { status: 500 }
    );
  }
}
