import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export class ExcelService {
  /**
   * Generates comprehensive 6-sheet billing workbook
   */
  static async generateWorkbook(companyId: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Vivid Interiors Studio";
    workbook.lastModifiedBy = "Vivid Interiors AI Billing";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Fetch all related data
    const [company, invoices, customers, items, payments] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.invoice.findMany({
        where: { companyId },
        include: { customer: true },
        orderBy: { invoiceDate: "desc" }
      }),
      prisma.customer.findMany({
        where: { companyId },
        orderBy: { name: "asc" }
      }),
      prisma.invoiceItem.findMany({
        where: { invoice: { companyId } },
        include: { invoice: { select: { invoiceNumber: true, invoiceDate: true } } },
        orderBy: { invoice: { invoiceDate: "desc" } }
      }),
      prisma.payment.findMany({
        where: { invoice: { companyId } },
        include: { invoice: { select: { invoiceNumber: true } } },
        orderBy: { paymentDate: "desc" }
      })
    ]);

    // Style helper
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
      fill: {
        type: "pattern" as const,
        pattern: "solid" as const,
        fgColor: { argb: "FF1E293B" } // Slate-800
      },
      alignment: { vertical: "middle" as const, horizontal: "center" as const }
    };

    // -------------------------------------------------------------------------
    // SHEET 1: All Invoices
    // -------------------------------------------------------------------------
    const sheet1 = workbook.addWorksheet("All Invoices");
    sheet1.columns = [
      { header: "Invoice No.", key: "invoiceNumber", width: 18 },
      { header: "Date", key: "invoiceDate", width: 14 },
      { header: "Customer Name", key: "customerName", width: 24 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Subtotal (₹)", key: "subtotal", width: 16 },
      { header: "Discount (₹)", key: "discountAmount", width: 14 },
      { header: "Taxable (₹)", key: "taxableAmount", width: 16 },
      { header: "CGST (₹)", key: "cgstAmount", width: 14 },
      { header: "SGST (₹)", key: "sgstAmount", width: 14 },
      { header: "IGST (₹)", key: "igstAmount", width: 14 },
      { header: "Total GST (₹)", key: "totalTaxAmount", width: 16 },
      { header: "Grand Total (₹)", key: "grandTotal", width: 18 },
      { header: "Paid (₹)", key: "paidAmount", width: 14 },
      { header: "Balance (₹)", key: "balanceAmount", width: 14 }
    ];

    sheet1.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    invoices.forEach((inv) => {
      sheet1.addRow({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: format(new Date(inv.invoiceDate), "dd/MM/yyyy"),
        customerName: inv.customer.name,
        phone: inv.customer.phone,
        status: inv.status,
        subtotal: inv.subtotal,
        discountAmount: inv.discountAmount,
        taxableAmount: inv.taxableAmount,
        cgstAmount: inv.cgstAmount,
        sgstAmount: inv.sgstAmount,
        igstAmount: inv.igstAmount,
        totalTaxAmount: inv.totalTaxAmount,
        grandTotal: inv.grandTotal,
        paidAmount: inv.paidAmount,
        balanceAmount: inv.balanceAmount
      });
    });

    // -------------------------------------------------------------------------
    // SHEET 2: Invoice Items
    // -------------------------------------------------------------------------
    const sheet2 = workbook.addWorksheet("Invoice Items");
    sheet2.columns = [
      { header: "Invoice No.", key: "invoiceNumber", width: 18 },
      { header: "Date", key: "date", width: 14 },
      { header: "Item Description", key: "description", width: 32 },
      { header: "SAC Code", key: "hsnSacCode", width: 14 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "Rate (₹)", key: "rate", width: 16 },
      { header: "Amount (₹)", key: "amount", width: 16 }
    ];

    sheet2.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    items.forEach((item) => {
      sheet2.addRow({
        invoiceNumber: item.invoice.invoiceNumber,
        date: format(new Date(item.invoice.invoiceDate), "dd/MM/yyyy"),
        description: item.description,
        hsnSacCode: item.hsnSacCode || "998391",
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount
      });
    });

    // -------------------------------------------------------------------------
    // SHEET 3: Customers
    // -------------------------------------------------------------------------
    const sheet3 = workbook.addWorksheet("Customers");
    sheet3.columns = [
      { header: "Customer Name", key: "name", width: 24 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "GSTIN", key: "gstin", width: 18 },
      { header: "City", key: "city", width: 16 },
      { header: "State", key: "state", width: 16 },
      { header: "Billing Address", key: "billingAddress", width: 35 },
      { header: "Site Address", key: "siteAddress", width: 35 }
    ];

    sheet3.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    customers.forEach((cust) => {
      sheet3.addRow({
        name: cust.name,
        phone: cust.phone,
        gstin: cust.gstin || "Unregistered",
        city: cust.city || "",
        state: cust.state,
        billingAddress: cust.billingAddress || "",
        siteAddress: cust.siteAddress || ""
      });
    });

    // -------------------------------------------------------------------------
    // SHEET 4: Payments
    // -------------------------------------------------------------------------
    const sheet4 = workbook.addWorksheet("Payments");
    sheet4.columns = [
      { header: "Invoice No.", key: "invoiceNumber", width: 18 },
      { header: "Payment Date", key: "date", width: 16 },
      { header: "Amount (₹)", key: "amount", width: 16 },
      { header: "Payment Method", key: "method", width: 16 },
      { header: "Reference No.", key: "referenceNo", width: 20 },
      { header: "Notes", key: "notes", width: 25 }
    ];

    sheet4.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    payments.forEach((pay) => {
      sheet4.addRow({
        invoiceNumber: pay.invoice.invoiceNumber,
        date: format(new Date(pay.paymentDate), "dd/MM/yyyy"),
        amount: pay.amount,
        method: pay.method,
        referenceNo: pay.referenceNo || "-",
        notes: pay.notes || ""
      });
    });

    // -------------------------------------------------------------------------
    // SHEET 5: GST Summary (GSTR-1 Ready)
    // -------------------------------------------------------------------------
    const sheet5 = workbook.addWorksheet("GST Summary");
    sheet5.columns = [
      { header: "SAC Code", key: "sac", width: 16 },
      { header: "Description", key: "desc", width: 30 },
      { header: "Total Taxable Value (₹)", key: "taxable", width: 24 },
      { header: "Total CGST (₹)", key: "cgst", width: 18 },
      { header: "Total SGST (₹)", key: "sgst", width: 18 },
      { header: "Total IGST (₹)", key: "igst", width: 18 },
      { header: "Total Tax (₹)", key: "totalTax", width: 18 }
    ];

    sheet5.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    const totalTaxable = invoices.reduce((s, i) => s + i.taxableAmount, 0);
    const totalCGST = invoices.reduce((s, i) => s + i.cgstAmount, 0);
    const totalSGST = invoices.reduce((s, i) => s + i.sgstAmount, 0);
    const totalIGST = invoices.reduce((s, i) => s + i.igstAmount, 0);
    const totalTax = invoices.reduce((s, i) => s + i.totalTaxAmount, 0);

    sheet5.addRow({
      sac: "998391",
      desc: "Interior Architecture & Turnkey Execution",
      taxable: totalTaxable,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
      totalTax: totalTax
    });

    // -------------------------------------------------------------------------
    // SHEET 6: Daily Summary
    // -------------------------------------------------------------------------
    const sheet6 = workbook.addWorksheet("Daily Summary");
    sheet6.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Invoices Count", key: "count", width: 16 },
      { header: "Total Billed (₹)", key: "billed", width: 20 },
      { header: "Collections (₹)", key: "paid", width: 20 },
      { header: "Pending Balance (₹)", key: "balance", width: 22 }
    ];

    sheet6.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    // Aggregate by date
    const dailyMap = new Map<string, { count: number; billed: number; paid: number; balance: number }>();
    invoices.forEach((inv) => {
      const dateKey = format(new Date(inv.invoiceDate), "dd/MM/yyyy");
      const current = dailyMap.get(dateKey) || { count: 0, billed: 0, paid: 0, balance: 0 };
      current.count += 1;
      current.billed += inv.grandTotal;
      current.paid += inv.paidAmount;
      current.balance += inv.balanceAmount;
      dailyMap.set(dateKey, current);
    });

    dailyMap.forEach((val, dateStr) => {
      sheet6.addRow({
        date: dateStr,
        count: val.count,
        billed: val.billed,
        paid: val.paid,
        balance: val.balance
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
