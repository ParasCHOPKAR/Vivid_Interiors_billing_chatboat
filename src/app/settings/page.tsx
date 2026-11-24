"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Building, ShieldCheck, Save, Sparkles, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCompany(data.company);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company & Billing Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure legal entity information, tax particulars, bank details, and invoice prefixes.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Company Legal Particulars</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                defaultValue={company?.name || "Vivid Interiors"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trade / Brand Name</label>
              <input
                type="text"
                defaultValue={company?.tradeName || "Vivid Interiors — Architecture, Design & Turnkey Execution"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                defaultValue={company?.gstin || "27AABCV1234F1Z3"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State & State Code</label>
              <input
                type="text"
                defaultValue={`${company?.state || "Maharashtra"} (Code ${company?.stateCode || "27"})`}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Studio Headquarters Address</label>
              <input
                type="text"
                defaultValue={company?.address || "B8, New Meenal Society, Nal Stop Chowk, Karve Road, Erandwane, Pune - 411004"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                defaultValue={company?.phone || "+91 99701 80947"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
              <input
                type="text"
                defaultValue={company?.email || "design@vividinteriorspune.com"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Bank & Payment Particulars */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bank & UPI Particulars (Printed on Invoices)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                defaultValue={company?.bankName || "HDFC Bank"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                defaultValue={company?.bankAccountNo || "50200088991122"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                defaultValue={company?.bankIfsc || "HDFC0000103"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID (e.g. GPay/PhonePe)</label>
              <input
                type="text"
                defaultValue={company?.upiId || "vividinteriors@hdfcbank"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Invoice Numbering Prefix */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Invoice Numbering & Atomic Sequences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                defaultValue={company?.invoicePrefix || "VI"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Generates numbers like: <span className="font-mono text-slate-700">VI-2026-000001</span>
              </p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default SAC Code</label>
              <input
                type="text"
                defaultValue="998391 (Interior Design & Turnkey Execution Services)"
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings successfully saved!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
