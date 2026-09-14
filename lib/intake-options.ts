// Single source of truth for the fixed option lists used on the /apply
// form and Hiring Needs — shared with server-side validation in
// app/api/apply/route.ts so the allowed values can't drift out of sync
// with what the dropdowns actually offer.

export const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1))

export const CURRICULA = ["CAPS", "IEB", "Cambridge (CAIE)", "IB (International Baccalaureate)", "American Curriculum"]

export const COUNTRIES = ["South Africa"]

// "Other" isn't itself a valid submitted value — selecting it reveals a
// free-text field, so a real submission never has suburb === "Other".
export const SUBURBS = [
  "Johannesburg",
  "Pretoria",
  "Cape Town",
  "Durban",
  "Port Elizabeth (Gqeberha)",
  "East London",
  "Bloemfontein",
  "Polokwane",
  "Nelspruit (Mbombela)",
  "Kimberley",
  "Pietermaritzburg",
  "Rustenburg",
  "George",
  "Other",
]

// Same "Other" caveat as SUBURBS — a real submission sends the custom text.
export const SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy",
  "Physical Science",
  "Life Sciences",
  "Accounting",
  "English",
  "Afrikaans",
  "Geography",
  "History",
  "Economics",
  "Business Studies",
  "Computer Applications Technology",
  "Other",
]

export const TEACHING_MODES = ["Online", "In-person", "Both"]
