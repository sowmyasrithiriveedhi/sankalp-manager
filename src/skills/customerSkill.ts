import { mcpGetCustomers, mcpAddCustomer, mcpDeleteCustomer, mcpUpdateCustomer } from '../mcps/supabaseMcp';
import { Customer } from '../lib/supabaseClient';

/**
 * customerSkill Module
 * Local domain logic relating to Customer operations.
 */

/**
 * Validates an Indian mobile phone number.
 * Rules (checked in order):
 *  1. Must not be empty
 *  2. Must contain only digits — no letters or special characters
 *  3. Must be exactly 10 digits
 *  4. First digit must be 6, 7, 8, or 9 (valid Indian mobile prefixes)
 *  5. All digits must not be identical (e.g. 9999999999 is fake)
 *
 * Throws an Error with a clear message if any rule is violated.
 */
function validatePhone(phone: string): void {
  const trimmed = phone.trim();

  // Rule 1 — empty check
  if (!trimmed) {
    throw new Error('Phone number is required.');
  }

  // Rule 2 — digits only
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Phone number must contain only digits (no letters or special characters).');
  }

  // Rule 3 — exactly 10 digits
  if (trimmed.length !== 10) {
    throw new Error(`Phone number must be exactly 10 digits (received ${trimmed.length}).`);
  }

  // Rule 4 — valid Indian mobile prefix (6, 7, 8, or 9)
  if (!/^[6-9]/.test(trimmed)) {
    throw new Error('Phone number must start with 6, 7, 8, or 9 (valid Indian mobile number).');
  }

  // Rule 5 — not all digits identical (e.g. 9999999999, 6666666666)
  if (/^(\d)\1{9}$/.test(trimmed)) {
    throw new Error('Phone number cannot have all identical digits (e.g. 9999999999 is not valid).');
  }
}

export async function getCustomersSkill(): Promise<Customer[]> {
  return await mcpGetCustomers();
}

export async function addCustomerSkill(name: string, phone: string, referenceName: string): Promise<Customer> {
  validatePhone(phone); // backend safety check before touching the DB
  return await mcpAddCustomer(name, phone, referenceName);
}

export async function deleteCustomerSkill(id: string): Promise<void> {
  return await mcpDeleteCustomer(id);
}

export async function updateCustomerSkill(id: string, name: string, phone: string, referenceName: string): Promise<Customer> {
  validatePhone(phone); // backend safety check before touching the DB
  return await mcpUpdateCustomer(id, name, phone, referenceName);
}

