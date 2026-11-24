"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  Clock,
  Users,
  Bot,
  FileSpreadsheet,
  PlusCircle,
  Printer,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  }, []);

  const stats = data?.stats || {
    billsTodayCount: 0,
    todayBillingVolume: 0,
    totalOutstanding: 0,
    customersCount: 0,
    recentInvoices: []
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! High-concurrency multilingual billing overview for{" "}
            <span className="font-semibold text-slate-800">{data?.company?.name || "Vivid Interiors"}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/excel"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Excel</span>
          </a>

          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
          >
            <Bot className="w-4 h-4" />
            <span>AI Billing Chat</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Bills Today */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Bills Today</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : stats.billsTodayCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Target: <span className="font-medium text-slate-700">200+ capacity</span>
            </p>
          </div>
        </div>

        {/* Card 2: Today's Billing */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Today's Billing</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : formatCurrency(stats.todayBillingVolume)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Lifetime: {formatCurrency(stats.totalLifetimeBilled || 0)}
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Outstanding Due</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : formatCurrency(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pending client collections</p>
          </div>
        </div>

        {/* Card 4: Customers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Total Clients</span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : stats.customersCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Interior architecture clients</p>
          </div>
        </div>
      </div>

      {/* AI Quick Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-medium">
            <Bot className="w-3.5 h-3.5" />
            <span>Voice & Text Invoicing (English • Marathi • Hindi)</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight">
            Create interior invoices & quotations with natural language
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Say or type: &ldquo;Modular Kitchen 1 job 185000&rdquo; or &ldquo;False Ceiling 450 sq ft 120 and Wardrobe 80 rft 1600&rdquo;.
          </p>
        </div>

        <Link
          href="/chatbot"
          className="shrink-0 px-5 py-3 rounded-xl bg-white text-indigo-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2"
        >
          <span>Open AI Assistant</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest tax invoices created in the system</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All Invoices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Invoice No</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Items</th>
                <th className="py-3 px-6 text-right">Taxable</th>
                <th className="py-3 px-6 text-right">Total (incl. GST)</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stats.recentInvoices && stats.recentInvoices.length > 0 ? (
                stats.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">
                      {inv.customer?.name}
                      <span className="block text-xs font-normal text-slate-400 font-mono">
                        {inv.customer?.phone}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {inv.items?.length || 0} line items
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600 font-mono text-xs">
                      ₹{inv.taxableAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-900 font-mono">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>View / Print</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm">No invoices created yet today.</p>
                    <Link
                      href="/chatbot"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create your first bill with AI Chat</span>
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
