import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/services/billing.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } }
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { customer: true, items: true },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.invoice.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      projectName,
      siteAddress,
      billingAddress,
      invoiceDate,
      items,
      discountType,
      discountValue,
      gstType,
      gstRate,
      paidAmount,
      notes
    } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json({ error: "Customer name and at least one item are required" }, { status: 400 });
    }

    // 1. Get default company & admin user
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Default company not found. Please run database seed.");

    const user = await prisma.user.findFirst({ where: { companyId: company.id } });
    if (!user) throw new Error("Default user not found. Please run database seed.");

    // 2. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { phone: customerPhone || "none" },
          { name: customerName }
        ]
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          name: customerName,
          phone: customerPhone || "9999999999",
          billingAddress: billingAddress || "Local Site",
          siteAddress: siteAddress || "Local Site",
          state: company.state,
          stateCode: company.stateCode
        }
      });
    }

    // 3. Issue invoice atomically
    const invoice = await BillingService.createInvoice({
      companyId: company.id,
      userId: user.id,
      customerId: customer.id,
      items,
      discountType: discountType || "FLAT",
      discountValue: discountValue || 0,
      gstType: gstType || "CGST_SGST",
      gstRate: gstRate !== undefined ? gstRate : 18,
      projectName: projectName || "Turnkey Interior Architecture & Execution",
      siteAddress: siteAddress || customer.siteAddress || undefined,
      invoiceDate: invoiceDate || undefined,
      notes,
      paidAmount: paidAmount || 0
    });

    return NextResponse.json({
      success: true,
      invoice
    });
  } catch (error: any) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
