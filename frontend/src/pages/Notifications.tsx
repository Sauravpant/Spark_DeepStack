import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useLowStockProducts } from '@/hooks/useInventory';
import { useCreditSales } from '@/hooks/useTransactions';
import { useCustomers } from '@/hooks/useCustomers';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/StateComponents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, ShieldAlert, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/routes';

type NotifType = 'inventory' | 'credit' | 'payment';

type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  href: string;
  time: string;
};

const typeConfig = {
  inventory: {
    icon: Package,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    label: 'Inventory',
  },
  credit: {
    icon: ShieldAlert,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    label: 'Credit',
  },
  payment: {
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    label: 'Payment',
  },
};

export default function Notifications() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: lowStock, isLoading: loadingLow } = useLowStockProducts(shopId);
  const { data: unpaid, isLoading: loadingUnpaid } = useCreditSales(shopId, 'unpaid');
  const { data: overdue, isLoading: loadingOverdue } = useCreditSales(shopId, 'overdue');
  const { data: paid, isLoading: loadingPaid } = useCreditSales(shopId, 'paid');
  const { data: customers } = useCustomers(shopId);
  const [activeFilter, setActiveFilter] = useState<'all' | NotifType>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    (customers ?? []).forEach((c) => m.set(c.id, c.full_name));
    return m;
  }, [customers]);

  const notifications = useMemo(() => {
    const list: AppNotification[] = [];

    (lowStock ?? []).forEach((p) => {
      list.push({
        id: `inv-${p.id}`,
        title: p.stock_quantity <= 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `${p.product_name} has ${p.stock_quantity} ${p.unit} left (reorder at ${p.reorder_level}).`,
        type: 'inventory',
        href: ROUTES.INVENTORY,
        time: new Date(p.updated_at).toLocaleString('en-IN'),
      });
    });

    [...(overdue ?? []), ...(unpaid ?? [])].forEach((sale) => {
      list.push({
        id: `credit-${sale.id}`,
        title: sale.status === 'overdue' ? 'Payment Overdue' : 'Unpaid Credit',
        message: `Credit of ${formatCurrency(sale.credit_amount)} due ${sale.due_date}${
          sale.remarks ? ` — ${sale.remarks}` : ''
        }.`,
        type: 'credit',
        href: ROUTES.TRANSACTIONS,
        time: new Date(sale.created_at).toLocaleString('en-IN'),
      });
    });

    (paid ?? [])
      .slice(0, 5)
      .forEach((sale) => {
        list.push({
          id: `paid-${sale.id}`,
          title: 'Payment Received',
          message: `Credit of ${formatCurrency(sale.credit_amount)} marked as paid${
            sale.paid_at
              ? ` on ${new Date(sale.paid_at).toLocaleDateString('en-IN')}`
              : ''
          }.`,
          type: 'payment',
          href: ROUTES.TRANSACTIONS,
          time: new Date(sale.paid_at ?? sale.created_at).toLocaleString('en-IN'),
        });
      });

    // Suppress unused warning — customer names available if backend adds customer_id later
    void customerMap;

    return list.filter((n) => !dismissed.has(n.id));
  }, [lowStock, unpaid, overdue, paid, dismissed, customerMap]);

  const filtered = notifications.filter(
    (n) => activeFilter === 'all' || n.type === activeFilter
  );

  if (!shopId || loadingLow || loadingUnpaid || loadingOverdue || loadingPaid) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {notifications.length > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0 font-bold">
              {notifications.length}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400">Built from live inventory & credit data</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'inventory', 'credit', 'payment'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors',
              activeFilter === f
                ? 'bg-red-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {f === 'all' ? 'All' : typeConfig[f].label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            title="All clear"
            description="No low-stock or unpaid credit alerts right now."
          />
        ) : (
          filtered.map((n) => {
            const cfg = typeConfig[n.type];
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-start hover:border-slate-300 transition-colors"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    cfg.iconBg
                  )}
                >
                  <Icon className={cn('w-5 h-5', cfg.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{n.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 h-8"
                      onClick={() => setDismissed((prev) => new Set(prev).add(n.id))}
                    >
                      Dismiss
                    </Button>
                  </div>
                  <Link
                    to={n.href}
                    className="text-xs font-semibold text-red-600 hover:underline mt-2 inline-block"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
