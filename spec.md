# ACP Billing Manager

## Current State
- `InvoiceFormPage.tsx` has a `selectCustomer()` function that auto-fills party name, addresses, GSTIN, phone when a customer is chosen.
- `selectInventory()` auto-fills brand, grade, colour, thickness, length, width, batch number when an inventory item is picked for a row.
- Neither function currently looks up or applies customer-specific pricing.
- The `Manage Pricing` feature (via `actor.listCustomerPricingsByCustomer(customerId)`) stores custom rates per inventory item per customer.
- Tax Invoice has a single `ratePerSqft` field that drives taxable amount / grand total.
- Packing list has no rate field (qty + sqft only).

## Requested Changes (Diff)

### Add
- In `InvoiceFormPage.tsx`: a query for customer pricings keyed to the currently selected `form.customerId` — `actor.listCustomerPricingsByCustomer(customerId)` — enabled only when a customer is selected (`form.customerId !== BigInt(0)`).
- Logic in `selectInventory()`: after filling in the item fields, look up the loaded customer pricings to find a custom rate for that `inventoryId`. If found, apply that rate as `ratePerSqft` (for Tax Invoice). If not found, fall back to `inv.sellingRate` (the inventory item's default selling rate).
- Logic in `selectCustomer()`: after filling in party fields, also re-apply rates — if there is only one item currently in the form and it already has an `inventoryId`, re-evaluate its rate using the new customer's pricings.
- A small visual badge/tag near the Rate per SQFT field (Tax Invoice only) that shows "Custom Rate" in green when a customer-specific rate is being used, or "Default Rate" when the inventory's default sellingRate is used.

### Modify
- `selectInventory(idx, invId)` in `InvoiceFormPage.tsx`: extend to also set `ratePerSqft` and recalculate tax totals when the invoice is a Tax Invoice.
- `selectCustomer(customerId)` in `InvoiceFormPage.tsx`: after setting customer fields, trigger a pricing lookup for any already-selected inventory rows.

### Remove
- Nothing removed.

## Implementation Plan
1. Add a `selectedCustomerId` state (or derive from `form.customerId`) and a React Query to fetch `listCustomerPricingsByCustomer` whenever `form.customerId` changes.
2. Modify `selectInventory` to: find the matching pricing entry from the loaded customer pricings for the selected inventory item; if found use `customRate`, else use `inv.sellingRate`; call `updateRateGst(rate, form.gstRate)` to update totals (only for Tax Invoice — packing list has no rate).
3. Modify `selectCustomer` to invalidate / immediately use the new customer's pricings for already-selected items.
4. Add a conditional badge near the Rate per SQFT label on the Tax Invoice form.
5. Validate (typecheck + build).

Do NOT touch `TaxInvoiceViewPage.tsx` or the printed tax invoice layout at all.
