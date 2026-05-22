/**
 * paymentSkill Module
 * Localized domain logic relating to Payments and Rent Calculation.
 */

export function calculateRentSkill(
  quantity: number,
  pricePerDay: number,
  rentalDateStr: string,
  returnDateStr: string
): number {
  const rentalDate = new Date(rentalDateStr);
  const returnDate = new Date(returnDateStr);
  
  // Calculate difference in milliseconds
  const diffTime = Math.abs(returnDate.getTime() - rentalDate.getTime());
  // Convert to days, rounded up to ensure at least 1 day is charged if returned on the same day
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  
  // Formula: Quantity * Price Per Day * Number of Days
  return quantity * pricePerDay * diffDays;
}
