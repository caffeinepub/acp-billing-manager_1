import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { InvoiceStatus } from "../backend";
import { useActor } from "../hooks/useActor";

const SKEL_ROWS = ["s1", "s2", "s3"];

export default function ReportsPage() {
  const { actor, isFetching } = useActor();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [historyCustomer, setHistoryCustomer] = useState("");

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor!.listInvoices(),
    enabled: !!actor && !isFetching,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.listCustomers(),
    enabled: !!actor && !isFetching,
  });

  const { data: stockReport = [], isLoading: stockLoading } = useQuery({
    queryKey: ["stockReport"],
    queryFn: () => actor!.getStockReport(),
    enabled: !!actor && !isFetching,
  });

  const { data: purchaseHistory } = useQuery({
    queryKey: ["purchaseHistory", historyCustomer],
    queryFn: () => actor!.getCustomerPurchaseHistory(BigInt(historyCustomer)),
    enabled: !!actor && !isFetching && !!historyCustomer,
  });

  const filteredInvoices = invoices.filter((inv) => {
    if (dateFrom && inv.invoiceDate < dateFrom) return false;
    if (dateTo && inv.invoiceDate > dateTo) return false;
    if (
      selectedCustomer !== "all" &&
      Number(inv.customerId) !== Number(selectedCustomer)
    )
      return false;
    return true;
  });

  const totalSqft = filteredInvoices.reduce((s, i) => s + i.totalSqft, 0);
  const savedCount = filteredInvoices.filter(
    (i) => i.status === InvoiceStatus.saved,
  ).length;

  const isLowStock = (item: (typeof stockReport)[0]) =>
    Number(item.sheetsAvailable) <= Number(item.lowStockThreshold);

  const historyInvoices = historyCustomer
    ? invoices.filter(
        (inv) => Number(inv.customerId) === Number(historyCustomer),
      )
    : [];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger data-ocid="reports.sales.tab" value="sales">
            Sales Report
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.stock.tab" value="stock">
            Stock Report
          </TabsTrigger>
          <TabsTrigger data-ocid="reports.history.tab" value="history">
            Customer History
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input
                    data-ocid="reports.date_from.input"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input
                    data-ocid="reports.date_to.input"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer</Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger
                      data-ocid="reports.customer.select"
                      className="w-48"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((c) => (
                        <SelectItem
                          key={Number(c.id)}
                          value={String(Number(c.id))}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-ocid="reports.clear.button"
                  variant="outline"
                  size="sm"
                  className="self-end"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSelectedCustomer("all");
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total SQFT</p>
                <p className="text-2xl font-bold">{totalSqft.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Saved Invoices</p>
                <p className="text-2xl font-bold">{savedCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total SQFT</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invLoading ? (
                    SKEL_ROWS.map((sk) => (
                      <TableRow key={sk}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-4" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div
                          data-ocid="reports.sales.empty_state"
                          className="text-muted-foreground text-sm"
                        >
                          No invoices in range
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv, i) => (
                      <TableRow
                        key={Number(inv.id)}
                        data-ocid={`reports.sales.item.${i + 1}`}
                      >
                        <TableCell className="font-mono text-xs">
                          {inv.billNumber}
                        </TableCell>
                        <TableCell>{inv.partyName}</TableCell>
                        <TableCell>{inv.invoiceDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {inv.invoiceType}
                          </Badge>
                        </TableCell>
                        <TableCell>{inv.totalSqft.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              inv.status === InvoiceStatus.saved
                                ? "text-accent"
                                : "text-warning"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" className="mt-4">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Colour</TableHead>
                    <TableHead>Thickness</TableHead>
                    <TableHead>L×W</TableHead>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Sheets</TableHead>
                    <TableHead>SQFT/Sheet</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLoading ? (
                    SKEL_ROWS.map((sk) => (
                      <TableRow key={sk}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-4" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : stockReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <div
                          data-ocid="reports.stock.empty_state"
                          className="text-muted-foreground text-sm"
                        >
                          No inventory
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockReport.map((item, i) => (
                      <TableRow
                        key={Number(item.id)}
                        data-ocid={`reports.stock.item.${i + 1}`}
                        className={isLowStock(item) ? "bg-destructive/5" : ""}
                      >
                        <TableCell>{item.brand}</TableCell>
                        <TableCell>{item.grade}</TableCell>
                        <TableCell>{item.colorName}</TableCell>
                        <TableCell>{item.thickness} MM</TableCell>
                        <TableCell>
                          {item.length}×{item.width}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.batchNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isLowStock(item)
                                ? "text-destructive border-destructive/50"
                                : "text-accent border-accent/50"
                            }
                          >
                            {Number(item.sheetsAvailable)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.sqftPerSheet}</TableCell>
                        <TableCell>
                          {isLowStock(item) ? (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-accent border-accent/50"
                            >
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Customer History */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Select Customer:</Label>
            <Select value={historyCustomer} onValueChange={setHistoryCustomer}>
              <SelectTrigger
                data-ocid="reports.history.select"
                className="w-64"
              >
                <SelectValue placeholder="Pick a customer" />
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

          {historyCustomer && (
            <>
              {purchaseHistory && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Total Invoices
                      </p>
                      <p className="text-2xl font-bold">
                        {Number(purchaseHistory.invoiceCount)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Total SQFT Purchased
                      </p>
                      <p className="text-2xl font-bold">
                        {purchaseHistory.totalSqft.toFixed(1)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Total SQFT</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            <div
                              data-ocid="reports.history.empty_state"
                              className="text-muted-foreground text-sm"
                            >
                              No invoices for this customer
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        historyInvoices.map((inv, i) => (
                          <TableRow
                            key={Number(inv.id)}
                            data-ocid={`reports.history.item.${i + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              {inv.billNumber}
                            </TableCell>
                            <TableCell>{inv.invoiceDate}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {inv.invoiceType}
                              </Badge>
                            </TableCell>
                            <TableCell>{inv.totalSqft.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  inv.status === InvoiceStatus.saved
                                    ? "text-accent"
                                    : "text-warning"
                                }
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
