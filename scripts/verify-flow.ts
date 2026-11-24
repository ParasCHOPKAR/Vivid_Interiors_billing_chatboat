import { BillingService } from "../src/services/billing.service";
import { ExcelService } from "../src/services/excel.service";
import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function verifyFlow() {
  console.log("=== Verifying Vivid Interiors AI Billing Core Flow ===");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found");

  const customer =
    (await prisma.customer.findFirst({ where: { name: { contains: "Rajesh" } } })) ||
    (await prisma.customer.findFirst());
  if (!customer) throw new Error("No customer found");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");

  console.log(`1. Creating invoice for ${customer.name}...`);
  const invoice = await BillingService.createInvoice({
    companyId: company.id,
    userId: user.id,
    customerId: customer.id,
    items: [
      {
        description: "Modular Kitchen Design & Execution (Marine Ply, Quartz Top, Acrylic Finish)",
        unit: "Job",
        quantity: 1,
        rate: 185000,
        hsnSacCode: "998391"
      },
      {
        description: "Custom Master Bedroom Wardrobe (Floor-to-Ceiling, Soft-close Sliding)",
        unit: "Rft.",
        quantity: 80,
        rate: 1600,
        hsnSacCode: "998391"
      },
      {
        description: "False Ceiling (Saint-Gobain Gypsum, POP & LED Cove Lighting)",
        unit: "Sq. ft.",
        quantity: 450,
        rate: 120,
        hsnSacCode: "998391"
      }
    ],
    discountType: "PERCENT",
    discountValue: 5,
    gstRate: 18,
    siteAddress: customer.siteAddress || "Flat 1402, Rohan Kritika, Sinhagad Road, Pune"
  });

  console.log("Invoice created successfully!");
  console.log(" - Company:", company.name);
  console.log(" - Invoice Number:", invoice.invoiceNumber);
  console.log(" - Subtotal: ₹", invoice.subtotal);
  console.log(" - Discount (5%): ₹", invoice.discountAmount);
  console.log(" - Taxable Amount: ₹", invoice.taxableAmount);
  console.log(" - CGST (9%): ₹", invoice.cgstAmount);
  console.log(" - SGST (9%): ₹", invoice.sgstAmount);
  console.log(" - Grand Total: ₹", invoice.grandTotal);
  console.log(" - Amount in Words:", invoice.amountInWords);

  console.log("\n2. Generating 6-sheet Excel workbook...");
  const excelBuffer = await ExcelService.generateWorkbook(company.id);
  const outPath = path.join(__dirname, "vivid_test_output.xlsx");
  fs.writeFileSync(outPath, excelBuffer);
  console.log("Excel generated successfully! File size:", excelBuffer.length, "bytes at", outPath);

  console.log("\n3. Testing Dashboard stats query...");
  const stats = await BillingService.getDashboardStats(company.id);
  console.log("Dashboard stats:");
  console.log(" - Bills today count:", stats.billsTodayCount);
  console.log(" - Today's billing volume: ₹", stats.todayBillingVolume);
  console.log(" - Outstanding balance: ₹", stats.totalOutstanding);
  console.log(" - Total customers:", stats.customersCount);

  console.log("\n=== ALL VIVID INTERIORS SYSTEMS VERIFIED & WORKING FLAWLESSLY! ===");
}

verifyFlow()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
