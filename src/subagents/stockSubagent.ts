import { Material, Rental } from '../lib/supabaseClient';

/**
 * stockSubagent Module
 * Coordinates material inventory and rental active stock checks.
 * Enforces dynamic business invariants across skills.
 */

export interface StockStats {
  totalMaterials: number;
  totalStockQuantity: number;
  availableStockQuantity: number;
}

/**
 * Calculates dynamic stock statistics for the dashboard.
 * availableStock = total_quantity - sum(active rentals quantity)
 */
export function calculateStockStatsSubagent(materials: Material[], rentals: Rental[]): StockStats {
  const totalMaterials = materials.length;
  
  // Calculate total stock and active rentals
  let totalStockQuantity = 0;
  let activeRentalsQtyMap: Record<string, number> = {};

  // Build mapping of active rented quantities per material
  rentals.forEach(rental => {
    if (rental.status === 'Active') {
      activeRentalsQtyMap[rental.material_id] = (activeRentalsQtyMap[rental.material_id] || 0) + rental.quantity;
    }
  });

  let availableStockQuantity = 0;

  materials.forEach(material => {
    totalStockQuantity += material.total_quantity;
    
    const activeQty = activeRentalsQtyMap[material.id] || 0;
    const availableForMat = Math.max(0, material.total_quantity - activeQty);
    availableStockQuantity += availableForMat;
  });

  return {
    totalMaterials,
    totalStockQuantity,
    availableStockQuantity
  };
}

/**
 * Validates whether enough stock is available for a new rental
 */
export function checkStockAvailabilitySubagent(
  materialId: string,
  requestedQty: number,
  materials: Material[],
  rentals: Rental[]
): { available: boolean; currentAvailable: number } {
  const material = materials.find(m => m.id === materialId);
  if (!material) {
    return { available: false, currentAvailable: 0 };
  }

  // Sum active rentals for this material
  const activeRentalsQty = rentals
    .filter(r => r.material_id === materialId && r.status === 'Active')
    .reduce((sum, r) => sum + r.quantity, 0);

  const currentAvailable = Math.max(0, material.total_quantity - activeRentalsQty);
  return {
    available: currentAvailable >= requestedQty,
    currentAvailable
  };
}
