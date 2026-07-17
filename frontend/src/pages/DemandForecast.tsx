import { useDemand } from '@/hooks/useDemand';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Sparkles, CalendarDays, AlertTriangle } from 'lucide-react';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-xs text-red-600">Demand Index: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function DemandForecast() {
  const { data, isLoading, isError, refetch } = useDemand();

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand Forecasting</h1>
          <p className="text-sm text-slate-500 mt-0.5">AI-powered predictions for your inventory needs</p>
        </div>
        <Badge className="bg-red-50 text-red-700 border-red-200 border px-3 py-1 h-auto">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />AI Powered
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Peak Season" value="Oct–Dec" subtitle="Dashain/Tihar surge" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Predicted Surge" value={`+${data.festivalImpact.predictedSurge}%`} subtitle={data.festivalImpact.festival} icon={CalendarDays} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard title="Festival In" value={`${data.festivalImpact.daysAway} days`} subtitle={data.festivalImpact.festival} icon={CalendarDays} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard title="Restock Alerts" value="3 items" subtitle="Action needed" icon={AlertTriangle} iconBg="bg-orange-50" iconColor="text-orange-600" />
      </div>

      {/* Seasonality Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">Annual Demand Seasonality</h2>
          <p className="text-xs text-slate-400">Historical demand index across the year</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.seasonality}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E3182D" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#E3182D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="demand" stroke="#E3182D" strokeWidth={2.5} fill="url(#colorDemand)" dot={{ fill: '#E3182D', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Festival Impact & Growing/Declining */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Festival Card */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-red-200" />
            <span className="text-sm font-semibold text-red-100">Upcoming Festival</span>
          </div>
          <h3 className="text-2xl font-black mb-1">{data.festivalImpact.festival}</h3>
          <p className="text-red-200 text-sm mb-4">{data.festivalImpact.daysAway} days away</p>
          <div className="bg-red-500/40 rounded-lg p-3 mb-3">
            <p className="text-xs text-red-100 mb-1">Predicted Demand Surge</p>
            <p className="text-3xl font-black">+{data.festivalImpact.predictedSurge}%</p>
          </div>
          <div>
            <p className="text-xs text-red-100 mb-2">Recommended Restocking</p>
            <div className="flex flex-wrap gap-1.5">
              {data.festivalImpact.recommendedCategories.map(cat => (
                <Badge key={cat} className="bg-white/20 text-white border-0 text-[10px]">{cat}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Top Growing */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900">Top Growing</h2>
          </div>
          <div className="space-y-4">
            {data.topGrowing.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.reason}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 ml-2">+{item.growth}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${item.growth}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Declining */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-slate-900">Top Declining</h2>
          </div>
          <div className="space-y-4">
            {data.topDeclining.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.reason}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 ml-2">{item.decline}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${Math.abs(item.decline)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
