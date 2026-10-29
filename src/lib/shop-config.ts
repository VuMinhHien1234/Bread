import { toVietnamParts } from "./datetime";

/**
 * Thông tin tiệm và quy tắc đặt món — nguồn duy nhất (CODING-RULES mục 8).
 * Các giá trị đánh dấu TẠM phải được thay bằng thông tin thật ở task G6.7.
 * P1 (G7.4) sẽ chuyển phần thông tin tiệm vào trang quản trị.
 */

export type OpeningRule = {
  /** 0 = Chủ nhật, 1 = Thứ hai, … 6 = Thứ bảy */
  readonly days: readonly number[];
  /** Giờ mở "HH:MM" theo giờ Việt Nam */
  readonly open: string;
  /** Giờ đóng "HH:MM"; nhỏ hơn hoặc bằng giờ mở nghĩa là qua nửa đêm */
  readonly close: string;
};

export const shopConfig = {
  name: "Bánh Mì Thanh Long",
  /**
   * Ảnh lớn ở đầu trang chủ (đặt file trong thư mục public/, ví dụ "/anh/hero.jpg").
   * Để trống thì hiện khung minh họa nét mảnh. TẠM: thay bằng ảnh chụp bánh thật của tiệm.
   */
  heroImage: "" as string,
  /** Dòng phụ nhỏ dưới tên tiệm ở logo */
  subtitle: "Bánh mì Hà Nội truyền thống",
  tagline: "Bánh mì nóng giòn mỗi sáng", // TẠM
  phone: "0961271777", // TẠM
  zalo: "https://zalo.me/0961271777", // TẠM
  telegram: "https://t.me/banhmithanhlong", // TẠM
  address: "301 E2, Tổ 26, Đống Đa, Hà Nội",
  mapsUrl: "https://maps.app.goo.gl/sQb4SEvrdKRjxyAM7",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d985.9611725297538!2d105.8172204265875!3d21.011085450800884!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab7d4da1c4cf%3A0x42ec19c1dd82a8af!2zMzAxIEUyLCBU4buVIDI2LCDEkOG7kW5nIMSQYSwgSMOgIE7hu5lpLCBWaeG7h3QgTmFt!5e1!3m2!1svi!2s!4v1793265925306!5m2!1svi!2s",
  storyTitle: "Từ một lò bánh nhỏ trong phố", // TẠM
  story: [
    "Tiệm bắt đầu từ một lò bánh nhỏ trong phố, với mong muốn đơn giản: mỗi sáng có ổ bánh mì vỏ giòn, ruột mềm, nhân đầy đặn cho bà con quanh đây.", // TẠM
    "Bánh được nướng trong ngày, nhân chuẩn bị từ sáng sớm. Bạn cứ chọn món, gửi yêu cầu, tiệm sẽ gọi lại xác nhận và chuẩn bị sẵn cho bạn.", // TẠM
  ],
  /**
   * Ba điểm mạnh hiển thị ở trang chủ — nháp TẠM, chỉnh lại cho đúng với tiệm.
   */
  highlights: [
    {
      title: "Nướng nóng mỗi sáng",
      text: "Bánh truyền thống, vỏ mỏng giòn, ruột mềm xốp.",
    },
    {
      title: "Nhân làm tại tiệm",
      text: "Pa-tê, chả, thịt nướng và đồ chua chuẩn bị từ sáng sớm, không dùng hàng làm sẵn.",
    },
    {
      title: "Gọi lại xác nhận",
      text: "Gửi yêu cầu trên web, tiệm gọi lại chốt món và giờ nhận. Không cần trả trước.",
    },
  ],
  /** Thông tin pháp lý hiển thị ở chân trang khi đã điền (G5.8). Để trống thì không hiện. */
  legal: {
    businessRegistration: "" as string, // TẠM: số đăng ký hộ kinh doanh
    foodSafetyCertificate: "" as string, // TẠM: giấy chứng nhận an toàn thực phẩm
  },
  openingHours: [
    { days: [0, 1, 2, 3, 4, 5, 6], open: "06:00", close: "20:00" }, // TẠM
  ] as readonly OpeningRule[],
} as const;

/** Quy tắc đặt món (master plan H3 #6–#8). */
export const orderRules = {
  deliveryRadiusKm: 3,
  maxQuantityPerItem: 50,
  maxLinesPerRequest: 20,
  /** Hẹn giờ nhận: ít nhất sau bao nhiêu phút kể từ lúc gửi */
  minLeadMinutes: 15,
  maxScheduleDays: 7,
  /** Gửi form nhanh hơn số giây này bị coi là bot */
  minFillSeconds: 3,
  rateLimit: {
    windowMinutes: 10,
    orderRequestsPerWindow: 5,
    contactMessagesPerWindow: 3,
  },
} as const;

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

function parseClock(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  if (hours === undefined || minutes === undefined || Number.isNaN(hours + minutes)) {
    throw new Error(`Giờ không hợp lệ: "${clock}" (cần dạng HH:MM)`);
  }
  return hours * 60 + minutes;
}

/** Phút tính từ 00:00 Chủ nhật theo giờ Việt Nam. */
function minuteOfWeek(date: Date): number {
  const { weekday, hours, minutes } = toVietnamParts(date);
  return weekday * MINUTES_PER_DAY + hours * 60 + minutes;
}

type Interval = { start: number; end: number };

function toIntervals(rules: readonly OpeningRule[]): Interval[] {
  return rules.flatMap((rule) => {
    const open = parseClock(rule.open);
    const close = parseClock(rule.close);
    const length = close > open ? close - open : close + MINUTES_PER_DAY - open;
    return rule.days.map((day) => ({
      start: day * MINUTES_PER_DAY + open,
      end: day * MINUTES_PER_DAY + open + length,
    }));
  });
}

/** Tiệm có đang mở cửa tại thời điểm `date` không (tính theo giờ Việt Nam). */
export function isOpenAt(
  date: Date,
  rules: readonly OpeningRule[] = shopConfig.openingHours,
): boolean {
  const now = minuteOfWeek(date);
  return toIntervals(rules).some(
    ({ start, end }) =>
      (now >= start && now < end) ||
      // Khoảng mở cửa qua nửa đêm Thứ bảy sang Chủ nhật vòng sang đầu tuần
      (now + MINUTES_PER_WEEK >= start && now + MINUTES_PER_WEEK < end),
  );
}

/**
 * Thời điểm tiệm mở cửa lần kế tiếp, sau `date`. Trả null nếu chưa cấu hình giờ mở cửa.
 * Dùng cho dòng "Tiệm sẽ gọi lại bạn lúc 06:00" khi gửi ngoài giờ.
 */
export function nextOpenTime(
  date: Date,
  rules: readonly OpeningRule[] = shopConfig.openingHours,
): Date | null {
  const now = minuteOfWeek(date);
  const starts = toIntervals(rules).flatMap(({ start }) => [start, start + MINUTES_PER_WEEK]);
  const upcoming = starts.filter((start) => start > now);
  if (upcoming.length === 0) return null;

  const minutesAhead = Math.min(...upcoming) - now;
  const wholeMinute = Math.floor(date.getTime() / 60_000) * 60_000;
  return new Date(wholeMinute + minutesAhead * 60_000);
}
