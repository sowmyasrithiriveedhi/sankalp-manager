import { mcpGetCustomers, mcpAddCustomer } from '../mcps/supabaseMcp';
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
