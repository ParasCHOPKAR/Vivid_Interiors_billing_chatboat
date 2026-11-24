import Decimal from "decimal.js";

// Configure standard half-up rounding
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface BillItemInput {
  description: string;
  unit?: string;
  quantity: number;
  rate: number;
  hsnSacCode?: string;
}

export interface CalculationInput {
  items: BillItemInput[];
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  gstType?: "CGST_SGST" | "IGST" | "NO_GST";
  gstRate?: number; // e.g., 18 for 18%
  supplierStateCode: string; // e.g., "27" (Maharashtra)
  customerStateCode: string; // e.g., "27"
}

export interface CalculatedItem {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnSacCode: string;
}

export interface CalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  isInterState: boolean;
  gstType: "CGST_SGST" | "IGST" | "NO_GST";
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

/**
 * Deterministic Financial Arithmetic Engine
 * Zero floating-point rounding issues via Decimal.js
 */
export function calculateBill(input: CalculationInput): CalculationResult {
  const {
    items,
    discountType = "FLAT",
    discountValue = 0,
    gstType: explicitGstType,
    gstRate = 18,
    supplierStateCode,
    customerStateCode
  } = input;

  let subtotalDec = new Decimal(0);
  const calculatedItems: CalculatedItem[] = [];

  for (const item of items) {
    const qty = new Decimal(item.quantity || 1);
    const rate = new Decimal(item.rate || 0);
    const lineAmount = qty.times(rate);
    subtotalDec = subtotalDec.plus(lineAmount);

    calculatedItems.push({
      description: item.description,
      unit: item.unit || "Job",
      quantity: qty.toNumber(),
      rate: rate.toNumber(),
      amount: lineAmount.toDecimalPlaces(2).toNumber(),
      hsnSacCode: item.hsnSacCode || "998391"
    });
  }

  // Calculate Discount
  let discountAmountDec = new Decimal(0);
  const discountValDec = new Decimal(discountValue || 0);

  if (discountValDec.gt(0)) {
    if (discountType === "PERCENT") {
      discountAmountDec = subtotalDec.times(discountValDec).dividedBy(100);
    } else {
      discountAmountDec = discountValDec;
    }
  }

  // Ensure discount does not exceed subtotal
  if (discountAmountDec.gt(subtotalDec)) {
    discountAmountDec = subtotalDec;
  }

  const taxableAmountDec = subtotalDec.minus(discountAmountDec);

  // Determine GST Type: "CGST_SGST" | "IGST" | "NO_GST"
  const isInterState = supplierStateCode.trim() !== customerStateCode.trim();
  const effectiveGstType: "CGST_SGST" | "IGST" | "NO_GST" =
    explicitGstType || (isInterState ? "IGST" : "CGST_SGST");

  const effectiveGstRate = effectiveGstType === "NO_GST" ? 0 : (gstRate || 0);
  const gstRateDec = new Decimal(effectiveGstRate);

  let cgstDec = new Decimal(0);
  let sgstDec = new Decimal(0);
  let igstDec = new Decimal(0);
  let totalTaxDec = new Decimal(0);

  if (effectiveGstType !== "NO_GST" && gstRateDec.gt(0)) {
    if (effectiveGstType === "IGST") {
      // Inter-state: Full IGST
      igstDec = taxableAmountDec.times(gstRateDec).dividedBy(100);
      totalTaxDec = igstDec;
    } else {
      // Intra-state: Split equally between CGST and SGST
      const halfRate = gstRateDec.dividedBy(2);
      cgstDec = taxableAmountDec.times(halfRate).dividedBy(100);
      sgstDec = taxableAmountDec.times(halfRate).dividedBy(100);
      totalTaxDec = cgstDec.plus(sgstDec);
    }
  }

  // Raw Total before Round-Off
  const rawTotalDec = taxableAmountDec.plus(totalTaxDec);
  const roundedGrandTotalDec = rawTotalDec.round();
  const roundOffDec = roundedGrandTotalDec.minus(rawTotalDec);

  const grandTotal = roundedGrandTotalDec.toNumber();
  const amountInWords = convertIndianNumberToWords(grandTotal);

  return {
    items: calculatedItems,
    subtotal: subtotalDec.toDecimalPlaces(2).toNumber(),
    discountType,
    discountValue: discountValDec.toNumber(),
    discountAmount: discountAmountDec.toDecimalPlaces(2).toNumber(),
    taxableAmount: taxableAmountDec.toDecimalPlaces(2).toNumber(),
    isInterState: effectiveGstType === "IGST",
    gstType: effectiveGstType,
    gstRate: gstRateDec.toNumber(),
    cgstAmount: cgstDec.toDecimalPlaces(2).toNumber(),
    sgstAmount: sgstDec.toDecimalPlaces(2).toNumber(),
    igstAmount: igstDec.toDecimalPlaces(2).toNumber(),
    totalTaxAmount: totalTaxDec.toDecimalPlaces(2).toNumber(),
    roundOff: roundOffDec.toDecimalPlaces(2).toNumber(),
    grandTotal,
    amountInWords
  };
}

/**
 * Converts numbers to Indian Currency Words Format (Lakhs, Crores)
 * e.g., 1,50,000 -> "One Lakh Fifty Thousand Rupees Only"
 */
export function convertIndianNumberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  if (num < 0) return "Negative " + convertIndianNumberToWords(Math.abs(num));

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const unitPart = n % 10;
    return tens[Math.floor(n / 10)] + (unitPart ? " " + units[unitPart] : "");
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = "";
    if (hundred > 0) {
      res += units[hundred] + " Hundred";
      if (remainder > 0) res += " and ";
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  const parts: string[] = [];
  if (crores > 0) parts.push(convertTwoDigits(crores) + " Crore");
  if (lakhs > 0) parts.push(convertTwoDigits(lakhs) + " Lakh");
  if (thousands > 0) parts.push(convertTwoDigits(thousands) + " Thousand");
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return parts.join(" ") + " Rupees Only";
}
