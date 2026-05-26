import { useState, useEffect, useCallback } from 'react';
import { getCustomersSkill, addCustomerSkill, deleteCustomerSkill, updateCustomerSkill } from '../skills/customerSkill';
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers.';
      console.error('Failed to load customers:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await fetchCustomers(); };
    void run();
  }, [fetchCustomers]);

  const addCustomer = async (name: string, phone: string, referenceName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await addCustomerSkill(name, phone, referenceName);
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add customer.';
      console.error('Failed to add customer:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCustomer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteCustomerSkill(id);
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete customer.';
      console.error('Failed to delete customer:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = async (id: string, name: string, phone: string, referenceName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await updateCustomerSkill(id, name, phone, referenceName);
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update customer.';
      console.error('Failed to update customer:', err);
      setError(message);
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
    removeCustomer,
    updateCustomer,
    refreshCustomers: fetchCustomers
  };
}
