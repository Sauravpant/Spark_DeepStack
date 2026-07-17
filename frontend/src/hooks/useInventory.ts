import { useQuery } from '@tanstack/react-query';
import { getInventory, getInventoryStats } from '@/services/inventory.service';

export function useInventory() {
  return useQuery({ queryKey: ['inventory'], queryFn: getInventory });
}

export function useInventoryStats() {
  return useQuery({ queryKey: ['inventory-stats'], queryFn: getInventoryStats });
}
