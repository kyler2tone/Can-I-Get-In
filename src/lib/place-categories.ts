export const placeCategories = [
  "Restaurant",
  "Coffee shop",
  "Shopping",
  "Grocery store",
  "Medical office",
  "Public building",
  "Library",
  "Hotel",
  "Entertainment",
  "Park",
  "Attraction",
  "Other",
] as const;

export type PlaceCategory = (typeof placeCategories)[number];

const googleTypeCategoryMap: Record<string, PlaceCategory> = {
  accounting: "Other",
  amusement_center: "Entertainment",
  amusement_park: "Attraction",
  aquarium: "Attraction",
  art_gallery: "Attraction",
  bakery: "Restaurant",
  bar: "Entertainment",
  book_store: "Shopping",
  bowling_alley: "Entertainment",
  cafe: "Coffee shop",
  coffee_shop: "Coffee shop",
  clothing_store: "Shopping",
  department_store: "Shopping",
  event_venue: "Entertainment",
  food: "Restaurant",
  grocery_store: "Grocery store",
  gym: "Entertainment",
  hospital: "Medical office",
  hotel: "Hotel",
  library: "Library",
  lodging: "Hotel",
  meal_delivery: "Restaurant",
  meal_takeaway: "Restaurant",
  movie_theater: "Entertainment",
  museum: "Attraction",
  night_club: "Entertainment",
  park: "Park",
  pharmacy: "Medical office",
  physiotherapist: "Medical office",
  restaurant: "Restaurant",
  school: "Public building",
  shopping_mall: "Shopping",
  spa: "Other",
  stadium: "Entertainment",
  store: "Shopping",
  supermarket: "Grocery store",
  tourist_attraction: "Attraction",
  university: "Public building",
  zoo: "Attraction",
};

const googleTypePriority: Partial<Record<PlaceCategory, number>> = {
  "Coffee shop": 10,
  Restaurant: 20,
  Library: 30,
  Park: 40,
  Hotel: 50,
  "Grocery store": 60,
  "Medical office": 70,
  "Public building": 80,
  Entertainment: 90,
  Attraction: 100,
  Shopping: 110,
  Other: 999,
};

export function isPlaceCategory(value: string): value is PlaceCategory {
  return placeCategories.includes(value as PlaceCategory);
}

export function normalizePlaceCategory(value: string | null | undefined): PlaceCategory {
  if (!value) return "Other";
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  const direct = placeCategories.find((category) => category.toLowerCase() === normalized);
  if (direct) return direct;
  if (normalized === "restaurants") return "Restaurant";
  if (normalized === "coffee" || normalized === "cafe") return "Coffee shop";
  if (normalized === "stores" || normalized === "shopping") return "Shopping";
  if (normalized === "parks") return "Park";
  if (normalized === "hotels") return "Hotel";
  if (normalized === "attractions") return "Attraction";
  if (normalized === "nightlife") return "Entertainment";
  return "Other";
}

export function categoryFromGoogleTypes(types: string[] | undefined): PlaceCategory {
  let bestCategory: PlaceCategory = "Other";
  let bestPriority = googleTypePriority.Other ?? 999;

  for (const type of types ?? []) {
    const category = googleTypeCategoryMap[type];
    if (!category) continue;
    const priority = googleTypePriority[category] ?? 999;
    if (priority < bestPriority) {
      bestCategory = category;
      bestPriority = priority;
    }
  }

  return bestCategory;
}
