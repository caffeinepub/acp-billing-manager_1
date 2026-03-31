import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { InvoiceType } from "./backend";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import InvoiceFormPage from "./pages/InvoiceFormPage";
import InvoiceViewPage from "./pages/InvoiceViewPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import ManagePricingPage from "./pages/ManagePricingPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TaxInvoiceViewPage from "./pages/TaxInvoiceViewPage";

export type Page =
  | "dashboard"
  | "customers"
  | "inventory"
  | "invoices"
  | "invoice-new-packing"
  | "invoice-new-tax"
  | "invoice-edit"
  | "invoice-view-packing"
  | "invoice-view-tax"
  | "reports"
  | "settings"
  | "manage-pricing";

export type NavState = {
  page: Page;
  invoiceId?: bigint;
  invoiceType?: InvoiceType;
};

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [seeded, setSeeded] = useState(false);

  // Seed sample data on first load
  useEffect(() => {
    if (!actor || seeded) return;
    setSeeded(true);
    void seedIfEmpty(actor);
  }, [actor, seeded]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (nav.page) {
      case "dashboard":
        return <DashboardPage setNav={setNav} />;
      case "customers":
        return <CustomersPage />;
      case "inventory":
        return <InventoryPage />;
      case "invoices":
        return <InvoicesPage setNav={setNav} />;
      case "invoice-new-packing":
        return (
          <InvoiceFormPage
            invoiceType={InvoiceType.packingList}
            setNav={setNav}
          />
        );
      case "invoice-new-tax":
        return (
          <InvoiceFormPage
            invoiceType={InvoiceType.taxInvoice}
            setNav={setNav}
          />
        );
      case "invoice-edit":
        return (
          <InvoiceFormPage
            invoiceId={nav.invoiceId}
            invoiceType={nav.invoiceType || InvoiceType.packingList}
            setNav={setNav}
          />
        );
      case "invoice-view-packing":
        return <InvoiceViewPage invoiceId={nav.invoiceId!} setNav={setNav} />;
      case "invoice-view-tax":
        return (
          <TaxInvoiceViewPage invoiceId={nav.invoiceId!} setNav={setNav} />
        );
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      case "manage-pricing":
        return <ManagePricingPage />;
      default:
        return <DashboardPage setNav={setNav} />;
    }
  };

  const isPrintView =
    nav.page === "invoice-view-packing" || nav.page === "invoice-view-tax";

  return (
    <>
      {isPrintView ? (
        renderPage()
      ) : (
        <Layout nav={nav} setNav={setNav}>
          {renderPage()}
        </Layout>
      )}
      <Toaster />
    </>
  );
}

async function seedIfEmpty(actor: import("./backend").backendInterface) {
  try {
    const [customers, settings] = await Promise.all([
      actor.listCustomers(),
      actor.getCompanySettings(),
    ]);

    if (!settings) {
      await actor.updateCompanySettings({
        companyName: "PRA PANELS PRIVATE LIMITED",
        address: {
          street:
            "Near Udyod Bhawan, 1st Floor, PRA House, Telibandha, Raipur, Chhattisgarh 492004",
          city: "Raipur",
          state: "Chhattisgarh",
          country: "India",
          phone: "8282828644",
          email: "accounts@prapanel.com",
        },
        gstin: "20AANCP2062R1Z3",
        phone: "8282828644",
        email: "accounts@prapanel.com",
        bankName: "BANK OF BARODA",
        accountNumber: "05100500000532",
        branchAndIfsc: "MAHAVIR GOUSHALA RAIPUR & BARB0RAIPUR",
        termsAndConditions:
          "1) Interest @18% P.A. will be charged if the bill is not paid Within 30 days from date of invoice.\n2) Our Responsibility ceases as soon as the goods leave premises and no claims in respect of breakage and lost in transit shall be entertained.\n3) TCS (U/s 206C(1H) Income Tax Act) Will Be Separately Charged at 0.1% on value of Receipts Exceeding Rs.50 Lakhs P.A. w.e.f. 01.10.2020, if it is applicable\n4) All the disputes subject to Raipur Jurisdiction",
      });
    }

    if (customers.length === 0) {
      const billingAddr = {
        street:
          "00, DEVI MANDAP ROAD, NEAR BANK OFFICERS COLONY, HESAL, KUNWAR SINGH COLONY, HEHAL",
        city: "Ranchi",
        state: "Jharkhand",
        country: "India",
        phone: "8210535799",
        email: "",
      };
      await actor.createCustomer({
        id: BigInt(0),
        name: "D & D INFRA",
        phone: "8210535799",
        email: "",
        gstin: "20CQQPS8470L1Z3",
        billingAddress: billingAddr,
        shippingAddress: billingAddr,
      });

      await Promise.all([
        actor.createInventoryItem({
          id: BigInt(0),
          brand: "ALUSTIC",
          grade: "AS-312",
          colorCode: "AT-26",
          colorName: "TRAFFIC YELLOW",
          thickness: 3,
          length: 12,
          width: 4,
          batchNumber: "TC-066A",
          sheetsAvailable: BigInt(50),
          lowStockThreshold: BigInt(10),
          sqftPerSheet: 48,
          purchaseRate: 0,
          sellingRate: 0,
        }),
        actor.createInventoryItem({
          id: BigInt(0),
          brand: "ALUSTIC",
          grade: "AS-312",
          colorCode: "AT-26",
          colorName: "TRAFFIC YELLOW",
          thickness: 3,
          length: 8,
          width: 4,
          batchNumber: "TC-066A",
          sheetsAvailable: BigInt(30),
          lowStockThreshold: BigInt(10),
          sqftPerSheet: 32,
          purchaseRate: 0,
          sellingRate: 0,
        }),
      ]);
    }
  } catch (e) {
    console.warn("Seed failed:", e);
  }
}
