import { useState, useEffect, useCallback } from 'react';
import { getMaterialsSkill } from '../skills/materialSkill';
import { getRentalsSkill } from '../skills/rentalSkill';
import { getCustomersSkill } from '../skills/customerSkill';
import { calculateStockStatsSubagent } from '../subagents/stockSubagent';
import { calculateRentalStatsSubagent } from '../subagents/rentalSubagent';

/**
 * useDashboardStats Custom React Hook
 * Interfaces between the dashboard UI page and the domain logic.
 * Exposes live data and dynamic stats.
 */

export interface DashboardStatsData {
  totalMaterials: number;       // Number of unique items
  activeRentals: number;        // Number of active rental events
  totalCustomers: number;       // Number of total customers
  availableStock: number;       // Dynamic available quantity across all materials
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalMaterials: 0,
    activeRentals: 0,
    totalCustomers: 0,
    availableStock: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch data from Skills (which call MCP)
      const materials = await getMaterialsSkill();
      const rentals = await getRentalsSkill();
      const customers = await getCustomersSkill();

      // 2. Compute dynamic stats using Subagents
      const stockStats = calculateStockStatsSubagent(materials, rentals);
      const rentalStats = calculateRentalStatsSubagent(rentals);

      // 3. Update React local state
      setStats({
        totalMaterials: stockStats.totalMaterials,
        activeRentals: rentalStats.activeCount,
        totalCustomers: customers.length,
        availableStock: stockStats.availableStockQuantity
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard statistics.';
      console.error('Failed to load dashboard statistics:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats on component load
  useEffect(() => {
    const run = async () => { await fetchStats(); };
    void run();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats
  };
}
