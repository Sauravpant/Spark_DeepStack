import { useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateCreditSale,
  useCreditSales,
  useTransaction,
} from "@/hooks/useTransactions";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useInventory";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateComponents";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Clock,
  Search,
  Plus,
  Banknote,
  Smartphone,
  Receipt,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type {
  CreateTransactionPayload,
  CreditStatus,
  PaymentType,
  Transaction,
} from "@/types";

const KATHMANDU_TIME_ZONE = "Asia/Kathmandu";

function getKathmanduDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KATHMANDU_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatKathmanduDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: KATHMANDU_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function MethodIcon({ method }: { method: PaymentType }) {
  if (method === "cash")
    return <Banknote className="w-4 h-4 text-emerald-500" />;
  if (method === "qr") return <Smartphone className="w-4 h-4 text-blue-500" />;
  return <CreditCard className="w-4 h-4 text-red-500" />;
}

function paymentLabel(type: PaymentType) {
  if (type === "cash") return "Cash";
  if (type === "qr") return "QR";
  return "Credit";
}

function StatusBadge({ tx }: { tx: Transaction }) {
  const status = tx.credit_sale?.status ?? "completed";
  const label =
    status === "paid" ? "Paid"
    : status === "overdue" ? "Overdue"
    : status === "unpaid" ? "Unpaid"
    : "Completed";
  return (
    <Badge
      className={cn("text-xs font-semibold border-0 capitalize", {
        "bg-emerald-100 text-emerald-700":
          status === "completed" || status === "paid",
        "bg-amber-100 text-amber-700": status === "unpaid",
        "bg-red-100 text-red-700": status === "overdue",
      })}>
      {label}
    </Badge>
  );
}

function TransactionTypeBadge({ tx }: { tx: Transaction }) {
  return (
    <Badge
      className={cn("text-[10px] font-semibold border-0 capitalize", {
        "bg-sky-100 text-sky-700": tx.transaction_type === "sale",
        "bg-violet-100 text-violet-700": tx.transaction_type === "purchase",
      })}>
      {tx.transaction_type}
    </Badge>
  );
}

type CartLine = {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
};

