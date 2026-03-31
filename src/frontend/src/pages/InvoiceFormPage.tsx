import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { NavState } from "../App";
import { InvoiceStatus, InvoiceType } from "../backend";
import type { Customer, InventoryItem, Invoice, InvoiceItem } from "../backend";
import { useActor } from "../hooks/useActor";
import { numberToWords } from "../lib/invoiceUtils";

interface Props {
  invoiceType: InvoiceType;
  invoiceId?: bigint;
  setNav: (nav: NavState) => void;
}

const emptyItem = (idx: number): InvoiceItem => ({
  lineId: BigInt(idx + 1),
  brand: "",
  grade: "",
  colorCode: "",
  colorName: "",
  thickness: 3,
  length: 12,
  width: 4,
  qty: 1,
  sqft: 0,
  batchNumber: "",
  inventoryId: undefined,
});

const todayStr = () => new Date().toISOString().split("T")[0];

const genBillNumber = (type: InvoiceType) => {
  const prefix = type === InvoiceType.packingList ? "PL" : "TI";
  const d = new Date();
  return `${prefix}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
};

export default function InvoiceFormPage({
  invoiceType,
  invoiceId,
  setNav,
}: Props) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.listCustomers(),
    enabled: !!actor && !isFetching,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => actor!.listInventory(),
    enabled: !!actor && !isFetching,
  });

  const { data: existingInvoice } = useQuery({
    queryKey: ["invoice", invoiceId?.toString()],
    queryFn: () => actor!.getInvoice(invoiceId!),
    enabled: !!actor && !isFetching && !!invoiceId,
  });

  const emptyAddr = {
    street: "",
    city: "",
    state: "",
    country: "India",
    phone: "",
    email: "",
  };

  const [form, setForm] = useState<Invoice>({
    id: BigInt(0),
    billNumber: genBillNumber(invoiceType),
    invoiceType,
    invoiceDate: todayStr(),
    status: InvoiceStatus.draft,
    customerId: BigInt(0),
    partyName: "",
    billingAddress: emptyAddr,
    deliveryAddress: emptyAddr,
    city: "",
    gstin: "",
    phone: "",
    piNumber: "",
    salesPerson: "",
    dispatchLocation: "",
    items: [emptyItem(0)],
    totalQty: 0,
    totalSqft: 0,
    remarks: "",
    vehicleNo: "",
    destination: "",
    lrNo: "",
    lrDate: "",
    deliveryMode: "",
    ewayBillNo: "",
    hsnSac: "7606",
    gstRate: 18,
    ratePerSqft: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    grandTotal: 0,
    amountInWords: "",
    irnNumber: "",
    ackNumber: "",
    ackDate: "",
  });

  // Load existing invoice for edit
  useEffect(() => {
    if (existingInvoice) {
      setForm({ ...existingInvoice });
    }
  }, [existingInvoice]);

  // Auto-calc totals
  const calcTotals = (items: InvoiceItem[]) => {
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const totalSqft = items.reduce((s, i) => s + i.sqft, 0);
    return { totalQty, totalSqft };
  };

  const calcTax = (totalSqft: number, rate: number, gstRate: number) => {
    const taxableAmount = +(totalSqft * rate).toFixed(2);
    const cgstAmount = +((taxableAmount * gstRate) / 2 / 100).toFixed(2);
    const sgstAmount = cgstAmount;
    const grandTotal = +(taxableAmount + cgstAmount + sgstAmount).toFixed(2);
    return { taxableAmount, cgstAmount, sgstAmount, grandTotal };
  };

  const updateItems = (items: InvoiceItem[]) => {
    const { totalQty, totalSqft } = calcTotals(items);
    const taxCalc = calcTax(totalSqft, form.ratePerSqft, form.gstRate);
    setForm((f) => ({
      ...f,
      items,
      totalQty,
      totalSqft,
      ...taxCalc,
      amountInWords: numberToWords(taxCalc.grandTotal),
    }));
  };

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...patch };
      if (
        patch.length !== undefined ||
        patch.width !== undefined ||
        patch.qty !== undefined
      ) {
        updated.sqft = +(updated.length * updated.width * updated.qty).toFixed(
          2,
        );
      }
      return updated;
    });
    updateItems(items);
  };

  const addRow = () => {
    const items = [...form.items, emptyItem(form.items.length)];
    updateItems(items);
  };

  const removeRow = (idx: number) => {
    const items = form.items.filter((_, i) => i !== idx);
    updateItems(items.length ? items : [emptyItem(0)]);
  };

  const selectInventory = (idx: number, invId: string) => {
    const inv = inventory.find((i) => Number(i.id) === Number(invId));
    if (!inv) return;
    updateItem(idx, {
      inventoryId: inv.id,
      brand: inv.brand,
      grade: inv.grade,
      colorCode: inv.colorCode,
      colorName: inv.colorName,
      thickness: inv.thickness,
      length: inv.length,
      width: inv.width,
      batchNumber: inv.batchNumber,
      sqft: +(inv.length * inv.width * form.items[idx].qty).toFixed(2),
    });
  };

  const selectCustomer = (customerId: string) => {
    const c = customers.find((c) => Number(c.id) === Number(customerId));
    if (!c) return;
    setForm((f) => ({
      ...f,
      customerId: c.id,
      partyName: c.name,
      billingAddress: { ...c.billingAddress },
      deliveryAddress: { ...c.shippingAddress },
      city: c.billingAddress.city,
      gstin: c.gstin,
      phone: c.phone,
    }));
  };

  const updateRateGst = (ratePerSqft: number, gstRate: number) => {
    const taxCalc = calcTax(form.totalSqft, ratePerSqft, gstRate);
    setForm((f) => ({
      ...f,
      ratePerSqft,
      gstRate,
      ...taxCalc,
      amountInWords: numberToWords(taxCalc.grandTotal),
    }));
  };

  const createMutation = useMutation({
    mutationFn: (inv: Invoice) => actor!.createInvoice(inv),
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice saved!");
      setNav({
        page:
          invoiceType === InvoiceType.packingList
            ? "invoice-view-packing"
            : "invoice-view-tax",
        invoiceId: newId,
      });
    },
    onError: () => toast.error("Failed to save invoice"),
  });

  const updateMutation = useMutation({
    mutationFn: (inv: Invoice) => actor!.updateInvoice(inv),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated!");
      setNav({
        page:
          invoiceType === InvoiceType.packingList
            ? "invoice-view-packing"
            : "invoice-view-tax",
        invoiceId: form.id,
      });
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  const handleSave = (status: InvoiceStatus) => {
    const inv: Invoice = {
      ...form,
      status,
      items: form.items.map((item, i) => ({ ...item, lineId: BigInt(i + 1) })),
    };
    if (invoiceId) {
      updateMutation.mutate(inv);
    } else {
      createMutation.mutate({ ...inv, id: BigInt(0) });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isTaxInvoice = invoiceType === InvoiceType.taxInvoice;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNav({ page: "invoices" })}
          data-ocid="invoice_form.back.button"
        >
          <ArrowLeft size={16} />
        </Button>
        <Badge variant="outline" className="text-xs">
          {isTaxInvoice ? "Tax Invoice" : "Packing List"}
        </Badge>
        <span className="text-sm text-muted-foreground font-mono">
          {form.billNumber}
        </span>
      </div>

      {/* Top Fields */}
      <div className="bg-card rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Invoice Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Bill Number</Label>
            <Input
              data-ocid="invoice_form.bill_number.input"
              value={form.billNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, billNumber: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              data-ocid="invoice_form.date.input"
              type="date"
              value={form.invoiceDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, invoiceDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select
              value={
                form.customerId === BigInt(0)
                  ? ""
                  : String(Number(form.customerId))
              }
              onValueChange={selectCustomer}
            >
              <SelectTrigger data-ocid="invoice_form.customer.select">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={Number(c.id)} value={String(Number(c.id))}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>PI Number</Label>
            <Input
              value={form.piNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, piNumber: e.target.value }))
              }
              placeholder="PI-XXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sales Person</Label>
            <Input
              value={form.salesPerson}
              onChange={(e) =>
                setForm((f) => ({ ...f, salesPerson: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Dispatch Location</Label>
            <Input
              value={form.dispatchLocation}
              onChange={(e) =>
                setForm((f) => ({ ...f, dispatchLocation: e.target.value }))
              }
            />
          </div>
          {isTaxInvoice && (
            <>
              <div className="space-y-1.5">
                <Label>Vehicle No</Label>
                <Input
                  value={form.vehicleNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicleNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input
                  value={form.destination}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, destination: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>LR No</Label>
                <Input
                  value={form.lrNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lrNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>LR Date</Label>
                <Input
                  type="date"
                  value={form.lrDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lrDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Mode</Label>
                <Input
                  value={form.deliveryMode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryMode: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-way Bill No</Label>
                <Input
                  value={form.ewayBillNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ewayBillNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>HSN/SAC</Label>
                <Input
                  value={form.hsnSac}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hsnSac: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>GST Rate (%)</Label>
                <Input
                  type="number"
                  value={form.gstRate}
                  onChange={(e) =>
                    updateRateGst(form.ratePerSqft, +e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rate per SQFT (₹)</Label>
                <Input
                  type="number"
                  value={form.ratePerSqft}
                  onChange={(e) => updateRateGst(+e.target.value, form.gstRate)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>IRN Number</Label>
                <Input
                  value={form.irnNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, irnNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ack No</Label>
                <Input
                  value={form.ackNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ackNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ack Date</Label>
                <Input
                  type="date"
                  value={form.ackDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ackDate: e.target.value }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* Party Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label>Party Name</Label>
            <Input
              value={form.partyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, partyName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>GSTIN</Label>
            <Input
              value={form.gstin}
              onChange={(e) =>
                setForm((f) => ({ ...f, gstin: e.target.value }))
              }
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="px-2 py-2 text-left">From Inventory</th>
                <th className="px-2 py-2 text-left">Brand</th>
                <th className="px-2 py-2 text-left">Grade</th>
                <th className="px-2 py-2 text-left">C.Code</th>
                <th className="px-2 py-2 text-left">Colour</th>
                <th className="px-2 py-2 text-left">Thk</th>
                <th className="px-2 py-2 text-left">L</th>
                <th className="px-2 py-2 text-left">W</th>
                <th className="px-2 py-2 text-left">Qty</th>
                <th className="px-2 py-2 text-left">SQFT</th>
                <th className="px-2 py-2 text-left">Batch</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr
                  key={Number(item.lineId)}
                  data-ocid={`invoice_form.items.row.${idx + 1}`}
                  className="border-b"
                >
                  <td className="px-1 py-1">
                    <Select
                      value={
                        item.inventoryId ? String(Number(item.inventoryId)) : ""
                      }
                      onValueChange={(v) => selectInventory(idx, v)}
                    >
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue placeholder="Pick..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((inv) => (
                          <SelectItem
                            key={Number(inv.id)}
                            value={String(Number(inv.id))}
                          >
                            {inv.brand} {inv.colorName} {inv.thickness}MM
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  {(
                    [
                      ["brand", item.brand],
                      ["grade", item.grade],
                      ["colorCode", item.colorCode],
                      ["colorName", item.colorName],
                    ] as [keyof InvoiceItem, string][]
                  ).map(([field, val]) => (
                    <td key={field} className="px-1 py-1">
                      <Input
                        className="h-7 text-xs w-20"
                        value={val}
                        onChange={(e) =>
                          updateItem(idx, {
                            [field]: e.target.value,
                          } as Partial<InvoiceItem>)
                        }
                      />
                    </td>
                  ))}
                  {(
                    [
                      ["thickness", item.thickness],
                      ["length", item.length],
                      ["width", item.width],
                      ["qty", item.qty],
                    ] as [keyof InvoiceItem, number][]
                  ).map(([field, val]) => (
                    <td key={field} className="px-1 py-1">
                      <Input
                        type="number"
                        className="h-7 text-xs w-14"
                        value={val}
                        onChange={(e) =>
                          updateItem(idx, {
                            [field]: +e.target.value,
                          } as Partial<InvoiceItem>)
                        }
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <Input
                      className="h-7 text-xs w-16 bg-muted cursor-not-allowed"
                      readOnly
                      value={item.sqft.toFixed(2)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      className="h-7 text-xs w-20"
                      value={item.batchNumber}
                      onChange={(e) =>
                        updateItem(idx, { batchNumber: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Button
                      data-ocid={`invoice_form.items.delete_button.${idx + 1}`}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeRow(idx)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted font-semibold">
                <td colSpan={8} className="px-2 py-2 text-right text-xs">
                  TOTAL
                </td>
                <td className="px-2 py-2 text-xs">{form.totalQty}</td>
                <td className="px-2 py-2 text-xs">
                  {form.totalSqft.toFixed(2)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <Button
          data-ocid="invoice_form.add_row.button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="text-xs"
        >
          <Plus size={12} className="mr-1" /> Add Row
        </Button>
      </div>

      {/* Tax Summary (Tax Invoice only) */}
      {isTaxInvoice && (
        <div className="bg-card rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-3">Tax Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Taxable Amount</p>
              <p className="font-semibold">₹{form.taxableAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                CGST ({form.gstRate / 2}%)
              </p>
              <p className="font-semibold">₹{form.cgstAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                SGST ({form.gstRate / 2}%)
              </p>
              <p className="font-semibold">₹{form.sgstAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Grand Total</p>
              <p className="font-bold text-lg">₹{form.grandTotal.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            In Words: {form.amountInWords}
          </p>
        </div>
      )}

      {/* Remarks */}
      <div className="bg-card rounded-xl border shadow-sm p-4 space-y-2">
        <Label>Remarks</Label>
        <Textarea
          data-ocid="invoice_form.remarks.textarea"
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
          rows={2}
          placeholder="Any additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-8">
        <Button
          data-ocid="invoice_form.draft.button"
          variant="outline"
          onClick={() => handleSave(InvoiceStatus.draft)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button
          data-ocid="invoice_form.save.button"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={() => handleSave(InvoiceStatus.saved)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save &amp; Finalize
        </Button>
      </div>
    </div>
  );
}
