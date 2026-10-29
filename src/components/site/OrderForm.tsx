"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import {
  formatVietnamClock,
  fromVietnamDateTimeLocal,
  toVietnamDateTimeLocal,
} from "@/lib/datetime";
import { formatVND } from "@/lib/money";
import { formatPhoneDisplay } from "@/lib/phone";
import { isOpenAt, nextOpenTime, orderRules, shopConfig } from "@/lib/shop-config";
import type { PublicMenuCategory } from "@/server/queries/public/menu";
import { createOrderRequest } from "@/server/actions/public/create-order-request";
import { Honeypot } from "./Honeypot";
import { buildOrderRows, estimateTotal, initialQuantities } from "./order-lines";

type Receipt = { code: string; estimatedTotal: number; isOpenNow: boolean };
type Fulfillment = "PICKUP" | "DELIVERY";
type Timing = "ASAP" | "SCHEDULED";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export function OrderForm({
  menu,
  preselectSlug,
}: {
  menu: PublicMenuCategory[];
  preselectSlug?: string | undefined;
}) {
  const rows = useMemo(() => buildOrderRows(menu), [menu]);
  const [quantities, setQuantities] = useState(() => initialQuantities(menu, preselectSlug));
  const [fulfillment, setFulfillment] = useState<Fulfillment>("PICKUP");
  const [timing, setTiming] = useState<Timing>("ASAP");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<Receipt>();
  // Thời điểm mở form: server từ chối form gửi nhanh bất thường (bot)
  const [startedAt] = useState(() => Date.now());

  const total = estimateTotal(rows, quantities);
  const hasItems = Object.values(quantities).some((quantity) => quantity > 0);

  function setQuantity(key: string, value: number) {
    setQuantities((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "");

    setFormError(undefined);
    setFieldErrors({});
    const items = rows
      .filter((row) => (quantities[row.key] ?? 0) > 0)
      .map((row) => ({
        menuItemId: row.menuItemId,
        optionId: row.optionId,
        quantity: quantities[row.key] ?? 0,
      }));
    if (items.length === 0) {
      setFieldErrors({ items: "Bạn chưa chọn món nào." });
      return;
    }
    const requestedAt =
      timing === "SCHEDULED" ? fromVietnamDateTimeLocal(field("requestedAt")) : null;
    if (timing === "SCHEDULED" && requestedAt === null) {
      setFieldErrors({ requestedAt: "Vui lòng chọn giờ muốn nhận." });
      return;
    }

    setIsSubmitting(true);
    const result = await createOrderRequest({
      items,
      customerName: field("customerName"),
      phone: field("phone"),
      fulfillment,
      deliveryAddress: fulfillment === "DELIVERY" ? field("deliveryAddress") : null,
      requestedAt,
      note: field("note"),
      website: field("website"),
      startedAt,
    });
    setIsSubmitting(false);

    if (result.ok) {
      setReceipt(result.data);
      window.scrollTo({ top: 0 });
      return;
    }
    setFormError(result.error);
    setFieldErrors(result.fieldErrors ?? {});
  }

  if (receipt) return <OrderSuccess receipt={receipt} />;

  const now = new Date();
  const minTime = toVietnamDateTimeLocal(
    new Date(now.getTime() + orderRules.minLeadMinutes * MS_PER_MINUTE),
  );
  const maxTime = toVietnamDateTimeLocal(
    new Date(now.getTime() + orderRules.maxScheduleDays * MS_PER_DAY),
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative flex flex-col gap-12 pb-24 md:pb-0"
    >
      <Honeypot />

      <section aria-labelledby="chon-mon" className="flex flex-col gap-5">
        <h2 id="chon-mon" className="flex items-baseline gap-3 text-3xl">
          <span className="font-heading text-lg italic text-brass-text">01</span>
          Chọn món
        </h2>
        {fieldErrors["items"] ? (
          <p role="alert" className="font-medium text-danger">
            {fieldErrors["items"]}
          </p>
        ) : null}
        <ul className="divide-y divide-border border border-border bg-surface">
          {rows.map((row, index) => {
            const quantity = quantities[row.key] ?? 0;
            const showCategory = rows[index - 1]?.categoryName !== row.categoryName;
            const label = row.showOptionName ? `${row.itemName} (${row.optionName})` : row.itemName;
            return (
              <li key={row.key}>
                {showCategory ? (
                  <p className="bg-cream-deep px-5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-brass-text">
                    {row.categoryName}
                  </p>
                ) : null}
                <div
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4",
                    row.soldOut && "opacity-60",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-heading text-xl leading-snug">{label}</p>
                    <p className="text-sm tabular-nums text-text-muted">
                      {row.soldOut ? "Tạm hết hôm nay" : formatVND(row.price)}
                    </p>
                  </div>
                  {row.soldOut ? null : (
                    <Stepper
                      label={label}
                      value={quantity}
                      max={orderRules.maxQuantityPerItem}
                      onChange={(value) => setQuantity(row.key, value)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="thong-tin"
        className="flex flex-col gap-5 border-t border-border pt-10"
      >
        <h2 id="thong-tin" className="flex items-baseline gap-3 text-3xl">
          <span className="font-heading text-lg italic text-brass-text">02</span>
          Thông tin của bạn
        </h2>
        <Input
          id="customerName"
          name="customerName"
          label="Tên"
          autoComplete="name"
          required
          maxLength={80}
          {...errorProp(fieldErrors["customerName"])}
        />
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          label="Số điện thoại"
          hint="Tiệm sẽ gọi vào số này để xác nhận."
          autoComplete="tel"
          required
          {...errorProp(fieldErrors["phone"])}
        />
      </section>

      <section
        aria-labelledby="nhan-mon"
        className="flex flex-col gap-5 border-t border-border pt-10"
      >
        <h2 id="nhan-mon" className="flex items-baseline gap-3 text-3xl">
          <span className="font-heading text-lg italic text-brass-text">03</span>
          Nhận món
        </h2>
        <RadioGroup
          legend="Cách nhận"
          name="fulfillment"
          value={fulfillment}
          onChange={setFulfillment}
          options={[
            { value: "PICKUP", label: "Lấy tại quầy" },
            { value: "DELIVERY", label: `Giao (trong ${orderRules.deliveryRadiusKm} km)` },
          ]}
        />
        {fulfillment === "DELIVERY" ? (
          <Textarea
            id="deliveryAddress"
            name="deliveryAddress"
            label="Địa chỉ giao hàng"
            hint={`Giao trong bán kính ${orderRules.deliveryRadiusKm} km quanh tiệm. Phí giao tiệm báo khi gọi.`}
            rows={2}
            required
            maxLength={300}
            {...errorProp(fieldErrors["deliveryAddress"])}
          />
        ) : null}
        <RadioGroup
          legend="Giờ muốn nhận"
          name="timing"
          value={timing}
          onChange={setTiming}
          options={[
            { value: "ASAP", label: "Sớm nhất có thể" },
            { value: "SCHEDULED", label: "Hẹn giờ" },
          ]}
        />
        {timing === "SCHEDULED" ? (
          <Input
            id="requestedAt"
            name="requestedAt"
            type="datetime-local"
            label="Giờ nhận (giờ Việt Nam)"
            hint={`Từ ${orderRules.minLeadMinutes} phút nữa đến ${orderRules.maxScheduleDays} ngày tới.`}
            min={minTime}
            max={maxTime}
            required
            {...errorProp(fieldErrors["requestedAt"])}
          />
        ) : null}
        <Textarea
          id="note"
          name="note"
          label="Ghi chú (không bắt buộc)"
          hint="Ví dụ: ít hành, không cay."
          rows={2}
          maxLength={500}
          {...errorProp(fieldErrors["note"])}
        />
      </section>

      {formError ? (
        <p role="alert" className="border border-danger bg-danger/5 p-4 font-medium text-danger">
          {formError}{" "}
          <a href={`tel:${shopConfig.phone}`} className="underline">
            Gọi tiệm
          </a>
        </p>
      ) : null}

      {/* Thanh gửi dính đáy điện thoại, nằm trên thanh liên hệ nổi */}
      <div className="fixed inset-x-0 bottom-[calc(3rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-border bg-bg/95 px-5 py-3 backdrop-blur-md md:static md:border md:bg-ink md:p-6 md:text-ivory">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-text-muted md:text-ivory/60">
            Tạm tính<span className="hidden sm:inline"> · giá tham khảo</span>
          </p>
          <p className="font-heading text-2xl tabular-nums text-primary md:text-3xl md:text-brass">
            {formatVND(total)}
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          disabled={!hasItems}
          className="shrink-0 whitespace-nowrap md:bg-brass md:text-ink md:hover:bg-ivory"
        >
          Gửi yêu cầu
        </Button>
      </div>
    </form>
  );
}

function errorProp(error: string | undefined) {
  return error ? { error } : {};
}

function RadioGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-3 rounded-button border px-5 transition-colors",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:border-text-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="accent-brass"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function OrderSuccess({ receipt }: { receipt: Receipt }) {
  const now = new Date();
  const next = isOpenAt(now) ? null : nextOpenTime(now);
  return (
    <section
      aria-live="polite"
      className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-border bg-surface px-6 py-12 text-center shadow-card sm:px-12"
    >
      <p className="eyebrow">Cảm ơn bạn</p>
      <h2 className="text-4xl text-primary sm:text-5xl">Đã gửi yêu cầu</h2>
      <p className="text-lg">
        {receipt.isOpenNow || !next
          ? "Tiệm sẽ gọi lại cho bạn để xác nhận."
          : `Tiệm đang đóng cửa, sẽ gọi lại cho bạn khi mở cửa (lúc ${formatVietnamClock(next)}).`}
      </p>
      <p className="text-text-muted">
        Mã yêu cầu <strong className="text-text">{receipt.code}</strong> · tạm tính{" "}
        {formatVND(receipt.estimatedTotal)} (giá tham khảo, chốt khi tiệm gọi).
      </p>
      <p className="text-text-muted">
        Cần gấp? Gọi{" "}
        <a href={`tel:${shopConfig.phone}`} className="font-semibold text-primary underline">
          {formatPhoneDisplay(shopConfig.phone)}
        </a>
        .
      </p>
    </section>
  );
}