export default function Transactions() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? "";
  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
  } = useTransactions(shopId);
  const { data: customers } = useCustomers(shopId);
  const { data: products } = useProducts(shopId);
  const { data: unpaidCredits } = useCreditSales(shopId, "unpaid");
  const { data: overdueCredits } = useCreditSales(shopId, "overdue");
  const { data: paidCredits } = useCreditSales(shopId, "paid");
  const createTx = useCreateTransaction(shopId);
  const updateCredit = useUpdateCreditSale(shopId);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const [creditFilter, setCreditFilter] = useState<CreditStatus | "all">("all");

  // Detail fetch via GET /transactions/{id}
  useTransaction(shopId, selectedId ?? "");

  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productPick, setProductPick] = useState("");

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    (customers ?? []).forEach((c) => map.set(c.id, c.full_name));
    return map;
  }, [customers]);

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    (products ?? []).forEach((p) => map.set(p.id, p.product_name));
    return map;
  }, [products]);

  const stats = useMemo(() => {
    const list = transactions ?? [];
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: KATHMANDU_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const todaySales = list
      .filter((t) => getKathmanduDateKey(t.created_at) === today)
      .reduce((s, t) => s + Number(t.total_amount), 0);
    const totalSales = list.reduce((s, t) => s + Number(t.total_amount), 0);
    const creditSales = list
      .filter((t) => t.payment_type === "credit")
      .reduce((s, t) => s + Number(t.total_amount), 0);
    const pending = list
      .filter((t) => t.credit_sale && t.credit_sale.status !== "paid")
      .reduce((s, t) => s + Number(t.credit_sale?.credit_amount ?? 0), 0);
    return { todaySales, totalSales, creditSales, pending, count: list.length };
  }, [transactions]);

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      const customerName =
        t.customer_id ? (customerMap.get(t.customer_id) ?? "") : "Walk-in";
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "credit") return t.payment_type === "credit";
      if (activeTab === "cash") return t.payment_type === "cash";
      if (activeTab === "qr") return t.payment_type === "qr";
      return true;
    });
  }, [transactions, search, activeTab, customerMap]);

  const selected = transactions?.find((t) => t.id === selectedId);
  const cartTotal =
    cart.reduce((s, l) => s + l.price * l.quantity, 0) - discount;

  const addProductToCart = () => {
    const product = products?.find((p) => p.id === productPick);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          quantity: 1,
          name: product.product_name,
          price: product.selling_price,
        },
      ];
    });
    setProductPick("");
  };

  const resetSaleForm = () => {
    setPaymentType("cash");
    setCustomerId("");
    setDueDate("");
    setDiscount(0);
    setNotes("");
    setCart([]);
    setProductPick("");
  };

  const submitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const payload: CreateTransactionPayload = {
      payment_type: paymentType,
      discount: discount || undefined,
      notes: notes || undefined,
      items: cart.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
      })),
      customer_id: customerId || undefined,
      due_date: paymentType === "credit" ? dueDate : undefined,
    };
    await createTx.mutateAsync(payload);
    setSaleOpen(false);
    resetSaleForm();
  };

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-[#E3182D]">
              <Receipt className="w-4 h-4" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          </div>
          <p className="text-sm text-slate-500">
            Record sales and track cash, QR, and credit payments.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#E3182D] hover:bg-red-700 text-white shadow-sm transition-all duration-200"
          onClick={() => setSaleOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={TrendingUp}
          iconBg="bg-emerald-50/80"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="All Sales"
          value={formatCurrency(stats.totalSales)}
          icon={ShoppingCart}
          iconBg="bg-blue-50/80"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Credit Sales"
          value={formatCurrency(stats.creditSales)}
          icon={CreditCard}
          iconBg="bg-red-50/80"
          iconColor="text-[#E3182D]"
        />
        <StatCard
          title="Pending Credit"
          value={formatCurrency(stats.pending)}
          icon={Clock}
          iconBg="bg-amber-50/80"
          iconColor="text-amber-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-slate-100/50">
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between gap-4 flex-wrap bg-slate-50/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="h-9 border border-slate-200/40 p-0.5 rounded-lg bg-slate-100/80">
              <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1 cursor-pointer">All</TabsTrigger>
              <TabsTrigger value="cash" className="text-xs font-semibold px-3 py-1 cursor-pointer">Cash</TabsTrigger>
              <TabsTrigger value="qr" className="text-xs font-semibold px-3 py-1 cursor-pointer">QR</TabsTrigger>
              <TabsTrigger value="credit" className="text-xs font-semibold px-3 py-1 cursor-pointer">Credit Sales</TabsTrigger>
              <TabsTrigger value="khata" className="text-xs font-semibold px-3 py-1 cursor-pointer">Khata</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-60 bg-white border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-[#E3182D]"
            />
          </div>
        </div>

        {activeTab === "khata" ?
          <div className="p-0 space-y-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex gap-2">
              {(["all", "unpaid", "overdue", "paid"] as const).map((s) => (
                <button
                  key={s}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer border",
                    creditFilter === s ?
                      "bg-white border-slate-300 text-slate-900 shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                  onClick={() => setCreditFilter(s)}>
                  {s === "all" ? "All Open" : s}
                </button>
              ))}
            </div>
            {(() => {
              const rows =
                creditFilter === "unpaid" ? (unpaidCredits ?? [])
                : creditFilter === "overdue" ? (overdueCredits ?? [])
                : creditFilter === "paid" ? (paidCredits ?? [])
                : [...(unpaidCredits ?? []), ...(overdueCredits ?? [])];
              if (!rows.length) {
                return (
                  <EmptyState
                    title="No open credit sales"
                    description="Unpaid and overdue khata entries will appear here."
                  />
                );
              }
              return (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200/60">
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Due
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {formatCurrency(Number(sale.credit_amount))}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-650 font-medium">
                            {sale.due_date}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={cn("border-0 capitalize rounded-md shadow-none px-2.5 py-0.5 text-xs font-semibold", {
                                "bg-amber-100 text-amber-700":
                                  sale.status === "unpaid",
                                "bg-red-100 text-red-700":
                                  sale.status === "overdue",
                                "bg-emerald-100 text-emerald-700":
                                  sale.status === "paid",
                              })}>
                              {sale.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {sale.status !== "paid" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                                disabled={updateCredit.isPending}
                                onClick={() =>
                                  updateCredit.mutate({
                                    creditSaleId: sale.id,
                                    payload: { status: "paid" },
                                  })
                                }>
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        : filtered.length === 0 ?
          <EmptyState
            title="No transactions yet"
            description="Create a new sale to start recording revenue."
          />
        : <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/60">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer group"
                    onClick={() => setSelectedId(t.id)}>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{t.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 tracking-tight group-hover:text-[#E3182D] transition-colors">
                      {t.customer_id ?
                        (customerMap.get(t.customer_id) ?? "Customer")
                      : "Walk-in"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-650 font-medium">
                        <span className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-150">
                          <MethodIcon method={t.payment_type} />
                        </span>
                        {paymentLabel(t.payment_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <TransactionTypeBadge tx={t} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-850">
                      {formatCurrency(Number(t.total_amount))}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tx={t} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatKathmanduDateTime(t.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-slate-700 h-8 w-8 hover:bg-slate-100 rounded-md">
                        <Receipt className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs font-semibold text-slate-450">
            Showing {filtered.length} of {transactions?.length ?? 0}{" "}
            transactions
          </p>
        </div>
      </div>

      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-105 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b border-slate-100">
                <SheetTitle className="font-bold text-slate-900">
                  Sale — #{selected.id.slice(0, 8)}
                </SheetTitle>
                <StatusBadge tx={selected} />
              </SheetHeader>
              <div className="space-y-4 mt-5">
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-semibold text-slate-800">
                      {selected.customer_id ?
                        (customerMap.get(selected.customer_id) ?? "Customer")
                      : "Walk-in"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Method</span>
                    <span className="font-semibold text-slate-800">
                      {paymentLabel(selected.payment_type)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">
                      {formatKathmanduDateTime(selected.created_at)}
                    </span>
                  </div>
                  {selected.notes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Notes</span>
                      <span className="font-semibold text-slate-800">
                        {selected.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Items
                  </h3>
                  {selected.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm border-b border-slate-50 py-2">
                      <span className="text-slate-700">
                        {productMap.get(item.product_id) ??
                          item.product_id.slice(0, 8)}{" "}
                        × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="font-bold text-red-600 text-lg">
                      {formatCurrency(Number(selected.total_amount))}
                    </span>
                  </div>
                </div>

                {selected.credit_sale &&
                  selected.credit_sale.status !== "paid" && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={updateCredit.isPending}
                      onClick={() =>
                        updateCredit.mutate({
                          creditSaleId: selected.credit_sale!.id,
                          payload: { status: "paid" },
                        })
                      }>
                      {updateCredit.isPending ?
                        <Loader2 className="w-4 h-4 animate-spin" />
                      : "Mark Credit as Paid"}
                    </Button>
                  )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={saleOpen}
        onOpenChange={(open) => {
          setSaleOpen(open);
          if (!open) resetSaleForm();
        }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitSale} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "qr", "credit"] as PaymentType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={paymentType === type ? "default" : "outline"}
                  className={
                    paymentType === type ?
                      "bg-red-600 hover:bg-red-700 text-white"
                    : ""
                  }
                  onClick={() => setPaymentType(type)}>
                  {paymentLabel(type)}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>
                Customer{" "}
                {paymentType === "credit" ? "(required)" : "(optional)"}
              </Label>
              <select
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={customerId}
                required={paymentType === "credit"}
                onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {(customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            {paymentType === "credit" && (
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Add product</Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 h-10 rounded-md border border-slate-200 px-3 text-sm"
                  value={productPick}
                  onChange={(e) => setProductPick(e.target.value)}>
                  <option value="">Select product...</option>
                  {(products ?? [])
                    .filter((p) => p.stock_quantity > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.stock_quantity} {p.unit}) —{" "}
                        {formatCurrency(p.selling_price)}
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductToCart}>
                  Add
                </Button>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="space-y-2 border rounded-lg p-3">
                {cart.map((line) => (
                  <div
                    key={line.product_id}
                    className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-medium text-slate-800">
                      {line.name}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      className="w-16 h-8"
                      value={line.quantity}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((l) =>
                            l.product_id === line.product_id ?
                              { ...l, quantity: Number(e.target.value) || 1 }
                            : l,
                          ),
                        )
                      }
                    />
                    <span className="w-20 text-right font-semibold">
                      {formatCurrency(line.price * line.quantity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-8 w-8 p-0"
                      onClick={() =>
                        setCart((prev) =>
                          prev.filter((l) => l.product_id !== line.product_id),
                        )
                      }>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center font-bold text-red-600 text-lg">
                  {formatCurrency(Math.max(0, cartTotal))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaleOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={createTx.isPending || cart.length === 0}>
                {createTx.isPending ?
                  <Loader2 className="w-4 h-4 animate-spin" />
                : "Record Sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
