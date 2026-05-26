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

/**
 * Compares totalRent against the advance already paid and determines the payment outcome.
 *
 * Returns one of three statuses:
 *  - 'remaining' : customer still owes money  → amount = what they need to pay
 *  - 'refund'    : customer overpaid          → amount = what to return to them
 *  - 'settled'   : exact match               → amount = 0
 */
export function calculatePaymentResultSkill(
  totalRent: number,
  advanceAmount: number
): { status: 'remaining' | 'refund' | 'settled'; amount: number } {
  const diff = totalRent - advanceAmount;

  if (diff > 0) {
    // Total rent is more than advance — customer needs to pay the difference
    return { status: 'remaining', amount: diff };
  } else if (diff < 0) {
    // Advance exceeded total rent — return the excess to customer
    return { status: 'refund', amount: Math.abs(diff) };
  } else {
    // Perfectly settled — no money changes hands
    return { status: 'settled', amount: 0 };
  }
}
