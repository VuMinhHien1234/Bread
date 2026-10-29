/**
 * Dữ liệu mẫu (TASK-DB mục 6). Giá chỉ để dựng thử giao diện; chủ tiệm nhập giá thật ở G2.11.
 * Đặt tách riêng để dễ sửa mà không đụng tới logic chèn.
 */
export type SeedItem = {
  slug: string;
  name: string;
  shortDescription: string;
  options: ReadonlyArray<{ name: string; price: number }>;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
};

export type SeedCategory = { slug: string; name: string; items: ReadonlyArray<SeedItem> };

export const seedCategories: ReadonlyArray<SeedCategory> = [
  {
    slug: "banh-mi-kep",
    name: "Bánh mì kẹp",
    items: [
      {
        slug: "banh-mi-thit-nuong",
        name: "Bánh mì thịt nướng",
        shortDescription: "Thịt heo nướng thơm, đồ chua, rau thơm",
        options: [
          { name: "Thường", price: 25000 },
          { name: "Đặc biệt", price: 35000 },
        ],
        isBestSeller: true,
        isFeatured: true,
      },
      {
        slug: "banh-mi-pate-cha",
        name: "Bánh mì pate chả",
        shortDescription: "Pate béo, chả lụa, dưa leo",
        options: [
          { name: "Thường", price: 20000 },
          { name: "Đặc biệt", price: 30000 },
        ],
        isFeatured: true,
      },
      {
        slug: "banh-mi-ga-xe",
        name: "Bánh mì gà xé",
        shortDescription: "Gà xé sợi trộn sốt cay nhẹ",
        options: [{ name: "Thường", price: 25000 }],
        isSpicy: true,
        isNew: true,
      },
      {
        slug: "banh-mi-chay",
        name: "Bánh mì chay",
        shortDescription: "Đậu hũ chiên, nấm xào, rau củ",
        options: [{ name: "Thường", price: 20000 }],
        isVegetarian: true,
      },
    ],
  },
  {
    slug: "combo",
    name: "Combo",
    items: [
      {
        slug: "combo-sang",
        name: "Combo sáng",
        shortDescription: "1 bánh mì + 1 cà phê",
        options: [{ name: "Combo", price: 40000 }],
        isFeatured: true,
      },
      {
        slug: "combo-van-phong-10-phan",
        name: "Combo văn phòng 10 phần",
        shortDescription: "10 bánh mì tuỳ chọn cho cả nhóm",
        options: [{ name: "10 phần", price: 230000 }],
      },
    ],
  },
  {
    slug: "mon-them",
    name: "Món thêm",
    items: [
      {
        slug: "them-trung",
        name: "Thêm trứng",
        shortDescription: "Trứng ốp la",
        options: [{ name: "1 phần", price: 5000 }],
      },
      {
        slug: "them-pate",
        name: "Thêm pate",
        shortDescription: "Pate béo mịn",
        options: [{ name: "1 phần", price: 5000 }],
      },
      {
        slug: "them-cha",
        name: "Thêm chả",
        shortDescription: "Chả lụa cắt lát",
        options: [{ name: "1 phần", price: 7000 }],
      },
    ],
  },
  {
    slug: "do-uong",
    name: "Đồ uống",
    items: [
      {
        slug: "ca-phe-sua-da",
        name: "Cà phê sữa đá",
        shortDescription: "Cà phê phin đậm vị",
        options: [{ name: "Ly", price: 20000 }],
      },
      {
        slug: "tra-tac",
        name: "Trà tắc",
        shortDescription: "Trà tắc mát lạnh",
        options: [{ name: "Ly", price: 15000 }],
      },
    ],
  },
];

/** Dùng để nhận biết và xóa đúng các dòng mẫu khi chạy lại, không đụng dữ liệu thật. */
export const SEED_MARKER = "seed";
