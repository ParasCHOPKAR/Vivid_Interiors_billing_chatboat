"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Share2,
  Copy,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileDown,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";

interface PaymentEntry {
  id: string;
  paymentId?: string;
  amount: number;
  paymentDate: string;
  method: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

interface ItemRow {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  hsnSacCode?: string;
}

export default function InvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash" | "Bank" | "Cheque">("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Edit Invoice States
  const [editClientName, setEditClientName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editSiteAddress, setEditSiteAddress] = useState("");
  const [editGstType, setEditGstType] = useState<"CGST_SGST" | "IGST" | "NO_GST">("CGST_SGST");
  const [editGstRate, setEditGstRate] = useState(18);
  const [editDiscountValue, setEditDiscountValue] = useState(0);
  const [editDiscountType, setEditDiscountType] = useState<"FLAT" | "PERCENT">("FLAT");
  const [editItems, setEditItems] = useState<ItemRow[]>([]);

  const fetchInvoice = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.invoice);
          setPaymentAmount(data.invoice.balanceAmount > 0 ? data.invoice.balanceAmount : "");
          // Initialize edit form states
          setEditClientName(data.invoice.customer.name);
          setEditProjectName(data.invoice.projectName || "Turnkey Interior Architecture & Execution");
          setEditSiteAddress(data.invoice.siteAddress || data.invoice.customer.siteAddress || "");
          setEditGstType(data.invoice.gstType || (data.invoice.igstAmount > 0 ? "IGST" : "CGST_SGST"));
          setEditGstRate(data.invoice.gstRate || 18);
          setEditDiscountValue(data.invoice.discountValue || 0);
          setEditDiscountType(data.invoice.discountType || "FLAT");
          setEditItems(
            data.invoice.items.map((it: any) => ({
              description: it.description,
              unit: it.unit || "Sq.Ft.",
              quantity: it.quantity,
              rate: it.rate,
              hsnSacCode: it.hsnSacCode
            }))
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch invoice:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // 1. Print Invoice
  const handlePrint = () => {
    window.print();
  };

  // 2. WhatsApp Sharing
  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const { company, customer } = invoice;
    const cleanPhone = customer.phone?.replace(/[^0-9]/g, "") || "";
    const appUrl = typeof window !== "undefined" ? window.location.href : "";

    const message = `🏛️ *TAX INVOICE — ${company.name.toUpperCase()}*
--------------------------------
📄 *Invoice No:* ${invoice.invoiceNumber}
📅 *Date (तारीख):* ${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
👤 *Client (ग्राहक):* ${customer.name}
🏗️ *Project (कामाचे नाव):* ${invoice.projectName || "Turnkey Interior"}

💰 *Invoice Amount:* ₹${invoice.grandTotal.toLocaleString("en-IN")}
✅ *Total Paid:* ₹${invoice.paidAmount.toLocaleString("en-IN")}
⚠️ *Remaining Balance:* ₹${invoice.balanceAmount.toLocaleString("en-IN")}
📌 *Status:* ${invoice.status}

🔗 *View & Print Invoice:*
${appUrl}

Thank you for choosing Vivid Interiors Pune!
Contact: ${company.phone} | Erandwane, Pune`;

    const encoded = encodeURIComponent(message);
    const targetUrl = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  // 3. Duplicate Invoice
  const handleDuplicate = async () => {
    if (!confirm("Are you sure you want to duplicate this invoice into a new numbered draft?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        router.push(`/invoices/${data.invoice.id}`);
      } else {
        alert(data.error || "Failed to duplicate invoice");
      }
    } catch (err) {
      alert("Error duplicating invoice");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete Invoice
  const handleDeleteInvoice = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/invoices");
      } else {
        alert(data.error || "Failed to delete invoice");
      }
    } catch (err) {
      alert("Error deleting invoice");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  // 5. Record Payment Entry
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount.toString());
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentDate,
          method: paymentMode,
          referenceNo: transactionId,
          notes: paymentRemarks
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        setTransactionId("");
        setPaymentRemarks("");
        fetchInvoice();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      alert("Error recording payment");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Save Invoice Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientName.trim() || editItems.length === 0) {
      alert("Client name and at least one item are required");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editClientName,
          projectName: editProjectName,
          siteAddress: editSiteAddress,
          items: editItems,
          discountType: editDiscountType,
          discountValue: editDiscountValue,
          gstType: editGstType,
          gstRate: editGstRate
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        fetchInvoice();
      } else {
        alert(data.error || "Failed to update invoice");
      }
    } catch (err) {
      alert("Error updating invoice");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-slate-500 text-sm gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span>Loading Vivid Interiors Invoice details...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-600 font-semibold">Invoice not found.</p>
        <Link href="/invoices" className="text-indigo-600 underline text-sm">
          Return to All Invoices
        </Link>
      </div>
    );
  }

  const { company, customer, items, payments = [] } = invoice;
  const totalPaid = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
  const remainingBalance = Math.max(0, invoice.grandTotal - totalPaid);
  const computedStatus = remainingBalance === 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center">
      {/* Action Bar (Hidden during Print) */}
      <div className="no-print w-full max-w-4xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        {/* Feature Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
            title="Print Swiss A4 layout"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice (A4)</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Record Payment Entry */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all shadow-sm cursor-pointer"
            title="Record payment received"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment (पैसे नोंदवा)</span>
          </button>

          {/* Duplicate Invoice Button */}
          <button
            onClick={handleDuplicate}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Clone into new draft"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              isEditing
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Edit invoice"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEditing ? "Close Edit" : "Edit"}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-all shadow-2xs cursor-pointer"
            title="Delete invoice"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Mode Panel */}
      {isEditing && (
        <div className="no-print w-full max-w-4xl mb-6 bg-white rounded-2xl border border-indigo-200 shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Invoice {invoice.invoiceNumber}</h2>
              <p className="text-xs text-slate-500">Modify client, project name, line items, and taxes.</p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name ग्राहक नाव *</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name कामाचे नाव *</label>
                <input
                  type="text"
                  required
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Address पत्ता</label>
                <input
                  type="text"
                  value={editSiteAddress}
                  onChange={(e) => setEditSiteAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Line items edit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase">Items (कामाचे वर्णन)</label>
                <button
                  type="button"
                  onClick={() => setEditItems([...editItems, { description: "", unit: "Sq.Ft.", quantity: 1, rate: 0 }])}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 w-32">Unit</th>
                      <th className="py-2 px-3 w-20 text-center">Qty</th>
                      <th className="py-2 px-3 w-28 text-right">Rate</th>
                      <th className="py-2 px-2 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            value={it.description}
                            onChange={(e) => {
                              const n = [...editItems];
                              n[idx].description = e.target.value;
                              setEditItems(n);
                            }}
                            className="w-full px-2 py-1 bg-transparent border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={it.unit}
                            onChange={(e) => {
                              const n = [...editItems];
                              n[idx].unit = e.target.value;
                              setEditItems(n);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          >
                            <option value="Sq.Ft.">Sq.Ft.</option>
                            <option value="Nos">Nos</option>
                            <option value="RFT">RFT</option>
                            <option value="LS">LS</option>
                            <option value="Job">Job</option>
                            <option value="Set">Set</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => {
                              const n = [...editItems];
                              n[idx].quantity = parseFloat(e.target.value) || 0;
                              setEditItems(n);
                            }}
                            className="w-full px-1.5 py-1 text-center bg-transparent border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            value={it.rate}
                            onChange={(e) => {
                              const n = [...editItems];
                              n[idx].rate = parseFloat(e.target.value) || 0;
                              setEditItems(n);
                            }}
                            className="w-full px-1.5 py-1 text-right bg-transparent border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {editItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600"
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

            {/* GST Type & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Type</label>
                <select
                  value={editGstType}
                  onChange={(e: any) => setEditGstType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="CGST_SGST">CGST + SGST (Maharashtra Intra-State)</option>
                  <option value="IGST">IGST (Inter-State)</option>
                  <option value="NO_GST">No GST (0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                <select
                  value={editGstRate}
                  disabled={editGstType === "NO_GST"}
                  onChange={(e) => setEditGstRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-50"
                >
                  <option value={18}>18% (Standard Interior)</option>
                  <option value={12}>12% (Works Contract)</option>
                  <option value={28}>28%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={editDiscountType}
                    onChange={(e: any) => setEditDiscountType(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg text-xs px-2"
                  >
                    <option value="FLAT">₹ Flat</option>
                    <option value="PERCENT">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving Changes..." : "Save Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SWISS TYPOGRAPHY PRINT-READY TAX INVOICE */}
      <div className="invoice-container bg-white w-full max-w-4xl p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200/80 text-slate-900 font-sans">
        {/* Header: Company & Tax Invoice Tag */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b-2 border-slate-900 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">
              Original Tax Invoice (मूळ कर बीजक)
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
              {company.name}
            </h1>
            <p className="text-xs text-slate-600 font-medium">{company.tradeName}</p>
            <p className="text-xs text-slate-500 max-w-md mt-1">{company.address}, {company.city} - {company.pincode}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-2 font-mono">
              <span><strong>GSTIN:</strong> {company.gstin}</span>
              <span><strong>State:</strong> {company.state} ({company.stateCode})</span>
              <span><strong>Phone:</strong> {company.phone}</span>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg shadow-sm">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500 pt-2 space-y-0.5">
              <p><strong>Invoice Date तारीख:</strong> {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</p>
              <p><strong>Payment Status:</strong>{" "}
                <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                  computedStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : computedStatus === "PARTIAL"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-800"
                }`}>
                  {computedStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Project Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
          <div className="space-y-1">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Billed To Client (ग्राहक)
            </h3>
            <p className="text-base font-bold text-slate-900">{customer.name}</p>
            <p className="text-slate-600">{customer.billingAddress || "Pune, Maharashtra"}</p>
            <p className="text-slate-600 font-mono">Phone: {customer.phone}</p>
            {customer.gstin && (
              <p className="text-slate-700 font-mono"><strong>GSTIN:</strong> {customer.gstin}</p>
            )}
            <p className="text-slate-500">State: {customer.state} ({customer.stateCode})</p>
          </div>

          <div className="space-y-1 sm:text-right">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project & Site Location (कामाचे नाव आणि पत्ता)
            </h3>
            <p className="text-sm font-bold text-indigo-700">{invoice.projectName || "Turnkey Interior Architecture & Execution"}</p>
            <p className="text-slate-600">{invoice.siteAddress || customer.siteAddress || "Site Location as agreed"}</p>
            <p className="text-slate-500 font-mono text-[11px] pt-1">
              Place of Supply: {customer.state} ({customer.stateCode})
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3 px-2 w-10">#</th>
                <th className="py-3 px-3">Description of Work कामाचे वर्णन</th>
                <th className="py-3 px-3 text-center">SAC Code</th>
                <th className="py-3 px-3 text-center">Unit युनिट</th>
                <th className="py-3 px-3 text-center">Qty प्रमाण</th>
                <th className="py-3 px-3 text-right">Rate दर (₹)</th>
                <th className="py-3 px-3 text-right">Amount रक्कम (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {items.map((item: any, idx: number) => (
                <tr key={item.id} className="text-slate-800">
                  <td className="py-3.5 px-2 font-mono text-slate-400">
                    {(idx + 1).toString().padStart(2, "0")}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                    {item.hsnSacCode || "998391"}
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {item.unit}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-800 font-semibold">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                    {item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900">
          {/* Amount in words & Bank info */}
          <div className="space-y-4 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">
                Total Amount in Words
              </span>
              <p className="font-semibold text-slate-900 italic mt-0.5">
                {invoice.amountInWords}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
              <span className="font-bold text-slate-700 uppercase block tracking-wider text-[10px]">
                Bank Transfer & UPI Details (Vivid Interiors)
              </span>
              <p><span className="text-slate-500">Bank:</span> {company.bankName}</p>
              <p><span className="text-slate-500">Account No:</span> {company.bankAccountNo}</p>
              <p><span className="text-slate-500">IFSC Code:</span> {company.bankIfsc}</p>
              <p><span className="text-slate-500">UPI ID:</span> {company.upiId}</p>
            </div>
          </div>

          {/* Right Column: Math Breakdown */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal (एकूण रक्कम):</span>
              <span>₹{invoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 font-semibold">
                <span>Discount ({invoice.discountValue}{invoice.discountType === "PERCENT" ? "%" : " Flat"}):</span>
                <span>- ₹{invoice.discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-900 font-semibold border-t border-slate-100">
              <span>Taxable Amount (करपात्र रक्कम):</span>
              <span>₹{invoice.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {invoice.gstType === "NO_GST" ? (
              <div className="flex justify-between py-1 text-slate-500 italic">
                <span>GST Type:</span>
                <span>No GST (0%)</span>
              </div>
            ) : invoice.igstAmount > 0 ? (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Integrated GST (IGST @ {invoice.gstRate}%):</span>
                <span>₹{invoice.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Central GST (CGST @ {invoice.gstRate / 2}%):</span>
                  <span>₹{invoice.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>State GST (SGST @ {invoice.gstRate / 2}%):</span>
                  <span>₹{invoice.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}

            {invoice.roundOff !== 0 && (
              <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>₹{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
              <span>Grand Total (एकूण बिल):</span>
              <span className="text-base font-black text-indigo-700">
                ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-600 text-[11px]">
              <span>Total Paid (आलेले पैसे):</span>
              <span className="font-semibold text-emerald-700">
                ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-900 font-bold border-t border-slate-200">
              <span>Remaining Balance (शिल्लक बाकी):</span>
              <span className={remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"}>
                ₹{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Signature Footer */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500">
          <div className="space-y-1 max-w-sm">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">Terms & Conditions:</span>
            <p className="whitespace-pre-line leading-relaxed">{invoice.termsConditions}</p>
          </div>

          <div className="text-center sm:text-right space-y-8">
            <p className="font-bold text-slate-800">For {company.name}</p>
            <div className="pt-8 border-t border-slate-400 w-44 inline-block text-center font-mono text-[9px] uppercase tracking-wider text-slate-400">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: PAYMENT ENTRIES SUBSYSTEM (प्रत्येक Invoice वर आलेले पैसे नोंदवण्यासाठी) */}
      <div className="no-print w-full max-w-4xl mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Payment History (प्रत्येक Invoice वर आलेले पैसे नोंदवणे)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track payment receipts, modes (Cash / UPI / Bank / Cheque) & automatic remaining balance
            </p>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Payment (पैसे नोंदवा)</span>
          </button>
        </div>

        {/* Automatic Calculation Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Invoice Amount
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              ₹{invoice.grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Total Paid (एकूण आलेले)
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-700 font-mono">
              ₹{totalPaid.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Remaining Balance (शिल्लक)
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-700 font-mono">
              ₹{remainingBalance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Payment Status
            </span>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
              computedStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : computedStatus === "PARTIAL"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-200 text-slate-800"
            }`}>
              {computedStatus}
            </span>
          </div>
        </div>

        {/* Payments Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Date तारीख</th>
                <th className="py-3 px-4">Mode प्रकार</th>
                <th className="py-3 px-4">Transaction ID / Ref</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Amount रक्कम (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map((p: PaymentEntry) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {p.paymentId || `PAY-${p.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.referenceNo || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {p.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No payment recorded yet for this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Payment Entry</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              {/* Context Summary */}
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Name:</span>
                  <span className="font-semibold text-slate-800">{customer.name}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-indigo-200/50">
                  <span className="text-slate-600 font-semibold">Remaining Balance:</span>
                  <span className="font-mono font-bold text-amber-700">₹{remainingBalance.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date तारीख *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount रक्कम (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>

              {/* Payment Mode: Cash / UPI / Bank / Cheque */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Payment Mode प्रकार *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Cash", "UPI", "Bank", "Cheque"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-1 text-center font-semibold rounded-lg border transition-all cursor-pointer ${
                        paymentMode === mode
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction ID / Reference / Cheque No
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI-12345678 or Cheque #987654"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks नोंद</label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="e.g. 50% design advance / 2nd stage milestone payment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Recording..." : "Save Payment Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Delete Invoice {invoice.invoiceNumber}?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete this invoice and all its payment history? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoice}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
