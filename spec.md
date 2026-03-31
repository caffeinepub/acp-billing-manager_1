# ACP Billing Manager

## Current State
New project. No existing application files beyond scaffolded empty actor.

## Requested Changes (Diff)

### Add
- **Authentication**: Login page with role-based access for Admin and Staff roles
- **Dashboard**: KPI cards (total invoices, total SQFT sold, revenue), recent invoices list, low-stock alerts, simple bar/line charts
- **Customer Management (Parties)**: Full CRUD with fields: party name, billing address, delivery address, city, GSTIN, phone, email. Search + pagination. Auto-populate in invoice creation.
- **Inventory Management**: ACP panel stock tracking with fields: brand, grade, C.Code, colour name, thickness (mm), length (ft), width (ft), batch number, sheets available, sqft per sheet (auto-calculated: length × width). Low-stock threshold alerts. Auto-deduct stock on invoice generation.
- **Invoice Module (Packing List)**: 
  - Auto-generated bill number (format: PRAJH + year + sequence)
  - Fields: date, PI number, sales person, dispatch location
  - Billing address section + Delivery address section (from customer data)
  - Item table: SNo, Brand, Grade, C.Code, Colour Name, Thickness, Length, Width, Qty, SQFT (auto: L×W×Qty), Batch No
  - Totals: total qty, total SQFT
  - Remarks field
  - Live preview, save, edit, print, PDF download
- **Tax Invoice Module**:
  - All packing list fields plus: HSN/SAC, GST Rate, Rate per SQFT, Disc%, Amount
  - Consignee (Ship to) + Buyer (Bill to) sections
  - Vehicle No, Destination, LR No, LR Date, Delivery mode, E-way Bill No
  - Tax summary table: HSN, Taxable Value, Tax%, CGST, SGST, IGST, Total Tax
  - Amount in words
  - Terms & Conditions, Bank Details, Declaration, Authorized Signatory
  - IRN / AckNo / AckDt fields for e-Invoice
- **Company Settings**: Company name, address, GSTIN, phone, email, bank details (name, A/c no, branch & IFSC), terms & conditions text
- **Reports**: Sales report (filter by date range / customer), stock report (available inventory + low-stock), customer purchase history (total SQFT)
- **PDF Generation**: Print-ready packing list (A4) and tax invoice (A4) using browser print / html-to-pdf approach

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Motoko backend: Users, Customers, Inventory, Invoices (packing list + tax), Company Settings stable storage with full CRUD
2. Authorization component for role-based access
3. Frontend: React + TypeScript + Tailwind
   - AuthContext + login page
   - Sidebar layout with Dashboard, Customers, Inventory, Invoices, Reports, Settings
   - Dashboard page with KPI cards and charts (recharts)
   - Customer CRUD page with search/pagination
   - Inventory CRUD page with search/pagination and stock level indicators
   - Invoice creation page: customer selector (auto-populates addresses), item rows with inventory selector, live SQFT calculation, live preview
   - Packing list PDF view matching provided image format exactly
   - Tax invoice PDF view matching provided image format exactly
   - Reports page with date/customer filters
   - Settings page for company details
4. PDF export via window.print() with print-specific CSS for both document formats
