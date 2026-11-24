"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FilePlus,
  Receipt,
  Users,
  FileSpreadsheet,
  Settings,
  Sparkles
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "AI Billing Chat", href: "/chatbot", icon: Bot, badge: "AI" },
    { label: "Create Bill", href: "/invoices/new", icon: FilePlus },
    { label: "All Invoices", href: "/invoices", icon: Receipt },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Excel Reports", href: "/reports", icon: FileSpreadsheet },
    { label: "Settings", href: "/settings", icon: Settings }
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20">
          VI
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white">Vivid Interiors</h1>
          <p className="text-xs text-slate-400 font-mono">Architecture & Turnkey • Pune</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Quick Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
            VI
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Vivid Interiors</p>
            <p className="text-[11px] text-slate-400 truncate">GST: 27AABCV1234F1Z3</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
