export const FOOD_KINDS = {
  MAIN: "MAIN",
  DRINK: "DRINK",
  YOGURT_SALAD: "YOGURT_SALAD",
} as const;

export type FoodKindValue = (typeof FOOD_KINDS)[keyof typeof FOOD_KINDS];

export const FoodKind = FOOD_KINDS;
export type FoodKind = FoodKindValue;

export const FOOD_KIND_OPTIONS: { value: FoodKindValue; label: string }[] = [
  { value: FOOD_KINDS.MAIN, label: "غذا" },
  { value: FOOD_KINDS.DRINK, label: "نوشیدنی" },
  { value: FOOD_KINDS.YOGURT_SALAD, label: "ماست و سالاد" },
];

export function foodKindLabel(kind: string) {
  return (
    FOOD_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? "غذا"
  );
}

export function parseFoodKind(value: string): FoodKindValue {
  if (value === FOOD_KINDS.DRINK || value === FOOD_KINDS.YOGURT_SALAD) {
    return value;
  }
  return FOOD_KINDS.MAIN;
}
