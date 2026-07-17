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
}: {
  title: string;
  value: string;
  icon: any;
  subtitle?: string;
}) {
  return (
    <Card className="flex flex-col border-slate-200 shadow-sm">
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
            <Icon className="w-5 h-5 text-[#E3182D]" />
          </div>
          {subtitle && <span className="text-xs text-slate-500 font-medium">{subtitle}</span>}
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        </div>
      </CardContent>
    </Card>
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
        <Loader2 className="w-8 h-8 animate-spin text-[#E3182D]" />
        <p className="text-slate-500 font-medium">Loading store dashboard...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load dashboard data</h3>
        <p className="text-slate-500 max-w-sm mb-4">
          Make sure your backend server is running and database migrations are up to date.
        </p>
        <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white">
          Retry
        </Button>
      </div>
    );
  }

  const summary = dashboard.summary;
  const isToday = timeFilter === 'Today';
  const displayedRevenue = isToday ? summary.today_revenue : summary.total_revenue;
  const displayedTransactions = isToday
    ? summary.today_transactions
    : summary.total_transactions;
  const displayedProfit = isToday ? summary.today_profit : summary.total_profit;
  const inv = dashboard.inventory_status;
  const pay = dashboard.revenue_by_payment;
  const chartData = (dashboard.sales_over_time ?? []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Good morning, {user?.full_name ? user.full_name.split(' ')[0] : 'Merchant'}
          </h1>
          <p className="text-slate-500">
            Here's the latest overview for {activeShop?.shop_name || 'your store'}.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-1 flex shadow-sm">
          {(['Today', 'All Time'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-sm transition-colors cursor-pointer',
                timeFilter === f
                  ? 'bg-red-50 text-[#E3182D]'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isToday ? "Today's Revenue" : 'Total Revenue'}
          value={formatCurrency(displayedRevenue)}
          icon={Wallet}
          subtitle={isToday ? undefined : `Profit ${formatCurrency(displayedProfit)}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Sales (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-500 py-12 text-center">No sales data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E3182D" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#E3182D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#E3182D"
                      strokeWidth={2}
                      fill="url(#rev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Best Selling Products
              </CardTitle>
              <Button variant="link" className="text-red-600 font-medium" asChild>
                <Link to={ROUTES.INVENTORY}>View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(dashboard.top_products ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No product sales yet. Record a sale to see top products.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Units Sold</th>
                        <th className="px-4 py-3 font-semibold">Revenue</th>
                        <th className="px-4 py-3 font-semibold text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.top_products.map((p) => (
                        <tr
                          key={p.product_name}
                          className="border-b border-slate-50 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                              <PackageOpen className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-800">
                              {p.product_name}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{p.total_sold}</td>
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {formatCurrency(p.total_revenue)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">
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
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Revenue by Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ['Cash', pay.cash, 'bg-emerald-500'],
                  ['Credit', pay.credit, 'bg-amber-500'],
                  ['QR', pay.qr, 'bg-blue-500'],
                ] as const
              ).map(([label, amount, color]) => {
                const total = pay.cash + pay.credit + pay.qr || 1;
                const pct = Math.round((amount / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium text-emerald-800">In Stock</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">{inv.in_stock}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Low Stock
                </span>
                <Badge className="bg-amber-100 text-amber-700 border-0">{inv.low_stock}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Out of Stock
                </span>
                <Badge className="bg-red-100 text-red-700 border-0">{inv.out_of_stock}</Badge>
              </div>
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link to={ROUTES.INVENTORY}>Manage Inventory</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(dashboard.revenue_by_category ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No category revenue yet</p>
              ) : (
                dashboard.revenue_by_category.slice(0, 5).map((c) => (
                  <div key={c.category_name} className="flex justify-between text-sm py-1.5">
                    <span className="text-slate-600">{c.category_name}</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(c.revenue)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
