export const ReservationStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;

export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

export function parseReservationStatus(value: string): ReservationStatus {
  if (value === ReservationStatus.CANCELLED) return ReservationStatus.CANCELLED;
  return ReservationStatus.ACTIVE;
}
