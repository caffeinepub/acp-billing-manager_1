import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, FileText, Layers, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NavState } from "../App";
import { InvoiceStatus, InvoiceType } from "../backend";
import { useActor } from "../hooks/useActor";

interface Props {
  setNav: (nav: NavState) => void;
}

export default function DashboardPage({ setNav }: Props) {
  const { actor, isFetching } = useActor();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["salesSummary"],
    queryFn: () => actor!.getSalesSummary(),
    enabled: !!actor && !isFetching,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor!.listInvoices(),
    enabled: !!actor && !isFetching,
  });

  const { data: lowStock = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ["lowStock"],
    queryFn: () => actor!.getLowStockItems(),
    enabled: !!actor && !isFetching,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.listCustomers(),
    enabled: !!actor && !isFetching,
  });

  // Group invoices by month for chart
  const monthlyData = (() => {
    const map: Record<string, number> = {};
    for (const inv of invoices) {
      try {
        const month = format(new Date(inv.invoiceDate), "MMM yy");
        map[month] = (map[month] || 0) + 1;
      } catch {
        // skip
      }
    }
    return Object.entries(map)
      .slice(-8)
      .map(([month, count]) => ({ month, count }));
  })();

  const recentInvoices = [...invoices]
    .sort((a, b) => (a.invoiceDate > b.invoiceDate ? -1 : 1))
    .slice(0, 5);

  const kpis = [
    {
      label: "Total Invoices",
      value: summaryLoading ? null : Number(summary?.totalInvoices ?? 0),
      icon: <FileText className="w-5 h-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total SQFT Sold",
      value: summaryLoading ? null : (summary?.totalSqft ?? 0).toFixed(1),
      icon: <Layers className="w-5 h-5" />,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Low Stock Items",
      value: lowStockLoading ? null : lowStock.length,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Total Customers",
      value: customersLoading ? null : customers.length,
      icon: <Users className="w-5 h-5" />,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center ${kpi.color}`}
                >
                  {kpi.icon}
                </div>
              </div>
              {kpi.value === null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {kpi.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Monthly Invoice Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : monthlyData.length === 0 ? (
              <div
                data-ocid="dashboard.chart.empty_state"
                className="h-48 flex items-center justify-center text-muted-foreground text-sm"
              >
                No invoice data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="oklch(0.33 0.072 241)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : lowStock.length === 0 ? (
              <div
                data-ocid="dashboard.lowstock.empty_state"
                className="py-8 text-center text-sm text-muted-foreground"
              >
                All stock levels OK
              </div>
            ) : (
              lowStock.slice(0, 5).map((item, i) => (
                <div
                  key={Number(item.id)}
                  data-ocid={`dashboard.lowstock.item.${i + 1}`}
                  className="flex items-center justify-between p-2 rounded-md bg-destructive/5 text-xs"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {item.brand} {item.colorName}
                    </p>
                    <p className="text-muted-foreground">
                      {item.thickness}MM {item.length}×{item.width}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {Number(item.sheetsAvailable)} sheets
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : recentInvoices.length === 0 ? (
            <div
              data-ocid="dashboard.invoices.empty_state"
              className="py-8 text-center text-sm text-muted-foreground"
            >
              No invoices yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                      Bill No
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                      Party
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">
                      SQFT
                    </th>
                    <th className="text-center py-2 px-3 text-xs text-muted-foreground font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv, i) => (
                    <tr
                      key={Number(inv.id)}
                      data-ocid={`dashboard.invoices.item.${i + 1}`}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      tabIndex={0}
                      onClick={() =>
                        setNav({
                          page:
                            inv.invoiceType === InvoiceType.packingList
                              ? "invoice-view-packing"
                              : "invoice-view-tax",
                          invoiceId: inv.id,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setNav({
                            page:
                              inv.invoiceType === InvoiceType.packingList
                                ? "invoice-view-packing"
                                : "invoice-view-tax",
                            invoiceId: inv.id,
                          });
                      }}
                    >
                      <td className="py-2 px-3 font-mono text-xs">
                        {inv.billNumber || "DRAFT"}
                      </td>
                      <td className="py-2 px-3 font-medium truncate max-w-[120px]">
                        {inv.partyName}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {inv.invoiceType === InvoiceType.packingList
                            ? "PL"
                            : "TI"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground hidden md:table-cell">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {inv.totalSqft.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          className={`text-xs ${
                            inv.status === InvoiceStatus.saved
                              ? "bg-accent/15 text-accent border-accent/30"
                              : "bg-warning/15 text-warning border-warning/30"
                          }`}
                          variant="outline"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
