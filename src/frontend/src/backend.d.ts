import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InventoryItem {
    id: bigint;
    colorCode: string;
    colorName: string;
    lowStockThreshold: bigint;
    purchaseRate: number;
    sheetsAvailable: bigint;
    thickness: number;
    sellingRate: number;
    sqftPerSheet: number;
    grade: string;
    length: number;
    batchNumber: string;
    brand: string;
    width: number;
}
export interface InvoiceItem {
    qty: number;
    colorCode: string;
    colorName: string;
    sqft: number;
    thickness: number;
    grade: string;
    length: number;
    batchNumber: string;
    brand: string;
    inventoryId?: bigint;
    width: number;
    lineId: bigint;
}
export interface Address {
    street: string;
    country: string;
    city: string;
    email: string;
    state: string;
    phone: string;
}
export interface CompanySettings {
    email: string;
    bankName: string;
    termsAndConditions: string;
    branchAndIfsc: string;
    gstin: string;
    address: Address;
    companyName: string;
    accountNumber: string;
    phone: string;
}
export interface Invoice {
    id: bigint;
    status: InvoiceStatus;
    deliveryAddress: Address;
    destination: string;
    hsnSac: string;
    taxableAmount: number;
    ackDate: string;
    billingAddress: Address;
    city: string;
    ackNumber: string;
    lrNo: string;
    igstAmount: number;
    ewayBillNo: string;
    deliveryMode: string;
    totalSqft: number;
    salesPerson: string;
    totalQty: number;
    grandTotal: number;
    invoiceDate: string;
    invoiceType: InvoiceType;
    gstin: string;
    ratePerSqft: number;
    billNumber: string;
    irnNumber: string;
    customerId: bigint;
    gstRate: number;
    partyName: string;
    phone: string;
    items: Array<InvoiceItem>;
    cgstAmount: number;
    sgstAmount: number;
    remarks: string;
    piNumber: string;
    vehicleNo: string;
    amountInWords: string;
    dispatchLocation: string;
    lrDate: string;
}
export interface Customer {
    id: bigint;
    billingAddress: Address;
    name: string;
    email: string;
    gstin: string;
    shippingAddress: Address;
    phone: string;
}
export interface UserProfile {
    name: string;
}
export interface CustomerPricing {
    id: bigint;
    note: string;
    customRate: number;
    customerId: bigint;
    inventoryId: bigint;
}
export enum InvoiceStatus {
    saved = "saved",
    draft = "draft"
}
export enum InvoiceType {
    packingList = "packingList",
    taxInvoice = "taxInvoice"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeInvoiceStatus(id: bigint, status: InvoiceStatus): Promise<void>;
    createCustomer(customer: Customer): Promise<bigint>;
    createInventoryItem(item: InventoryItem): Promise<bigint>;
    createInvoice(invoice: Invoice): Promise<bigint>;
    deductStock(id: bigint, qty: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteCustomerPricing(id: bigint): Promise<void>;
    deleteInventoryItem(id: bigint): Promise<void>;
    deleteInvoice(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanySettings(): Promise<CompanySettings | null>;
    getCustomer(id: bigint): Promise<Customer>;
    getCustomerPricingByCustomerAndItem(customerId: bigint, inventoryId: bigint): Promise<CustomerPricing | null>;
    getCustomerPurchaseHistory(customerId: bigint): Promise<{
        invoiceCount: bigint;
        totalSqft: number;
    }>;
    getInventoryItem(id: bigint): Promise<InventoryItem>;
    getInvoice(id: bigint): Promise<Invoice>;
    getLowStockItems(): Promise<Array<InventoryItem>>;
    getSalesSummary(): Promise<{
        totalSqft: number;
        totalInvoices: bigint;
    }>;
    getStockReport(): Promise<Array<InventoryItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllCustomerPricings(): Promise<Array<CustomerPricing>>;
    listCustomerPricingsByCustomer(customerId: bigint): Promise<Array<CustomerPricing>>;
    listCustomers(): Promise<Array<Customer>>;
    listInventory(): Promise<Array<InventoryItem>>;
    listInvoices(): Promise<Array<Invoice>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCustomerPricing(pricing: CustomerPricing): Promise<bigint>;
    updateCompanySettings(settings: CompanySettings): Promise<void>;
    updateCustomer(customer: Customer): Promise<void>;
    updateInventoryItem(item: InventoryItem): Promise<void>;
    updateInvoice(invoice: Invoice): Promise<void>;
}
