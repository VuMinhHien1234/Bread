import { z } from "zod";
import { honeypotFields, phoneSchema, requiredText } from "./common";

const optionalPhone = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value === "" || value == null ? null : value))
  .pipe(phoneSchema.nullable());

const optionalEmail = z
  .string()
  .trim()
  .max(120, "Email tối đa 120 ký tự.")
  .nullish()
  .transform((value) => (value === "" || value == null ? null : value))
  .pipe(z.email("Email chưa đúng.").nullable());

export const contactSchema = z
  .object({
    name: requiredText("Tên", 2, 80),
    phone: optionalPhone,
    email: optionalEmail,
    message: requiredText("Nội dung", 10, 1000),
    ...honeypotFields,
  })
  .superRefine((value, ctx) => {
    if (value.phone === null && value.email === null) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Vui lòng để lại số điện thoại hoặc email để tiệm liên lạc.",
      });
    }
  });

export type ContactInput = z.output<typeof contactSchema>;
