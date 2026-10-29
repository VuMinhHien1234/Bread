import Link from "next/link";
import { StatusScreen } from "@/components/site/StatusScreen";
import { buttonClassName } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <StatusScreen
      mark="404"
      title="Không tìm thấy trang"
      description="Trang bạn tìm có thể đã được chuyển hoặc không còn nữa."
    >
      <Link href="/" className={buttonClassName("primary")}>
        Về trang chủ
      </Link>
      <Link href="/thuc-don" className={buttonClassName("secondary")}>
        Xem thực đơn
      </Link>
    </StatusScreen>
  );
}
