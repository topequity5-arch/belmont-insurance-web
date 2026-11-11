// The product name is intentionally generic and configurable. Change it with NEXT_PUBLIC_BRAND_NAME.
export const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "Your Insurer";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Public company details shown on the contact page.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@yourinsurer.example";
export const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+1 (555) 010-2030";
// "|"-separated lines, e.g. "123 Insurance Plaza, Suite 400|New York, NY 10004|United States"
export const COMPANY_ADDRESS = (process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "123 Insurance Plaza, Suite 400|New York, NY 10004|United States")
  .split("|").map((line) => line.trim()).filter(Boolean);
