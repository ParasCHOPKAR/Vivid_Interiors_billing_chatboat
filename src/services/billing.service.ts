import { prisma } from "@/lib/prisma";
import { calculateBill, BillItemInput } from "@/lib/calculations";

export interface CreateInvoiceParams {
  companyId: string;
  userId: string;
  customerId: string;
  items: BillItemInput[];
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  gstType?: "CGST_SGST" | "IGST" | "NO_GST";
  gstRate?: number;
  projectName?: string;
  siteAddress?: string;
  invoiceDate?: Date | string;
  notes?: string;
  termsConditions?: string;
  paidAmount?: number;
  dueDate?: Date | string;
}

export interface UpdateInvoiceParams {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItemInput[];
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  gstType?: "CGST_SGST" | "IGST" | "NO_GST";
  gstRate?: number;
  projectName?: string;
  siteAddress?: string;
  invoiceDate?: Date | string;
  notes?: string;
  termsConditions?: string;
  dueDate?: Date | string;
}

export interface RecordPaymentParams {
  amount: number;
  paymentDate?: Date | string;
  method?: string; // CASH, UPI, BANK, CHEQUE
  referenceNo?: string;
  notes?: string;
}

export class BillingService {
  /**
   * Generates next sequential invoice number safely inside a transaction
   */
  static async getNextInvoiceNumber(companyId: string, fiscalYear: string = new Date().getFullYear().toString()): Promise<string> {
    const sequence = await prisma.invoiceSequence.upsert({
      where: {
        companyId_fiscalYear: {
          companyId,
          fiscalYear
        }
      },
      update: {
        currentNumber: {
          increment: 1
        }
      },
      create: {
        companyId,
        fiscalYear,
        prefix: "VI",
        currentNumber: 1
      }
    });

    const prefix = sequence.prefix || "VI";
    const paddedNum = sequence.currentNumber.toString().padStart(6, "0");
    return `${prefix}-${fiscalYear}-${paddedNum}`;
  }

  /**
   * Atomic invoice creation with full calculation and auditing
   */
  static async createInvoice(params: CreateInvoiceParams) {
    const {
      companyId,
      userId,
      customerId,
      items,
      discountType = "FLAT",
      discountValue = 0,
      gstType,
      gstRate = 18,
      projectName,
      siteAddress,
      invoiceDate,
      notes,
      termsConditions,
      paidAmount = 0,
      dueDate
    } = params;

    // 1. Fetch Company & Customer to determine State Code & tax rules
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error("Company not found");

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found");

    // 2. Perform isolated deterministic calculations
    const calc = calculateBill({
      items,
      discountType,
      discountValue,
      gstType,
      gstRate,
      supplierStateCode: company.stateCode || "27",
      customerStateCode: customer.stateCode || "27"
    });

    const balanceAmount = Math.max(0, calc.grandTotal - paidAmount);
    const invoiceStatus = balanceAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "ISSUED";

    // 3. Run atomic transaction
    return await prisma.$transaction(async (tx) => {
      const fiscalYear = new Date().getFullYear().toString();
      
      // Update/Increment sequence
      const seq = await tx.invoiceSequence.upsert({
        where: {
          companyId_fiscalYear: {
            companyId,
            fiscalYear
          }
        },
        update: {
          currentNumber: { increment: 1 }
        },
        create: {
          companyId,
          fiscalYear,
          prefix: company.invoicePrefix || "VI",
          currentNumber: 1
        }
      });

      const invoiceNumber = `${seq.prefix}-${fiscalYear}-${seq.currentNumber.toString().padStart(6, "0")}`;

      // Create main invoice
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          userId,
          customerId,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          status: invoiceStatus,
          projectName: projectName || "Turnkey Interior Architecture & Execution",
          siteAddress: siteAddress || customer.siteAddress || customer.billingAddress,
          subtotal: calc.subtotal,
          discountType: calc.discountType,
          discountValue: calc.discountValue,
          discountAmount: calc.discountAmount,
          taxableAmount: calc.taxableAmount,
          gstType: calc.gstType,
          gstRate: calc.gstRate,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          igstAmount: calc.igstAmount,
          totalTaxAmount: calc.totalTaxAmount,
          roundOff: calc.roundOff,
          grandTotal: calc.grandTotal,
          paidAmount: paidAmount,
          balanceAmount: balanceAmount,
          amountInWords: calc.amountInWords,
          termsConditions: termsConditions || (company.tradeName ? `Terms for ${company.name}` : undefined),
          notes: notes || undefined,
          items: {
            create: calc.items.map((it, idx) => ({
              description: it.description,
              unit: it.unit,
              quantity: it.quantity,
              rate: it.rate,
              amount: it.amount,
              hsnSacCode: it.hsnSacCode,
              sortOrder: idx
            }))
          }
        },
        include: {
          customer: true,
          company: true,
          items: true
        }
      });

