// Common law firm names for autocomplete
export const commonFirmNames = [
  "Baker McKenzie",
  "DLA Piper",
  "Jones Day",
  "Kirkland & Ellis",
  "Latham & Watkins",
  "Skadden, Arps, Slate, Meagher & Flom",
  "White & Case",
  "Allen & Overy",
  "Clifford Chance",
  "Freshfields Bruckhaus Deringer",
  "Linklaters",
  "Norton Rose Fulbright",
  "Sidley Austin",
  "Simpson Thacher & Bartlett",
  "Sullivan & Cromwell",
];

// Specializations by bar number prefix
export const specializationsByBar = {
  // California Bar
  "CA": [
    "Intellectual Property",
    "Entertainment Law",
    "Technology Law",
    "Corporate Law",
    "Real Estate Law",
  ],
  // New York Bar
  "NY": [
    "Corporate Law",
    "Securities Law",
    "Banking Law",
    "International Law",
    "Tax Law",
  ],
  // Texas Bar
  "TX": [
    "Oil & Gas Law",
    "Energy Law",
    "Real Estate Law",
    "Corporate Law",
    "Environmental Law",
  ],
  // Default specializations
  "DEFAULT": [
    "Corporate Law",
    "Criminal Law",
    "Family Law",
    "Real Estate Law",
    "Intellectual Property",
    "Tax Law",
    "Environmental Law",
    "Employment Law",
    "Immigration Law",
    "Bankruptcy Law",
  ],
};

export function getSpecializationsByBarNumber(barNumber: string): string[] {
  // Extract state prefix from bar number (assuming format like "CA123456")
  const statePrefix = barNumber.substring(0, 2).toUpperCase();
  return specializationsByBar[statePrefix as keyof typeof specializationsByBar] || specializationsByBar.DEFAULT;
}

export function getFirmSuggestions(input: string): string[] {
  if (!input) return [];
  const searchTerm = input.toLowerCase();
  return commonFirmNames
    .filter(name => name.toLowerCase().includes(searchTerm))
    .slice(0, 5); // Return top 5 matches
}

// Social proof data
export const socialProofData = {
  totalAttorneys: 15000,
  activeFirms: 2500,
  averageRating: 4.8,
  recentSignups: 150,
}; 