// scratch/test-features.mjs
async function runTests() {
  const baseUrl = "http://localhost:3000";

  console.log("--- 1. Testing Chatbot API with purchase phrase ---");
  const chatRes = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Modular Kitchen purchase with quantity 1 and amount 185000"
    })
  });
  const chatData = await chatRes.json();
  console.log("Chat Success:", chatData.success);
  console.log("Client:", chatData.extracted?.customerName);
  console.log("Project:", chatData.extracted?.projectName);
  console.log("Items:", chatData.extracted?.items);
  console.log("Calculation Preview:", {
    subtotal: chatData.calculationPreview?.subtotal,
    taxableAmount: chatData.calculationPreview?.taxableAmount,
    cgstAmount: chatData.calculationPreview?.cgstAmount,
    sgstAmount: chatData.calculationPreview?.sgstAmount,
    grandTotal: chatData.calculationPreview?.grandTotal
  });

  console.log("\n--- 2. Testing Chatbot API with Units & Discounts ---");
  const chatMulti = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Dr. Aditya Joshi sathi False Ceiling 450 Sq.Ft. 120 and Wardrobe 80 RFT 1600 with 5% discount"
    })
  });
  const multiData = await chatMulti.json();
  console.log("Multi Items:", multiData.extracted?.items);
  console.log("Discount Amount:", multiData.calculationPreview?.discountAmount);
  console.log("Grand Total:", multiData.calculationPreview?.grandTotal);

  console.log("\n--- 3. Testing Invoice Creation with Mandatory Fields ---");
  const createRes = await fetch(`${baseUrl}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "M/s Horizon Tech Labs",
      customerPhone: "9822019944",
      projectName: "Corporate Office Fit-out, Baner",
      siteAddress: "Level 4, IT Park, Baner, Pune",
      invoiceDate: "2026-11-24",
      items: [
        { description: "Corporate Office & Workspace Interior Fit-out", unit: "Sq.Ft.", quantity: 1200, rate: 850 },
        { description: "Architectural Track & Profile Lighting", unit: "LS", quantity: 1, rate: 65000 }
      ],
      discountType: "FLAT",
      discountValue: 20000,
      gstType: "CGST_SGST",
      gstRate: 18,
      paidAmount: 200000
    })
  });
  const createData = await createRes.json();
  console.log("Invoice Created:", createData.success);
  const inv = createData.invoice;
  console.log("Invoice Number (Automatic):", inv.invoiceNumber);
  console.log("Project Name (कामाचे नाव):", inv.projectName);
  console.log("Grand Total:", inv.grandTotal);
  console.log("Paid Amount:", inv.paidAmount);
  console.log("Balance Amount:", inv.balanceAmount);
  console.log("Initial Status:", inv.status);

  console.log("\n--- 4. Testing Payment Recording (प्रत्येक Invoice वर आलेले पैसे नोंदवणे) ---");
  const payRes = await fetch(`${baseUrl}/api/invoices/${inv.id}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: inv.balanceAmount, // Pay full balance!
      paymentDate: "2026-11-24",
      method: "Bank",
      referenceNo: "HDFC-NEFT-998822",
      notes: "Final settlement payment"
    })
  });
  const payData = await payRes.json();
  console.log("Payment Success:", payData.success);
  console.log("Payment ID (Automatic):", payData.payment?.paymentId);
  console.log("Payment Method:", payData.payment?.method);
  console.log("Total Paid:", payData.totalPaid);
  console.log("Remaining Balance:", payData.remainingBalance);
  console.log("Updated Payment Status:", payData.paymentStatus);

  console.log("\n--- 5. Testing Invoice Duplication ---");
  const dupRes = await fetch(`${baseUrl}/api/invoices/${inv.id}/duplicate`, {
    method: "POST"
  });
  const dupData = await dupRes.json();
  console.log("Duplication Success:", dupData.success);
  console.log("Duplicated Invoice No:", dupData.invoice?.invoiceNumber);
  console.log("Duplicated Project Name:", dupData.invoice?.projectName);

  console.log("\n--- 6. Testing Invoice Edit ---");
  const editRes = await fetch(`${baseUrl}/api/invoices/${dupData.invoice.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "M/s Horizon Tech Labs (Updated)",
      projectName: "Corporate Office Fit-out (Phase 2)",
      items: [
        { description: "Conference Room Acoustical Paneling", unit: "Sq.Ft.", quantity: 300, rate: 450 }
      ],
      gstType: "IGST",
      gstRate: 18
    })
  });
  const editData = await editRes.json();
  console.log("Edit Success:", editData.success);
  console.log("Updated Client:", editData.invoice?.customer?.name);
  console.log("Updated Project:", editData.invoice?.projectName);
  console.log("Updated GST Type:", editData.invoice?.gstType);
  console.log("Updated Grand Total:", editData.invoice?.grandTotal);

  console.log("\n--- ALL TESTS COMPLETED SUCCESSFULLY! ---");
}

runTests().catch(console.error);
