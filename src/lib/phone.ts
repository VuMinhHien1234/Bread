/**
 * Số điện thoại Việt Nam.
 * - Di động: 10 số, đầu 03 / 05 / 07 / 08 / 09.
 * - Cố định: 11 số, đầu 02 (mã vùng + 8 số).
 * Chấp nhận dấu cách, chấm, gạch, ngoặc và tiền tố +84 / 84.
 * @returns số dạng "0xxxxxxxxx" hoặc null nếu không hợp lệ.
 */
export function normalizeVietnamPhone(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, "");
  const withLeadingZero = compact.replace(/^(\+84|84)/, "0");
  if (!/^\d+$/.test(withLeadingZero)) return null;
  if (/^0[35789]\d{8}$/.test(withLeadingZero)) return withLeadingZero;
  if (/^02\d{9}$/.test(withLeadingZero)) return withLeadingZero;
  return null;
}

/** Che bớt số điện thoại khi ghi log: "0901234567" → "0901***567". */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

/** Hiển thị dễ đọc: "0901234567" → "0901 234 567". */
export function formatPhoneDisplay(phone: string): string {
  if (phone.length === 10) return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  return phone;
}
