import OpenAI from "openai";

export interface ExtractedBillData {
  language: "hi" | "mr" | "en";
  intent:
    | "CREATE_BILL"
    | "ADD_ITEM"
    | "APPLY_DISCOUNT"
    | "SET_GST"
    | "SHOW_PREVIEW"
    | "CONFIRM_BILL"
    | "CLEAR_BILL"
    | "SEARCH_BILL"
    | "GENERAL_QUERY";
  customerName?: string;
  phone?: string;
  projectName?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    hsnSacCode?: string;
  }>;
  discountValue?: number;
  discountType?: "PERCENT" | "FLAT";
  gstType?: "CGST_SGST" | "IGST" | "NO_GST";
  gstRate?: number;
  messageReply: string;
  readyForPreview: boolean;
}

/**
 * Normalizes Devanagari numerals (०-९) to standard ASCII numerals (0-9)
 */
function normalizeDevanagariDigits(str: string): string {
  const devanagariDigits = "०१२३४५६७८९";
  return str.replace(/[०-९]/g, (d) => devanagariDigits.indexOf(d).toString());
}

/**
 * Vivid Interiors (Architecture, Design & Turnkey Execution) Catalog
 * Aligned with https://vivid-interiors-c6on.vercel.app/
 */
const VIVID_INTERIORS_CATALOG = [
  // Modular Kitchen & Cabinetry
  {
    keywords: ["modular kitchen", "kitchen work", "acrylic kitchen", "pu kitchen", "किचन", "मॉड्युलर किचन", "मॉड्यूलर किचन"],
    label: "Modular Kitchen Design & Execution",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  // Wardrobes & Closets
  {
    keywords: ["wardrobe", "master bedroom wardrobe", "sliding wardrobe", "walk in closet", "walk-in closet", "कपाट", "वॉर्डरोब", "वार्डरोब"],
    label: "Custom Master Wardrobe & Storage",
    defaultHsn: "998391",
    defaultUnit: "Rft."
  },
  // False Ceiling & Lighting
  {
    keywords: ["false ceiling", "pop ceiling", "gypsum ceiling", "cove lighting", "सीलिंग", "फॉल्स सीलिंग", "पीओपी"],
    label: "False Ceiling (Gypsum / POP & Cove Lighting)",
    defaultHsn: "998391",
    defaultUnit: "Sq. ft."
  },
  // TV Unit & Wall Paneling
  {
    keywords: ["tv unit", "tv cabinet", "fluted panel", "wall paneling", "louvers", "टीव्ही युनिट", "टीवी यूनिट"],
    label: "TV Unit & Fluted Wall Paneling",
    defaultHsn: "998391",
    defaultUnit: "Set"
  },
  // Turnkey Packages
  {
    keywords: ["3bhk turnkey", "3bhk interior", "3 bhk interior", "3 bhk turnkey"],
    label: "3BHK Full Turnkey Interior Architecture",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  {
    keywords: ["2bhk turnkey", "2bhk interior", "2 bhk interior", "2 bhk turnkey"],
    label: "2BHK Full Turnkey Interior Architecture",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  {
    keywords: ["1bhk turnkey", "1bhk interior", "1 bhk interior", "1 bhk turnkey"],
    label: "1BHK Turnkey Interior Architecture",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  {
    keywords: ["villa interior", "bungalow interior", "bungalow", "villa turnkey"],
    label: "Luxury Villa & Bungalow Turnkey Execution",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  {
    keywords: ["living room", "living & dining", "hall renovation"],
    label: "Living & Dining Room Bespoke Design",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  // Flooring & Civil
  {
    keywords: ["italian marble", "marble flooring", "tile flooring", "vitrified tile", "flooring", "फ्लोरिंग"],
    label: "Vitrified Tile & Italian Marble Flooring",
    defaultHsn: "998391",
    defaultUnit: "Sq. ft."
  },
  {
    keywords: ["civil work", "demolition", "brickwork", "plaster"],
    label: "Civil Alteration, Demolition & Tiling",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  // Painting & Texture
  {
    keywords: ["painting", "royal paint", "texture wall", "wall finish", "रंगकाम", "पेंटिंग"],
    label: "Luxury Emulsion Painting & Texture Finish",
    defaultHsn: "998391",
    defaultUnit: "Sq. ft."
  },
  // Electrical & Lighting
  {
    keywords: ["electrical", "wiring", "track lighting", "magnetic track", "profile light", "इलेक्ट्रिकल"],
    label: "Architectural Track & Profile Lighting",
    defaultHsn: "998391",
    defaultUnit: "Job"
  },
  // 3D Visualization & Space Planning
  {
    keywords: ["3d design", "3d rendering", "walkthrough", "vr walkthrough", "architectural drawing", "working drawings"],
    label: "3D Photorealistic Architectural Renderings & Walkthrough",
    defaultHsn: "998391",
    defaultUnit: "Set"
  },
  // Balcony & Landscape
  {
    keywords: ["terrace garden", "balcony garden", "wooden decking", "vertical garden", "landscape"],
    label: "Terrace Garden & Balcony Wooden Decking",
    defaultHsn: "998391",
    defaultUnit: "Sq. ft."
  },
  // Commercial & Office
  {
    keywords: ["office interior", "corporate interior", "commercial workspace", "conference room"],
    label: "Corporate Office & Workspace Interior Fit-out",
    defaultHsn: "998391",
    defaultUnit: "Sq. ft."
  }
];

export class AIService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-local"
  });

  /**
   * Main parsing entry point
   */
  static async processUserInput(
    userMessage: string,
    currentDraft?: Partial<ExtractedBillData>
  ): Promise<ExtractedBillData> {
    const trimmed = normalizeDevanagariDigits(userMessage.trim());
    const lang = this.detectLanguage(trimmed);

    // If real OpenAI key is set, attempt OpenAI structured extraction
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        return await this.extractWithOpenAI(trimmed, lang, currentDraft);
      } catch (err) {
        console.warn("OpenAI API call failed, falling back to built-in Multilingual NLP:", err);
      }
    }

    // High-performance built-in offline Multilingual NLP parser for Vivid Interiors
    return this.parseLocally(trimmed, lang, currentDraft);
  }

  /**
   * Detects Hindi (Devanagari/Roman), Marathi (Devanagari/Roman), or English
   */
  static detectLanguage(text: string): "hi" | "mr" | "en" {
    const lower = text.toLowerCase();

    // Marathi specific markers (Devanagari & Roman)
    if (
      /[\u0900-\u097F]/.test(text) &&
      (text.includes("करा") ||
        text.includes("च्या") ||
        text.includes("साठी") ||
        text.includes("यांच्यासाठी") ||
        text.includes("तपासा") ||
        text.includes("आहे") ||
        text.includes("नग") ||
        text.includes("दराने") ||
        text.includes("आणि") ||
        text.includes("नवीन"))
    ) {
      return "mr";
    }
    if (
      lower.includes("sathi") ||
      lower.includes("kara") ||
      lower.includes("navane") ||
      lower.includes("chya") ||
      lower.includes("ani") ||
      lower.includes("darane")
    ) {
      return "mr";
    }

    // Hindi markers
    if (
      /[\u0900-\u097F]/.test(text) &&
      (text.includes("बनाओ") ||
        text.includes("के नाम") ||
        text.includes("दीजिये") ||
        text.includes("और") ||
        text.includes("रुपये") ||
        text.includes("नया"))
    ) {
      return "hi";
    }
    if (
      lower.includes("banao") ||
      lower.includes("naam se") ||
      lower.includes("karo") ||
      lower.includes("aur") ||
      lower.includes("lagao") ||
      lower.includes("chahiye")
    ) {
      return "hi";
    }

    return "en";
  }

  /**
   * Built-in rule-based Multilingual NLP Engine tailored for Vivid Interiors products & execution services
   */
  private static parseLocally(
    text: string,
    lang: "hi" | "mr" | "en",
    currentDraft?: Partial<ExtractedBillData>
  ): ExtractedBillData {
    const lower = text.toLowerCase();

    // 1. Check for Reset / Clear intent
    if (
      lower === "clear" ||
      lower === "reset" ||
      lower.includes("start over") ||
      lower.includes("new bill") ||
      lower.includes("नया बिल") ||
      lower.includes("नवीन बिल") ||
      lower.includes("रद्द करा")
    ) {
      return {
        language: lang,
        intent: "CLEAR_BILL",
        customerName: undefined,
        items: [],
        discountValue: 0,
        discountType: "FLAT",
        gstRate: 18,
        messageReply:
          lang === "mr"
            ? "बिल रीसेट केले आहे. आपण नवीन इंटीरियर कामाचे तपशील (उदा. 'मॉड्युलर किचन 1 job 185000') टाकू शकता."
            : lang === "hi"
            ? "बिल रीसेट कर दिया गया है। आप नए इंटीरियर कार्य (जैसे: 'मॉड्यूलर किचन 1 जॉब 185000') दर्ज कर सकते हैं।"
            : "Bill has been reset. You can type any interior product or service (e.g. 'Modular Kitchen 1 job 185000') to start a new bill.",
        readyForPreview: false
      };
    }

    // Clone existing items if any
    const items = currentDraft?.items ? [...currentDraft.items] : [];
    let customerName = currentDraft?.customerName;
    let projectName = currentDraft?.projectName || "Turnkey Interior Architecture & Execution";
    let discountValue = currentDraft?.discountValue || 0;
    let discountType = currentDraft?.discountType || "FLAT";
    let gstType: "CGST_SGST" | "IGST" | "NO_GST" = currentDraft?.gstType || "CGST_SGST";
    let gstRate = currentDraft?.gstRate !== undefined ? currentDraft.gstRate : 18;

    // 2. Customer Name Detection
    const customerPatterns = [
      /(?:bill for|create a? bill for|invoice for|client|customer(?:\s+is)?)\s+([A-Za-z0-9&.\- \u0900-\u097F]{2,35})/i,
      /([A-Za-z0-9&.\- \u0900-\u097F]{2,35})\s+(?:यांच्यासाठी|च्यासाठी|यांच्या नावाने|च्या नावाने|च्या|साठी|sathi|ke naam (?:se|pe)?|ko|ला)/i,
      /(?:M\/s\s+[A-Za-z0-9&.\- ]{2,35})/i,
      /(?:Mr\.|Mrs\.|Dr\.)\s+[A-Za-z0-9&.\- ]{2,35}/i,
      /([A-Za-z0-9&.\- ]+(?:Pvt\s+Ltd|Enterprises|Residency|Villa|Apartment|Flat|Associates))/i
    ];

    let detectedCustomerClause = "";
    for (const pat of customerPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        let extracted = match[1].trim();
        extracted = extracted
          .replace(/^(?:bill|invoice|create|banao|kar|kara|for|client|customer)\s+/i, "")
          .trim();
        if (
          extracted.length > 2 &&
          !["kitchen", "wardrobe", "false ceiling", "painting", "flooring", "interior", "किचन", "सीलिंग"].some((w) =>
            extracted.toLowerCase().includes(w)
          )
        ) {
          customerName = extracted;
          detectedCustomerClause = match[0];
          break;
        }
      }
    }

    // Project Name (कामाचे नाव) Detection
    const projectPatterns = [
      /(?:project(?:\s*name)?|कामाचे नाव|काम|site)\s*[:=]\s*([A-Za-z0-9&.\- /#,\u0900-\u097F]{3,50})/i,
      /(?:project)\s+([A-Za-z0-9&.\- /#,\u0900-\u097F]{3,40})/i
    ];
    let detectedProjectClause = "";
    for (const pat of projectPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        projectName = match[1].trim();
        detectedProjectClause = match[0];
        break;
      }
    }

    // 3. Discount Detection (e.g. "5% discount", "10000 rs discount", "10 percent discount")
    const pctDiscountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:%\s*|\s*percent\s*)discount/i);
    if (pctDiscountMatch) {
      discountType = "PERCENT";
      discountValue = parseFloat(pctDiscountMatch[1]);
    } else {
      const flatDiscountMatch = text.match(/(\d{2,7})\s*(?:rs|rupees|inr|₹|का)?\s*discount/i);
      if (flatDiscountMatch) {
        discountType = "FLAT";
        discountValue = parseFloat(flatDiscountMatch[1]);
      }
    }

    // 4. GST Type & Rate Detection (e.g. "CGST+SGST", "IGST", "No GST", "18% gst", "12% gst", "without gst")
    if (/without\s*gst|no\s*gst|0%\s*gst|zero\s*gst|बिना\s*जीएसटी|विना\s*जीएसटी/i.test(lower)) {
      gstType = "NO_GST";
      gstRate = 0;
    } else if (/igst|inter-?state/i.test(lower)) {
      gstType = "IGST";
    } else if (/cgst|sgst|intra-?state/i.test(lower)) {
      gstType = "CGST_SGST";
    }

    const gstMatch = text.match(/(\d{1,2})\s*%\s*gst/i);
    if (gstMatch) {
      gstRate = parseFloat(gstMatch[1]);
      if (gstRate === 0) gstType = "NO_GST";
    }

    // Clean text of customer clauses, project clauses and discount phrases before item extraction
    let cleanText = text;
    if (detectedCustomerClause) {
      cleanText = cleanText.replace(detectedCustomerClause, " ");
    }
    if (detectedProjectClause) {
      cleanText = cleanText.replace(detectedProjectClause, " ");
    }
    cleanText = cleanText
      .replace(/(?:and\s+)?(?:\d+(?:\.\d+)?\s*(?:%|percent)\s*discount|\d+\s*(?:rs|rupees|inr|₹|का)?\s*discount)/gi, " ")
      .trim();

    // 5. Intelligent Multi-Product / Work Extraction
    // Negative lookahead prevents splitting on "and amount", "and total", "and rate", etc.
    const segments = cleanText
      .split(
        /(?:\s+(?:and|aur|ani|&|\+|और|तथा|आणि)(?!\s+(?:amount|total|rate|price|cost|discount|\d+%\s*discount))\s+|,\s*|\n+)/i
      )
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    for (const segment of segments) {
      if (
        /^\s*(?:\d+%\s*discount|\d+\s*(?:rs|rupees)?\s*discount)\s*$/i.test(segment) ||
        /^\s*(?:customer|client|bill for)\s+/i.test(segment)
      ) {
        continue;
      }

      const extractedItem = this.extractItemFromSegment(segment);
      if (extractedItem) {
        const existingIdx = items.findIndex(
          (it) => it.description.toLowerCase() === extractedItem.description.toLowerCase()
        );
        if (existingIdx >= 0) {
          items[existingIdx] = extractedItem;
        } else {
          items.push(extractedItem);
        }
      }
    }

    // 6. Default Customer if not specified yet
    if (!customerName && items.length > 0) {
      customerName = "Walk-in Client / Consultation";
    }

    // 7. Bill starts creating IMMEDIATELY when items exist!
    const readyForPreview = items.length > 0;

    // 8. Generate Multilingual Reply
    let reply = "";
    if (readyForPreview) {
      const itemSummaries = items
        .map(
          (it) =>
            `• **${it.description}** — ${it.quantity} ${it.unit} @ ₹${it.rate.toLocaleString("en-IN")}${
              it.quantity > 1 ? ` = ₹${(it.quantity * it.rate).toLocaleString("en-IN")}` : ""
            } (SAC ${it.hsnSacCode || "998391"})`
        )
        .join("\n");

      if (lang === "mr") {
        reply = `✅ **व्हिव्हिड इंटीरियर्स टॅक्स इनव्हॉइस सुरू झाले आहे!**\n\nग्राहक: **${customerName}**\n${itemSummaries}\n\nखालील **लाईव्ह टॅक्स इनव्हॉइस प्रिव्ह्यू** तयार आहे. आपण आणखी इंटीरियर वर्क जोडू शकता किंवा **Confirm & Issue Tax Invoice** वर क्लिक करू शकता.`;
      } else if (lang === "hi") {
        reply = `✅ **विविड इंटीरियर्स टैक्स इनवॉइस शुरू हो गया है!**\n\nग्राहक: **${customerName}**\n${itemSummaries}\n\nनीचे **लाइव टैक्स इनवॉइस प्रिव्यू** तैयार है। आप और कार्य जोड़ सकते हैं, या सीधे **Confirm & Issue Tax Invoice** पर क्लिक करें।`;
      } else {
        reply = `✅ **Vivid Interiors Tax Invoice Started!**\n\nClient: **${customerName}**\n${itemSummaries}\n\nThe **Live Tax Invoice preview** is ready below with 18% GST (CGST 9% + SGST 9%). You can add more line items, adjust discounts, or click **Confirm & Issue Tax Invoice**.`;
      }
    } else {
      if (lang === "mr") {
        reply = `नमस्कार! **व्हिव्हिड इंटीरियर्स (पुणे)** बिलिंग असिस्टंटमध्ये आपले स्वागत आहे.\n\nकोणत्याही इंटीरियर कामाचे नाव, नग/क्षेत्रफळ आणि रक्कम टाईप करा. उदा.:\n*\"मॉड्युलर किचन 1 job 185000\"*\n*\"फॉल्स सीलिंग 450 sq ft 120 per sq ft\"*`;
      } else if (lang === "hi") {
        reply = `नमस्ते! **विविड इंटीरियर्स (पुणे)** बिलिंग असिस्टेंट में आपका स्वागत है।\n\nकिसी भी इंटीरियर प्रोडक्ट, क्वांटिटी और कीमत टाइप करें। जैसे:\n*\"मॉड्यूलर किचन 1 जॉब 185000\"*\n*\"फॉल्स सीलिंग 450 sq ft 120\"*`;
      } else {
        reply = `Welcome to **Vivid Interiors (Pune)** AI Billing Assistant!\n\nType any interior product or turnkey service with quantity and amount to instantly start creating a bill, e.g.:\n*\"Modular Kitchen 1 job 185000\"*\n*\"False Ceiling 450 sq ft 120 per sq ft and Wardrobe 80 rft 1600\"*`;
      }
    }

    return {
      language: lang,
      intent: readyForPreview ? "SHOW_PREVIEW" : "CREATE_BILL",
      customerName,
      projectName,
      items,
      discountValue,
      discountType,
      gstType,
      gstRate,
      messageReply: reply,
      readyForPreview
    };
  }

  /**
   * Granular Item Extraction from a natural language segment
   */
  private static extractItemFromSegment(segment: string): {
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    hsnSacCode: string;
  } | null {
    const raw = segment.trim();
    if (!raw) return null;

    // A. Check for "purchase [Product] with quantity [Q] and amount [A]" or "[Product] purchase with quantity [Q] and amount [A]"
    const patternA =
      /(?:purchase|purchased|bought|buy)?\s*(.+?)\s*(?:purchase|purchased|bought|buy)?\s+(?:with\s+)?(?:qty|quantity)\s*:?\s*(\d+(?:\.\d+)?)\s+(?:and\s+)?(?:total\s+)?(?:amount|amt|cost|price|rate)\s*:?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i;
    const matchA = raw.match(patternA);
    if (matchA) {
      let prodName = matchA[1].trim().replace(/^(?:purchase|purchased|bought|buy)\s+/i, "");
      const qty = parseFloat(matchA[2]) || 1;
      const amountVal = parseFloat(matchA[3]) || 0;
      const isTotal = /amount|total/i.test(matchA[0]) && !/each|per/i.test(matchA[0]);
      const rate = isTotal && qty > 0 ? Math.round(amountVal / qty) : amountVal;

      for (const cat of VIVID_INTERIORS_CATALOG) {
        if (cat.keywords.some((k) => prodName.toLowerCase().includes(k))) {
          prodName = cat.label;
          return {
            description: prodName,
            quantity: qty,
            unit: cat.defaultUnit,
            rate,
            hsnSacCode: cat.defaultHsn
          };
        }
      }

      return {
        description: this.capitalizeTitle(prodName),
        quantity: qty,
        unit: "Job",
        rate,
        hsnSacCode: "998391"
      };
    }

    // B. Detect Quantity & Unit
    // Recognizes: sq ft, sqft, rft, running feet, job, set, nos, units, lump sum, l/s, पीस, नग, स्क्वेअर फूट
    let quantity = 1;
    let unit = "Job";

    const explicitUnitPattern =
      /(?:(\d+(?:\.\d+)?)\s*(sq\.?\s*ft\.?|sqft|square\s*feet|स्क्वेअर\s*फूट|rft\.?|running\s*feet|रनिंग\s*फूट|jobs?|जॉब|sets?|सेट|nos?|pieces?|pcs|नग|पीस|lump\s*sum|l\/s|ls\b|लमसम))/i;
    const qtyOnlyPattern = /(?:qty|quantity)\s*:?\s*(\d+(?:\.\d+)?)/i;

    const unitMatch = raw.match(explicitUnitPattern);
    const qtyOnlyMatch = raw.match(qtyOnlyPattern);

    if (unitMatch) {
      quantity = parseFloat(unitMatch[1]) || 1;
      const matchedUnit = unitMatch[2].toLowerCase();
      if (/sq|स्क्वेअर/i.test(matchedUnit)) unit = "Sq.Ft.";
      else if (/rft|running|रनिंग/i.test(matchedUnit)) unit = "RFT";
      else if (/set|सेट/i.test(matchedUnit)) unit = "Set";
      else if (/nos?|pcs|pieces?|नग|पीस/i.test(matchedUnit)) unit = "Nos";
      else if (/lump|l\/s|ls|लमसम/i.test(matchedUnit)) unit = "LS";
      else unit = "Job";
    } else if (qtyOnlyMatch) {
      quantity = parseFloat(qtyOnlyMatch[1]) || 1;
    }

    // C. Detect Rate / Amount
    let rate = 0;
    const explicitRateMatch =
      raw.match(/(?:rate|price|cost|amount|@|at|दराने|ने)\s*:?\s*(?:₹|rs\.?|inr)?\s*(\d{2,8}(?:\.\d{1,2})?)/i) ||
      raw.match(/(?:₹|rs\.?|inr)\s*(\d{2,8}(?:\.\d{1,2})?)/i) ||
      raw.match(/(\d{2,8}(?:\.\d{1,2})?)\s*(?:each|per\s*(?:sq\.?\s*ft|rft|job|set|pc|unit)|\/-|रुपये)/i);

    if (explicitRateMatch) {
      rate = parseFloat(explicitRateMatch[1]);
    }

    // If unit was not explicitly accompanied by quantity, check if leading number is quantity!
    // E.g. "1 Modular Kitchen 185000" or "400 False Ceiling 120"
    if (!unitMatch && !qtyOnlyMatch) {
      const leadingNumberMatch = raw.match(/^\s*(\d{1,5})\s+(.+)/);
      if (leadingNumberMatch) {
        const candidateQty = parseFloat(leadingNumberMatch[1]);
        const rest = leadingNumberMatch[2];
        const restNumbers = [...rest.matchAll(/\b(\d{2,8})\b/g)].map((m) => parseFloat(m[1]));
        if (restNumbers.length > 0) {
          quantity = candidateQty;
          if (rate === 0) {
            rate = restNumbers[restNumbers.length - 1];
          }
        }
      }
    }

    // If rate is still not determined, pick the largest or last standalone number >= 50
    if (rate === 0) {
      const allNumbers = [...raw.matchAll(/\b(\d{2,8})\b/g)].map((m) => parseFloat(m[1]));
      for (let i = allNumbers.length - 1; i >= 0; i--) {
        const n = allNumbers[i];
        if (n !== quantity && n >= 50) {
          rate = n;
          break;
        }
      }
    }

    if (rate <= 0) return null;

    // D. Extract Product / Service Name
    let prodText = raw
      .replace(/(?:qty|quantity)\s*:?\s*\d+(?:\.\d+)?/gi, "")
      .replace(/\b\d+(?:\.\d+)?\s*(?:sq\.?\s*ft\.?|sqft|square\s*feet|rft\.?|running\s*feet|jobs?|sets?|nos?|pieces?|pcs|lump\s*sum|l\/s|नग|पीस|स्क्वेअर\s*फूट|रनिंग\s*फूट)\b/gi, "")
      .replace(/(?:rate|price|cost|amount|@|at|दराने|ने)\s*:?\s*(?:₹|rs\.?|inr)?\s*\d{2,8}(?:\.\d{1,2})?/gi, "")
      .replace(/(?:₹|rs\.?|inr)\s*\d{2,8}(?:\.\d{1,2})?/gi, "")
      .replace(/\b\d{2,8}(?:\.\d{1,2})?\s*(?:each|per\s*(?:sq\.?\s*ft|rft|job|set|pc|unit)|\/-|रुपये)\b/gi, "")
      .replace(/\b(purchase|purchased|bought|buy|order|add|bill|item|amount|price|rate|with|for|each|of)\b/gi, "")
      .replace(/[\b\s]+(?:रुपये|नग|पीस|च्या|साठी|ने|दराने)[\b\s]*/g, " ")
      .trim();

    if (rate > 0) {
      prodText = prodText.replace(new RegExp(`\\b${rate}\\b`, "g"), "");
    }
    if (quantity > 0) {
      prodText = prodText.replace(new RegExp(`\\b${quantity}\\b`, "g"), "");
    }
    prodText = prodText.replace(/\s{2,}/g, " ").trim();

    // Check against known Vivid Interiors catalog
    const lowerRaw = raw.toLowerCase();
    for (const cat of VIVID_INTERIORS_CATALOG) {
      for (const kw of cat.keywords) {
        if (lowerRaw.includes(kw)) {
          // If unit wasn't explicitly stated in raw text, use the catalog's natural default unit!
          const finalUnit = !unitMatch ? cat.defaultUnit : unit;
          return {
            description: cat.label,
            quantity: quantity > 0 ? quantity : 1,
            unit: finalUnit,
            rate,
            hsnSacCode: cat.defaultHsn
          };
        }
      }
    }

    const cleanProd = prodText.replace(/^[-:,\s]+|[-:,\s]+$/g, "");
    const finalDescription = cleanProd.length >= 2 ? cleanProd : "Bespoke Interior Execution";

    return {
      description: this.capitalizeTitle(finalDescription),
      quantity: quantity > 0 ? quantity : 1,
      unit,
      rate,
      hsnSacCode: "998391"
    };
  }

  private static capitalizeTitle(s: string): string {
    return s
      .split(" ")
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  /**
   * OpenAI Structured Output Pipeline for advanced reasoning when API key is provided
   */
  private static async extractWithOpenAI(
    userMessage: string,
    lang: "hi" | "mr" | "en",
    currentDraft?: Partial<ExtractedBillData>
  ): Promise<ExtractedBillData> {
    const prompt = `You are the AI Billing Assistant for "Vivid Interiors", Pune (Architecture, Design & Turnkey Execution - https://vivid-interiors-c6on.vercel.app/).
Extract interior project particulars from the user's message in Hindi, Marathi, or English.
RULES:
1. Vivid Interiors provides: Modular Kitchens, Custom Wardrobes, False Ceiling & Cove Lighting, TV Units & Wall Paneling, 1BHK/2BHK/3BHK Full Turnkey Interior Architecture, Flooring, Painting, 3D VR Walkthroughs, Terrace Gardens.
2. Standard SAC: 998391 (Interior design & turnkey execution services).
3. Typical units: Job, Sq. ft., Rft., Set, Nos, Lump Sum.
4. If user gives quantity and total amount (e.g. quantity 1 amount 185000), rate = amount / quantity.
5. If client name is not mentioned, use "Walk-in Client / Consultation".
Existing Draft: ${JSON.stringify(currentDraft || {})}`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    const items = parsed.items || currentDraft?.items || [];
    const customerName = parsed.customerName || currentDraft?.customerName || "Walk-in Client / Consultation";

    return {
      language: lang,
      intent: items.length > 0 ? "SHOW_PREVIEW" : "CREATE_BILL",
      customerName,
      items,
      discountValue: parsed.discountValue ?? currentDraft?.discountValue ?? 0,
      discountType: parsed.discountType ?? currentDraft?.discountType ?? "FLAT",
      gstRate: parsed.gstRate ?? currentDraft?.gstRate ?? 18,
      messageReply:
        parsed.messageReply ||
        `Processed invoice with ${items.length} interior items for ${customerName}.`,
      readyForPreview: items.length > 0
    };
  }
}
