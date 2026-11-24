"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Sparkles,
  Receipt,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Loader2,
  Compass,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Share2,
  CreditCard,
  Building2,
  Calculator,
  ArrowRight,
  X
} from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  preview?: any;
  confirmedInvoice?: any;
}

export default function ChatbotPage() {
  const [showGuide, setShowGuide] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "नमस्ते! नमस्कार! Welcome to **Vivid Interiors AI Billing Assistant** (Architecture, Design & Turnkey Execution — Erandwane, Pune).\n\nYou can speak or type in **English, Marathi (मराठी), or Hindi (हिन्दी)**.\n\nType any interior product with quantity and amount to **instantly start creating a tax invoice**, for example:\n• *\"Modular Kitchen purchase with quantity 1 and amount 185000\"*\n• *\"False Ceiling 450 sq ft 120 per sq ft and Wardrobe 80 rft 1600\"*\n• *\"Rajesh Kulkarni sathi 3BHK Turnkey Interior 1 job 850000 with 5% discount\"*"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState<"en-IN" | "mr-IN" | "hi-IN">("en-IN");
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  // Quick Payment Modal in Chatbot
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | string>("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode] = useState<"UPI" | "Cash" | "Bank" | "Cheque">("UPI");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLang;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is supported in Google Chrome and Microsoft Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = selectedLang;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isProcessing) return;

    const userMsg: Message = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          currentDraft: currentDraft
        })
      });

      const data = await res.json();
      if (data.success) {
        const { extracted, calculationPreview, matchedCustomer } = data;

        if (extracted.intent === "CLEAR_BILL") {
          setCurrentDraft(null);
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: extracted.messageReply
            }
          ]);
          setIsProcessing(false);
          return;
        }

        // Merge draft state
        const updatedDraft = {
          ...currentDraft,
          ...extracted,
          customerDetails: matchedCustomer || null
        };
        setCurrentDraft(updatedDraft);

        const aiMsg: Message = {
          sender: "ai",
          text: extracted.messageReply,
          preview: calculationPreview
            ? {
                customerName: extracted.customerName || "Walk-in Client / Consultation",
                projectName: extracted.projectName || "Turnkey Interior Architecture & Execution",
                phone: matchedCustomer?.phone || "Phone not recorded",
                siteAddress: matchedCustomer?.siteAddress || "Pune Site Location",
                gstType: extracted.gstType || "CGST_SGST",
                gstRate: extracted.gstRate !== undefined ? extracted.gstRate : 18,
                calculation: calculationPreview,
                rawDraft: updatedDraft
              }
            : undefined
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "माफ करा, समस्येमुळे प्रक्रिया पूर्ण होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा." }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Network error processing instruction. Please try again." }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle GST Type directly in live preview
  const handleToggleGstType = async (newType: "CGST_SGST" | "IGST" | "NO_GST") => {
    handleSendMessage(`set gst type to ${newType}`);
  };

  const confirmAndIssueBill = async (previewData: any) => {
    setIsIssuing(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: previewData.customerName || "Walk-in Client / Consultation",
          customerPhone: previewData.phone !== "Phone not recorded" ? previewData.phone : undefined,
          projectName: previewData.projectName || "Turnkey Interior Architecture & Execution",
          siteAddress: previewData.siteAddress,
          items: previewData.calculation.items,
          discountType: previewData.calculation.discountType,
          discountValue: previewData.calculation.discountValue,
          gstType: previewData.calculation.gstType || "CGST_SGST",
          gstRate: previewData.calculation.gstRate,
          paidAmount: 0
        })
      });

      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `✅ **Tax Invoice Successfully Issued! (कर बीजक यशस्वीपणे तयार झाले!)**\n\n📄 Invoice Number: **${json.invoice.invoiceNumber}**\n👤 Client: **${previewData.customerName}**\n🏗️ Project: **${json.invoice.projectName || previewData.projectName}**\n💰 Total: **₹${json.invoice.grandTotal.toLocaleString("en-IN")}**\n\nThe invoice has been safely registered and synchronized with your 6-sheet Excel report.`,
            confirmedInvoice: json.invoice
          }
        ]);
        setCurrentDraft(null); // Reset draft
      } else {
        alert(json.error || "Failed to issue invoice");
      }
    } catch (err) {
      alert("Error issuing invoice");
    } finally {
      setIsIssuing(false);
    }
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

🔗 *View & Print Invoice:*
${appUrl}

