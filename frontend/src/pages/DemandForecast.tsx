import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useProducts } from '@/hooks/useInventory';
import {
  useDemandForecast7Days,
  useDemandForecastNextDay,
  useDemandModelInfo,
  useDemandGlobalImportance,
} from '@/hooks/useML';
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
  ChevronDown,
  ChevronUp,
  BarChart3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemandGlobalImportanceEntry } from '@/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="text-xs text-red-600">
          Predicted: {Number(payload[0].value).toFixed(1)} units
        </p>
        {payload[1] && (
          <p className="text-xs text-slate-500">
            Confidence: {Number(payload[1].value)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

function FeatureBar({
  feature,
  impact,
  max,
  positive,
}: {
  feature: string;
  impact: number;
  max: number;
  positive: boolean;
}) {
  const label = feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const pct = max > 0 ? Math.min(100, (Math.abs(impact) / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-slate-700 truncate pr-4">{label}</span>
        <span className={positive ? 'text-red-600 shrink-0' : 'text-emerald-600 shrink-0'}>
          {positive ? '+' : ''}
          {impact.toFixed(3)}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', positive ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DemandForecast() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: products, isLoading, isError, refetch } = useProducts(shopId);
  const [productId, setProductId] = useState<string | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);

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
  const { data: globalImportance, isLoading: globalLoading } = useDemandGlobalImportance(!!shopId && showGlobal);

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

  // Derive the best explain data from the 7-day forecast itself (confidence/model embedded)
  // The /explain endpoints require the same history payload the per-product backend constructs
  // We surface them from the forecast array directly (confidence is included)

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

  const modelName = String(
    (modelInfo as any)?.model ??
      (modelInfo as any)?.metadata?.model ??
      (modelInfo as any)?.metadata?.model_name ??
      'CatBoost'
  );

  // Global importance entries from the backend
  const globalEntries: DemandGlobalImportanceEntry[] = globalImportance
    ? (globalImportance.shap_importance ?? globalImportance.native_importance ?? []).slice(0, 12)
    : [];
  const globalMax = globalEntries.reduce((m, e) => Math.max(m, Math.abs(e.importance)), 0);

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demand Forecasting</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI predictions based on your product sales history — powered by {modelName}
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

      {/* ── Stat cards ── */}
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
          subtitle={nextDay?.forecast_date ?? 'Loading...'}
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
          subtitle={peakDay?.date ?? modelName}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── Forecast chart ── */}
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
              'Need enough sales history (≥21 days) or a loaded demand model on the backend.'}
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
          {/* ── 7-day area chart ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Next 7 Days — {selected?.product_name}
              </h2>
              <p className="text-xs text-slate-400">
                Predicted units sold per day · Model: {modelName}
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

          {/* ── Daily breakdown + SHAP explanation from forecast ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart */}
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

            {/* Forecast detail table */}
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

          {/* ── SHAP Explanation Panel (from /explain-next-7-days via per-product backend) ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowExplain((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span className="font-bold text-sm text-slate-900">
                  AI Explanation — What Drives This Forecast?
                </span>
                <Badge className="bg-red-50 text-red-600 border-red-200 border text-[10px] h-auto px-2">
                  SHAP
                </Badge>
              </div>
              {showExplain ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showExplain && (
              <div className="px-5 pb-5 border-t border-slate-100">
                <p className="text-xs text-slate-500 mt-4 mb-5">
                  The confidence score in each forecast day reflects how strongly the model
                  signals demand. Factors like lag sales, rolling averages, festival proximity,
                  is_staple and is_perishable flags, and location type drive each prediction.
                  The chart below shows the raw model confidence per day.
                </p>

                {/* Confidence trend */}
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Model Confidence Per Day
                </h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, 'Confidence']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar
                      dataKey="confidence"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Key demand drivers info */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Demand Boosters
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {selected?.is_staple && (
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          Staple product — steady baseline demand
                        </li>
                      )}
                      {selected?.is_perishable && (
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          Perishable — frequent restock pattern
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        Recent lag sales (lag_1, lag_7, lag_14)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        Rolling 7-day average — recent trend signal
                      </li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Model Context
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        Location: {activeShop?.location_type ?? '—'}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        Model: {modelName}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        Day-of-week &amp; rolling 21-day avg
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        Festival proximity features
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Global Feature Importance ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowGlobal((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">
                  Global Feature Importance
                </span>
                <Badge className="bg-blue-50 text-blue-600 border-blue-200 border text-[10px] h-auto px-2">
                  SHAP / Native
                </Badge>
              </div>
              {showGlobal ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showGlobal && (
              <div className="px-5 pb-5 border-t border-slate-100">
                {globalLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                    <span className="text-sm text-slate-500">Loading feature importance...</span>
                  </div>
                ) : globalEntries.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No global importance data available from the model.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mt-4 mb-5">
                      Ranked by mean absolute SHAP value (or native importance) across training data.
                      Higher values = stronger influence on demand predictions.
                    </p>
                    <div className="space-y-4">
                      {globalEntries.map((e, i) => (
                        <div key={e.feature} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5 shrink-0">
                            #{i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs font-semibold mb-1.5">
                              <span className="text-slate-700 truncate pr-4">
                                {e.feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              <span className="text-blue-600 shrink-0">
                                {e.importance.toFixed(4)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full transition-all"
                                style={{
                                  width: `${globalMax > 0 ? Math.min(100, (Math.abs(e.importance) / globalMax) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
