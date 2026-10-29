/**
 * Giờ Việt Nam. Việt Nam dùng UTC+7 quanh năm, không có giờ mùa hè,
 * nên cộng lệch cố định là đủ và cho kết quả giống nhau trên mọi máy chủ.
 */
export const VIETNAM_OFFSET_MINUTES = 7 * 60;

const WEEKDAYS = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"];

type VietnamParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hours: number;
  minutes: number;
};

/** Tách thời điểm thành các thành phần theo giờ Việt Nam (weekday: 0 = Chủ nhật). */
export function toVietnamParts(date: Date): VietnamParts {
  const local = new Date(date.getTime() + VIETNAM_OFFSET_MINUTES * 60_000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    weekday: local.getUTCDay(),
    hours: local.getUTCHours(),
    minutes: local.getUTCMinutes(),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** "06:00" theo giờ Việt Nam. */
export function formatVietnamClock(date: Date): string {
  const { hours, minutes } = toVietnamParts(date);
  return `${pad(hours)}:${pad(minutes)}`;
}

/** "07:30 thứ Năm 08/10" theo giờ Việt Nam, dùng trong tin Telegram. */
export function formatVietnamDateTime(date: Date): string {
  const { weekday, day, month } = toVietnamParts(date);
  return `${formatVietnamClock(date)} ${WEEKDAYS[weekday]} ${pad(day)}/${pad(month)}`;
}

/** Ngày dạng "MMDD" theo giờ Việt Nam, dùng làm phần giữa của mã yêu cầu TL-MMDD-NNN. */
export function formatVietnamMonthDay(date: Date): string {
  const { month, day } = toVietnamParts(date);
  return `${pad(month)}${pad(day)}`;
}

/** Giá trị cho ô `<input type="datetime-local">` theo giờ Việt Nam: "2026-10-07T14:30". */
export function toVietnamDateTimeLocal(date: Date): string {
  const { year, month, day, hours, minutes } = toVietnamParts(date);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`;
}

/**
 * Đổi giá trị của ô datetime-local (khách nhập theo giờ Việt Nam) thành chuỗi ISO chuẩn,
 * không phụ thuộc múi giờ của trình duyệt. Trả null nếu chuỗi không hợp lệ.
 */
export function fromVietnamDateTimeLocal(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
