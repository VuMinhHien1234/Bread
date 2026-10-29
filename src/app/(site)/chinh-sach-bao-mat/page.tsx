import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { formatPhoneDisplay } from "@/lib/phone";
import { shopConfig } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Tiệm thu thập thông tin gì khi bạn gửi yêu cầu đặt món và dùng chúng ra sao.",
  alternates: { canonical: "/chinh-sach-bao-mat" },
};

/**
 * Nháp TẠM: mô tả đúng những gì website hiện làm. Nếu thêm công cụ theo dõi (Google Analytics…)
 * hoặc đổi cách lưu dữ liệu thì phải cập nhật trang này. Nên nhờ người am hiểu pháp lý rà soát trước khi ra mắt.
 */
export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Pháp lý"
        title="Chính sách bảo mật"
        description="Tiệm thu thập thông tin gì khi bạn gửi yêu cầu, và dùng chúng ra sao."
      />
      <div className="flex max-w-2xl flex-col gap-10 text-lg leading-8 text-text-muted">
        <section className="flex flex-col gap-3">
          <h2 className="text-3xl text-text">Thông tin chúng tôi thu thập</h2>
          <p>
            Khi bạn gửi yêu cầu đặt món hoặc tin liên hệ, {shopConfig.name} lưu: tên, số điện thoại,
            địa chỉ giao hàng (nếu bạn chọn giao), giờ muốn nhận, ghi chú và nội dung tin nhắn mà
            bạn tự nhập. Email chỉ lưu khi bạn điền ở form liên hệ.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-3xl text-text">Chúng tôi dùng thông tin để làm gì</h2>
          <p>
            Chỉ để gọi lại xác nhận yêu cầu, chuẩn bị món và trả lời tin nhắn của bạn. Tiệm không
            bán hay chia sẻ thông tin của bạn cho bên khác để quảng cáo.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-3xl text-text">Thông báo nội bộ</h2>
          <p>
            Yêu cầu của bạn được gửi vào nhóm Telegram nội bộ của tiệm để nhân viên thấy ngay và gọi
            lại. Dữ liệu được lưu trên hệ thống cơ sở dữ liệu của tiệm.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-3xl text-text">Chống spam và cookie</h2>
          <p>
            Để chặn tin nhắn rác, website đếm số lần gửi form theo địa chỉ mạng của bạn. Địa chỉ này
            được mã hóa một chiều, tiệm không lưu địa chỉ gốc. Web dành cho khách không đặt cookie
            theo dõi và không dùng công cụ phân tích hành vi.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-3xl text-text">Quyền của bạn</h2>
          <p>
            Bạn có thể gọi hoặc nhắn cho tiệm để hỏi, sửa hoặc yêu cầu xóa thông tin đã gửi:{" "}
            <a href={`tel:${shopConfig.phone}`} className="font-medium text-primary underline">
              {formatPhoneDisplay(shopConfig.phone)}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
