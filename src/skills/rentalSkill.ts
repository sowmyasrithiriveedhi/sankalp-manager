import { mcpGetRentals, mcpCreateRental, mcpReturnRental } from '../mcps/supabaseMcp';
import { Rental } from '../lib/supabaseClient';

/**
 * rentalSkill Module
 * Localized domain logic relating to Rentals.
 */

export async function getRentalsSkill(): Promise<Rental[]> {
  return await mcpGetRentals();
}

export async function createRentalRecord(
  customerId: string,
  materialId: string,
  quantity: number,
  rentalDate: string,
  advanceAmount: number
): Promise<Rental> {
  return await mcpCreateRental(customerId, materialId, quantity, rentalDate, advanceAmount);
}

export async function updateRentalStatus(
  rentalId: string,
  returnDate: string,
  totalRent: number
): Promise<Rental> {
  return await mcpReturnRental(rentalId, returnDate, totalRent);
}
