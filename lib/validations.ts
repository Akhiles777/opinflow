import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Имя должно быть не короче 2 символов"),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
    confirmPassword: z.string(),
    role: z.enum(["RESPONDENT", "CLIENT"]),
    acceptTerms: z.string().optional(),
  })
  .refine((data) => data.acceptTerms === "on", {
    message: "Подтвердите согласие с условиями использования",
    path: ["acceptTerms"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Введите корректный email"),
});

export const respondentProfileSchema = z.object({
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  income: z.enum(["under30k", "30-60k", "60-100k", "over100k"]).nullable().optional(),
  education: z.enum(["school", "college", "bachelor", "master", "phd"]).nullable().optional(),
  interests: z.array(z.string().min(1)).max(20),
});

export const clientProfileSchema = z.object({
  companyName: z.string().trim().max(160).nullable().optional(),
  inn: z.string().trim().max(20).nullable().optional(),
  contactName: z.string().trim().max(160).nullable().optional(),
  email: z.string().email("Введите корректный email").nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(30).nullable().optional(),
  legalAddress: z.string().trim().max(255).nullable().optional(),
  bankName: z.string().trim().max(160).nullable().optional(),
  bankAccount: z.string().trim().max(40).nullable().optional(),
  bankBik: z.string().trim().max(20).nullable().optional(),
});
