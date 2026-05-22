import { Rental, Material } from '../lib/supabaseClient';
import { checkStockAvailabilitySubagent } from './stockSubagent';
import { createRentalRecord } from '../skills/rentalSkill';

/**
 * rentalSubagent Module
 * Coordinates high-level rental status aggregations.
 */

export interface RentalStats {
  activeCount: number;
  returnedCount: number;
}

/**
 * Calculates rental aggregates for the dashboard cards
 */
export function calculateRentalStatsSubagent(rentals: Rental[]): RentalStats {
  let activeCount = 0;
  let returnedCount = 0;

  rentals.forEach(rental => {
    if (rental.status === 'Active') {
      activeCount++;
    } else if (rental.status === 'Returned') {
      returnedCount++;
    }
  });

  return {
    activeCount,
    returnedCount
  };
}

/**
 * Coordinates checking stock availability and processing a new active rental
 */
export async function processRentalSubagent(
  customerId: string,
  materialId: string,
  quantity: number,
  rentalDate: string,
  materials: Material[],
  rentals: Rental[]
): Promise<Rental> {
  // 1. Perform automatic stock validation using stockSubagent
  const stockCheck = checkStockAvailabilitySubagent(materialId, quantity, materials, rentals);
  
  if (!stockCheck.available) {
    throw new Error(`Insufficient Stock. Requested: ${quantity}, Available: ${stockCheck.currentAvailable}.`);
  }

  // 2. Delegate creation to rentalSkill
  return await createRentalRecord(customerId, materialId, quantity, rentalDate);
}
