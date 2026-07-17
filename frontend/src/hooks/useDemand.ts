import { useDemandForecast7Days } from '@/hooks/useML';

/** @deprecated Use useDemandForecast7Days from useML */
export function useDemand(shopId?: string, productId?: string | null) {
  return useDemandForecast7Days(shopId ?? '', productId ?? null);
}
