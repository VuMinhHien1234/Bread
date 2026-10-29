import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Chạy file migration thật trên Postgres (PGlite) rồi thử vi phạm từng ràng buộc
 * trong TASK-DB.md: CHECK, UNIQUE, khóa ngoại, chỉ mục từng phần.
 */
let db: PGlite;

async function expectViolation(sql: string, constraint: RegExp) {
  await expect(db.query(sql)).rejects.toThrow(constraint);
}

beforeAll(async () => {
  db = new PGlite();
  const migration = readFileSync(
    new URL("../../../drizzle/0000_init.sql", import.meta.url),
    "utf8",
  );
  for (const statement of migration.split("--> statement-breakpoint")) {
    await db.exec(statement);
  }
  await db.exec(`
    INSERT INTO category (id, name, slug) VALUES ('c1', 'Bánh mì kẹp', 'banh-mi-kep');
    INSERT INTO menu_item (id, category_id, name, slug) VALUES ('m1', 'c1', 'Thịt nướng', 'thit-nuong');
    INSERT INTO menu_item_option (id, menu_item_id, name, price, is_default) VALUES ('o1', 'm1', 'Thường', 25000, true);
  `);
});

describe("ràng buộc database", () => {
  it("giá lựa chọn không được âm", async () => {
    await expectViolation(
      `INSERT INTO menu_item_option (id, menu_item_id, name, price) VALUES ('o2', 'm1', 'Lỗi', -1)`,
      /menu_item_option_price_check/,
    );
  });

  it("mỗi món chỉ có một lựa chọn mặc định, nhưng được nhiều lựa chọn không mặc định", async () => {
    await expectViolation(
      `INSERT INTO menu_item_option (id, menu_item_id, name, price, is_default) VALUES ('o3', 'm1', 'Thứ hai', 1, true)`,
      /menu_item_option_one_default_idx/,
    );
    await db.exec(
      `INSERT INTO menu_item_option (id, menu_item_id, name, price) VALUES ('o4', 'm1', 'Đặc biệt', 35000)`,
    );
  });

  it("slug món và danh mục phải duy nhất", async () => {
    await expectViolation(
      `INSERT INTO category (id, name, slug) VALUES ('c2', 'Trùng', 'banh-mi-kep')`,
      /category_slug_unique/,
    );
  });

  it("không xóa được danh mục khi còn món", async () => {
    await expectViolation(
      `DELETE FROM category WHERE id = 'c1'`,
      /menu_item_category_id_category_id_fk/,
    );
  });

  it("yêu cầu giao hàng bắt buộc có địa chỉ", async () => {
    await expectViolation(
      `INSERT INTO order_request (id, code, customer_name, phone, fulfillment, estimated_total)
       VALUES ('r1', 'TL-0001-001', 'A', '0901234567', 'DELIVERY', 0)`,
      /order_request_delivery_address_check/,
    );
    await db.exec(
      `INSERT INTO order_request (id, code, customer_name, phone, fulfillment, delivery_address, estimated_total)
       VALUES ('r2', 'TL-0001-002', 'A', '0901234567', 'DELIVERY', '12 Láng Hạ', 0),
              ('r3', 'TL-0001-003', 'B', '0901234568', 'PICKUP', NULL, 0)`,
    );
  });

  it("mã yêu cầu phải duy nhất", async () => {
    await expectViolation(
      `INSERT INTO order_request (id, code, customer_name, phone, fulfillment, estimated_total)
       VALUES ('r4', 'TL-0001-003', 'C', '0901234569', 'PICKUP', 0)`,
      /order_request_code_unique/,
    );
  });

  it("số lượng mỗi dòng món chỉ từ 1 đến 50", async () => {
    for (const quantity of [0, 51]) {
      await expectViolation(
        `INSERT INTO order_request_item (id, order_request_id, item_name, option_name, unit_price, quantity, line_total)
         VALUES ('i-${quantity}', 'r3', 'Món', 'Thường', 1000, ${quantity}, 0)`,
        /order_request_item_quantity_check/,
      );
    }
  });

  it("xóa món thì dòng yêu cầu cũ vẫn còn, giữ bản chụp tên và giá", async () => {
    await db.exec(`
      INSERT INTO menu_item (id, category_id, name, slug) VALUES ('m2', 'c1', 'Món sẽ xóa', 'mon-se-xoa');
      INSERT INTO menu_item_option (id, menu_item_id, name, price) VALUES ('o9', 'm2', 'Thường', 20000);
      INSERT INTO order_request_item (id, order_request_id, menu_item_id, menu_item_option_id, item_name, option_name, unit_price, quantity, line_total)
      VALUES ('i1', 'r3', 'm2', 'o9', 'Món sẽ xóa', 'Thường', 20000, 2, 40000);
      DELETE FROM menu_item WHERE id = 'm2';
    `);
    const { rows } = await db.query<{
      menu_item_id: string | null;
      item_name: string;
      unit_price: number;
    }>(`SELECT menu_item_id, item_name, unit_price FROM order_request_item WHERE id = 'i1'`);
    expect(rows[0]).toEqual({ menu_item_id: null, item_name: "Món sẽ xóa", unit_price: 20000 });
  });

  it("tin liên hệ phải có ít nhất SĐT hoặc email", async () => {
    await expectViolation(
      `INSERT INTO contact_message (id, name, message) VALUES ('t1', 'A', 'xin chào')`,
      /contact_message_contact_check/,
    );
    await db.exec(
      `INSERT INTO contact_message (id, name, email, message) VALUES ('t2', 'A', 'a@b.vn', 'xin chào')`,
    );
  });

  it("có bảng rate_limit cho Better Auth và khóa đếm phải duy nhất", async () => {
    await db.exec(
      `INSERT INTO rate_limit (id, key, count, last_request) VALUES ('l1', '1.2.3.4/sign-in/email', 1, 1700000000000)`,
    );
    await expectViolation(
      `INSERT INTO rate_limit (id, key, count, last_request) VALUES ('l2', '1.2.3.4/sign-in/email', 1, 1)`,
      /rate_limit_key_unique/,
    );
  });

  it("xóa người dùng thì xóa luôn phiên đăng nhập", async () => {
    await db.exec(`
      INSERT INTO "user" (id, name, email) VALUES ('u1', 'Chủ tiệm', 'chu@tiem.vn');
      INSERT INTO session (id, expires_at, token, user_id) VALUES ('s1', now(), 'tok', 'u1');
      DELETE FROM "user" WHERE id = 'u1';
    `);
    const { rows } = await db.query(`SELECT 1 FROM session WHERE id = 's1'`);
    expect(rows).toHaveLength(0);
  });
});
