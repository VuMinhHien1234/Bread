/**
 * Tiền trong dự án luôn là số nguyên VND (không dùng số thực).
 * Tự nhóm hàng nghìn bằng dấu chấm thay vì dùng Intl, để kết quả giống nhau
 * trên mọi máy chủ (ICU khác nhau cho ra khoảng trắng khác nhau).
 */
export function formatVND(amount: number): string {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError(`Số tiền phải là số nguyên không âm, nhận được: ${amount}`);
  }
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}₫`;
}
