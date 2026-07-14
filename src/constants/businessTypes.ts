export type BusinessType =
  | "RESTAURANT"
  | "BAR"
  | "HOTEL"
  | "MOTEL"
  | "CAFE"
  | "OTHER";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "BAR", label: "Bar" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MOTEL", label: "Motel" },
  { value: "CAFE", label: "Cafe" },
  { value: "OTHER", label: "Other" },
];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: "Restaurant",
  BAR: "Bar",
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
  busyMode?: boolean;
  estimatedWaitMinutes?: number;
  kitchenLoad?: "LOW" | "NORMAL" | "HIGH";
  happyHourWindow?: string;
}

export type OrderContext = "TABLE" | "ROOM" | "BAR_SEAT";

export function isLodgingType(type?: BusinessType | null): boolean {
  return type === "HOTEL" || type === "MOTEL";
}

export function isBarType(type?: BusinessType | null): boolean {
  return type === "BAR";
}

export function isFoodServiceType(type?: BusinessType | null): boolean {
  return type === "RESTAURANT" || type === "BAR" || type === "CAFE";
}

export function defaultOrderContext(type?: BusinessType | null): OrderContext {
  if (isLodgingType(type)) return "ROOM";
  if (type === "BAR") return "BAR_SEAT";
  return "TABLE";
}

export function businessTypeLabel(type?: BusinessType | null, fallback?: string): string {
  if (type && BUSINESS_TYPE_LABELS[type]) return BUSINESS_TYPE_LABELS[type];
  if (fallback) return fallback;
  return "Business";
}

export function menuSectionLabel(type?: BusinessType | null): string {
  if (isLodgingType(type)) return "Room Service Menu";
  if (type === "BAR") return "Drinks & Snacks";
  if (type === "CAFE") return "Menu & Drinks";
  return "Menu";
}

export const SPECIAL_REQUEST_PRESETS: Record<BusinessType, string[]> = {
  RESTAURANT: [
    "Less cheese",
    "No onions",
    "Extra spicy",
    "No salt",
    "Gluten-free if possible",
    "Well done",
    "Sauce on the side",
  ],
  BAR: [
    "Less ice",
    "No ice",
    "Extra strong",
    "Light on sugar",
    "Virgin / no alcohol",
    "Rim with salt",
    "Extra garnish",
  ],
  CAFE: [
    "Little sugar",
    "No sugar",
    "Oat milk",
    "Extra shot",
    "Decaf",
    "Not too hot",
    "Extra foam",
  ],
  HOTEL: [
    "No ice",
    "Extra napkins",
    "Quiet delivery",
    "Knock don't enter",
    "Allergy: nuts",
    "Less oil",
    "Cutlery please",
  ],
  MOTEL: [
    "No ice",
    "Extra napkins",
    "Quiet delivery",
    "Knock don't enter",
    "Allergy: nuts",
    "Less oil",
  ],
  OTHER: ["No onions", "Less spicy", "Extra sauce", "Allergy note"],
};

export const ORDER_NOTES_PLACEHOLDER: Record<BusinessType, string> = {
  RESTAURANT: "Allergies, seating preference, or anything the kitchen should know…",
  BAR: "How you want your drinks mixed, ice preference, or bar notes…",
  CAFE: "Milk preference, sweetness, temperature…",
  HOTEL: "Delivery preference, timing, or allergy notes for room service…",
  MOTEL: "Delivery preference, timing, or allergy notes…",
  OTHER: "Any special requests for this order…",
};

export const ITEM_HINT_BY_TYPE: Record<BusinessType, string> = {
  RESTAURANT: "e.g. less cheese, no onions, medium spicy…",
  BAR: "e.g. less ice, light sugar, shaken not stirred…",
  CAFE: "e.g. oat milk, little sugar, extra hot…",
  HOTEL: "e.g. no ice, allergies, leave at door…",
  MOTEL: "e.g. no ice, allergies, leave at door…",
  OTHER: "Tell us exactly how you want it…",
};

export type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required?: boolean;
  maxSelect?: number;
  options: ModifierOption[];
};

export type CustomizationOptions = {
  groups: ModifierGroup[];
};

export function defaultCustomizationTemplate(type?: BusinessType | null): CustomizationOptions {
  switch (type) {
    case "BAR":
      return {
        groups: [
          {
            id: "ice",
            name: "Ice",
            required: true,
            maxSelect: 1,
            options: [
              { id: "regular", name: "Regular ice", priceDelta: 0 },
              { id: "less", name: "Less ice", priceDelta: 0 },
              { id: "none", name: "No ice", priceDelta: 0 },
            ],
          },
          {
            id: "sweetness",
            name: "Sweetness",
            required: false,
            maxSelect: 1,
            options: [
              { id: "normal", name: "Normal", priceDelta: 0 },
              { id: "less", name: "Less sugar", priceDelta: 0 },
              { id: "none", name: "No sugar", priceDelta: 0 },
            ],
          },
        ],
      };
    case "CAFE":
      return {
        groups: [
          {
            id: "milk",
            name: "Milk",
            required: false,
            maxSelect: 1,
            options: [
              { id: "dairy", name: "Dairy", priceDelta: 0 },
              { id: "oat", name: "Oat milk", priceDelta: 500 },
              { id: "soy", name: "Soy milk", priceDelta: 500 },
              { id: "none", name: "No milk", priceDelta: 0 },
            ],
          },
          {
            id: "sugar",
            name: "Sugar",
            required: false,
            maxSelect: 1,
            options: [
              { id: "normal", name: "Normal", priceDelta: 0 },
              { id: "little", name: "Little sugar", priceDelta: 0 },
              { id: "none", name: "No sugar", priceDelta: 0 },
            ],
          },
        ],
      };
    case "HOTEL":
    case "MOTEL":
      return {
        groups: [
          {
            id: "delivery",
            name: "Delivery preference",
            required: false,
            maxSelect: 1,
            options: [
              { id: "door", name: "Leave at door", priceDelta: 0 },
              { id: "knock", name: "Knock and wait", priceDelta: 0 },
              { id: "call", name: "Call on arrival", priceDelta: 0 },
            ],
          },
        ],
      };
    case "RESTAURANT":
    default:
      return {
        groups: [
          {
            id: "spice",
            name: "Spice level",
            required: false,
            maxSelect: 1,
            options: [
              { id: "mild", name: "Mild", priceDelta: 0 },
              { id: "medium", name: "Medium", priceDelta: 0 },
              { id: "hot", name: "Hot", priceDelta: 0 },
            ],
          },
          {
            id: "doneness",
            name: "Cooking preference",
            required: false,
            maxSelect: 1,
            options: [
              { id: "normal", name: "As usual", priceDelta: 0 },
              { id: "well", name: "Well done", priceDelta: 0 },
              { id: "light", name: "Light / soft", priceDelta: 0 },
            ],
          },
        ],
      };
  }
}
