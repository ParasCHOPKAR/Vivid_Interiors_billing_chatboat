import { NextResponse } from "next/server";
import { ExcelService } from "@/services/excel.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const excelBuffer = await ExcelService.generateWorkbook(company.id);

    const year = new Date().getFullYear();
    const filename = `Interior_Billing_${year}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store"
      }
    });
  } catch (error: any) {
    console.error("Excel generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate Excel report" }, { status: 500 });
  }
}
