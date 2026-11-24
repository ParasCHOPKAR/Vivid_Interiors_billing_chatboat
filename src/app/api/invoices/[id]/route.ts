import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillingService } from "@/services/billing.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        items: {
          orderBy: { sortOrder: "asc" }
        },
        payments: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await BillingService.updateInvoice(id, body);
    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error("Invoice update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await BillingService.deleteInvoice(id);
    return NextResponse.json({ success: true, deletedInvoice: deleted });
  } catch (error: any) {
    console.error("Invoice delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete invoice" }, { status: 500 });
  }
}
