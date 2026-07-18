import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  CreditCard,
  Wallet,
  Search,
  Plus,
  Phone,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { Customer, CreateCustomerPayload } from '@/types';

function utilization(c: Customer) {
  if (!c.credit_limit) return 0;
  return Math.min(100, Math.round((c.current_outstanding_balance / c.credit_limit) * 100));
}

function RiskBadge({ customer }: { customer: Customer }) {
  const pct = utilization(customer);
  const label = pct >= 80 ? 'High Exposure' : pct >= 40 ? 'Moderate' : 'Healthy';
  return (
    <Badge
      className={cn('text-xs font-semibold border-0', {
        'bg-red-100 text-red-700': pct >= 80,
        'bg-amber-100 text-amber-700': pct >= 40 && pct < 80,
        'bg-emerald-100 text-emerald-700': pct < 40,
      })}
    >
      {label}
    </Badge>
  );
}

const emptyForm: CreateCustomerPayload = {
  full_name: '',
  phone: '',
  address: '',
  credit_limit: 5000,
};

export default function Customers() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: customers, isLoading, isError, refetch } = useCustomers(shopId);
  const createCustomer = useCreateCustomer(shopId);
  const deleteCustomer = useDeleteCustomer(shopId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'credit' | 'high'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateCustomerPayload>(emptyForm);

  const selected = customers?.find((c) => c.id === selectedId);
  const updateCustomer = useUpdateCustomer(shopId, selectedId ?? '');

  const stats = useMemo(() => {
    const list = customers ?? [];
    return {
      total: list.length,
      withCredit: list.filter((c) => c.current_outstanding_balance > 0).length,
      outstanding: list.reduce((s, c) => s + c.current_outstanding_balance, 0),
      avgLimit:
        list.length > 0
          ? Math.round(list.reduce((s, c) => s + c.credit_limit, 0) / list.length)
          : 0,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    return (customers ?? []).filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.full_name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filter === 'credit') return c.current_outstanding_balance > 0;
      if (filter === 'high') return utilization(c) >= 80;
      return true;
    });
  }, [customers, search, filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCustomer.mutateAsync(form);
    setDialogOpen(false);
    setForm(emptyForm);
  };

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-[#E3182D]">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage credit limits, outstanding balances, and customer records.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#E3182D] hover:bg-red-700 text-white shadow-sm transition-all duration-200"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.total.toLocaleString()}
          icon={Users}
          iconBg="bg-red-50/80"
          iconColor="text-[#E3182D]"
        />
        <StatCard
          title="Active Credit"
          value={stats.withCredit.toLocaleString()}
          icon={CreditCard}
          iconBg="bg-amber-50/80"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={Wallet}
          iconBg="bg-red-50/80"
          iconColor="text-[#E3182D]"
        />
        <StatCard
          title="Avg Credit Limit"
          value={formatCurrency(stats.avgLimit)}
          icon={CreditCard}
          iconBg="bg-emerald-50/80"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-slate-100/50">
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between gap-3 flex-wrap bg-slate-50/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 focus-visible:ring-red-500/20 focus-visible:border-[#E3182D]"
            />
          </div>
          <div className="bg-slate-100/80 p-0.5 rounded-lg flex gap-1 border border-slate-200/40">
            {(
              [
                ['all', 'All'],
                ['credit', 'Has Credit'],
                ['high', 'High Exposure'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer',
                  filter === key
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                )}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Add your first customer to start tracking credit sales."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/60">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Exposure
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer group"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-slate-200">
                          <AvatarFallback className="bg-red-50 text-[#E3182D] text-xs font-bold">
                            {c.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 tracking-tight group-hover:text-[#E3182D] transition-colors">{c.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            #{c.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-semibold">
                      {formatCurrency(c.credit_limit)}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge customer={c} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          c.current_outstanding_balance > 0
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        )}
                      >
                        {c.current_outstanding_balance > 0
                          ? formatCurrency(c.current_outstanding_balance)
                          : 'Cleared'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs font-semibold text-slate-400">
            Showing {filtered.length} of {customers?.length ?? 0} customers
          </p>
        </div>
      </div>

      <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-red-200">
                    <AvatarFallback className="bg-red-50 text-red-600 text-xl font-bold">
                      {selected.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-lg font-bold text-slate-900">
                      {selected.full_name}
                    </SheetTitle>
                    <div className="mt-1">
                      <RiskBadge customer={selected} />
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 mt-5">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Contact
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {selected.phone || 'No phone'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selected.address || 'No address'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Member since{' '}
                    {new Date(selected.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Credit Limit</p>
                    <p className="text-xl font-bold text-slate-800">
                      {formatCurrency(selected.credit_limit)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(selected.current_outstanding_balance)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Max Ever</p>
                    <p className="text-xl font-bold text-slate-800">
                      {formatCurrency(selected.max_outstanding_ever)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Utilization</p>
                    <p className="text-xl font-bold text-slate-800">{utilization(selected)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Update credit limit</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      defaultValue={selected.credit_limit}
                      id="credit-limit-edit"
                    />
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={updateCustomer.isPending}
                      onClick={() => {
                        const el = document.getElementById(
                          'credit-limit-edit'
                        ) as HTMLInputElement;
                        updateCustomer.mutate({ credit_limit: Number(el.value) });
                      }}
                    >
                      {updateCustomer.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  disabled={deleteCustomer.isPending}
                  onClick={() => {
                    deleteCustomer.mutate(selected.id);
                    setSelectedId(null);
                  }}
                >
                  Deactivate Customer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address ?? ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit limit (NPR)</Label>
              <Input
                type="number"
                min={0}
                required
                value={form.credit_limit}
                onChange={(e) =>
                  setForm({ ...form, credit_limit: Number(e.target.value) })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={createCustomer.isPending}
              >
                {createCustomer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
