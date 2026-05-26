import { useState, useEffect, useCallback } from 'react';
import { getRentalsSkill } from '../skills/rentalSkill';
import { processRentalSubagent } from '../subagents/rentalSubagent';
import { processReturnSubagent } from '../subagents/paymentSubagent';
import { Rental, Material } from '../lib/supabaseClient';

/**
 * useRentals Custom React Hook
 * Interfaces between the rentals list/forms UI and the subagents layer.
 */

export function useRentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRentalsSkill();
      setRentals(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rentals.';
      console.error('Failed to load rentals:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await fetchRentals(); };
    void run();
  }, [fetchRentals]);

  /**
   * Allocates a new rental.
   * Leverages rentalSubagent to validate stock availability before creating a record.
   */
  const allocateRental = async (
    customerId: string,
    materialId: string,
    quantity: number,
    rentalDate: string,
    materials: Material[],
    advanceAmount: number
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    try {
      await processRentalSubagent(customerId, materialId, quantity, rentalDate, materials, rentals, advanceAmount);
      await fetchRentals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to process rental.';
      console.error('Failed to allocate rental:', err);
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Processes a rental return event.
   * Leverages paymentSubagent to compute dynamic billing and close rental log.
   */
  const returnRental = async (
    rentalId: string,
    returnDate: string,
    materials: Material[]
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    try {
      await processReturnSubagent(rentalId, returnDate, rentals, materials);
      await fetchRentals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to process return.';
      console.error('Failed to process return:', err);
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rentals,
    isLoading,
    error,
    allocateRental,
    returnRental,
    refreshRentals: fetchRentals
  };
}
