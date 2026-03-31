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

const TI_HEADERS = [
  "S.No",
  "Description of Goods",
  "HSN/SAC",
  "GST%",
  "Qty (SQFT)",
  "Rate/SQFT",
  "Disc.",
  "Amount",
];
const HSN_HEADERS = [
  "HSN",
  "Taxable Value",
  "Tax %",
  "CGST",
  "SGST",
  "IGST",
  "Total Tax",
];

export default function TaxInvoiceViewPage({ invoiceId, setNav }: Props) {
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
    termsAndConditions:
      "1) Interest @18% P.A. will be charged if the bill is not paid Within 30 days from date of invoice.",
  };

  const td = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: "0.5pt solid #000",
    padding: "2pt 3pt",
    verticalAlign: "top",
    ...extra,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: "6pt",
    color: "#666",
    display: "block",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Controls */}
      <div className="no-print flex items-center gap-3 p-4 bg-card border-b sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNav({ page: "invoices" })}
          data-ocid="tax_invoice.back.button"
        >
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <span className="text-sm font-medium flex-1">
          Tax Invoice: {invoice.billNumber}
        </span>
        <Button
          data-ocid="tax_invoice.print.button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          <Printer size={14} className="mr-1" /> Print
        </Button>
        <Button
          data-ocid="tax_invoice.download.button"
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
          background: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "8pt",
          color: "#000",
        }}
      >
        {/* ===== PAGE 1 ===== */}
        <div style={{ padding: "8mm", pageBreakAfter: "always" }}>
          {/* Document Title Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "4pt",
              borderBottom: "1pt solid #000",
              paddingBottom: "4pt",
            }}
          >
            <div>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>
                Tax Invoice
              </div>
              <div style={{ fontSize: "7pt", color: "#555" }}>
                (Original Recipient For)
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "7pt" }}>
              {invoice.irnNumber && <div>IRN: {invoice.irnNumber}</div>}
              {invoice.ackNumber && <div>AckNo: {invoice.ackNumber}</div>}
              {invoice.ackDate && <div>AckDt: {invoice.ackDate}</div>}
            </div>
          </div>

          {/* Company Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "6pt",
              borderBottom: "1pt solid #000",
              paddingBottom: "4pt",
            }}
          >
            <div
              style={{
                fontSize: "14pt",
                fontWeight: "900",
                letterSpacing: "0.5pt",
              }}
            >
              {co.companyName}
            </div>
            <div style={{ fontSize: "7pt" }}>{co.address.street}</div>
            <div style={{ fontSize: "7pt" }}>
              GSTIN: {co.gstin} | Ph: {co.phone} | Email: {co.email}
            </div>
          </div>

          {/* Consignee + Invoice Info Grid */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "4pt",
              fontSize: "7.5pt",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{ ...td(), width: "55%", verticalAlign: "top" }}
                  rowSpan={4}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "2pt" }}>
                    Consignee (Ship to)
                  </div>
                  <div>
                    <strong>{invoice.partyName}</strong>
                  </div>
                  <div>{invoice.deliveryAddress.street}</div>
                  <div>
                    {invoice.deliveryAddress.city},{" "}
                    {invoice.deliveryAddress.state}
                  </div>
                  <div>GSTIN/UIN: {invoice.gstin}</div>
                  <div>State: {invoice.deliveryAddress.state}</div>
                  <div>
                    Contact: {invoice.deliveryAddress.phone || invoice.phone}
                  </div>
                </td>
                <td style={td({ width: "22.5%" })}>
                  <span style={labelStyle}>Invoice No.</span>
                  <strong>{invoice.billNumber}</strong>
                </td>
                <td style={td({ width: "22.5%" })}>
                  <span style={labelStyle}>Dated</span>
                  <strong>{invoice.invoiceDate}</strong>
                </td>
              </tr>
              <tr>
                <td style={td()}>
                  <span style={labelStyle}>Buyer&apos;s Order No.</span>
                  {invoice.piNumber}
                </td>
                <td style={td()}>
                  <span style={labelStyle}>Dated</span>
                  {invoice.invoiceDate}
                </td>
              </tr>
              <tr>
                <td style={td()}>
                  <span style={labelStyle}>Vehicle No.</span>
                  {invoice.vehicleNo}
                </td>
                <td style={td()}>
                  <span style={labelStyle}>Destination</span>
                  {invoice.destination}
                </td>
              </tr>
              <tr>
                <td style={td()}>
                  <span style={labelStyle}>LR No.</span>
                  {invoice.lrNo}
                </td>
                <td style={td()}>
                  <span style={labelStyle}>LR Date</span>
                  {invoice.lrDate}
                </td>
              </tr>
              <tr>
                <td style={{ ...td(), verticalAlign: "top" }} rowSpan={3}>
                  <div style={{ fontWeight: "bold", marginBottom: "2pt" }}>
                    Buyer (Bill to)
                  </div>
                  <div>
                    <strong>{invoice.partyName}</strong>
                  </div>
                  <div>{invoice.billingAddress.street}</div>
                  <div>
                    {invoice.billingAddress.city},{" "}
                    {invoice.billingAddress.state}
                  </div>
                  <div>GSTIN/UIN: {invoice.gstin}</div>
                  <div>State: {invoice.billingAddress.state}</div>
                  <div>Contact: {invoice.phone}</div>
                </td>
                <td style={td()}>
                  <span style={labelStyle}>Delivery Mode</span>
                  {invoice.deliveryMode}
                </td>
                <td style={td()}>
                  <span style={labelStyle}>E-way Bill No.</span>
                  {invoice.ewayBillNo}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={td()}>
                  <span style={labelStyle}>Dispatch Location</span>
                  {invoice.dispatchLocation}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={td()}>
                  <span style={labelStyle}>Sales Person</span>
                  {invoice.salesPerson}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "7pt",
              marginBottom: "4pt",
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                {TI_HEADERS.map((h, hi) => (
                  <th
                    key={h}
                    style={{
                      border: "0.5pt solid #000",
                      padding: "2pt 3pt",
                      textAlign: hi === 1 ? "left" : "center",
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
                  <td style={{ ...td(), textAlign: "center" }}>{i + 1}</td>
                  <td style={td()}>
                    <div style={{ fontWeight: "bold" }}>
                      ALUMINIUM COMPOSITE PANEL
                    </div>
                    <div>
                      ACP, Grade - {item.grade}, Color - {item.colorName}, Color
                      Code - {item.colorCode}, Thickness - {item.thickness} MM,
                      Size - {item.length}x{item.width}, Batch No. -{" "}
                      {item.batchNumber}
                    </div>
                  </td>
                  <td style={{ ...td(), textAlign: "center" }}>
                    {invoice.hsnSac}
                  </td>
                  <td style={{ ...td(), textAlign: "center" }}>
                    {invoice.gstRate}%
                  </td>
                  <td style={{ ...td(), textAlign: "center" }}>
                    {item.sqft.toFixed(2)}
                  </td>
                  <td style={{ ...td(), textAlign: "right" }}>
                    {invoice.ratePerSqft.toFixed(2)}
                  </td>
                  <td style={{ ...td(), textAlign: "right" }}>-</td>
                  <td style={{ ...td(), textAlign: "right" }}>
                    {(item.sqft * invoice.ratePerSqft).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={td()}>
                  <strong>State Tax (SGST)</strong>
                </td>
                <td colSpan={2} style={{ ...td(), textAlign: "center" }}>
                  {invoice.gstRate / 2}%
                </td>
                <td colSpan={2} style={td()} />
                <td style={{ ...td(), textAlign: "right" }}>
                  <strong>{invoice.sgstAmount.toFixed(2)}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={td()}>
                  <strong>Central Tax (CGST)</strong>
                </td>
                <td colSpan={2} style={{ ...td(), textAlign: "center" }}>
                  {invoice.gstRate / 2}%
                </td>
                <td colSpan={2} style={td()} />
                <td style={{ ...td(), textAlign: "right" }}>
                  <strong>{invoice.cgstAmount.toFixed(2)}</strong>
                </td>
              </tr>
              <tr style={{ background: "#f0f0f0" }}>
                <td colSpan={3} style={{ ...td(), textAlign: "right" }}>
                  <strong>TOTAL</strong>
                </td>
                <td style={td()} />
                <td style={{ ...td(), textAlign: "center" }}>
                  <strong>{invoice.totalSqft.toFixed(2)}</strong>
                </td>
                <td colSpan={2} style={td()} />
                <td style={{ ...td(), textAlign: "right" }}>
                  <strong>{invoice.grandTotal.toFixed(2)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div
            style={{
              border: "0.5pt solid #000",
              padding: "3pt",
              fontSize: "7.5pt",
              marginBottom: "4pt",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong>Amount (in words):</strong> {invoice.amountInWords} Only
            </div>
            <div>
              <strong>E. &amp; O.E.</strong>
            </div>
          </div>

          {/* HSN Summary */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "7pt",
              marginBottom: "4pt",
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                {HSN_HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      border: "0.5pt solid #000",
                      padding: "2pt 3pt",
                      textAlign: "center",
                      fontSize: "6.5pt",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td(), textAlign: "center" }}>
                  {invoice.hsnSac}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.taxableAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "center" }}>
                  {invoice.gstRate}%
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.cgstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.sgstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.igstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {(
                    invoice.cgstAmount +
                    invoice.sgstAmount +
                    invoice.igstAmount
                  ).toFixed(2)}
                </td>
              </tr>
              <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
                <td style={{ ...td(), textAlign: "center" }}>Total</td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.taxableAmount.toFixed(2)}
                </td>
                <td style={td()} />
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.cgstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.sgstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {invoice.igstAmount.toFixed(2)}
                </td>
                <td style={{ ...td(), textAlign: "right" }}>
                  {(
                    invoice.cgstAmount +
                    invoice.sgstAmount +
                    invoice.igstAmount
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Remarks + Terms */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "4pt",
              fontSize: "7pt",
            }}
          >
            <div style={{ border: "0.5pt solid #000", padding: "3pt" }}>
              <strong>Remarks:</strong>
              <br />
              {invoice.remarks}
            </div>
            <div style={{ border: "0.5pt solid #000", padding: "3pt" }}>
              <strong>Terms &amp; Conditions:</strong>
              {co.termsAndConditions.split("\n").map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static T&C lines
                <div key={i} style={{ marginTop: "1pt" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PAGE 2 ===== */}
        <div style={{ padding: "8mm", pageBreakBefore: "always" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8pt",
              fontSize: "8pt",
            }}
          >
            {/* Declaration */}
            <div style={{ border: "0.5pt solid #000", padding: "6pt" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4pt" }}>
                Declaration
              </div>
              <div style={{ fontSize: "7pt", lineHeight: "1.5" }}>
                We declare that this invoice shows the actual price of the goods
                described and that all particulars are true and correct.
              </div>
            </div>

            {/* Bank Details */}
            <div style={{ border: "0.5pt solid #000", padding: "6pt" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4pt" }}>
                Company&apos;s Bank Details
              </div>
              <div style={{ fontSize: "7.5pt", lineHeight: "1.8" }}>
                <div>
                  <strong>Bank Name:</strong> {co.bankName}
                </div>
                <div>
                  <strong>A/c No.:</strong> {co.accountNumber}
                </div>
                <div>
                  <strong>Branch &amp; IFS Code:</strong> {co.branchAndIfsc}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ textAlign: "right", marginTop: "24pt", fontSize: "8pt" }}
          >
            <div style={{ marginBottom: "32pt" }}>For {co.companyName}</div>
            <div
              style={{
                borderTop: "0.5pt solid #000",
                display: "inline-block",
                paddingTop: "2pt",
                minWidth: "80pt",
              }}
            >
              Authorised Signatory
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "24pt",
              fontSize: "6.5pt",
              color: "#666",
            }}
          >
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
}
