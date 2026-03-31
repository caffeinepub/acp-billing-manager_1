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
import { Copy, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address, Customer } from "../backend";
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

export default function CustomersPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(emptyCustomer());
  const [isEditing, setIsEditing] = useState(false);

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
    onError: () => toast.error("Failed to save customer"),
  });

  const updateMutation = useMutation({
    mutationFn: (c: Customer) => actor!.updateCustomer(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to update customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete customer"),
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
              {isLoading ? (
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
              disabled={isSaving || !form.name}
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
