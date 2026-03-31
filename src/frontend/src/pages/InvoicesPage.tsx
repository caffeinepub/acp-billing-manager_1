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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { NavState } from "../App";
import { InvoiceStatus, InvoiceType } from "../backend";
import { useActor } from "../hooks/useActor";

interface Props {
  setNav: (nav: NavState) => void;
}

const SKEL_ROWS = ["s1", "s2", "s3"];
const SKEL_COLS = ["c1", "c2", "c3", "c4", "c5", "c6"];

export default function InvoicesPage({ setNav }: Props) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor!.listInvoices(),
    enabled: !!actor && !isFetching,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      const invoice = await actor!.getInvoice(id);
      if (invoice.status === InvoiceStatus.saved) {
        for (const item of invoice.items) {
          if (item.inventoryId && item.qty > 0) {
            const invItem = await actor!.getInventoryItem(item.inventoryId);
            await actor!.updateInventoryItem({
              ...invItem,
              sheetsAvailable: invItem.sheetsAvailable + BigInt(item.qty),
            });
          }
        }
      }
      await actor!.deleteInvoice(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Invoice deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  const packingLists = invoices.filter(
    (i) => i.invoiceType === InvoiceType.packingList,
  );
  const taxInvoices = invoices.filter(
    (i) => i.invoiceType === InvoiceType.taxInvoice,
  );

  const filterInv = (list: typeof invoices) =>
    list.filter(
      (i) =>
        i.partyName.toLowerCase().includes(search.toLowerCase()) ||
        i.billNumber.toLowerCase().includes(search.toLowerCase()),
    );

  const InvoiceTable = ({ list }: { list: typeof invoices }) => (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell">Total SQFT</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKEL_ROWS.map((sk) => (
                <TableRow key={sk}>
                  {SKEL_COLS.map((sc) => (
                    <TableCell key={sc}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filterInv(list).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div
                    data-ocid="invoices.empty_state"
                    className="text-muted-foreground text-sm"
                  >
                    {search ? "No invoices found" : "No invoices yet"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filterInv(list).map((inv, i) => (
                <TableRow
                  key={Number(inv.id)}
                  data-ocid={`invoices.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs">
                    {inv.billNumber || "DRAFT"}
                  </TableCell>
                  <TableCell className="font-medium">{inv.partyName}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {inv.invoiceDate}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {inv.totalSqft.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        inv.status === InvoiceStatus.saved
                          ? "bg-accent/15 text-accent border-accent/30 text-xs"
                          : "bg-warning/15 text-warning border-warning/30 text-xs"
                      }
                    >
                      {inv.status === InvoiceStatus.saved ? "Saved" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        data-ocid={`invoices.view.button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View"
                        onClick={() =>
                          setNav({
                            page:
                              inv.invoiceType === InvoiceType.packingList
                                ? "invoice-view-packing"
                                : "invoice-view-tax",
                            invoiceId: inv.id,
                          })
                        }
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        data-ocid={`invoices.edit_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() =>
                          setNav({
                            page: "invoice-edit",
                            invoiceId: inv.id,
                            invoiceType: inv.invoiceType,
                          })
                        }
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        data-ocid={`invoices.print.button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Print"
                        onClick={() => {
                          setNav({
                            page:
                              inv.invoiceType === InvoiceType.packingList
                                ? "invoice-view-packing"
                                : "invoice-view-tax",
                            invoiceId: inv.id,
                          });
                          setTimeout(() => window.print(), 500);
                        }}
                      >
                        <Printer size={14} />
                      </Button>
                      <Button
                        data-ocid={`invoices.delete_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => setDeleteId(inv.id)}
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
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={15}
          />
          <Input
            data-ocid="invoices.search_input"
            placeholder="Search invoices..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="invoices.new_packing_button"
            variant="outline"
            onClick={() => setNav({ page: "invoice-new-packing" })}
          >
            <Plus size={14} className="mr-1" /> Packing List
          </Button>
          <Button
            data-ocid="invoices.new_tax_button"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => setNav({ page: "invoice-new-tax" })}
          >
            <Plus size={14} className="mr-1" /> Tax Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="packing">
        <TabsList>
          <TabsTrigger data-ocid="invoices.packing.tab" value="packing">
            Packing Lists ({packingLists.length})
          </TabsTrigger>
          <TabsTrigger data-ocid="invoices.tax.tab" value="tax">
            Tax Invoices ({taxInvoices.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="packing" className="mt-4">
          <InvoiceTable list={packingLists} />
        </TabsContent>
        <TabsContent value="tax" className="mt-4">
          <InvoiceTable list={taxInvoices} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent data-ocid="invoices.dialog">
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="invoices.cancel_button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="invoices.delete_button"
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
