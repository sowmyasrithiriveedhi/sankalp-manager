import { useState, useEffect, useCallback } from 'react';
import { getMaterialsSkill } from '../skills/materialSkill';
import { getRentalsSkill } from '../skills/rentalSkill';
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
  returnedRentals: number;      // Number of returned rental events
  availableStock: number;       // Dynamic available quantity across all materials
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalMaterials: 0,
    activeRentals: 0,
    returnedRentals: 0,
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

      // 2. Compute dynamic stats using Subagents
      const stockStats = calculateStockStatsSubagent(materials, rentals);
      const rentalStats = calculateRentalStatsSubagent(rentals);

      // 3. Update React local state
      setStats({
        totalMaterials: stockStats.totalMaterials,
        activeRentals: rentalStats.activeCount,
        returnedRentals: rentalStats.returnedCount,
        availableStock: stockStats.availableStockQuantity
      });
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats on component load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats
  };
}
