import { useState, useEffect, useCallback } from 'react';
import { getCustomersSkill, addCustomerSkill } from '../skills/customerSkill';
import { Customer } from '../lib/supabaseClient';

/**
 * useCustomers Custom React Hook
 * Interfaces between the customer list UI and the customerSkill layer.
 */

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomersSkill();
      setCustomers(data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setError(err.message || 'Failed to fetch customers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (name: string, phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await addCustomerSkill(name, phone);
      await fetchCustomers(); // Refresh customers
      return true;
    } catch (err: any) {
      console.error('Failed to add customer:', err);
      setError(err.message || 'Failed to add customer.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    customers,
    isLoading,
    error,
    addCustomer,
    refreshCustomers: fetchCustomers
  };
}
