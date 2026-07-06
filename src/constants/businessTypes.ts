export type BusinessType =
  | "RESTAURANT"
  | "HOTEL"
  | "MOTEL"
  | "CAFE"
  | "OTHER";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MOTEL", label: "Motel" },
  { value: "CAFE", label: "Cafe" },
  { value: "OTHER", label: "Other" },
];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: "Restaurant",
  HOTEL: "Hotel",
  MOTEL: "Motel",
  CAFE: "Cafe",
  OTHER: "Other",
};

export interface BusinessSettings {
  wifiPassword?: string;
  checkInTime?: string;
  checkOutTime?: string;
  operatingHours?: string;
  emergencyPhone?: string;
}

export type OrderContext = "TABLE" | "ROOM";

export function isLodgingType(type?: BusinessType | null): boolean {
  return type === "HOTEL" || type === "MOTEL";
}

export function defaultOrderContext(type?: BusinessType | null): OrderContext {
  return isLodgingType(type) ? "ROOM" : "TABLE";
}

export function businessTypeLabel(type?: BusinessType | null, fallback?: string): string {
  if (type && BUSINESS_TYPE_LABELS[type]) return BUSINESS_TYPE_LABELS[type];
  if (fallback) return fallback;
  return "Business";
}

export function menuSectionLabel(type?: BusinessType | null): string {
  if (isLodgingType(type)) return "Room Service Menu";
  if (type === "CAFE") return "Menu & Drinks";
  return "Menu";
}
