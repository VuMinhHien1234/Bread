"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { shopConfig } from "@/lib/shop-config";
import { createContactMessage } from "@/server/actions/public/create-contact-message";
import { Honeypot } from "./Honeypot";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  // Thời điểm mở form: server từ chối form gửi nhanh bất thường (bot)
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "");

    setIsSubmitting(true);
    setFormError(undefined);
    setFieldErrors({});
    const result = await createContactMessage({
      name: field("name"),
      phone: field("phone"),
      email: field("email"),
      message: field("message"),
      website: field("website"),
      startedAt,
    });
    setIsSubmitting(false);

    if (result.ok) {
      setSent(true);
      return;
    }
    setFormError(result.error);
    setFieldErrors(result.fieldErrors ?? {});
  }

  if (sent) {
    return (
      <p
        role="status"
        className="rounded-card border border-accent-green bg-surface p-5 text-lg font-medium text-accent-green"
      >
        Đã gửi tin nhắn. {shopConfig.name} sẽ liên lạc lại với bạn sớm nhất.
      </p>
    );
  }

  const errorOf = (name: string) => (fieldErrors[name] ? { error: fieldErrors[name] } : {});

  return (
    <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-4">
      <Honeypot />
      <Input
        id="name"
        name="name"
        label="Tên"
        autoComplete="name"
        required
        maxLength={80}
        {...errorOf("name")}
      />
      <Input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Số điện thoại"
        hint="Điền số điện thoại hoặc email (ít nhất một)."
        autoComplete="tel"
        {...errorOf("phone")}
      />
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        maxLength={120}
        {...errorOf("email")}
      />
      <Textarea
        id="message"
        name="message"
        label="Nội dung"
        required
        maxLength={1000}
        {...errorOf("message")}
      />
      {formError ? (
        <p role="alert" className="font-medium text-danger">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Gửi tin nhắn
      </Button>
    </form>
  );
}
