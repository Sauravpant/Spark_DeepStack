import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useProducts } from '@/hooks/useInventory';
import { useDemandForecast7Days, useDemandForecastNextDay, useDemandModelInfo } from '@/hooks/useML';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Package,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-xs text-red-600">
          Predicted: {Number(payload[0].value).toFixed(1)} units
        </p>
      </div>
    );
  }
  return null;
};

export default function DemandForecast() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: products, isLoading, isError, refetch } = useProducts(shopId);
  const [productId, setProductId] = useState<string | null>(null);

  const selectedId = productId ?? products?.[0]?.id ?? null;
  const selected = products?.find((p) => p.id === selectedId) ?? null;

  const {
    data: forecast,
    isLoading: forecastLoading,
    isError: forecastError,
    error: forecastErr,
    refetch: refetchForecast,
  } = useDemandForecast7Days(shopId, selectedId);

  const { data: nextDay } = useDemandForecastNextDay(shopId, selectedId);
  const { data: modelInfo } = useDemandModelInfo(!!shopId);

  const chartData = useMemo(() => {
    return (forecast ?? []).map((d) => ({
      date: new Date(d.forecast_date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
      }),
      units: Math.round(d.predicted_units * 10) / 10,
      confidence: Math.round(d.confidence * 100),
    }));
  }, [forecast]);

  const peakDay = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((a, b) => (b.units > a.units ? b : a));
  }, [chartData]);

  const totalPredicted = chartData.reduce((s, d) => s + d.units, 0);

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  if (!products?.length) {
    return (
      <div className="p-6">
        <EmptyState
          title="No products to forecast"
          description="Add products and record sales so the demand model can build history."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand Forecasting</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            7-day AI predictions based on your product sales history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-md border border-slate-200 px-3 text-sm bg-white min-w-[220px]"
            value={selectedId ?? ''}
            onChange={(e) => setProductId(e.target.value)}
          >
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name}
              </option>
            ))}
          </select>
          <Badge className="bg-red-50 text-red-700 border-red-200 border px-3 py-1 h-auto">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI Powered
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Product"
          value={selected?.product_name?.slice(0, 18) ?? '—'}
          subtitle={`Stock: ${selected?.stock_quantity ?? 0}`}
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Tomorrow"
          value={nextDay ? nextDay.predicted_units.toFixed(1) : '—'}
          subtitle={nextDay?.forecast_date}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="7-Day Demand"
          value={totalPredicted.toFixed(0)}
          subtitle="Predicted units"
          icon={TrendingUp}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          title="Peak Day"
          value={peakDay ? String(peakDay.units) : '—'}
          subtitle={
            modelInfo
              ? `Model: ${String((modelInfo as any)?.model ?? (modelInfo as any)?.metadata?.model ?? 'loaded')}`
              : peakDay?.date
          }
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {forecastLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-sm text-slate-500">Generating 7-day forecast...</p>
        </div>
      ) : forecastError ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="font-semibold text-slate-800">Forecast unavailable</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {(forecastErr as any)?.response?.data?.message ||
              'Need enough sales history or a loaded demand model on the backend.'}
          </p>
          <Button
            onClick={() => refetchForecast()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Next 7 Days — {selected?.product_name}
              </h2>
              <p className="text-xs text-slate-400">
                Predicted units sold per day from the demand model
              </p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E3182D" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#E3182D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="units"
                  stroke="#E3182D"
                  strokeWidth={2.5}
                  fill="url(#colorDemand)"
                  dot={{ fill: '#E3182D', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-900 mb-4">Daily Breakdown</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="units" fill="#E3182D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-900 mb-4">Forecast Details</h2>
              <div className="space-y-2">
                {chartData.map((d) => (
                  <div
                    key={d.date}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-sm text-slate-600">{d.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">
                        {d.units} units
                      </span>
                      <Badge
                        className={cn(
                          'text-[10px] border-0',
                          d.confidence >= 70
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {d.confidence}% conf
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {selected && totalPredicted > selected.stock_quantity && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Predicted 7-day demand ({totalPredicted.toFixed(0)}) exceeds current stock (
                  {selected.stock_quantity}). Consider restocking.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
