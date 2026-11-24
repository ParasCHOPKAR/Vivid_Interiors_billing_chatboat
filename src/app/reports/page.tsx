"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  FileCheck2,
  Users,
  CreditCard,
  Building
} from "lucide-react";

export default function ReportsPage() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const sheetsInfo = [
    {
      name: "Sheet 1 — All Invoices",
      desc: "Every issued invoice: Invoice No, Date, Customer, Subtotal, GST Breakdown, Total, Amount Paid, and Balance.",
      icon: FileSpreadsheet,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      name: "Sheet 2 — Invoice Items",
      desc: "Granular line items breakdown: SAC 998391 code, interior design scope, quantity, unit, and amount.",
      icon: Layers,
      color: "text-sky-600 bg-sky-50"
    },
    {
      name: "Sheet 3 — Customers",
      desc: "Client registry with registered phone numbers, GSTIN, site addresses, and billing addresses.",
      icon: Users,
      color: "text-amber-600 bg-amber-50"
    },
    {
      name: "Sheet 4 — Payments",
      desc: "Payment transactions, modes (UPI, Cash, NEFT), transaction reference numbers, and timestamps.",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      name: "Sheet 5 — GST Summary",
      desc: "GSTR-1 return filing ready summary with SAC code, Taxable value, CGST, SGST, IGST, and total tax.",
      icon: FileCheck2,
      color: "text-purple-600 bg-purple-50"
    },
    {
      name: "Sheet 6 — Daily Summary",
      desc: "Daily operational volume: Invoices generated per day, total sales, daily collections, and pending dues.",
      icon: Calendar,
      color: "text-rose-600 bg-rose-50"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Excel Export & Financial Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Auto-synchronized multi-sheet workbooks for accounting, audit, and GSTR-1 tax compliance.
        </p>
      </div>

      {/* Main Download Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Multi-Sheet Auto-Generated Register</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Interior_Billing_{currentYear}.xlsx
          </h2>
          <p className="text-sm text-emerald-100 max-w-xl">
            Download the comprehensive 6-sheet workbook formatted with professional headers, automated arithmetic formulas, and Indian currency values.
          </p>
        </div>

        <a
          href="/api/reports/excel"
          download
          className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition-all shadow-md"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Download Complete Workbook (.xlsx)</span>
        </a>
      </div>

      {/* Breakdown of the 6 Sheets */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">6-Sheet Workbook Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sheetsInfo.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