      // If initial payment was made, record payment entry with formatted Payment ID
      if (paidAmount > 0) {
        const paySeq = Math.floor(100000 + Math.random() * 900000);
        await tx.payment.create({
          data: {
            paymentId: `PAY-${fiscalYear}-${paySeq}`,
            invoiceId: invoice.id,
            amount: paidAmount,
            method: "UPI",
            referenceNo: "ADVANCE_AT_CREATION",
            notes: "Initial advance recorded at invoice creation"
          }
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: "INVOICE_CREATED",
          entity: "INVOICE",
          entityId: invoice.id,
          details: JSON.stringify({
            invoiceNumber,
            grandTotal: calc.grandTotal,
            customerName: customer.name
          })
        }
      });

      return invoice;
    });
  }

  /**
   * Update an existing invoice (recalculates financial totals atomically)
   */
  static async updateInvoice(invoiceId: string, params: UpdateInvoiceParams) {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, company: true, payments: true }
    });
    if (!existing) throw new Error("Invoice not found");

    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discountType = (existing.discountType as "PERCENT" | "FLAT") || "FLAT",
      discountValue = existing.discountValue || 0,
      gstType = (existing.gstType as "CGST_SGST" | "IGST" | "NO_GST") || "CGST_SGST",
      gstRate = existing.gstRate !== undefined ? existing.gstRate : 18,
      projectName,
      siteAddress,
      invoiceDate,
      notes,
      termsConditions,
      dueDate
    } = params;

    // Handle customer update if needed
    let targetCustomerId = existing.customerId;
    if (customerId && customerId !== existing.customerId) {
      targetCustomerId = customerId;
    } else if (customerName && customerName !== existing.customer.name) {
      const updatedCustomer = await prisma.customer.update({
        where: { id: existing.customerId },
        data: {
          name: customerName,
          phone: customerPhone || existing.customer.phone
        }
      });
      targetCustomerId = updatedCustomer.id;
    }

    const customer = await prisma.customer.findUnique({ where: { id: targetCustomerId } });
    if (!customer) throw new Error("Customer not found");

    // Recalculate bill
    const calc = calculateBill({
      items,
      discountType,
      discountValue,
      gstType,
      gstRate,
      supplierStateCode: existing.company.stateCode || "27",
      customerStateCode: customer.stateCode || "27"
    });

    // Sum existing payments
    const totalPaid = existing.payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceAmount = Math.max(0, calc.grandTotal - totalPaid);
    const status = balanceAmount === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "ISSUED";

    return await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId }
      });

      // Update invoice and recreate items
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          customerId: targetCustomerId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : existing.invoiceDate,
          dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
          status,
          projectName: projectName !== undefined ? projectName : existing.projectName,
          siteAddress: siteAddress !== undefined ? siteAddress : existing.siteAddress,
          subtotal: calc.subtotal,
          discountType: calc.discountType,
          discountValue: calc.discountValue,
          discountAmount: calc.discountAmount,
          taxableAmount: calc.taxableAmount,
          gstType: calc.gstType,
          gstRate: calc.gstRate,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          igstAmount: calc.igstAmount,
          totalTaxAmount: calc.totalTaxAmount,
          roundOff: calc.roundOff,
          grandTotal: calc.grandTotal,
          paidAmount: totalPaid,
          balanceAmount,
          amountInWords: calc.amountInWords,
          termsConditions: termsConditions !== undefined ? termsConditions : existing.termsConditions,
          notes: notes !== undefined ? notes : existing.notes,
          items: {
            create: calc.items.map((it, idx) => ({
              description: it.description,
              unit: it.unit,
              quantity: it.quantity,
              rate: it.rate,
              amount: it.amount,
              hsnSacCode: it.hsnSacCode,
              sortOrder: idx
            }))
          }
        },
        include: {
          customer: true,
          company: true,
          items: true,
          payments: true
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          companyId: existing.companyId,
          userId: existing.userId,
          action: "INVOICE_UPDATED",
          entity: "INVOICE",
          entityId: invoiceId,
          details: JSON.stringify({
            invoiceNumber: existing.invoiceNumber,
            newGrandTotal: calc.grandTotal
          })
        }
      });

      return updated;
    });
  }

  /**
   * Delete an existing invoice and audit
   */
  static async deleteInvoice(invoiceId: string) {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });
    if (!existing) throw new Error("Invoice not found");

    return await prisma.$transaction(async (tx) => {
      // Delete payments
      await tx.payment.deleteMany({ where: { invoiceId } });
      // Delete items
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
      // Delete invoice
      const deleted = await tx.invoice.delete({ where: { id: invoiceId } });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId: existing.companyId,
          userId: existing.userId,
          action: "INVOICE_DELETED",
          entity: "INVOICE",
          entityId: invoiceId,
          details: JSON.stringify({
            invoiceNumber: existing.invoiceNumber,
            grandTotal: existing.grandTotal
          })
        }
      });

      return deleted;
    });
  }

  /**
   * Duplicate an invoice into a fresh new draft invoice with a new invoice number
   */
  static async duplicateInvoice(invoiceId: string) {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true, company: true }
    });
    if (!existing) throw new Error("Invoice not found");

    return await this.createInvoice({
      companyId: existing.companyId,
      userId: existing.userId,
      customerId: existing.customerId,
      items: existing.items.map((it) => ({
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        rate: it.rate,
        hsnSacCode: it.hsnSacCode || undefined
      })),
      discountType: (existing.discountType as "PERCENT" | "FLAT") || "FLAT",
      discountValue: existing.discountValue,
      gstType: (existing.gstType as "CGST_SGST" | "IGST" | "NO_GST") || "CGST_SGST",
      gstRate: existing.gstRate,
      projectName: `${existing.projectName || "Turnkey Interior"} (Copy)`,
      siteAddress: existing.siteAddress || undefined,
      notes: existing.notes || undefined,
      termsConditions: existing.termsConditions || undefined,
      paidAmount: 0 // Draft starts with 0 paid
    });
  }

  /**
   * Record a payment against an invoice and recalculate paidAmount, balanceAmount and status
   */
  static async recordPayment(invoiceId: string, params: RecordPaymentParams) {
    const { amount, paymentDate, method = "UPI", referenceNo, notes } = params;
    if (!amount || amount <= 0) throw new Error("Payment amount must be greater than 0");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, customer: true, company: true }
    });
    if (!invoice) throw new Error("Invoice not found");

    return await prisma.$transaction(async (tx) => {
      const fiscalYear = new Date().getFullYear().toString();
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const paymentId = `PAY-${fiscalYear}-${randomSeq}`;

      const payment = await tx.payment.create({
        data: {
          paymentId,
          invoiceId,
          amount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          method: method.toUpperCase(),
          referenceNo: referenceNo || undefined,
          notes: notes || undefined
        }
      });

      // Recalculate total paid
      const allPayments = await tx.payment.findMany({ where: { invoiceId } });
      const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);
      const remainingBalance = Math.max(0, invoice.grandTotal - totalPaid);
      const paymentStatus = remainingBalance === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "ISSUED";

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: totalPaid,
          balanceAmount: remainingBalance,
          status: paymentStatus
        },
        include: {
          customer: true,
          payments: true
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          companyId: invoice.companyId,
          userId: invoice.userId,
          action: "PAYMENT_RECORDED",
          entity: "PAYMENT",
          entityId: payment.id,
          details: JSON.stringify({
            paymentId,
            invoiceNumber: invoice.invoiceNumber,
            amount,
            method,
            totalPaid,
            remainingBalance,
            paymentStatus
          })
        }
      });

      return {
        payment,
        invoice: updatedInvoice,
        totalPaid,
        remainingBalance,
        paymentStatus
      };
    });
  }

  /**
   * Retrieves dashboard statistics
   */
  static async getDashboardStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [invoicesToday, allInvoices, customersCount] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId,
          invoiceDate: { gte: today }
        }
      }),
      prisma.invoice.findMany({
        where: { companyId },
        select: { grandTotal: true, paidAmount: true, balanceAmount: true }
      }),
      prisma.customer.count({ where: { companyId } })
    ]);

    const billsTodayCount = invoicesToday.length;
    const todayBillingVolume = invoicesToday.reduce((acc, curr) => acc + curr.grandTotal, 0);
    const totalOutstanding = allInvoices.reduce((acc, curr) => acc + curr.balanceAmount, 0);
    const totalLifetimeBilled = allInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

    // Recent 10 invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        customer: true,
        items: true
      }
    });

    return {
      billsTodayCount,
      todayBillingVolume,
      totalOutstanding,
      totalLifetimeBilled,
      customersCount,
      recentInvoices
    };
  }
}