Vivid Interiors Pune • Erandwane`;

    const encoded = encodeURIComponent(message);
    const targetUrl = cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const amt = parseFloat(payAmount.toString());
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setIsRecordingPayment(true);
    try {
      const res = await fetch(`/api/invoices/${paymentModalInvoice.id}/payments`, {
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
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `💳 **Payment Recorded Successfully!**\n\nPayment ID: **${data.payment.paymentId}**\nInvoice: **${paymentModalInvoice.invoiceNumber}**\nAmount Paid: **₹${amt.toLocaleString("en-IN")}** via ${payMode}\nRemaining Balance: **₹${data.remainingBalance.toLocaleString("en-IN")}**\nPayment Status: **${data.paymentStatus}**`
          }
        ]);
        setPaymentModalInvoice(null);
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      alert("Error saving payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleReset = () => {
    handleSendMessage("clear");
  };

  // 1-Click Interactive Guide Templates
  const guideSteps = [
    {
      step: "Step 1",
      title: "Client & Project Name (ग्राहक आणि कामाचे नाव)",
      example: "Bill for Rajesh Kulkarni, Project: Flat 402 Turnkey",
      description: "Specify the customer name and project scope."
    },
    {
      step: "Step 2",
      title: "Interior Work, Quantity & Units (कामाचे वर्णन, प्रमाण, युनिट)",
      example: "Modular Kitchen purchase with quantity 1 and amount 185000 and False Ceiling 450 Sq.Ft. 120",
      description: "Units supported: Sq.Ft., Nos, RFT, LS, Job, Set."
    },
    {
      step: "Step 3",
      title: "Discounts & GST Type (सवलत आणि जीएसटी)",
      example: "with 5% discount and CGST+SGST",
      description: "Choose CGST+SGST (Intra-state), IGST (Inter-state) or No GST."
    },
    {
      step: "Step 4",
      title: "Instant Live Preview & One-Click Issue (थेट प्रिव्ह्यू आणि बिल)",
      example: "Confirm & Issue Tax Invoice",
      description: "The AI automatically calculates taxes and assigns the next VI-2026-XXXXXX number!"
    }
  ];

  const samplePrompts = [
    {
      label: "Purchase Phrasing",
      text: "Modular Kitchen purchase with quantity 1 and amount 185000"
    },
    {
      label: "Full 3BHK Turnkey",
      text: "Rajesh Kulkarni sathi 3BHK Turnkey Interior 1 job 850000 with 5% discount"
    },
    {
      label: "Ceiling & Wardrobe",
      text: "False Ceiling 450 Sq.Ft. 120 per sq ft and Wardrobe 80 RFT 1600"
    },
    {
      label: "TV Unit & Lighting",
      text: "TV Unit 1 Set 45000 and Track Lighting 1 LS 22000"
    },
    {
      label: "Marathi Voice/Text",
      text: "मॉड्युलर किचन 140000 आणि वॉर्डरोब 60000"
    },
    {
      label: "Hindi Voice/Text",
      text: "मॉड्यूलर किचन 125000 और वार्डरोब 65000 और फॉल्स सीलिंग 25000"
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-slate-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md shadow-slate-900/10">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base">
                Vivid Interiors AI Billing Assistant
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Architecture & Turnkey • Erandwane, Pune • Units: Sq.Ft. / Nos / RFT / LS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Guide Toggle Button */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showGuide ? "Hide Guide" : "How to Use Guide"}</span>
            <span className="sm:hidden">Guide</span>
            {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Reset Draft */}
          {currentDraft?.items?.length > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset current draft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Bill</span>
            </button>
          )}

          {/* Voice Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedLang}
              onChange={(e: any) => setSelectedLang(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none pr-1 cursor-pointer"
            >
              <option value="en-IN">English (India)</option>
              <option value="mr-IN">मराठी (Marathi)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* HOW TO USE CHATBOT GUIDE (मार्गदर्शक बॅनर) */}
      {showGuide && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white px-6 py-4 border-b border-indigo-950 transition-all shadow-md">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-amber-300">
                  📖 How to Use the AI Chatbot to Create a Bill (चॅटबॉटद्वारे बिल कसे तयार करावे)
                </h2>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Just type or speak naturally in <strong>English, Marathi, or Hindi</strong>. The bill starts creating <strong>immediately</strong> as soon as you type an item with quantity and amount!
            </p>

            {/* 4 Step Process Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {guideSteps.map((st, i) => (
                <div
                  key={i}
                  onClick={() => setInputText(st.example)}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 cursor-pointer transition-all space-y-1.5 group"
                  title="Click to copy into input box"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded">
                      {st.step}
                    </span>
                    <span className="text-[10px] text-indigo-200 group-hover:text-white flex items-center gap-0.5">
                      Try <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-white leading-snug">
                    {st.title}
                  </h3>
                  <p className="text-[11px] font-mono text-amber-200 truncate">
                    &quot;{st.example}&quot;
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "ai" && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`space-y-4 max-w-[92%] sm:max-w-[88%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                  msg.sender === "user"
                    ? "bg-slate-900 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>

              {/* LIVE TAX INVOICE PREVIEW CARD */}
              {msg.preview && (
                <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-5 sm:p-6 space-y-5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-900 text-sm">Live Tax Invoice Preview</span>
                        <span className="text-slate-400 text-xs ml-2">VI-2026-AUTO</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        VIVID INTERIORS PUNE
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ⚡ Ready to Issue
                      </span>
                    </div>
                  </div>

                  {/* Customer & Project summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Client (ग्राहक)</span>
                      <span className="font-semibold text-slate-900 text-sm">{msg.preview.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Project (कामाचे नाव)</span>
                      <span className="font-semibold text-indigo-700 text-xs truncate block">{msg.preview.projectName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Site Location</span>
                      <span className="text-slate-600 truncate block">{msg.preview.siteAddress}</span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Description कामाचे वर्णन</th>
                          <th className="py-2.5 px-3 text-center">SAC</th>
                          <th className="py-2.5 px-3 text-center">Unit युनिट</th>
                          <th className="py-2.5 px-3 text-center">Qty प्रमाण</th>
                          <th className="py-2.5 px-3 text-right">Rate दर (₹)</th>
                          <th className="py-2.5 px-3 text-right">Total रक्कम (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {msg.preview.calculation.items.map((it: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">{it.description}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">{it.hsnSacCode || "998391"}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{it.unit}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono">₹{it.rate.toLocaleString("en-IN")}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{it.amount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* GST Type Quick Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                    <span className="font-semibold text-slate-700">GST Type (जीएसटी प्रकार):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleGstType("CGST_SGST")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                          msg.preview.calculation.gstType === "CGST_SGST"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        CGST + SGST (Intra-State)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleGstType("IGST")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                          msg.preview.calculation.gstType === "IGST"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        IGST (Inter-State)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleGstType("NO_GST")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                          msg.preview.calculation.gstType === "NO_GST"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        No GST (0%)
                      </button>
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs font-mono border border-slate-200/60">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (एकूण रक्कम):</span>
                      <span>₹{msg.preview.calculation.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    {msg.preview.calculation.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount:</span>
                        <span>- ₹{msg.preview.calculation.discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-200/60">
                      <span>Taxable Value (करपात्र मूल्य):</span>
                      <span>₹{msg.preview.calculation.taxableAmount.toLocaleString("en-IN")}</span>
                    </div>

                    {msg.preview.calculation.gstType === "NO_GST" ? (
                      <div className="flex justify-between text-slate-500 italic">
                        <span>GST:</span>
                        <span>No GST Applicable (0%)</span>
                      </div>
                    ) : msg.preview.calculation.isInterState || msg.preview.calculation.gstType === "IGST" ? (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST ({msg.preview.calculation.gstRate}%):</span>
                        <span>₹{msg.preview.calculation.igstAmount.toLocaleString("en-IN")}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST ({msg.preview.calculation.gstRate / 2}%):</span>
                          <span>₹{msg.preview.calculation.cgstAmount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST ({msg.preview.calculation.gstRate / 2}%):</span>
                          <span>₹{msg.preview.calculation.sgstAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    )}

                    {msg.preview.calculation.roundOff !== 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Round Off:</span>
                        <span>₹{msg.preview.calculation.roundOff.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Grand Total (एकूण बिल):</span>
                      <span className="text-indigo-600 text-base font-black">
                        ₹{msg.preview.calculation.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Amount in words */}
                  <div className="text-[11px] text-slate-500 italic">
                    {msg.preview.calculation.amountInWords}
                  </div>

                  {/* Confirm CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500">
                      You can add more items by typing, or issue official sequence now.
                    </p>
                    <button
                      onClick={() => confirmAndIssueBill(msg.preview)}
                      disabled={isIssuing}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isIssuing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Sequential Invoice...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm & Issue Tax Invoice (बिल तयार करा)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* CONFIRMED INVOICE ACTIONS CARD */}
              {msg.confirmedInvoice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Official Tax Invoice Issued: {msg.confirmedInvoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-slate-600">
                        Total Amount: ₹{msg.confirmedInvoice.grandTotal.toLocaleString("en-IN")} • Registered in SQLite & 6-sheet Excel
                      </p>
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/70">
                    {/* Print Swiss A4 */}
                    <Link
                      href={`/invoices/${msg.confirmedInvoice.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Open & Print Invoice (Swiss A4)</span>
                    </Link>

                    {/* WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(msg.confirmedInvoice)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>

                    {/* Record Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentModalInvoice(msg.confirmedInvoice);
                        setPayAmount(msg.confirmedInvoice.grandTotal);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Record Payment (पैसे नोंदवा)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing interior requirements & creating live tax invoice preview...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Example Prompt Pills */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Click to test:
        </span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p.text)}
            className="shrink-0 text-xs bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 px-3 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <span className="font-semibold text-indigo-600 mr-1">[{p.label}]</span>
            <span>{p.text}</span>
          </button>
        ))}
      </div>

      {/* Input Box with Voice & Send */}
      <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          {/* Voice Microphone Toggle */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isRecording
                ? "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/20"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title={isRecording ? "Listening... click to stop" : "Speak instruction (English/Hindi/Marathi)"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type interior work (e.g. 'Modular Kitchen 1 job 185000' or 'False Ceiling 450 sq ft 120')"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PAYMENT ENTRY MODAL FROM CHATBOT */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Payment Entry (पैसे नोंदवा)</h3>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentModalInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{paymentModalInvoice.grandTotal.toLocaleString("en-IN")}
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
                  placeholder="e.g. Initial advance payment on confirmation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isRecordingPayment ? "Saving..." : "Record Payment Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
