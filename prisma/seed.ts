import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vivid Interiors initial data...");

  // 1. Create or Update Default Company
  const company = await prisma.company.upsert({
    where: { id: "default-company-001" },
    update: {
      name: "Vivid Interiors",
      tradeName: "Vivid Interiors — Architecture, Design & Turnkey Execution",
      address: "B8, New Meenal Society, Nal Stop Chowk, Karve Road, Erandwane",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411004",
      phone: "+91 99701 80947",
      email: "design@vividinteriorspune.com",
      gstin: "27AABCV1234F1Z3",
      pan: "AABCV1234F",
      bankName: "HDFC Bank",
      bankAccountNo: "50200088991122",
      bankIfsc: "HDFC0000103",
      bankBranch: "Karve Road Branch, Pune",
      upiId: "vividinteriors@hdfcbank",
      invoicePrefix: "VI"
    },
    create: {
      id: "default-company-001",
      name: "Vivid Interiors",
      tradeName: "Vivid Interiors — Architecture, Design & Turnkey Execution",
      address: "B8, New Meenal Society, Nal Stop Chowk, Karve Road, Erandwane",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411004",
      phone: "+91 99701 80947",
      email: "design@vividinteriorspune.com",
      gstin: "27AABCV1234F1Z3",
      pan: "AABCV1234F",
      bankName: "HDFC Bank",
      bankAccountNo: "50200088991122",
      bankIfsc: "HDFC0000103",
      bankBranch: "Karve Road Branch, Pune",
      upiId: "vividinteriors@hdfcbank",
      invoicePrefix: "VI"
    }
  });

  // 2. Create Default Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@vividinteriorspune.com" },
    update: {
      companyId: company.id,
      name: "Vivid Studio Principal Architect",
      role: "ADMIN"
    },
    create: {
      companyId: company.id,
      name: "Vivid Studio Principal Architect",
      email: "admin@vividinteriorspune.com",
      password: "admin123",
      role: "ADMIN"
    }
  });

  // 3. Initialize Invoice Sequence for current year
  const currentYear = new Date().getFullYear().toString();
  await prisma.invoiceSequence.upsert({
    where: {
      companyId_fiscalYear: {
        companyId: company.id,
        fiscalYear: currentYear
      }
    },
    update: {
      prefix: "VI"
    },
    create: {
      companyId: company.id,
      fiscalYear: currentYear,
      prefix: "VI",
      currentNumber: 0
    }
  });

  // 4. Seed Demo Customers (Pune Residential & Commercial Clients)
  const customers = [
    {
      name: "Rajesh & Sunita Kulkarni",
      phone: "9822045678",
      email: "rajesh.kulkarni@gmail.com",
      billingAddress: "Flat 1402, Rohan Kritika, Sinhagad Road, Pune",
      siteAddress: "Flat 1402, Rohan Kritika, Sinhagad Road, Pune - 411030",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      gstin: "27AAACK1234F1Z2"
    },
    {
      name: "Dr. Aditya Joshi",
      phone: "9890198765",
      email: "aditya.joshi@puneclinics.in",
      billingAddress: "Villa 18, Beverly Hills, Baner-Pashan Link Road, Pune",
      siteAddress: "Villa 18, Beverly Hills, Baner-Pashan Link Road, Pune - 411045",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      gstin: ""
    },
    {
      name: "M/s Horizon Tech Labs Pvt Ltd",
      phone: "9823123456",
      email: "admin@horizontechlabs.com",
      billingAddress: "Office 501, 5th Floor, ICC Tech Park, Senapati Bapat Road, Pune",
      siteAddress: "5th Floor Corporate Fit-Out, ICC Tech Park, Pune - 411016",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      gstin: "27AAACH9876K1Z9"
    },
    {
      name: "Walk-in Client / Consultation",
      phone: "9970180947",
      email: "design@vividinteriorspune.com",
      billingAddress: "Erandwane Flagship Studio, Nal Stop Chowk, Karve Road, Pune - 411004",
      siteAddress: "Pune Local Site",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      gstin: ""
    }
  ];

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({
      where: { companyId: company.id, name: c.name }
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          companyId: company.id,
          ...c
        }
      });
    }
  }

  console.log("Seeding complete! Configured company:", company.name, "with Pune interior client directory.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
