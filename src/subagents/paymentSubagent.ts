import { calculateRentSkill } from '../skills/paymentSkill';
import { Rental, Material } from '../lib/supabaseClient';
import { updateRentalStatus } from '../skills/rentalSkill';

/**
 * paymentSubagent Module
 * Coordinates pricing calculations and return payments.
 */

/**
 * Process billing amount for a rental return.
 * Leverages paymentSkill to calculate costs.
 */
export function processRentalBillingSubagent(
  quantity: number,
  pricePerDay: number,
  rentalDate: string,
  returnDate: string
): number {
  return calculateRentSkill(quantity, pricePerDay, rentalDate, returnDate);
}

/**
 * Coordinates processing a return, calculating rent dynamically, and updating database record status.
 */
export async function processReturnSubagent(
  rentalId: string,
  returnDate: string,
  rentals: Rental[],
  materials: Material[]
): Promise<Rental> {
  // 1. Locate rental log
  const rental = rentals.find(r => r.id === rentalId);
  if (!rental) {
    throw new Error(`Rental log ${rentalId} not found.`);
  }

  // 2. Locate material pricing
  const material = materials.find(m => m.id === rental.material_id);
  if (!material) {
    throw new Error(`Material ${rental.material_id} not found.`);
  }

  // 3. Compute dynamic rent using paymentSkill
  const totalRent = calculateRentSkill(
    rental.quantity,
    material.price_per_day,
    rental.rental_date,
    returnDate
  );

  // 4. Update status in database using rentalSkill
  return await updateRentalStatus(rentalId, returnDate, totalRent);
}
