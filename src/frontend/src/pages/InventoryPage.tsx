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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { InventoryItem } from "../backend";
import { useActor } from "../hooks/useActor";

const emptyItem = (): InventoryItem => ({
  id: BigInt(0),
  brand: "",
  grade: "",
  colorCode: "",
  colorName: "",
  thickness: 3,
  length: 12,
  width: 4,
  batchNumber: "",
  sheetsAvailable: BigInt(0),
  lowStockThreshold: BigInt(10),
  sqftPerSheet: 0,
  purchaseRate: 0,
  sellingRate: 0,
});

export default function InventoryPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [isEditing, setIsEditing] = useState(false);

  const PAGE_SIZE = 10;

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => actor!.listInventory(),
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: (item: InventoryItem) => actor!.createInventoryItem(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item created");
      setModalOpen(false);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to save item"),
  });

  const updateMutation = useMutation({
    mutationFn: (item: InventoryItem) => actor!.updateInventoryItem(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item updated");
      setModalOpen(false);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteInventoryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item deleted");
      setDeleteId(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to delete item"),
  });

  const calcSqft = (l: number, w: number) => +(l * w).toFixed(2);

  const filtered = inventory.filter(
    (item) =>
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.colorName.toLowerCase().includes(search.toLowerCase()) ||
      item.colorCode.toLowerCase().includes(search.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setForm(emptyItem());
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({ ...item });
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!actor) {
      toast.error("Still connecting to server, please try again in a moment.");
      return;
    }
    const item = { ...form, sqftPerSheet: calcSqft(form.length, form.width) };
    if (isEditing) {
      updateMutation.mutate(item);
    } else {
      createMutation.mutate({ ...item, id: BigInt(0) });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isLowStock = (item: InventoryItem) =>
    Number(item.sheetsAvailable) <= Number(item.lowStockThreshold);

  // Summary stats
  const totalSheets = inventory.reduce(
    (sum, item) => sum + Number(item.sheetsAvailable),
    0,
  );
  const totalItems = inventory.length;

  return (
    <div className="space-y-4">
      {/* In-Hand Stock Summary Card */}
      {isLoading || isFetching ? (
        <Skeleton
          data-ocid="inventory.loading_state"
          className="h-20 w-full rounded-xl"
        />
      ) : (
        <div
          data-ocid="inventory.card"
          className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 shadow-sm"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/15 text-accent shrink-0">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total In-Hand Stock
            </p>
            <p className="text-2xl font-bold text-foreground leading-tight">
              {totalSheets.toLocaleString()}{" "}
              <span className="text-base font-medium text-muted-foreground">
                sheets
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              across {totalItems} product{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={15}
          />
          <Input
            data-ocid="inventory.search_input"
            placeholder="Search inventory..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          data-ocid="inventory.add_button"
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={openAdd}
          disabled={!actor}
        >
          <Plus size={15} className="mr-1" /> Add Item
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="hidden sm:table-cell">C.Code</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead className="hidden md:table-cell">
                  Thickness
                </TableHead>
                <TableHead className="hidden md:table-cell">L×W (ft)</TableHead>
                <TableHead className="hidden lg:table-cell">Batch No</TableHead>
                <TableHead>In Hand Stock</TableHead>
                <TableHead className="hidden lg:table-cell">
                  SQFT/Sheet
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Purchase Rate
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Selling Rate
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                ["skel-r1", "skel-r2", "skel-r3"].map((sk) => (
                  <TableRow key={sk}>
                    {[
                      "c1",
                      "c2",
                      "c3",
                      "c4",
                      "c5",
                      "c6",
                      "c7",
                      "c8",
                      "c9",
                      "c10",
                      "c11",
                      "c12",
                    ].map((sc) => (
                      <TableCell key={sc}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12">
                    <div
                      data-ocid="inventory.empty_state"
                      className="text-muted-foreground text-sm"
                    >
                      {search
                        ? "No items found"
                        : "No inventory yet. Add your first item."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, i) => (
                  <TableRow
                    key={Number(item.id)}
                    data-ocid={`inventory.item.${i + 1}`}
                    className={isLowStock(item) ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">{item.brand}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs">
                      {item.colorCode}
                    </TableCell>
                    <TableCell>{item.colorName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.thickness} MM
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.length}×{item.width}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">
                      {item.batchNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isLowStock(item)
                            ? "border-destructive/50 text-destructive bg-destructive/10"
                            : "border-accent/50 text-accent bg-accent/10"
                        }
                      >
                        {Number(item.sheetsAvailable)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.sqftPerSheet}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      ₹{item.purchaseRate}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      ₹{item.sellingRate}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`inventory.edit_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          data-ocid={`inventory.delete_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            data-ocid="inventory.pagination_prev"
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
            data-ocid="inventory.pagination_next"
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
        <DialogContent className="max-w-xl" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Item" : "Add Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Brand *</Label>
              <Input
                data-ocid="inventory.input"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="e.g. ALUSTIC"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Input
                value={form.grade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grade: e.target.value }))
                }
                placeholder="e.g. AS-312"
              />
            </div>
            <div className="space-y-1.5">
              <Label>C.Code (Color Code)</Label>
              <Input
                value={form.colorCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colorCode: e.target.value }))
                }
                placeholder="e.g. AT-26"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Colour Name</Label>
              <Input
                value={form.colorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colorName: e.target.value }))
                }
                placeholder="e.g. TRAFFIC YELLOW"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Thickness (MM)</Label>
              <Input
                type="number"
                value={form.thickness}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thickness: +e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Batch Number</Label>
              <Input
                value={form.batchNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, batchNumber: e.target.value }))
                }
                placeholder="e.g. TC-066A"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Length (ft)</Label>
              <Input
                type="number"
                value={form.length}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    length: +e.target.value,
                    sqftPerSheet: calcSqft(+e.target.value, f.width),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Width (ft)</Label>
              <Input
                type="number"
                value={form.width}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    width: +e.target.value,
                    sqftPerSheet: calcSqft(f.length, +e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>SQFT/Sheet (auto)</Label>
              <Input
                readOnly
                value={calcSqft(form.length, form.width)}
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sheets Available</Label>
              <Input
                type="number"
                value={Number(form.sheetsAvailable)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sheetsAvailable: BigInt(Math.max(0, +e.target.value)),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                value={Number(form.lowStockThreshold)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lowStockThreshold: BigInt(Math.max(0, +e.target.value)),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Rate (per sqft) ₹</Label>
              <Input
                type="number"
                value={form.purchaseRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseRate: +e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Rate (per sqft) ₹</Label>
              <Input
                type="number"
                value={form.sellingRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sellingRate: +e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="inventory.cancel_button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="inventory.save_button"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleSave}
              disabled={isSaving || !form.brand || !actor}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Update" : "Save"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="inventory.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="inventory.delete_button"
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
