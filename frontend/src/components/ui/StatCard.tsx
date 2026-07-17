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
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend !== undefined && (
            <span className={cn('text-xs font-semibold flex items-center gap-0.5', positive ? 'text-emerald-600' : 'text-red-500')}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
