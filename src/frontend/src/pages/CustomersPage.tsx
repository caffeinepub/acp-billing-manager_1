import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  Address,
  Customer,
  CustomerPricing,
  InventoryItem,
} from "../backend";
import { useActor } from "../hooks/useActor";

const emptyAddress = (): Address => ({
  street: "",
  city: "",
  state: "",
  country: "India",
  phone: "",
  email: "",
});

const emptyCustomer = (): Omit<Customer, "id"> & { id: bigint } => ({
  id: BigInt(0),
  name: "",
  phone: "",
  email: "",
  gstin: "",
  billingAddress: emptyAddress(),
  shippingAddress: emptyAddress(),
});

// ─── Customer Pricing Modal ───────────────────────────────────────────────────

interface PricingRowState {
  customRate: string;
  note: string;
}

interface CustomerPricingModalProps {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}

function CustomerPricingModal({
  customer,
  open,
  onClose,
}: CustomerPricingModalProps) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, PricingRowState>>({});

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => actor!.listInventory(),
    enabled: !!actor && !isFetching,
  });

  const { data: pricings = [], isLoading: loadingPricings } = useQuery({
    queryKey: ["customerPricings", String(customer.id)],
    queryFn: () => actor!.listCustomerPricingsByCustomer(customer.id),
    enabled: !!actor && !isFetching && open,
  });

  // Sync local row state when remote data loads or changes (e.g., after save/remove)
  useEffect(() => {
    if (inventory.length === 0) return;
    const initialRows: Record<string, PricingRowState> = {};
    for (const item of inventory) {
      const existing = pricings.find((p) => p.inventoryId === item.id);
      initialRows[String(item.id)] = {
        customRate: existing ? String(existing.customRate) : "",
        note: existing?.note ?? "",
      };
    }
    setRows(initialRows);
  }, [inventory, pricings]);

  const saveMutation = useMutation({
    mutationFn: (pricing: CustomerPricing) =>
      actor!.setCustomerPricing(pricing),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["customerPricings", String(customer.id)],
      });
      toast.success("Custom rate saved");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to save rate"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomerPricing(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["customerPricings", String(customer.id)],
      });
      toast.success("Custom rate removed");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to remove rate"),
  });

  const handleSave = (item: InventoryItem) => {
    const row = rows[String(item.id)];
    const existing = pricings.find((p) => p.inventoryId === item.id);
    saveMutation.mutate({
      id: existing?.id ?? BigInt(0),
      customerId: customer.id,
      inventoryId: item.id,
      customRate: Number.parseFloat(row?.customRate || "0") || 0,
      note: row?.note ?? "",
    });
  };

  const handleRemove = (item: InventoryItem) => {
    const existing = pricings.find((p) => p.inventoryId === item.id);
    if (existing) {
      deleteMutation.mutate(existing.id);
    }
  };

  const updateRow = (
    itemId: bigint,
    field: keyof PricingRowState,
    value: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [String(itemId)]: {
        ...(prev[String(itemId)] ?? { customRate: "", note: "" }),
        [field]: value,
      },
    }));
  };

  const isLoading = loadingInventory || loadingPricings;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
        data-ocid="customers.pricing.dialog"
      >
        <DialogHeader>
          <DialogTitle>Manage Pricing — {customer.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 space-y-3">
            {["s1", "s2", "s3"].map((s) => (
              <Skeleton key={s} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Thickness
                  </TableHead>
                  <TableHead className="hidden md:table-cell">L×W</TableHead>
                  <TableHead>Default Rate</TableHead>
                  <TableHead>Custom Rate (₹)</TableHead>
                  <TableHead className="hidden sm:table-cell">Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No inventory items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item, i) => {
                    const existing = pricings.find(
                      (p) => p.inventoryId === item.id,
                    );
                    const row = rows[String(item.id)] ?? {
                      customRate: "",
                      note: "",
                    };
                    return (
                      <TableRow
                        key={Number(item.id)}
                        data-ocid={`customers.pricing.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {item.brand}
                        </TableCell>
                        <TableCell>{item.colorName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.thickness} MM
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.length}×{item.width}
                        </TableCell>
                        <TableCell>
                          {existing ? (
                            <Badge
                              variant="outline"
                              className="border-accent/50 text-accent bg-accent/10"
                            >
                              ₹{existing.customRate}/sqft
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              ₹{item.sellingRate}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            data-ocid={`customers.pricing.input.${i + 1}`}
                            type="number"
                            value={row.customRate}
                            onChange={(e) =>
                              updateRow(item.id, "customRate", e.target.value)
                            }
                            className="w-24"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Input
                            type="text"
                            value={row.note}
                            onChange={(e) =>
                              updateRow(item.id, "note", e.target.value)
                            }
                            className="w-32"
                            placeholder="Optional note"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              data-ocid={`customers.pricing.save_button.${i + 1}`}
                              size="sm"
                              className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 text-xs px-2"
                              onClick={() => handleSave(item)}
                              disabled={saveMutation.isPending}
                            >
                              {saveMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            {existing && (
                              <Button
                                data-ocid={`customers.pricing.delete_button.${i + 1}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                                onClick={() => handleRemove(item)}
                                disabled={deleteMutation.isPending}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button
            data-ocid="customers.pricing.close_button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main CustomersPage ────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(emptyCustomer());
  const [isEditing, setIsEditing] = useState(false);
  const [pricingCustomer, setPricingCustomer] = useState<Customer | null>(null);

  const PAGE_SIZE = 10;

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.listCustomers(),
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: (c: Customer) => actor!.createCustomer(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
      setModalOpen(false);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to save customer"),
  });

  const updateMutation = useMutation({
    mutationFn: (c: Customer) => actor!.updateCustomer(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
      setModalOpen(false);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
      setDeleteId(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to delete customer"),
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.billingAddress.city.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm(emptyCustomer());
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm({ ...c });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!actor) {
      toast.error("Still connecting to server, please try again in a moment.");
      return;
    }
    if (isEditing) {
      updateMutation.mutate(form as Customer);
    } else {
      createMutation.mutate({ ...form, id: BigInt(0) });
    }
  };

  const copyBillingToShipping = () => {
    setForm((f) => ({ ...f, shippingAddress: { ...f.billingAddress } }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={15}
          />
          <Input
            data-ocid="customers.search_input"
            placeholder="Search customers..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          data-ocid="customers.add_button"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={openAdd}
          disabled={!actor}
        >
          <Plus size={15} className="mr-1" /> Add Customer
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="hidden md:table-cell">GSTIN</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                ["skel-r1", "skel-r2", "skel-r3"].map((sk) => (
                  <TableRow key={sk}>
                    {["c1", "c2", "c3", "c4", "c5", "c6"].map((sc) => (
                      <TableCell key={sc}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div
                      data-ocid="customers.empty_state"
                      className="text-muted-foreground text-sm"
                    >
                      {search
                        ? "No customers found"
                        : "No customers yet. Add your first customer."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c, i) => (
                  <TableRow
                    key={Number(c.id)}
                    data-ocid={`customers.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.billingAddress.city}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {c.gstin || "—"}
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {c.email || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`customers.pricing.open_modal_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          title="Manage Pricing"
                          onClick={() => setPricingCustomer(c)}
                        >
                          <Tag size={14} />
                        </Button>
                        <Button
                          data-ocid={`customers.edit_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          data-ocid={`customers.delete_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            data-ocid="customers.pagination_prev"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="text-sm text-muted-foreground py-1.5 px-2">
            {page} / {totalPages}
          </span>
          <Button
            data-ocid="customers.pagination_next"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Customer Pricing Modal */}
      {pricingCustomer && (
        <CustomerPricingModal
          customer={pricingCustomer}
          open={!!pricingCustomer}
          onClose={() => setPricingCustomer(null)}
        />
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="customers.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Party Name *</Label>
                <Input
                  data-ocid="customers.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Company / Party Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Mobile number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input
                  value={form.gstin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gstin: e.target.value }))
                  }
                  placeholder="GST Identification Number"
                  className="uppercase"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Billing Address
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Street / Address</Label>
                  <Textarea
                    value={form.billingAddress.street}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingAddress: {
                          ...f.billingAddress,
                          street: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    placeholder="Full street address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={form.billingAddress.city}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingAddress: {
                          ...f.billingAddress,
                          city: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={form.billingAddress.state}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingAddress: {
                          ...f.billingAddress,
                          state: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Delivery Address
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={copyBillingToShipping}
                >
                  <Copy size={12} className="mr-1" /> Same as Billing
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Street / Address</Label>
                  <Textarea
                    value={form.shippingAddress.street}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        shippingAddress: {
                          ...f.shippingAddress,
                          street: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={form.shippingAddress.city}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        shippingAddress: {
                          ...f.shippingAddress,
                          city: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={form.shippingAddress.state}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        shippingAddress: {
                          ...f.shippingAddress,
                          state: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="customers.cancel_button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="customers.save_button"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleSave}
              disabled={isSaving || !form.name || !actor}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Update" : "Save"} Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>Delete Customer?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="customers.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="customers.delete_button"
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
