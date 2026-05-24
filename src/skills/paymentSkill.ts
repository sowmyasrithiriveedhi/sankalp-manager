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
  // Convert difference to days and add 1 to count both rental and return days
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  // Formula: Quantity * Price Per Day * Total Days
  return quantity * pricePerDay * totalDays;
}
