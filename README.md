# Vivid Interiors — AI-Powered Multilingual Billing & Invoicing System

**Client Business:** [Vivid Interiors](https://vivid-interiors-c6on.vercel.app/)  
**Domain:** Architecture, Luxury Residential & Commercial Interior Design & Turnkey Contracting  
**Studio Headquarters:** B8, New Meenal Society, Nal Stop Chowk, Karve Road, Erandwane, Pune, Maharashtra - 411004, India  
**Serving Areas:** Erandwane, Kothrud, Model Colony, Baner, Wakad, and Greater Pune & Maharashtra  
**Phone:** +91 99701 80947 (Call & WhatsApp) / +91 89999 23438 | **Email:** design@vividinteriorspune.com  
**GSTIN:** `27AABCV1234F1Z3` | **Invoice Sequence:** `VI-2026-XXXXXX`  
**Standard GST:** 18% (CGST 9% + SGST 9% or IGST 18%) | **SAC Code:** `998391` (Interior Design & Turnkey Execution)  

---

## 🌟 Instant Product & Work Scope Chatbot (Live Bill Ingestion)

The AI Chatbot is built to **instantly start creating a tax invoice** the moment any interior product or service purchase with quantity/measurements and amount is typed or spoken:

### Supported Input Styles:
- **Product / Work + Quantity + Unit Rate:**
  > *"Modular Kitchen 1 job 185000"*  
  > $\rightarrow$ Creates item: Modular Kitchen Design & Execution (1 Job @ ₹1,85,000, SAC `998391`), computes CGST ₹16,650 + SGST ₹16,650, Grand Total: **₹2,18,300**.
- **Area / Measurement Based Phrasing:**
  > *"False Ceiling 450 sq ft 120 per sq ft and Wardrobe 80 rft 1600"*  
  > $\rightarrow$ Automatically computes False Ceiling (450 Sq. ft. @ ₹120 = ₹54,000) + Custom Wardrobe (80 Rft. @ ₹1,600 = ₹1,28,000), Subtotal: ₹1,82,000, Total with 18% GST: **₹2,14,760**.
- **Natural Purchase Phrasing:**
  > *"Modular Kitchen purchase with quantity 1 and amount 185000"*  
  > $\rightarrow$ Automatically creates the line item and live calculated preview.
- **Client Directives & Percentage Discounts:**
  > *"Rajesh Kulkarni sathi 3BHK Turnkey Interior 1 job 850000 with 5% discount"*  
  > $\rightarrow$ Links client *Rajesh Kulkarni*, applies 5% discount, computes net GST.
- **Hindi Ingestion:**
  > *"मॉड्यूलर किचन 125000 और वार्डरोब 65000 और फॉल्स सीलिंग 25000"*
- **Marathi Ingestion with Devanagari Numerals:**
  > *"मॉड्युलर किचन 140000 आणि वॉर्डरोब 60000"*
- **Voice Ingestion:** Click the microphone button in Google Chrome / Edge and speak directly in English, Marathi, or Hindi.

---

## 🛠️ Vivid Interiors Product & Scope Catalog (SAC 998391)

| Category | Typical Items | Default Unit | SAC Code |
| :--- | :--- | :---: | :---: |
| **Modular Kitchen & Cabinetry** | Modular Kitchen Design & Execution (Marine Ply, Acrylic / PU Finish, Quartz Top) | `Job` / `Rft.` | `998391` |
| **Wardrobes & Closets** | Custom Master Bedroom Wardrobes (Floor-to-ceiling, Sliding / Openable), Walk-in Closets | `Rft.` / `Job` | `998391` |
| **Ceiling & Lighting** | False Ceiling (Saint-Gobain Gypsum, POP & LED Cove Lighting), Magnetic Track Lights | `Sq. ft.` / `Job` | `998391` |
| **Living & Entertainment** | TV Unit & Fluted Wall Paneling, Foyer Consoles, Shoe Racks, Bar Counters | `Set` / `Sq. ft.` | `998391` |
| **Full Turnkey Packages** | 1BHK, 2BHK, 3BHK Full Turnkey Execution, Luxury Villa & Bungalow Interiors | `Job` | `998391` |
| **Flooring & Civil Work** | Italian Marble & Vitrified Tile Flooring, Demolition & Civil Alteration | `Sq. ft.` / `Job` | `998391` |
| **Painting & Wall Finishes** | Luxury Emulsion Painting (Royal / Velvet Touch) & Texture Walls | `Sq. ft.` | `998391` |
| **Architectural 3D & VR** | 3D Photorealistic Interior Renderings, 2D Working Drawings, VR Walkthrough | `Set` / `Job` | `998391` |

---

## 🖨️ Swiss Typography Print Invoices (`/invoices/[id]`)

- Formatted for standard **A4 paper** with native browser zero-margin print dialog (`window.print()`).
- Displays Vivid Interiors flagship studio branding, Nal Stop Chowk, Karve Road, Erandwane, Pune - 411004, GSTIN `27AABCV1234F1Z3`, bank details (HDFC Bank, IFSC `HDFC0000103`), UPI ID (`vividinteriors@hdfcbank`), SAC Code `998391`, amount in words, and authorized signatory seal.

---

## 💳 Payment Entry Subsystem (प्रत्येक Invoice वर आलेले पैसे नोंदवण्यासाठी)

A dedicated payment entry system tracks client advances and milestone settlements:
- **Payment ID:** Automatically generated (`PAY-2026-XXXXXX`)
- **Invoice Number & Client Name:** Pre-filled link
- **Payment Date:** Date of transaction
- **Payment Amount:** INR amount received
- **Payment Mode:** Cash, UPI (Google Pay, PhonePe), Bank (NEFT/RTGS), Cheque
- **Transaction ID & Remarks:** UTR / Cheque reference and milestone descriptions
- **Automatic Calculations:**
  - Invoice Grand Total
  - Total Paid Amount
  - Remaining Balance
  - Payment Status Badge: **`PAID`** (Green), **`PARTIAL`** (Amber), **`UNPAID`** (Gray)

---

## ⚡ Invoice Features (थेट कार्यक्षमता)

- **Automatic Invoice Number:** Sequential format `VI-YYYY-XXXXXX`
- **WhatsApp Sharing:** 1-click sharing pre-filled with client name, project name, totals, balance, and invoice link (`https://wa.me/?text=...`)
- **Duplicate Invoice:** 1-click clone into a new draft with the next sequential invoice number
- **Edit & Delete Invoice:** Permission-confirmed deletion and in-place editing of client, project, items, units (`Sq.Ft. / Nos / RFT / LS`), and GST types
- **GST Types:** `CGST + SGST` (Intra-state Maharashtra), `IGST` (Inter-state), `No GST` (0%)
- **AI Chatbot Guide:** Interactive expandable 4-step tutorial banner in `/chatbot` explaining how to create bills with 1-click test templates.

---

## 📊 Automated 6-Sheet Excel Reporting (`ExcelJS`)

Downloadable at `/api/reports/excel` or from the **Excel Reports** tab:
1. **Sheet 1 — All Invoices:** Master sales register with invoice numbers (`VI-2026-XXXXXX`), client names, taxable values, and balances.
2. **Sheet 2 — Invoice Items:** Line-item job breakdown with SAC `998391`, units (`Job`, `Sq. ft.`, `Rft.`, `Set`), quantities, and rates.
3. **Sheet 3 — Customers:** Residential & commercial client directory (Erandwane, Kothrud, Baner, Wakad, Pune).
4. **Sheet 4 — Payments:** Payment logs with payment modes (UPI, Cash, NEFT, Cheque) and reference numbers.
5. **Sheet 5 — GST Summary:** **GSTR-1 Ready** aggregated tax turnover under SAC `998391`.
6. **Sheet 6 — Daily Summary:** Daily project billing volume, collections, and outstanding receivables.

---

## 🚀 Quick Start Guide

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema
npx prisma db push

# 3. Seed Vivid Interiors company profile & Pune client directory
npx tsx prisma/seed.ts

# 4. Start local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** (or your active port `http://localhost:3002`) in your browser:
- **Executive Dashboard:** `http://localhost:3002`
- **Vivid Interiors AI Billing Chat:** `http://localhost:3002/chatbot`
- **All Invoices:** `http://localhost:3002/invoices`
- **Create Manual Invoice:** `http://localhost:3002/invoices/new`
- **6-Sheet Excel Reports:** `http://localhost:3002/reports`
- **Company & Studio Settings:** `http://localhost:3002/settings`
