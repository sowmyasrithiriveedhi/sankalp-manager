import { mcpGetCustomers, mcpAddCustomer, mcpDeleteCustomer } from '../mcps/supabaseMcp';
import { Customer } from '../lib/supabaseClient';

/**
 * customerSkill Module
 * local domain logic relating to Customer operations.
 */

export async function getCustomersSkill(): Promise<Customer[]> {
  return await mcpGetCustomers();
}

export async function addCustomerSkill(name: string, phone: string): Promise<Customer> {
  return await mcpAddCustomer(name, phone);
}

export async function deleteCustomerSkill(id: string): Promise<void> {
  return await mcpDeleteCustomer(id);
}
