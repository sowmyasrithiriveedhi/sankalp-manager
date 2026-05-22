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
    } catch (err: any) {
      console.error('Failed to load rentals:', err);
      setError(err.message || 'Failed to fetch rentals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
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
    materials: Material[]
  ): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    try {
      // Direct call to subagent coordinator
      await processRentalSubagent(customerId, materialId, quantity, rentalDate, materials, rentals);
      await fetchRentals(); // Refresh list
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to allocate rental:', err);
      const errMsg = err.message || 'Failed to process rental.';
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
      // Direct call to subagent coordinator
      await processReturnSubagent(rentalId, returnDate, rentals, materials);
      await fetchRentals(); // Refresh list
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Failed to process return:', err);
      const errMsg = err.message || 'Failed to process return.';
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
