import Text "mo:core/Text";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Use migration module on upgrade

actor {
  // Initialize Access Control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type Address = {
    street : Text;
    city : Text;
    state : Text;
    country : Text;
    phone : Text;
    email : Text;
  };

  type Customer = {
    id : Nat;
    name : Text;
    gstin : Text;
    billingAddress : Address;
    shippingAddress : Address;
    phone : Text;
    email : Text;
  };

  module Customer {
    public func compare(customer1 : Customer, customer2 : Customer) : Order.Order {
      Nat.compare(customer1.id, customer2.id);
    };
  };

  type InventoryItem = {
    id : Nat;
    brand : Text;
    grade : Text;
    colorCode : Text;
    colorName : Text;
    thickness : Float;
    length : Float;
    width : Float;
    batchNumber : Text;
    sheetsAvailable : Int;
    sqftPerSheet : Float;
    lowStockThreshold : Int;
    purchaseRate : Float;
    sellingRate : Float;
  };

  type CustomerPricing = {
    id : Nat;
    customerId : Nat;
    inventoryId : Nat;
    customRate : Float;
    note : Text;
  };

  type InvoiceType = { #packingList; #taxInvoice };

  type InvoiceStatus = { #draft; #saved };

  type InvoiceItem = {
    lineId : Nat;
    inventoryId : ?Nat;
    brand : Text;
    grade : Text;
    colorCode : Text;
    colorName : Text;
    thickness : Float;
    length : Float;
    width : Float;
    qty : Float;
    sqft : Float;
    batchNumber : Text;
  };

  type Invoice = {
    id : Nat;
    billNumber : Text;
    invoiceType : InvoiceType;
    invoiceDate : Text;
    customerId : Nat;
    partyName : Text;
    billingAddress : Address;
    deliveryAddress : Address;
    city : Text;
    gstin : Text;
    phone : Text;
    piNumber : Text;
    salesPerson : Text;
    dispatchLocation : Text;
    remarks : Text;
    status : InvoiceStatus;
    totalQty : Float;
    totalSqft : Float;
    vehicleNo : Text;
    destination : Text;
    lrNo : Text;
    lrDate : Text;
    deliveryMode : Text;
    ewayBillNo : Text;
    hsnSac : Text;
    gstRate : Float;
    ratePerSqft : Float;
    taxableAmount : Float;
    cgstAmount : Float;
    sgstAmount : Float;
    igstAmount : Float;
    grandTotal : Float;
    amountInWords : Text;
    irnNumber : Text;
    ackNumber : Text;
    ackDate : Text;
    items : [InvoiceItem];
  };

  module Invoice {
    public func compare(invoice1 : Invoice, invoice2 : Invoice) : Order.Order {
      Nat.compare(invoice1.id, invoice2.id);
    };
  };

  type CompanySettings = {
    companyName : Text;
    address : Address;
    gstin : Text;
    phone : Text;
    email : Text;
    bankName : Text;
    accountNumber : Text;
    branchAndIfsc : Text;
    termsAndConditions : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  // State
  var nextCustomerId = 1;
  var nextInventoryId = 1;
  var nextInvoiceId = 1;
  var nextCustomerPricingId = 1;

  let customers = Map.empty<Nat, Customer>();
  let inventory = Map.empty<Nat, InventoryItem>();
  let invoices = Map.empty<Nat, Invoice>();
  var companySettings : ?CompanySettings = null;
  let customerPricing = Map.empty<Nat, CustomerPricing>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Customer Functions
  public shared ({ caller }) func createCustomer(customer : Customer) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create a customer.");
    };
    let id = nextCustomerId;
    let newCustomer = { customer with id };
    customers.add(id, newCustomer);
    nextCustomerId += 1;
    id;
  };

  public shared ({ caller }) func updateCustomer(customer : Customer) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update a customer.");
    };
    if (not customers.containsKey(customer.id)) {
      Runtime.trap("Customer not found");
    };
    customers.add(customer.id, customer);
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete a customer.");
    };
    if (not customers.containsKey(id)) {
      Runtime.trap("Customer not found");
    };
    customers.remove(id);
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view customers.");
    };
    switch (customers.get(id)) {
      case (?customer) { customer };
      case (null) { Runtime.trap("Customer not found") };
    };
  };

  public query ({ caller }) func listCustomers() : async [Customer] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list customers.");
    };
    customers.values().toArray();
  };

  // Inventory Functions
  public shared ({ caller }) func createInventoryItem(item : InventoryItem) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create an inventory item.");
    };
    let id = nextInventoryId;
    let newItem = { item with id };
    inventory.add(id, newItem);
    nextInventoryId += 1;
    id;
  };

  public shared ({ caller }) func updateInventoryItem(item : InventoryItem) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update an inventory item.");
    };
    if (not inventory.containsKey(item.id)) {
      Runtime.trap("Inventory item not found");
    };
    inventory.add(item.id, item);
  };

  public shared ({ caller }) func deleteInventoryItem(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete an inventory item.");
    };
    if (not inventory.containsKey(id)) {
      Runtime.trap("Inventory item not found");
    };
    inventory.remove(id);
  };

  public query ({ caller }) func getInventoryItem(id : Nat) : async InventoryItem {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view inventory.");
    };
    switch (inventory.get(id)) {
      case (?item) { item };
      case (null) { Runtime.trap("Inventory item not found") };
    };
  };

  public query ({ caller }) func listInventory() : async [InventoryItem] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list inventory.");
    };
    inventory.values().toArray();
  };

  // Internal function for stock deduction (no authorization check - only called from authorized contexts)
  private func deductStockInternal(id : Nat, qty : Int) {
    switch (inventory.get(id)) {
      case (?item) {
        if (item.sheetsAvailable < qty) {
          Runtime.trap("Not enough stock");
        };
        let updatedItem = { item with sheetsAvailable = item.sheetsAvailable - qty };
        inventory.add(id, updatedItem);
      };
      case (null) { Runtime.trap("Inventory item not found") };
    };
  };

  public shared ({ caller }) func deductStock(id : Nat, qty : Int) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can deduct stock.");
    };
    deductStockInternal(id, qty);
  };

  public query ({ caller }) func getLowStockItems() : async [InventoryItem] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view low stock items.");
    };
    inventory.values().filter(func(item) { item.sheetsAvailable <= item.lowStockThreshold }).toArray();
  };

  // Invoice Functions
  public shared ({ caller }) func createInvoice(invoice : Invoice) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create an invoice.");
    };
    let id = nextInvoiceId;
    let billNumber = "BILL-" # invoice.invoiceDate # "-" # id.toText();
    let newInvoice = { invoice with id; billNumber };
    invoices.add(id, newInvoice);
    nextInvoiceId += 1;
    id;
  };

  public shared ({ caller }) func updateInvoice(invoice : Invoice) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update an invoice.");
    };
    switch (invoices.get(invoice.id)) {
      case (?existingInvoice) {
        // Prevent changing id and bill number
        let updatedInvoice = { invoice with id = existingInvoice.id; billNumber = existingInvoice.billNumber };
        invoices.add(invoice.id, updatedInvoice);
      };
      case (null) { Runtime.trap("Invoice not found") };
    };
  };

  public shared ({ caller }) func deleteInvoice(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete an invoice.");
    };
    if (not invoices.containsKey(id)) {
      Runtime.trap("Invoice not found");
    };
    invoices.remove(id);
  };

  public query ({ caller }) func getInvoice(id : Nat) : async Invoice {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view invoices.");
    };
    switch (invoices.get(id)) {
      case (?invoice) { invoice };
      case (null) { Runtime.trap("Invoice not found") };
    };
  };

  public query ({ caller }) func listInvoices() : async [Invoice] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list invoices.");
    };
    invoices.values().toArray();
  };

  public shared ({ caller }) func changeInvoiceStatus(id : Nat, status : InvoiceStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update invoice status.");
    };
    switch (invoices.get(id)) {
      case (?invoice) {
        let updatedInvoice = { invoice with status };
        invoices.add(id, updatedInvoice);
        // Stock deduction when invoice is saved - this is allowed for users as part of invoice workflow
        if (status == #saved) {
          for (item in invoice.items.vals()) {
            switch (item.inventoryId) {
              case (?invId) {
                let qtyInt = item.qty.toInt();
                deductStockInternal(invId, qtyInt);
              };
              case (null) {};
            };
          };
        };
      };
      case (null) { Runtime.trap("Invoice not found") };
    };
  };

  // Customer Pricing Functions
  public shared ({ caller }) func setCustomerPricing(pricing : CustomerPricing) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set customer pricing.");
    };

    // Check for existing pricing for same customer & inventory
    let existing = customerPricing.values().find(
      func(p) {
        p.customerId == pricing.customerId and
        p.inventoryId == pricing.inventoryId
      }
    );

    let id = switch (existing) {
      case (?p) { p.id };
      case (null) {
        let newId = nextCustomerPricingId;
        nextCustomerPricingId += 1;
        newId;
      };
    };

    let newPricing = { pricing with id };
    customerPricing.add(id, newPricing);
    id;
  };

  public query ({ caller }) func getCustomerPricingByCustomerAndItem(customerId : Nat, inventoryId : Nat) : async ?CustomerPricing {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view customer pricing.");
    };
    customerPricing.values().find(
      func(p) { p.customerId == customerId and p.inventoryId == inventoryId }
    );
  };

  public query ({ caller }) func listCustomerPricingsByCustomer(customerId : Nat) : async [CustomerPricing] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view customer pricing.");
    };
    customerPricing.values().filter(func(p) { p.customerId == customerId }).toArray();
  };

  public shared ({ caller }) func deleteCustomerPricing(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete customer pricing.");
    };
    if (not customerPricing.containsKey(id)) {
      Runtime.trap("Customer pricing not found");
    };
    customerPricing.remove(id);
  };

  public query ({ caller }) func listAllCustomerPricings() : async [CustomerPricing] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list customer pricing.");
    };
    customerPricing.values().toArray();
  };

  // Company Settings
  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view company settings.");
    };
    companySettings;
  };

  public shared ({ caller }) func updateCompanySettings(settings : CompanySettings) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update company settings.");
    };
    companySettings := ?settings;
  };

  // Report Functions
  public query ({ caller }) func getSalesSummary() : async { totalInvoices : Nat; totalSqft : Float } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view sales summary.");
    };
    var totalSqft : Float = 0.0;
    var totalInvoices : Nat = 0;
    for (invoice in invoices.values()) {
      if (invoice.status == #saved) {
        totalSqft += invoice.totalSqft;
        totalInvoices += 1;
      };
    };
    { totalInvoices; totalSqft };
  };

  public query ({ caller }) func getStockReport() : async [InventoryItem] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view stock report.");
    };
    inventory.values().toArray();
  };

  public query ({ caller }) func getCustomerPurchaseHistory(customerId : Nat) : async { totalSqft : Float; invoiceCount : Nat } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view customer purchase history.");
    };
    var totalSqft : Float = 0.0;
    var invoiceCount : Nat = 0;
    for (invoice in invoices.values()) {
      if (invoice.customerId == customerId and invoice.status == #saved) {
        totalSqft += invoice.totalSqft;
        invoiceCount += 1;
      };
    };
    { totalSqft; invoiceCount };
  };
};
