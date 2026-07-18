import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  PackageOpen,
  Package,
  Wallet,
  UserCircle,
  Activity,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardData } from '@/services/dashboard.service';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent = false,
}: {
  title: string;
  value: string;
  icon: any;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      'group relative rounded-2xl p-5 flex flex-col gap-4 border transition-all duration-200 cursor-default',
      'hover:-translate-y-1 hover:shadow-lg',
      accent
        ? 'bg-gradient-to-br from-[#E3182D] to-[#c41020] border-transparent text-white shadow-lg shadow-red-200'
        : 'bg-white border-slate-100 shadow-sm hover:shadow-slate-200/80'
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          accent ? 'bg-white/20' : 'bg-red-50'
        )}>
          <Icon className={cn('w-5 h-5', accent ? 'text-white' : 'text-[#E3182D]')} />
        </div>
        {subtitle && (
          <span className={cn(
            'text-[11px] font-semibold px-2 py-1 rounded-lg',
            accent ? 'bg-white/15 text-white/90' : 'bg-slate-50 text-slate-500'
          )}>
            {subtitle}
          </span>
        )}
      </div>
      <div>
        <p className={cn(
          'text-[11px] font-semibold uppercase tracking-widest mb-1',
          accent ? 'text-white/70' : 'text-slate-400'
        )}>
          {title}
        </p>
        <h3 className={cn(
          'text-[28px] font-bold tracking-tight leading-none',
          accent ? 'text-white' : 'text-slate-900'
        )}>
          {value}
        </h3>
      </div>
    </div>
  );
}

