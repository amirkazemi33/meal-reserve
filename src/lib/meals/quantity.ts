export const MIN_RESERVATION_QUANTITY = 1;
export const MAX_RESERVATION_QUANTITY = 99;

export function parseReservationQuantity(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return MIN_RESERVATION_QUANTITY;
  const rounded = Math.trunc(parsed);
  if (rounded < MIN_RESERVATION_QUANTITY) return MIN_RESERVATION_QUANTITY;
  if (rounded > MAX_RESERVATION_QUANTITY) return MAX_RESERVATION_QUANTITY;
  return rounded;
}
