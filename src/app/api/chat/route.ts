import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { calculateBill } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentDraft } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Process NLP via AIService
    const extracted = await AIService.processUserInput(message, currentDraft);

    // 2. Fetch default company
    const company = (await prisma.company.findFirst()) || {
      id: "default-company-001",
      name: "Vivid Interiors",
      stateCode: "27"
    };

    // 3. Match customer in database if name was detected
    let matchedCustomer = null;
    if (extracted.customerName) {
      matchedCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { name: { contains: extracted.customerName } },
            { phone: { contains: extracted.customerName } }
          ]
        }
      });
    }

    // 4. Calculate live bill preview if items exist
    let calculationPreview = null;
    if (extracted.items && extracted.items.length > 0) {
      calculationPreview = calculateBill({
        items: extracted.items,
        discountType: extracted.discountType || "FLAT",
        discountValue: extracted.discountValue || 0,
        gstType: extracted.gstType || "CGST_SGST",
        gstRate: extracted.gstRate !== undefined ? extracted.gstRate : 18,
        supplierStateCode: company.stateCode || "27",
        customerStateCode: matchedCustomer?.stateCode || "27"
      });
    }

    return NextResponse.json({
      success: true,
      extracted,
      matchedCustomer,
      calculationPreview,
      company
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
