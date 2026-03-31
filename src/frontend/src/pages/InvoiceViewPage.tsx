import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Printer } from "lucide-react";
import type { NavState } from "../App";
import { useActor } from "../hooks/useActor";

interface Props {
  invoiceId: bigint;
  setNav: (nav: NavState) => void;
}

const PL_HEADERS = [
  "S.No",
  "BRAND",
  "GRADE",
  "C.CODE",
  "COLOUR NAME",
  "THICKNESS",
  "LENGTH",
  "WIDTH",
  "QTY",
  "SQFT",
  "BATCH NO",
];

export default function InvoiceViewPage({ invoiceId, setNav }: Props) {
  const { actor, isFetching } = useActor();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", invoiceId.toString()],
    queryFn: () => actor!.getInvoice(invoiceId),
    enabled: !!actor && !isFetching,
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["companySettings"],
    queryFn: () => actor!.getCompanySettings(),
    enabled: !!actor && !isFetching,
  });

  const isLoading = invoiceLoading || companyLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Invoice not found
      </div>
    );

  const co = company ?? {
    companyName: "PRA PANELS PRIVATE LIMITED",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      phone: "",
      email: "",
    },
    gstin: "",
    phone: "",
    email: "",
    bankName: "",
    accountNumber: "",
    branchAndIfsc: "",
    termsAndConditions: "",
  };

  const cellStyle = {
    border: "0.5pt solid #000",
    padding: "2pt 3pt",
    textAlign: "center" as const,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Controls */}
      <div className="no-print flex items-center gap-3 p-4 bg-card border-b sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNav({ page: "invoices" })}
          data-ocid="packing_list.back.button"
        >
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <span className="text-sm font-medium flex-1">
          Packing List: {invoice.billNumber}
        </span>
        <Button
          data-ocid="packing_list.print.button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          <Printer size={14} className="mr-1" /> Print
        </Button>
        <Button
          data-ocid="packing_list.download.button"
          size="sm"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={() => window.print()}
        >
          <Download size={14} className="mr-1" /> Download PDF
        </Button>
      </div>

      {/* Printable Document */}
      <div
        id="print-area"
        style={{
          width: "210mm",
          margin: "0 auto",
          padding: "10mm",
          background: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "9pt",
          color: "#000",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "6pt",
            borderBottom: "2pt solid #000",
            paddingBottom: "6pt",
          }}
        >
          <div
            style={{
              fontSize: "7pt",
              fontWeight: "normal",
              letterSpacing: "1pt",
            }}
          >
            PACKING LIST
          </div>
          <div
            style={{
              fontSize: "16pt",
              fontWeight: "900",
              letterSpacing: "1pt",
              marginBottom: "2pt",
            }}
          >
            {co.companyName}
          </div>
          <div style={{ fontSize: "7.5pt" }}>{co.address.street}</div>
          <div style={{ fontSize: "7.5pt" }}>GSTIN - {co.gstin}</div>
          <div style={{ fontSize: "7.5pt" }}>
            Phone: {co.phone} | Email: {co.email}
          </div>
        </div>

        {/* Bill Info Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4pt",
            marginBottom: "4pt",
            fontSize: "8pt",
          }}
        >
          <div>
            <strong>Bill No: {invoice.billNumber}</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Date: {invoice.invoiceDate}</strong>
          </div>
        </div>

        {/* Party Info */}
        <div
          style={{
            border: "1pt solid #000",
            padding: "4pt",
            marginBottom: "4pt",
            fontSize: "8pt",
          }}
        >
          <div>
            <strong>PARTY NAME: {invoice.partyName}</strong>
            {invoice.dispatchLocation && (
              <>&nbsp;&nbsp; Dispatch Location: {invoice.dispatchLocation}</>
            )}
          </div>
          <div>ADDRESS - {invoice.billingAddress.street}</div>
          <div>
            CITY - {invoice.billingAddress.city}, {invoice.billingAddress.state}
          </div>
          {(invoice.gstin || invoice.piNumber) && (
            <div>
              {invoice.gstin && <>GSTIN - {invoice.gstin}</>}
              {invoice.gstin && invoice.piNumber && <>&nbsp;&nbsp;</>}
              {invoice.piNumber && <>PI NO. - {invoice.piNumber}</>}
            </div>
          )}
          {(invoice.phone || invoice.salesPerson) && (
            <div>
              {invoice.phone && <>MOBILE NO - {invoice.phone}</>}
              {invoice.phone && invoice.salesPerson && <>&nbsp;&nbsp;</>}
              {invoice.salesPerson && <>Sales Person: {invoice.salesPerson}</>}
            </div>
          )}
        </div>

        {/* Billing / Delivery Address Split */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1pt solid #000",
            marginBottom: "4pt",
            fontSize: "7.5pt",
          }}
        >
          <div style={{ padding: "4pt", borderRight: "1pt solid #000" }}>
            <div
              style={{
                fontWeight: "bold",
                textDecoration: "underline",
                marginBottom: "2pt",
              }}
            >
              BILLING ADDRESS
            </div>
            <div>
              <strong>{invoice.partyName}</strong>
            </div>
            <div>{invoice.billingAddress.street}</div>
            <div>
              {invoice.billingAddress.city}, {invoice.billingAddress.state}
            </div>
            {invoice.gstin && <div>GSTIN: {invoice.gstin}</div>}
            {invoice.phone && <div>Mobile: {invoice.phone}</div>}
          </div>
          <div style={{ padding: "4pt" }}>
            <div
              style={{
                fontWeight: "bold",
                textDecoration: "underline",
                marginBottom: "2pt",
              }}
            >
              DELIVERY ADDRESS
            </div>
            <div>
              <strong>{invoice.partyName}</strong>
            </div>
            <div>{invoice.deliveryAddress.street}</div>
            <div>
              {invoice.deliveryAddress.city}, {invoice.deliveryAddress.state}
            </div>
            {invoice.gstin && <div>GSTIN: {invoice.gstin}</div>}
            {(invoice.deliveryAddress.phone || invoice.phone) && (
              <div>
                Mobile: {invoice.deliveryAddress.phone || invoice.phone}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "7.5pt",
            marginBottom: "4pt",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {PL_HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    border: "0.5pt solid #000",
                    padding: "2pt 3pt",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "6.5pt",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: print table row
              <tr key={i}>
                <td style={cellStyle}>{i + 1}</td>
                <td style={cellStyle}>{item.brand}</td>
                <td style={cellStyle}>{item.grade}</td>
                <td style={cellStyle}>{item.colorCode}</td>
                <td style={{ ...cellStyle, textAlign: "left" }}>
                  {item.colorName}
                </td>
                <td style={cellStyle}>{item.thickness} MM</td>
                <td style={cellStyle}>{item.length}</td>
                <td style={cellStyle}>{item.width}</td>
                <td style={cellStyle}>{item.qty}</td>
                <td style={cellStyle}>{item.sqft.toFixed(2)}</td>
                <td style={cellStyle}>{item.batchNumber}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
              <td
                colSpan={8}
                style={{
                  border: "0.5pt solid #000",
                  padding: "2pt 3pt",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                TOTAL
              </td>
              <td
                style={{
                  border: "0.5pt solid #000",
                  padding: "2pt 3pt",
                  textAlign: "center",
                }}
              >
                {invoice.totalQty}
              </td>
              <td
                style={{
                  border: "0.5pt solid #000",
                  padding: "2pt 3pt",
                  textAlign: "center",
                }}
              >
                {invoice.totalSqft.toFixed(2)}
              </td>
              <td style={{ border: "0.5pt solid #000" }} />
            </tr>
          </tfoot>
        </table>

        {/* Remarks */}
        {invoice.remarks && (
          <div
            style={{
              border: "1pt solid #000",
              padding: "4pt",
              fontSize: "7.5pt",
              marginBottom: "6pt",
            }}
          >
            <strong>Remarks:</strong> {invoice.remarks}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8pt",
            marginTop: "16pt",
            fontSize: "7.5pt",
          }}
        >
          <div />
          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: "24pt" }}>For {co.companyName}</div>
            <div style={{ borderTop: "1pt solid #000", paddingTop: "2pt" }}>
              Authorised Signatory
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "6.5pt",
            marginTop: "8pt",
            color: "#555",
          }}
        >
          This is a Computer Generated Packing List
        </div>
      </div>
    </div>
  );
}
