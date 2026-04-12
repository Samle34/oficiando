// Builds a wa.me deep link from a free-form Argentine phone number.
// The phone CHECK in migration 001 accepts inputs like "1134567890",
// "011-3456-7890" and "+541134567890" — stripping everything but digits
// and prepending 54 only when absent keeps the link valid across all
// three shapes.
export function waUrl(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}
