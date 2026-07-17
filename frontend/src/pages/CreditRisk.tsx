import { useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useCustomers } from '@/hooks/useCustomers';
import {
  useCreditRiskExplain,
  useCreditRiskPredict,
  useCreditRiskGlobalImportance,
  useCreditRiskModelInfo,
} from '@/hooks/useML';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState, EmptyState } from '@/components/ui/StateComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  CheckCircle2,
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import type { Customer } from '@/types';
import { useUpdateCustomer } from '@/hooks/useCustomers';

function featureLabel(feature: string) {
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function riskFromCustomer(c: Customer) {
  if (!c.credit_limit) return 'Low Risk';
  const pct = (c.current_outstanding_balance / c.credit_limit) * 100;
  if (pct >= 80) return 'High Risk';
  if (pct >= 40) return 'Medium Risk';
  return 'Low Risk';
}

function ShapBar({
  feature,
  value,
  maxVal,
  positive,
}: {
  feature: string;
  value: number;
  maxVal: number;
  positive: boolean;
}) {
  const pct = maxVal > 0 ? Math.min(100, (Math.abs(value) / maxVal) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-slate-700 truncate pr-4">{featureLabel(feature)}</span>
        <span className={positive ? 'text-red-600 shrink-0' : 'text-emerald-600 shrink-0'}>
          {positive ? '+' : ''}
          {value.toFixed(3)}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', positive ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CreditRisk() {
  const { activeShop, user } = useAuth();
  const shopId = activeShop?.id ?? '';
  const { data: customers, isLoading, isError, refetch } = useCustomers(shopId);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGlobal, setShowGlobal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (customers ?? []).filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const effectiveId = selectedId ?? filtered[0]?.id ?? null;
  const selected = customers?.find((c) => c.id === effectiveId) ?? null;

  // ── Per-customer SHAP explain ────────────────────────────────────────────────
  const {
    data: explanation,
    isLoading: explainLoading,
    isError: explainError,
    error: explainErr,
    refetch: refetchExplain,
  } = useCreditRiskExplain(shopId, effectiveId);

  // ── Per-customer predict (save to DB) ────────────────────────────────────────
  const predictMutation = useCreditRiskPredict(shopId);

  // ── Global importance + model info ───────────────────────────────────────────
  const { data: globalImportance, isLoading: globalLoading } = useCreditRiskGlobalImportance(
    !!shopId && showGlobal
  );
  const { data: modelInfo } = useCreditRiskModelInfo(!!shopId);

  // ── Update customer credit limit ──────────────────────────────────────────────
  const updateCustomer = useUpdateCustomer(shopId, effectiveId ?? '');

  // ── Derived metrics ───────────────────────────────────────────────────────────
  const score = explanation
    ? Math.round((1 - explanation.risk_probability) * 100)
    : null;
  const repayProb = explanation
    ? Math.round((1 - explanation.risk_probability) * 1000) / 10
    : null;
  const suggestedLimit =
    selected && explanation
      ? explanation.is_risk
        ? Math.round(selected.credit_limit * 0.5)
        : Math.round(selected.credit_limit * 1.1)
      : null;

  const modelName = String(
    (modelInfo as any)?.metadata?.model_name ??
      (modelInfo as any)?.model ??
      'credit risk'
  );

  const maxPositive = (explanation?.top_positive_features ?? []).reduce(
    (m, f) => Math.max(m, Math.abs(f.shap_value)),
    0
  );
  const maxNegative = (explanation?.top_negative_features ?? []).reduce(
    (m, f) => Math.max(m, Math.abs(f.shap_value)),
    0
  );

  const globalEntries = globalImportance?.ranked_features?.slice(0, 12) ?? [];
  const globalValues = globalImportance?.mean_abs_shap_values ?? {};
  const globalMax = Object.values(globalValues).reduce(
    (m: number, v: unknown) => Math.max(m, Math.abs(Number(v))),
    0
  );

  if (!shopId || isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* ── Customer sidebar ── */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search customers..."
              className="pl-9 bg-slate-50/50 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="font-bold text-sm text-slate-800">Customer Registry</span>
          <span className="text-xs font-bold text-red-600">{customers?.length ?? 0} Active</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <EmptyState title="No customers" description="Add customers to run credit analysis." />
          ) : (
            filtered.map((c) => {
              const status = riskFromCustomer(c);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all duration-200 relative',
                    effectiveId === c.id
                      ? 'bg-white border-red-200 shadow-sm ring-1 ring-red-500/20'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {effectiveId === c.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-r-full" />
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <Avatar
                        className={cn(
                          'w-10 h-10 border',
                          effectiveId === c.id
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-slate-200 bg-slate-100 text-slate-500'
                        )}
                      >
                        <AvatarFallback className="font-semibold">
                          {c.full_name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 leading-tight">
                          {c.full_name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          #{c.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 shadow-none text-[10px] font-bold px-2 py-0.5 h-auto rounded-sm',
                        status === 'High Risk' && 'bg-red-100 text-red-700',
                        status === 'Medium Risk' && 'bg-amber-100 text-amber-700',
                        status === 'Low Risk' && 'bg-emerald-100 text-emerald-700'
                      )}
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-600">
                      Outstanding: {formatCurrency(c.current_outstanding_balance)}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium flex items-center gap-1',
                        c.current_outstanding_balance > 0
                          ? 'text-slate-500'
                          : 'text-emerald-600'
                      )}
                    >
                      {c.current_outstanding_balance > 0 ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {c.current_outstanding_balance > 0 ? 'Open' : 'Clear'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Topbar */}
        <div className="h-16 px-6 border-b border-slate-200 flex justify-between items-center gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Sparkles className="w-4 h-4 text-red-600" />
            AI Credit Risk Analysis
            {modelInfo && (
              <span className="text-xs text-slate-400 ml-2">· {modelName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.full_name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {activeShop?.shop_name}
              </span>
            </div>
            <Avatar className="w-8 h-8 bg-red-100 text-red-600">
              <AvatarFallback className="text-xs">
                {user?.full_name?.[0] ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="Select a customer"
              description="Choose a customer from the list to run ML credit analysis."
            />
          </div>
        ) : explainLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-sm text-slate-500">Running credit risk model...</p>
          </div>
        ) : explainError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <p className="font-semibold text-slate-800">Could not run credit analysis</p>
            <p className="text-sm text-slate-500 max-w-md">
              {(explainErr as any)?.response?.data?.message ||
                'Ensure ML models are loaded on the backend (/health).'}
            </p>
            <Button
              onClick={() => refetchExplain()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : explanation ? (
          <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">

            {/* ── Score card + actions ── */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Score ring + summary */}
              <Card className="flex-1 bg-white rounded-xl border border-slate-200/80 p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className={cn(
                          'drop-shadow-md',
                          score! >= 70
                            ? 'stroke-emerald-500'
                            : score! >= 40
                              ? 'stroke-amber-500'
                              : 'stroke-red-500'
                        )}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="351.8"
                        strokeDashoffset={351.8 - (351.8 * (score ?? 0)) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">
                        {score}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                        AI Score
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Base prob: {(explanation.base_probability * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-[#E3182D] mb-4">{selected.full_name}</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        'px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-wider',
                        explanation.is_risk
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-200/50 text-emerald-800'
                      )}
                    >
                      {explanation.is_risk ? 'Elevated Risk' : 'Good Standing'}
                    </div>
                    <Badge className="text-[10px] border-0 bg-slate-100 text-slate-600">
                      Risk prob: {(explanation.risk_probability * 100).toFixed(1)}%
                    </Badge>
                    <p className="text-xs font-medium text-slate-500">
                      Threshold: {(explanation.threshold * 100).toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {explanation.human_readable_explanation ||
                      `Model confidence ${(explanation.confidence * 100).toFixed(1)}%. Risk probability ${(explanation.risk_probability * 100).toFixed(1)}%.`}
                  </p>
                </div>
              </Card>

              {/* Action panel */}
              <div className="w-full lg:w-64 bg-slate-100/50 rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Recommended Actions
                </h3>

                {/* Save prediction to DB */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 bg-white border-slate-200 text-slate-700 rounded-lg"
                  disabled={!effectiveId || predictMutation.isPending}
                  onClick={() =>
                    effectiveId &&
                    predictMutation.mutate(
                      { customerId: effectiveId, save: true },
                      { onSuccess: () => refetchExplain() }
                    )
                  }
                >
                  {predictMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2 text-red-500" />
                  )}
                  Save Prediction
                </Button>

                {/* Apply suggested credit limit */}
                {suggestedLimit != null && (
                  <Button
                    className="w-full justify-start h-14 bg-[#E3182D] hover:bg-red-700 text-white rounded-lg"
                    disabled={updateCustomer.isPending}
                    onClick={() => updateCustomer.mutate({ credit_limit: suggestedLimit })}
                  >
                    {updateCustomer.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="flex flex-col items-start">
                        <span className="font-bold">
                          {explanation.is_risk ? 'Reduce Limit' : 'Apply Suggested Limit'}
                        </span>
                        <span className="text-[10px] opacity-80">
                          {formatCurrency(suggestedLimit)}
                        </span>
                      </div>
                    )}
                  </Button>
                )}

                {/* Model info */}
                {modelInfo && (
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Model: {modelName}
                  </p>
                )}

                {/* Top 3 global drivers */}
                {globalImportance?.ranked_features?.slice(0, 3)?.length ? (
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold uppercase tracking-wider">Top global drivers</p>
                    {globalImportance.ranked_features.slice(0, 3).map((f) => (
                      <p key={f}>{featureLabel(f)}</p>
                    ))}
                  </div>
                ) : null}

                <Button
                  variant="outline"
                  className="w-full justify-start h-14 bg-white border-slate-200 text-slate-700 rounded-lg"
                  asChild
                >
                  <a href="/customers">
                    <ShieldAlert className="w-5 h-5 mr-3 text-slate-400" />
                    View Customer
                  </a>
                </Button>
              </div>
            </div>

            {/* ── 3 KPI cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Suggested Limit
                  </p>
                  <div className="text-3xl font-black text-[#E3182D] mb-4 tracking-tight">
                    {formatCurrency(suggestedLimit ?? 0)}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 flex items-start gap-1.5">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    Current: {formatCurrency(selected.credit_limit)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Repayment Probability
                  </p>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {repayProb}%
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        repayProb! >= 70 ? 'bg-emerald-650' : repayProb! >= 40 ? 'bg-amber-500' : 'bg-red-600'
                      )}
                      style={{ width: `${repayProb}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Outstanding Amount
                  </p>
                  <div className="text-2xl font-black text-slate-800 tracking-tight mb-4">
                    {formatCurrency(selected.current_outstanding_balance)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Clock className="w-4 h-4" /> Limit {formatCurrency(selected.credit_limit)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── SHAP breakdown ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Protective drivers (negative SHAP = reduce risk) */}
              <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Protective Drivers
                  </h3>
                  <div className="flex flex-col gap-5">
                    {(explanation.top_negative_features ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No protective drivers found</p>
                    ) : (
                      explanation.top_negative_features.map((driver, i) => (
                        <ShapBar
                          key={i}
                          feature={driver.feature}
                          value={driver.shap_value}
                          maxVal={maxNegative}
                          positive={false}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk drivers (positive SHAP = increase risk) */}
              <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
                    <AlertTriangle className="w-5 h-5 text-[#E3182D]" /> Risk Drivers
                  </h3>
                  <div className="flex flex-col gap-5">
                    {(explanation.top_positive_features ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No risk drivers found</p>
                    ) : (
                      explanation.top_positive_features.map((driver, i) => (
                        <ShapBar
                          key={i}
                          feature={driver.feature}
                          value={driver.shap_value}
                          maxVal={maxPositive}
                          positive={true}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Feature contributions heat table ── */}
            {explanation.feature_contributions &&
              Object.keys(explanation.feature_contributions).length > 0 && (
                <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-slate-850 mb-4 text-base tracking-tight">
                      All Feature Contributions (SHAP values)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/60">
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Feature
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              SHAP Value
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-40">
                              Impact
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(explanation.feature_contributions)
                            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                            .map(([feat, val]) => {
                              const maxAll = Math.max(
                                ...Object.values(explanation.feature_contributions).map(Math.abs)
                              );
                              const pct = maxAll > 0 ? (Math.abs(val) / maxAll) * 100 : 0;
                              return (
                                <tr key={feat} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-700 font-semibold tracking-tight">
                                    {featureLabel(feat)}
                                  </td>
                                  <td
                                    className={cn(
                                      'px-4 py-3 text-right font-mono text-xs font-bold',
                                      val > 0 ? 'text-red-650' : 'text-emerald-600'
                                    )}
                                  >
                                    {val > 0 ? '+' : ''}
                                    {val.toFixed(4)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full',
                                          val > 0 ? 'bg-red-500' : 'bg-emerald-500'
                                        )}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* ── Global Feature Importance (collapsible) ── */}
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
                    Mean SHAP
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
                      <span className="text-sm text-slate-500">
                        Loading global importance from model...
                      </span>
                    </div>
                  ) : globalEntries.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center">
                      No global importance data available.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 mt-4 mb-5">
                        Ranked by mean absolute SHAP value across the training set. These are the
                        features that most consistently drive credit risk predictions across all customers.
                      </p>
                      <div className="space-y-4">
                        {globalEntries.map((feat, i) => {
                          const val = globalValues[feat] ?? 0;
                          const pct =
                            globalMax > 0 ? Math.min(100, (Math.abs(Number(val)) / globalMax) * 100) : 0;
                          return (
                            <div key={feat} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">
                                #{i + 1}
                              </span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs font-semibold mb-1.5">
                                  <span className="text-slate-700 truncate pr-4">
                                    {featureLabel(feat)}
                                  </span>
                                  <span className="text-blue-600 shrink-0">
                                    {Number(val).toFixed(4)}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
