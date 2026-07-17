import { useReports } from '@/hooks/useReports';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';

const COLORS = ['#E3182D', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: NPR {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { data, isLoading, isError, refetch } = useReports();

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          <Tabs defaultValue="week">
            <TabsList className="h-9">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" />PDF</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`NPR ${data.summary.totalRevenue.toLocaleString()}`} trend={12.5} subtitle="vs last week" icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Total Profit" value={`NPR ${data.summary.totalProfit.toLocaleString()}`} trend={8.2} subtitle="vs last week" icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Total Orders" value={data.summary.totalOrders.toLocaleString()} trend={15} subtitle="vs last week" icon={ShoppingCart} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Avg. Order Value" value={`NPR ${data.summary.averageOrderValue}`} trend={3.1} subtitle="vs last week" icon={BarChart3} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue vs Profit</h2>
            <p className="text-xs text-slate-400">Weekly trend</p>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-500"><Download className="w-4 h-4 mr-1" />PNG</Button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.revenueTrend}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E3182D" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#E3182D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E3182D" strokeWidth={2} fill="url(#colorRevenue)" />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales by Category Pie */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-900 mb-1">Sales by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Revenue breakdown this period</p>
          <div className="flex items-center justify-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={data.salesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {data.salesByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {data.salesByCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-slate-600">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-900 mb-1">Daily Revenue</h2>
          <p className="text-xs text-slate-400 mb-4">Revenue per day this week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.revenueTrend} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#E3182D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
