import { useState } from 'react';
import { useCustomers, useCustomerStats } from '@/hooks/useCustomers';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, UserCheck, ShieldAlert, Star, Search, Plus,
  Download, Phone, Mail, Calendar, CreditCard, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

function RiskBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('text-xs font-semibold border-0', {
      'bg-red-100 text-red-700': status === 'High Risk',
      'bg-amber-100 text-amber-700': status === 'Medium Risk',
      'bg-emerald-100 text-emerald-700': status === 'Low Risk',
    })}>
      {status}
    </Badge>
  );
}

export default function Customers() {
  const { data: customers, isLoading, isError, refetch } = useCustomers();
  const { data: stats } = useCustomerStats();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const filtered = (customers ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = customers?.find(c => c.id === selectedId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage credit, risk, and customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={stats.totalCustomers.toLocaleString()} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Active Credit" value={stats.activeCredit.toLocaleString()} icon={CreditCard} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatCard title="High Risk" value={stats.highRisk.toLocaleString()} icon={ShieldAlert} iconBg="bg-red-50" iconColor="text-red-600" />
          <StatCard title="Avg. AI Score" value={`${stats.averageScore}`} icon={Star} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm" className="text-red-600">High Risk</Button>
            <Button variant="ghost" size="sm">Medium</Button>
            <Button variant="ghost" size="sm">Low Risk</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No customers found" description="Try a different search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Order</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedId(c.id)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-slate-200">
                          <AvatarFallback className="bg-red-50 text-red-600 text-xs font-bold">{c.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">#{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-600">{c.phone}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={cn('h-full rounded-full', c.score >= 80 ? 'bg-emerald-500' : c.score >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{c.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><RiskBadge status={c.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={cn('text-sm font-semibold', c.outstanding > 0 ? 'text-red-600' : 'text-emerald-600')}>
                        {c.outstanding > 0 ? `NPR ${c.outstanding.toLocaleString()}` : 'Cleared'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{new Date(c.recentOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {customers?.length} customers</p>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-red-200">
                    <AvatarFallback className="bg-red-50 text-red-600 text-xl font-bold">{selected.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-lg font-bold text-slate-900">{selected.name}</SheetTitle>
                    <p className="text-xs font-mono text-slate-400">#{selected.id}</p>
                    <div className="mt-1"><RiskBadge status={selected.status} /></div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 mt-5">
                {/* Contact */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />{selected.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />{selected.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />Member since {selected.memberSince}
                  </div>
                </div>

                {/* Credit Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">AI Credit Score</p>
                    <p className={cn('text-2xl font-black', selected.score >= 80 ? 'text-emerald-600' : selected.score >= 60 ? 'text-amber-600' : 'text-red-600')}>{selected.score}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                    <p className="text-2xl font-black text-red-600">NPR {selected.outstanding.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Total Purchases</p>
                    <p className="text-xl font-bold text-slate-800">NPR {selected.totalPurchases.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Overdue Days</p>
                    <p className={cn('text-xl font-bold', selected.overdueDays > 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {selected.overdueDays > 0 ? `${selected.overdueDays}d` : 'None'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h3>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white justify-start"><UserCheck className="w-4 h-4 mr-2" />Approve Credit Extension</Button>
                  <Button variant="outline" className="w-full justify-start"><CreditCard className="w-4 h-4 mr-2" />Request Payment</Button>
                  <Button variant="outline" className="w-full justify-start text-slate-600"><Download className="w-4 h-4 mr-2" />Export Statement</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
