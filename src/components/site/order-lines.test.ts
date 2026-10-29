import { describe, expect, it } from "vitest";
import type { PublicMenuCategory } from "@/server/queries/public/menu";
import { buildOrderRows, estimateTotal, initialQuantities } from "./order-lines";

const baseItem = {
  shortDescription: null,
  isSpicy: false,
  isVegetarian: false,
  isBestSeller: false,
  isNew: false,
  isFeatured: false,
  primaryImage: null,
};

const menu: PublicMenuCategory[] = [
  {
    id: "c1",
    slug: "banh-mi",
    name: "Bánh mì",
    description: null,
    items: [
      {
        ...baseItem,
        id: "i1",
        slug: "thit-nuong",
        name: "Thịt nướng",
        isSoldOutToday: false,
        minPrice: 25_000,
        options: [
          { id: "o1", name: "Thường", price: 25_000, isDefault: false },
          { id: "o2", name: "Đặc biệt", price: 35_000, isDefault: true },
        ],
      },
      {
        ...baseItem,
        id: "i2",
        slug: "ca-phe",
        name: "Cà phê",
        isSoldOutToday: true,
        minPrice: 20_000,
        options: [{ id: "o3", name: "Ly", price: 20_000, isDefault: true }],
      },
    ],
  },
];

describe("buildOrderRows", () => {
  it("mỗi lựa chọn là một dòng; chỉ hiện tên lựa chọn khi món có nhiều lựa chọn", () => {
    const rows = buildOrderRows(menu);
    expect(rows.map((row) => row.key)).toEqual(["i1:o1", "i1:o2", "i2:o3"]);
    expect(rows.map((row) => row.showOptionName)).toEqual([true, true, false]);
    expect(rows[2]?.soldOut).toBe(true);
  });
});

describe("initialQuantities", () => {
  it("chọn sẵn 1 phần ở lựa chọn mặc định", () => {
    expect(initialQuantities(menu, "thit-nuong")).toEqual({ "i1:o2": 1 });
  });

  it("không chọn sẵn món đã hết hoặc không tồn tại", () => {
    expect(initialQuantities(menu, "ca-phe")).toEqual({});
    expect(initialQuantities(menu, "khong-co")).toEqual({});
    expect(initialQuantities(menu, undefined)).toEqual({});
  });
});

describe("estimateTotal", () => {
  it("cộng giá × số lượng, bỏ qua dòng chưa chọn", () => {
    const rows = buildOrderRows(menu);
    expect(estimateTotal(rows, { "i1:o1": 2, "i1:o2": 1 })).toBe(85_000);
    expect(estimateTotal(rows, {})).toBe(0);
  });
});
