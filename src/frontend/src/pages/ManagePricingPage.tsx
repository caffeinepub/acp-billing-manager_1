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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Customer, CustomerPricing, InventoryItem } from "../backend";
import { useActor } from "../hooks/useActor";

interface PricingRowState {
  customRate: string;
  note: string;
}

export default function ManagePricingPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Record<string, PricingRowState>>({});

  // Load all customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.listCustomers(),
    enabled: !!actor && !isFetching,
  });

  // Load all inventory items
  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => actor!.listInventory(),
    enabled: !!actor && !isFetching,
  });

  const selectedCustomer: Customer | undefined = customers.find(
    (c) => String(c.id) === selectedCustomerId,
  );

  // Load custom pricings for selected customer
  const { data: pricings = [], isLoading: loadingPricings } = useQuery({
    queryKey: ["customerPricings", selectedCustomerId],
    queryFn: () => actor!.listCustomerPricingsByCustomer(selectedCustomer!.id),
    enabled: !!actor && !isFetching && !!selectedCustomer,
  });

  // Sync row state when inventory or pricings change
  useEffect(() => {
    if (inventory.length === 0) return;
    const initialRows: Record<string, PricingRowState> = {};
    for (const item of inventory) {
      const existing = pricings.find(
        (p) => Number(p.inventoryId) === Number(item.id),
      );
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
        queryKey: ["customerPricings", selectedCustomerId],
      });
      toast.success("Custom rate saved");
    },
    onError: () => toast.error("Failed to save rate"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomerPricing(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["customerPricings", selectedCustomerId],
      });
      toast.success("Custom rate removed");
    },
    onError: () => toast.error("Failed to remove rate"),
  });

  const handleSave = (item: InventoryItem) => {
    if (!selectedCustomer) return;
    const row = rows[String(item.id)];
    const existing = pricings.find(
      (p) => Number(p.inventoryId) === Number(item.id),
    );
    saveMutation.mutate({
      id: existing?.id ?? BigInt(0),
      customerId: selectedCustomer.id,
      inventoryId: item.id,
      customRate: Number.parseFloat(row?.customRate || "0") || 0,
      note: row?.note ?? "",
    });
  };

  const handleRemove = (item: InventoryItem) => {
    const existing = pricings.find(
      (p) => Number(p.inventoryId) === Number(item.id),
    );
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

  // Filtered customers for search
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isTableLoading = loadingInventory || loadingPricings;

  return (
    <div className="space-y-6">
      {/* Customer Selector */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Tags size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            Select Customer
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a customer to view and manage their individual product pricing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="manage_pricing.search_input"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Customer select */}
          <div className="flex-1 max-w-sm">
            <Label className="sr-only">Customer</Label>
            {loadingCustomers ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={selectedCustomerId}
                onValueChange={(val) => {
                  setSelectedCustomerId(val);
                  setSearch("");
                }}
              >
                <SelectTrigger data-ocid="manage_pricing.select">
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No customers found
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Selected customer banner */}
        {selectedCustomer && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {selectedCustomer.name[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {selectedCustomer.name}
              </p>
              {selectedCustomer.phone && (
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.phone}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className="ml-auto border-primary/30 text-primary"
            >
              {pricings.length} custom rate{pricings.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </div>

      {/* Pricing Table */}
      {!selectedCustomer ? (
        <div
          data-ocid="manage_pricing.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed border-border"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Tags size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No customer selected
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a customer above to view and edit their individual product
            rates.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">
                Product Pricing — {selectedCustomer.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set custom selling rates per product for this customer. Leave
                blank to use the default rate.
              </p>
            </div>
          </div>

          {isTableLoading ? (
            <div
              data-ocid="manage_pricing.loading_state"
              className="p-6 space-y-3"
            >
              {["s1", "s2", "s3", "s4"].map((s) => (
                <Skeleton key={s} className="h-12 w-full" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No inventory items found. Add products in Inventory first.
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
                    <TableHead>Custom Rate (₹/sqft)</TableHead>
                    <TableHead className="hidden sm:table-cell">Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item, i) => {
                    const existing = pricings.find(
                      (p) => Number(p.inventoryId) === Number(item.id),
                    );
                    const row = rows[String(item.id)] ?? {
                      customRate: "",
                      note: "",
                    };
                    return (
                      <TableRow
                        key={Number(item.id)}
                        data-ocid={`manage_pricing.item.${i + 1}`}
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
                            data-ocid={`manage_pricing.input.${i + 1}`}
                            type="number"
                            value={row.customRate}
                            onChange={(e) =>
                              updateRow(item.id, "customRate", e.target.value)
                            }
                            className="w-28"
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
                            className="w-36"
                            placeholder="Optional note"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              data-ocid={`manage_pricing.save_button.${i + 1}`}
                              size="sm"
                              className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-xs px-3"
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
                                data-ocid={`manage_pricing.delete_button.${i + 1}`}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemove(item)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