function SectionCard({ title, action, children }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <h3 className="font-semibold text-[15px] text-slate-900">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<'Today' | 'All Time'>('Today');
  const { activeShop, user } = useAuth();

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', activeShop?.id],
    queryFn: () => getDashboardData(activeShop!.id),
    enabled: !!activeShop?.id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-[#E3182D] animate-spin" />
        </div>
        <p className="text-slate-500 font-medium text-[14px]">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load dashboard</h3>
        <p className="text-slate-500 text-sm max-w-sm mb-5">
          Make sure your backend server is running and database migrations are up to date.
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-[#E3182D] hover:bg-red-700 text-white rounded-xl px-6 cursor-pointer"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const summary = dashboard.summary;
  const isToday = timeFilter === 'Today';
  const displayedRevenue = isToday ? summary.today_revenue : summary.total_revenue;
  const displayedTransactions = isToday ? summary.today_transactions : summary.total_transactions;
  const displayedProfit = isToday ? summary.today_profit : summary.total_profit;
  const inv = dashboard.inventory_status;
  const pay = dashboard.revenue_by_payment;
  const chartData = (dashboard.sales_over_time ?? []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="w-4 h-4 text-[#E3182D]" />
            <span className="text-[12px] font-semibold text-[#E3182D] uppercase tracking-wider">Overview</span>
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            {greeting()},{' '}
            <span className="gradient-text">
              {user?.full_name ? user.full_name.split(' ')[0] : 'Merchant'}
            </span>
          </h1>
          <p className="text-slate-500 text-[14px] mt-0.5">
            Here's what's happening with <span className="font-medium text-slate-700">{activeShop?.shop_name || 'your store'}</span> today.
          </p>
        </div>

        {/* Time filter toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm shrink-0">
          {(['Today', 'All Time'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                'px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 cursor-pointer',
                timeFilter === f
                  ? 'bg-[#E3182D] text-white shadow-sm shadow-red-200'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isToday ? "Today's Revenue" : 'Total Revenue'}
          value={formatCurrency(displayedRevenue)}
          icon={Wallet}
          subtitle={isToday ? undefined : `Profit ${formatCurrency(displayedProfit)}`}
          accent
        />
        <StatCard
          title={isToday ? "Today's Transactions" : 'Total Transactions'}
          value={displayedTransactions.toString()}
          icon={Activity}
        />
        <StatCard
          title="Credit Outstanding"
          value={formatCurrency(summary.total_credit_outstanding)}
          icon={UserCircle}
        />
        <StatCard
          title="Products"
          value={summary.total_products.toString()}
          icon={Package}
          subtitle={`${summary.low_stock_count} low stock`}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Chart + Table */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Sales Chart */}
          <SectionCard title="Sales — Last 7 Days">
            <div className="p-5">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No sales data yet</p>
                  <p className="text-xs text-slate-300 mt-1">Record a transaction to see the chart</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E3182D" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#E3182D" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      }}
                      cursor={{ stroke: '#E3182D', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#E3182D"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={{ fill: '#E3182D', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#E3182D', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          {/* Best Selling Products */}
          <SectionCard
            title="Best Selling Products"
            action={
              <Link
                to={ROUTES.INVENTORY}
                className="flex items-center gap-1 text-[13px] text-[#E3182D] font-semibold hover:opacity-75 transition-opacity cursor-pointer"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {(dashboard.top_products ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No product sales yet</p>
                <p className="text-xs text-slate-300 mt-1">Record a sale to see top products</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/70">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Units Sold</th>
                      <th className="px-5 py-3">Revenue</th>
                      <th className="px-5 py-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboard.top_products.map((p) => (
                      <tr
                        key={p.product_name}
                        className="hover:bg-slate-50/60 transition-colors table-row-hover"
                      >
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                            <PackageOpen className="w-4 h-4 text-[#E3182D]" />
                          </div>
                          <span className="font-semibold text-slate-800 text-[13px] truncate max-w-[140px]">
                            {p.product_name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-[13px]">{p.total_sold}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 text-[13px]">
                          {formatCurrency(p.total_revenue)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[12px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <TrendingUp className="w-3 h-3" />
                            {formatCurrency(p.total_profit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT: Payment + Inventory + Category */}
        <div className="flex flex-col gap-5">
          {/* Revenue by Payment */}
          <SectionCard title="Revenue by Payment">
            <div className="p-5 space-y-4">
              {(
                [
                  ['Cash', pay.cash, '#16a34a', 'bg-emerald-500'],
                  ['Credit', pay.credit, '#d97706', 'bg-amber-500'],
                  ['QR / Digital', pay.qr, '#2563eb', 'bg-blue-500'],
                ] as const
              ).map(([label, amount, textColor, barColor]) => {
                const total = pay.cash + pay.credit + pay.qr || 1;
                const pct = Math.round((amount / total) * 100);
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: textColor }}
                        />
                        <span className="font-medium text-slate-700">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatCurrency(amount)}</span>
                        <span className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Inventory Status */}
          <SectionCard
            title="Inventory Status"
            action={
              <Link
                to={ROUTES.INVENTORY}
                className="flex items-center gap-1 text-[13px] text-[#E3182D] font-semibold hover:opacity-75 transition-opacity cursor-pointer"
              >
                Manage <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="p-4 space-y-2.5">
              {[
                {
                  label: 'In Stock',
                  count: inv.in_stock,
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-800',
                  badge: 'bg-emerald-100 text-emerald-700',
                  dot: 'bg-emerald-500',
                },
                {
                  label: 'Low Stock',
                  count: inv.low_stock,
                  bg: 'bg-amber-50',
                  text: 'text-amber-800',
                  badge: 'bg-amber-100 text-amber-700',
                  dot: 'bg-amber-500',
                  icon: AlertTriangle,
                },
                {
                  label: 'Out of Stock',
                  count: inv.out_of_stock,
                  bg: 'bg-red-50',
                  text: 'text-red-800',
                  badge: 'bg-red-100 text-red-700',
                  dot: 'bg-red-500',
                  icon: TrendingDown,
                },
              ].map(({ label, count, bg, text, badge, dot, icon: Icon }) => (
                <div
                  key={label}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl transition-transform hover:scale-[1.01]',
                    bg
                  )}
                >
                  <span className={cn('text-[13px] font-semibold flex items-center gap-2', text)}>
                    <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {label}
                  </span>
                  <span className={cn('text-[12px] font-bold px-2.5 py-1 rounded-lg', badge)}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Revenue by Category */}
          <SectionCard title="Revenue by Category">
            <div className="p-5">
              {(dashboard.revenue_by_category ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6 font-medium">No category revenue yet</p>
              ) : (
                <div className="space-y-2.5">
                  {dashboard.revenue_by_category.slice(0, 5).map((c, i) => (
                    <div
                      key={c.category_name}
                      className="flex justify-between items-center text-[13px] py-1.5 border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center text-[10px] font-bold text-[#E3182D]">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 font-medium truncate max-w-[110px]">{c.category_name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
