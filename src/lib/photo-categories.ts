export const photoCategories = [
  {
    value: "entrance_overview",
    label: "Entrance Overview",
    guidance: "Show the full entrance and approach.",
  },
  {
    value: "doorway_closeup",
    label: "Doorway / Threshold",
    guidance: "Show the door, threshold, handle, and any visible step.",
  },
  {
    value: "parking",
    label: "Accessible Parking",
    guidance: "Show marked spaces, signs, curb cuts, and route context.",
  },
  {
    value: "route_to_entrance",
    label: "Route to Entrance",
    guidance: "Show the surface, slope, curb cuts, and path to the door.",
  },
  {
    value: "interior",
    label: "Interior",
    guidance: "Show customer-accessible paths without capturing private moments.",
  },
  {
    value: "restroom",
    label: "Restroom",
    guidance: "Only photograph empty restrooms from lawful customer-accessible areas.",
  },
  {
    value: "seating",
    label: "Seating",
    guidance: "Show seating layout, spacing, and movable chairs where relevant.",
  },
  {
    value: "checkout",
    label: "Checkout / Counter",
    guidance: "Show counter height and approach space.",
  },
  {
    value: "other",
    label: "Other",
    guidance: "Use when the photo supports accessibility planning but does not fit above.",
  },
] as const;

export type PhotoCategory = (typeof photoCategories)[number]["value"];

export const photoCategoryValues = photoCategories.map((category) => category.value);

export function isPhotoCategory(value: string): value is PhotoCategory {
  return photoCategoryValues.includes(value as PhotoCategory);
}

export function getPhotoCategoryLabel(value: string) {
  return photoCategories.find((category) => category.value === value)?.label ?? "Other";
}
