import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboard } from '@/hooks/useDashboard';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

const COLORS = ['#E3182D', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

export default function Reports() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data, isLoading, isError, refetch } = useDashboard(shopId);

  const paymentPie = useMemo(() => {
    if (!data) return [];
    const p = data.revenue_by_payment;
    return [
      { name: 'Cash', value: p.cash },
      { name: 'Credit', value: p.credit },
      { name: 'QR', value: p.qr },
    ].filter((x) => x.value > 0);
  }, [data]);

  const salesTrend = useMemo(
    () =>
      (data?.sales_over_time ?? []).map((d) => ({
        label: new Date(d.date).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
        }),
        revenue: d.revenue,
        profit: d.profit,
      })),
    [data]
  );

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const s = data.summary;
  const avgOrder =
    s.total_transactions > 0 ? Math.round(s.total_revenue / s.total_transactions) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Live data from your shop dashboard API
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(s.total_revenue)}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(s.total_profit)}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Orders"
          value={s.total_transactions.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Avg. Order Value"
          value={formatCurrency(avgOrder)}
          icon={BarChart3}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-900 mb-1">Revenue vs Profit</h2>
        <p className="text-xs text-slate-400 mb-4">Last 7 days</p>
        {salesTrend.length === 0 ? (
          <EmptyState title="No sales yet" description="Record transactions to see trends." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E3182D" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#E3182D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E3182D"
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                fill="url(#colorProfit)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Revenue by Payment</h2>
          {paymentPie.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No payment data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {paymentPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Top Products</h2>
          {(data.top_products ?? []).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No product sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.top_products.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="product_name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total_revenue" fill="#E3182D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">Revenue by Category</h2>
        {(data.revenue_by_category ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No category revenue yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Category
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Products
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Revenue
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.revenue_by_category.map((c) => (
                  <tr key={c.category_name}>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.category_name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{c.product_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(c.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {formatCurrency(c.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
