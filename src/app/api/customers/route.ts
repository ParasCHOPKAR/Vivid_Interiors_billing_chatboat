import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { invoices: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Company not found");

    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        billingAddress: body.billingAddress || null,
        siteAddress: body.siteAddress || null,
        city: body.city || "Nagpur",
        state: body.state || "Maharashtra",
        stateCode: body.stateCode || "27",
        gstin: body.gstin || null
      }
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
