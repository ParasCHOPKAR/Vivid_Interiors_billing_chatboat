"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Calculator, Sparkles, Building2, Calendar, FileText } from "lucide-react";
import Link from "next/link";

interface ItemRow {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // Invoice Fields
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [projectName, setProjectName] = useState("Turnkey Interior Architecture & Execution");
  const [siteAddress, setSiteAddress] = useState("");
  
  // Tax & Discount Settings
  const [gstType, setGstType] = useState<"CGST_SGST" | "IGST" | "NO_GST">("CGST_SGST");
  const [gstRate, setGstRate] = useState(18);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENT">("FLAT");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default Items with specified units: Sq.Ft. / Nos / RFT / LS / Job / Set
  const [items, setItems] = useState<ItemRow[]>([
    { description: "Modular Kitchen Design & Execution", unit: "Job", quantity: 1, rate: 185000 },
    { description: "Custom Master Bedroom Wardrobe & Storage", unit: "RFT", quantity: 80, rate: 1600 },
    { description: "False Ceiling (Gypsum / POP & Cove Lighting)", unit: "Sq.Ft.", quantity: 450, rate: 120 }
  ]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { description: "", unit: "Sq.Ft.", quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Automatic Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.rate || 0), 0);
  const discountAmount =
    discountType === "PERCENT" ? (subtotal * (discountValue || 0)) / 100 : (discountValue || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // GST Calculation based on GST Type
  const effectiveGstRate = gstType === "NO_GST" ? 0 : gstRate;
  const totalTaxAmount = (taxableAmount * effectiveGstRate) / 100;
  const cgstAmount = gstType === "CGST_SGST" ? totalTaxAmount / 2 : 0;
  const sgstAmount = gstType === "CGST_SGST" ? totalTaxAmount / 2 : 0;
  const igstAmount = gstType === "IGST" ? totalTaxAmount : 0;

  const rawGrandTotal = taxableAmount + totalTaxAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;
  const balanceDue = Math.max(0, grandTotal - (paidAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) {
      alert("Please provide client name and at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          projectName,
          siteAddress,
          invoiceDate,
          items,
          discountType,
          discountValue,
          gstType,
          gstRate: effectiveGstRate,
          paidAmount,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/invoices/${data.invoice.id}`);
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch (err) {
      alert("Error saving invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            ⚡ Automatic Invoice Number Protected
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Create Tax Invoice (थेट बिल तयार करा)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Vivid Interiors Pune • All standard interior units (Sq.Ft., Nos, RFT, LS) & GST rates
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-500">Invoice No:</span>
            <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200">
              VI-2026-AUTO
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Section 1: Customer & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Invoice Date तारीख *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Client Name ग्राहक नाव *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rajesh & Sunita Kulkarni"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Client Phone नंबर
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9822012345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Name कामाचे नाव *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. 3BHK Turnkey Interior / Flat 402"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Site Address साइटचा पत्ता
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g. Flat 402, Rohan Kritika, Sinhagad Road, Pune - 411030"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 2: Items Table with specific units: Sq.Ft. / Nos / RFT / LS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Description of Work & Supply कामाचे वर्णन
                </label>
                <p className="text-[11px] text-slate-500">
                  Units available: Sq.Ft. • Nos • RFT • LS • Job • Set
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item (काम जोडा)</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Description कामाचे वर्णन</th>
                    <th className="py-3 px-3 w-36">Unit युनिट</th>
                    <th className="py-3 px-3 w-24 text-center">Quantity प्रमाण</th>
                    <th className="py-3 px-3 w-32 text-right">Rate दर (₹)</th>
                    <th className="py-3 px-3 w-36 text-right">Amount रक्कम (₹)</th>
                    <th className="py-3 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="e.g. Modular Kitchen / False Ceiling / Wardrobe..."
                          className="w-full px-2.5 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800"
                        >
                          <option value="Sq.Ft.">Sq.Ft. (स्क्वेअर फूट)</option>
                          <option value="Nos">Nos (नग / संख्या)</option>
                          <option value="RFT">RFT (रनिंग फूट)</option>
                          <option value="LS">LS (Lump Sum / लमसम)</option>
                          <option value="Job">Job (जॉब)</option>
                          <option value="Set">Set (सेट)</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-center font-mono font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={it.rate}
                          onChange={(e) => handleItemChange(idx, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-right font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{((it.quantity || 0) * (it.rate || 0)).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: GST Type, Rates, Discount & Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
            {/* Left Controls: GST Type, Applicable Rate, Discount, Advance */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tax & Payment Settings (कर आणि पेमेंट पर्याय)
              </h3>

              {/* GST Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  GST Type (जीएसटी प्रकार) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGstType("CGST_SGST")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      gstType === "CGST_SGST"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    CGST + SGST
                    <span className="block text-[10px] font-normal opacity-85">Intra-State (Maharashtra)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGstType("IGST")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      gstType === "IGST"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    IGST
                    <span className="block text-[10px] font-normal opacity-85">Inter-State Supply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGstType("NO_GST")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      gstType === "NO_GST"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    No GST
                    <span className="block text-[10px] font-normal opacity-85">0% / Non-GST</span>
                  </button>
                </div>
              </div>

              {/* GST Percentage Applicable Rate & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Percentage Applicable Rate
                  </label>
                  <select
                    value={gstRate}
                    disabled={gstType === "NO_GST"}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 disabled:opacity-50"
                  >
                    <option value={18}>18% (Standard Interior GST)</option>
                    <option value={12}>12% (Works Contract / Civil)</option>
                    <option value={28}>28% (Luxury Fittings)</option>
                    <option value={5}>5%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Discount (सवलत)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <select
                      value={discountType}
                      onChange={(e: any) => setDiscountType(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-lg text-xs px-2 font-medium"
                    >
                      <option value="FLAT">₹ Flat</option>
                      <option value="PERCENT">%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Payment Entry */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Payment Received (आलेले पैसे नोंदवा - ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Creates an automatic Payment ID entry if advance amount is entered.
                </span>
              </div>
            </div>

            {/* Right Card: Automatic Real-Time Calculations */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs font-mono shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-sm font-sans flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Automatic Calculation Summary
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Zero Rounding Error
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Subtotal (एकूण रक्कम):</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({discountValue}{discountType === "PERCENT" ? "%" : " Flat"}):</span>
                  <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-200/60">
                <span>Taxable Amount (करपात्र रक्कम):</span>
                <span>₹{taxableAmount.toLocaleString("en-IN")}</span>
              </div>

              {gstType === "NO_GST" ? (
                <div className="flex justify-between text-slate-500 italic">
                  <span>GST:</span>
                  <span>No GST (0%)</span>
                </div>
              ) : gstType === "IGST" ? (
                <div className="flex justify-between text-slate-700">
                  <span>Integrated GST (IGST @ {effectiveGstRate}%):</span>
                  <span>₹{igstAmount.toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Central GST (CGST @ {effectiveGstRate / 2}%):</span>
                    <span>₹{cgstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>State GST (SGST @ {effectiveGstRate / 2}%):</span>
                    <span>₹{sgstAmount.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>₹{roundOff.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-slate-900 flex justify-between font-bold text-slate-900 text-base">
                <span>Grand Total (एकूण बिल):</span>
                <span className="text-indigo-600">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between text-slate-600">
                <span>Payment Received (आलेले पैसे):</span>
                <span>₹{(paidAmount || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-slate-900 font-bold">
                <span>Remaining Balance (शिल्लक बाकी):</span>
                <span className={balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}>
                  ₹{balanceDue.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="pt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-sans font-bold uppercase ${
                    balanceDue === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : paidAmount > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  Status: {balanceDue === 0 ? "PAID (पूर्ण)" : paidAmount > 0 ? "PARTIAL (अंशतः)" : "UNPAID (बाकी)"}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <Link
              href="/chatbot"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or create easily by typing or speaking in Chatbot</span>
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Generating Official Sequence..." : "Confirm & Issue Tax Invoice (बिल तयार करा)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
