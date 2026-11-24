"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  Printer,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Bot,
  Share2,
  CreditCard,
  Copy,
  Plus,
  X,
  Loader2
} from "lucide-react";

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Payment quick modal states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | string>("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode] = useState<"UPI" | "Cash" | "Bank" | "Cheque">("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = () => {
    setLoading(true);
    let url = `/api/invoices?search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching invoices:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleWhatsAppShare = (inv: any) => {
    const cleanPhone = inv.customer?.phone?.replace(/[^0-9]/g, "") || "";
    const appUrl = typeof window !== "undefined" ? `${window.location.origin}/invoices/${inv.id}` : "";

    const message = `🏛️ *TAX INVOICE — VIVID INTERIORS PUNE*
--------------------------------
📄 *Invoice No:* ${inv.invoiceNumber}
📅 *Date (तारीख):* ${new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
👤 *Client (ग्राहक):* ${inv.customer?.name}
🏗️ *Project (कामाचे नाव):* ${inv.projectName || "Turnkey Interior"}

💰 *Invoice Total:* ₹${inv.grandTotal.toLocaleString("en-IN")}
✅ *Total Paid:* ₹${(inv.paidAmount || 0).toLocaleString("en-IN")}
⚠️ *Remaining Balance:* ₹${(inv.balanceAmount || 0).toLocaleString("en-IN")}
📌 *Status:* ${inv.status}

🔗 *View / Print Invoice:*
${appUrl}`;

    const encoded = encodeURIComponent(message);
    const targetUrl = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoiceForPayment(inv);
    setPayAmount(inv.balanceAmount > 0 ? inv.balanceAmount : "");
    setPayRef("");
    setPayNotes("");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    const amt = parseFloat(payAmount.toString());
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoiceForPayment.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentDate: payDate,
          method: payMode,
          referenceNo: payRef,
          notes: payNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedInvoiceForPayment(null);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      alert("Error saving payment");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Vivid Interiors Tax Invoices (सर्व इनव्हॉइसेस)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, WhatsApp share, print Swiss A4 invoices and record customer payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/excel"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel 6-Sheet Register</span>
          </a>

          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Direct Bill Entry</span>
          </Link>

          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Create with AI Chatbot</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice No, Customer Name, Project Name or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">PAID (पूर्ण आलेले)</option>
            <option value="PARTIAL">PARTIAL (अंशतः आलेले)</option>
            <option value="ISSUED">UNPAID / ISSUED (बाकी)</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client & Project Name (कामाचे नाव)</th>
                <th className="py-3 px-4">Date तारीख</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading invoices...</span>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => {
                  const paid = inv.paidAmount || 0;
                  const balance = inv.balanceAmount !== undefined ? inv.balanceAmount : Math.max(0, inv.grandTotal - paid);
                  const status = balance === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-indigo-600 underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{inv.customer?.name}</span>
                        <span className="text-[11px] text-indigo-600 font-medium block truncate max-w-xs">
                          {inv.projectName || "Turnkey Interior"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {inv.customer?.phone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{inv.grandTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        ₹{paid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        ₹{balance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Button */}
                          <button
                            onClick={() => handleWhatsAppShare(inv)}
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment Button */}
                          {balance > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Record payment received"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print / View */}
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                            title="View & Print Swiss A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-xs">No invoices found matching criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL FROM LIST */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Payment Entry</h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedInvoiceForPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Name:</span>
                  <span className="font-semibold text-slate-800">{selectedInvoiceForPayment.customer?.name}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-indigo-200/50">
                  <span className="text-slate-600 font-semibold">Remaining Balance:</span>
                  <span className="font-mono font-bold text-amber-700">
                    ₹{(selectedInvoiceForPayment.balanceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date तारीख *</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount रक्कम (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Payment Mode प्रकार *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Cash", "UPI", "Bank", "Cheque"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`py-2 px-1 text-center font-semibold rounded-lg border transition-all cursor-pointer ${
                        payMode === mode
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction ID / Reference No
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-99887766 or Cheque #123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks नोंद</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Material delivery milestone payment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
