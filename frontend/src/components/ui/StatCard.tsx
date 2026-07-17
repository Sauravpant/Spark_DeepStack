import { cn } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-slate-500',
  iconBg = 'bg-slate-100',
  className,
}: StatCardProps) {
  const positive = trend !== undefined && trend >= 0;

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-100/60 hover:-translate-y-0.5', className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-colors', iconBg)}>
          <Icon className={cn('w-4.5 h-4.5', iconColor)} />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{value}</p>
      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend !== undefined && (
            <span className={cn('text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full', positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
