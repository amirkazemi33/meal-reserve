const ITEMS = [
  { label: "رزرو شده", dot: "bg-booking-reserved-dot" },
  { label: "قابل رزرو", dot: "bg-booking-brand" },
  { label: "گذشته یا بسته", dot: "bg-booking-fill" },
] as const;

export function DayStatusLegend() {
  return (
    <div className="text-booking-secondary flex flex-wrap gap-3.5 text-[11px]">
      {ITEMS.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={`size-[5px] rounded-full ${item.dot}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
