import type { Metadata } from "next";
import Link from "next/link";
import { ContactStatusButton } from "@/components/admin/ContactStatusButton";
import { Pagination } from "@/components/admin/Pagination";
import { RetryTelegramButton } from "@/components/admin/RetryTelegramButton";
import { Badge } from "@/components/ui/Badge";
import { contactStatusLabel, isContactStatus } from "@/lib/admin-labels";
import { cn } from "@/lib/cn";
import { formatVietnamDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { listContactMessages } from "@/server/queries/admin";
import { ADMIN_BASE, adminPath } from "@/lib/admin-path";

export const metadata: Metadata = { title: "Tin liên hệ", robots: { index: false } };

type Props = { searchParams: Promise<{ "trang-thai"?: string; trang?: string }> };

export default async function ContactMessagesPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = isContactStatus(params["trang-thai"]) ? params["trang-thai"] : undefined;
  const result = await listContactMessages({
    ...(status ? { status } : {}),
    page: Number(params.trang ?? 1),
  });

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    if (status) query.set("trang-thai", status);
    if (page > 1) query.set("trang", String(page));
    const text = query.toString();
    return text ? `${ADMIN_BASE}/lien-he?${text}` : adminPath("lien-he");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">Tin liên hệ</h1>
      <nav aria-label="Lọc theo trạng thái" className="flex gap-2">
        {[undefined, "NEW", "HANDLED"].map((entry) => (
          <Link
            key={entry ?? "all"}
            href={entry ? `${ADMIN_BASE}/lien-he?trang-thai=${entry}` : adminPath("lien-he")}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border-2 px-4 font-semibold",
              entry === status ? "border-primary bg-primary/10" : "border-border bg-surface",
            )}
          >
            {isContactStatus(entry) ? contactStatusLabel[entry] : "Tất cả"}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-6 text-text-muted">
          Chưa có tin nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.rows.map((message) => (
            <li
              key={message.id}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong>{message.name}</strong>
                <Badge tone={message.status === "NEW" ? "primary" : "green"}>
                  {contactStatusLabel[message.status]}
                </Badge>
                {message.telegramError ? <Badge tone="danger">Telegram lỗi</Badge> : null}
                <span className="text-sm text-text-muted">
                  {formatVietnamDateTime(message.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-line">{message.message}</p>
              <p className="flex flex-wrap gap-x-4 text-sm">
                {message.phone ? (
                  <a href={`tel:${message.phone}`} className="font-medium text-primary underline">
                    {formatPhoneDisplay(message.phone)}
                  </a>
                ) : null}
                {message.email ? (
                  <a
                    href={`mailto:${message.email}`}
                    className="font-medium text-primary underline"
                  >
                    {message.email}
                  </a>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                <ContactStatusButton id={message.id} status={message.status} />
                {message.telegramError ? (
                  <RetryTelegramButton kind="contact" id={message.id} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </div>
  );
}
