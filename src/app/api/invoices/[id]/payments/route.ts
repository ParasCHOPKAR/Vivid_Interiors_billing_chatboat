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
        payments: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingBalance = Math.max(0, invoice.grandTotal - totalPaid);
    const paymentStatus =
      remainingBalance === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

    return NextResponse.json({
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      invoiceAmount: invoice.grandTotal,
      totalPaid,
      remainingBalance,
      paymentStatus,
      payments: invoice.payments
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, paymentDate, method, referenceNo, notes } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    const result = await BillingService.recordPayment(id, {
      amount: parseFloat(amount),
      paymentDate: paymentDate || undefined,
      method: method || "UPI",
      referenceNo: referenceNo || undefined,
      notes: notes || undefined
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("Record payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
