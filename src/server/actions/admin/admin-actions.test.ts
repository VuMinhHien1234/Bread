import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

class FakeUnauthorizedError extends Error {}
const requireAdmin = vi.fn();
vi.mock("@/server/auth/session", () => ({
  requireAdmin: () => requireAdmin() as Promise<unknown>,
  UnauthorizedError: FakeUnauthorizedError,
}));

const getDb = vi.fn();
vi.mock("@/server/db", () => ({ getDb: () => getDb() as unknown }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/server/services/cloudinary", () => ({
  createUploadSignature: vi.fn(),
  deleteCloudinaryImage: vi.fn(),
}));
vi.mock("@/server/services/telegram", () => ({ sendTelegramMessage: vi.fn() }));
vi.mock("@/lib/env", () => ({ getServerEnv: vi.fn() }));

const { runAdminAction, UNAUTHORIZED_MESSAGE, GENERIC_ERROR_MESSAGE } =
  await import("./run-admin-action");
const categories = await import("./categories");
const menuItems = await import("./menu-items");
const images = await import("./images");
const requests = await import("./requests");

beforeEach(() => {
  requireAdmin.mockReset();
  getDb.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("runAdminAction", () => {
  it("chưa đăng nhập thì không chạy handler", async () => {
    requireAdmin.mockRejectedValue(new FakeUnauthorizedError());
    const handler = vi.fn();
    const result = await runAdminAction("test", handler);
    expect(result).toEqual({ ok: false, error: UNAUTHORIZED_MESSAGE });
    expect(handler).not.toHaveBeenCalled();
  });

  it("đã đăng nhập thì trả kết quả của handler", async () => {
    requireAdmin.mockResolvedValue({});
    const result = await runAdminAction("test", () => Promise.resolve({ ok: true, data: 5 }));
    expect(result).toEqual({ ok: true, data: 5 });
  });

  it("lỗi bất ngờ trong handler không ném ra ngoài và không lộ chi tiết", async () => {
    requireAdmin.mockResolvedValue({});
    const result = await runAdminAction("test", () =>
      Promise.reject(new Error("SELECT * FROM secret")),
    );
    expect(result).toEqual({ ok: false, error: GENERIC_ERROR_MESSAGE });
  });

  it("lỗi lạ khi kiểm tra quyền vẫn trả thông báo chung", async () => {
    requireAdmin.mockRejectedValue(new Error("db sập"));
    const result = await runAdminAction("test", vi.fn());
    expect(result).toEqual({ ok: false, error: GENERIC_ERROR_MESSAGE });
  });
});

describe("mọi admin action đều chặn người chưa đăng nhập, không đụng tới database", () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ["createCategory", () => categories.createCategory({ name: "A" })],
    ["updateCategory", () => categories.updateCategory("1", { name: "A" })],
    ["deleteCategory", () => categories.deleteCategory({ id: "1" })],
    ["reorderCategories", () => categories.reorderCategories({ ids: ["1"] })],
    ["createMenuItem", () => menuItems.createMenuItem({})],
    ["updateMenuItem", () => menuItems.updateMenuItem("1", {})],
    ["deleteMenuItem", () => menuItems.deleteMenuItem({ id: "1" })],
    ["toggleSoldOut", () => menuItems.toggleSoldOut({ id: "1", value: true })],
    ["toggleActive", () => menuItems.toggleActive({ id: "1", value: true })],
    ["reorderMenuItems", () => menuItems.reorderMenuItems({ parentId: "1", ids: ["1"] })],
    ["getUploadSignature", () => images.getUploadSignature()],
    ["addMenuItemImage", () => images.addMenuItemImage({})],
    ["deleteMenuItemImage", () => images.deleteMenuItemImage({ id: "1" })],
    ["setPrimaryImage", () => images.setPrimaryImage({ id: "1" })],
    ["reorderImages", () => images.reorderImages({ parentId: "1", ids: ["1"] })],
    ["updateOrderRequestStatus", () => requests.updateOrderRequestStatus({})],
    ["updateContactStatus", () => requests.updateContactStatus({})],
    ["retryTelegram", () => requests.retryTelegram({})],
  ];

  it.each(calls)("%s", async (_name, call) => {
    requireAdmin.mockRejectedValue(new FakeUnauthorizedError());
    expect(await call()).toEqual({ ok: false, error: UNAUTHORIZED_MESSAGE });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("dữ liệu sai trả lỗi theo ô khi đã đăng nhập", async () => {
    requireAdmin.mockResolvedValue({});
    const result = await categories.createCategory({ name: "" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors?.["name"]).toBeDefined();
    expect(getDb).not.toHaveBeenCalled();
  });
});
