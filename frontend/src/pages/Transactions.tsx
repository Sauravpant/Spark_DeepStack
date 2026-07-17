import { useState } from 'react';
import { useTransactions, useTransactionStats } from '@/hooks/useTransactions';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, ShoppingCart, ArrowDownLeft, Clock, Search,
  Download, Calendar, CreditCard, Banknote, Smartphone, Building2, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('text-xs font-semibold border-0', {
      'bg-emerald-100 text-emerald-700': status === 'Completed',
      'bg-amber-100 text-amber-700': status === 'Pending',
      'bg-red-100 text-red-700': status === 'Failed',
    })}>
      {status}
    </Badge>
  );
}

function MethodIcon({ method }: { method: string }) {
  if (method === 'Cash') return <Banknote className="w-4 h-4 text-emerald-500" />;
  if (method === 'FonePay') return <Smartphone className="w-4 h-4 text-blue-500" />;
  if (method === 'Credit') return <CreditCard className="w-4 h-4 text-red-500" />;
  return <Building2 className="w-4 h-4 text-slate-400" />;
}

export default function Transactions() {
  const { data: transactions, isLoading, isError, refetch } = useTransactions();
  const { data: stats } = useTransactionStats();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const filtered = (transactions ?? []).filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || t.type.toLowerCase().includes(activeTab);
    return matchesSearch && matchesTab;
  });

  const selected = transactions?.find(t => t.id === selectedId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track all sales, purchases and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Calendar className="w-4 h-4 mr-2" />Date Range</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Today's Sales" value={`NPR ${stats.todaySales.toLocaleString()}`} trend={12} subtitle="vs yesterday" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Weekly Sales" value={`NPR ${stats.weeklySales.toLocaleString()}`} trend={8} subtitle="vs last week" icon={ShoppingCart} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Monthly Purchases" value={`NPR ${stats.monthlyPurchases.toLocaleString()}`} icon={ArrowDownLeft} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatCard title="Pending Payments" value={`NPR ${stats.pendingPayments.toLocaleString()}`} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sale">Sales</TabsTrigger>
              <TabsTrigger value="purchase">Purchases</TabsTrigger>
              <TabsTrigger value="credit">Credit</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-60" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No transactions found" description="Adjust your filters or search terms." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedId(t.id)}>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{t.id}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', {
                        'bg-emerald-50 text-emerald-700': t.type === 'Sale',
                        'bg-blue-50 text-blue-700': t.type === 'Purchase',
                        'bg-purple-50 text-purple-700': t.type === 'Credit Payment',
                      })}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{t.customer}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MethodIcon method={t.method} />
                        {t.method}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={cn('text-sm font-bold', t.type === 'Sale' ? 'text-emerald-600' : 'text-slate-700')}>
                        NPR {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                      <span className="text-xs">{new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 h-7 px-2">
                        <Receipt className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {transactions?.length} transactions</p>
        </div>
      </div>

      {/* Invoice Drawer */}
      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[420px]">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b border-slate-100">
                <SheetTitle className="font-bold text-slate-900">Invoice — {selected.id}</SheetTitle>
                <StatusBadge status={selected.status} />
              </SheetHeader>
              <div className="space-y-4 mt-5">
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold text-slate-800">{selected.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-semibold text-slate-800">{selected.customer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Method</span>
                    <span className="font-semibold text-slate-800">{selected.method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">{new Date(selected.date).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-bold text-slate-800">Total Amount</span>
                    <span className="font-bold text-red-600 text-lg">NPR {selected.amount.toLocaleString()}</span>
                  </div>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white"><Download className="w-4 h-4 mr-2" />Download Invoice PDF</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
