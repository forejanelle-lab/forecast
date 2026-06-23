export const CASTING_OFFICE_LOCATION_SUGGESTIONS = [
  "1200 Wilshire Blvd, Suite 400, Los Angeles, CA 90017",
  "350 Fifth Avenue, New York, NY 10118",
  "101 Marietta Street NW, Atlanta, GA 30303",
  "Los Angeles, CA",
  "New York, NY",
  "Atlanta, GA",
  "Burbank, CA",
  "San Diego, CA",
  "Brooklyn, NY",
  "Santa Monica, CA",
  "Hollywood, CA",
  "Pasadena, CA",
  "Long Island City, NY",
  "Chicago, IL",
  "Austin, TX",
  "Vancouver, BC",
  "Toronto, ON",
];

export function filterLocationSuggestions(query: string, limit = 6): string[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return CASTING_OFFICE_LOCATION_SUGGESTIONS.filter((suggestion) =>
    suggestion.toLowerCase().includes(normalized),
  ).slice(0, limit);
}
