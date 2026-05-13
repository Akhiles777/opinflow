import { cache } from "react";
import { readFileSync } from "node:fs";
import path from "node:path";

export type LegalDocumentMeta = {
  slug: string;
  title: string;
  fileName: string;
  description: string;
};

export const legalDocuments = [
  {
    slug: "personal-data-policy",
    title: "Политика в отношении обработки персональных данных",
    fileName: "Политика в отношении обработки персональных данных.txt",
    description: "Порядок, цели и условия обработки персональных данных пользователей платформы.",
  },
  {
    slug: "personal-data-consent",
    title: "Согласие на обработку персональных данных",
    fileName: "Согласие на обработку персональных данных.txt",
    description: "Согласие пользователя на обработку персональных данных при использовании сервиса.",
  },
  {
    slug: "user-agreement",
    title: "Пользовательское соглашение",
    fileName: "Пользовательское соглашение.txt",
    description: "Общие правила использования сайта и сервисов платформы.",
  },
  {
    slug: "respondent-offer",
    title: "Публичная оферта для Респондента",
    fileName: "Публичная оферта для Респондента.txt",
    description: "Условия участия респондентов в опросах и получения вознаграждений.",
  },
  {
    slug: "client-offer",
    title: "Публичная оферта для Заказчика",
    fileName: "Публичная оферта для Заказчика.txt",
    description: "Условия заказа маркетинговых исследований через платформу.",
  },
  {
    slug: "cookies",
    title: "Политика использования файлов cookie",
    fileName: "Политика обработки файлов cookie.txt",
    description: "Какие cookie использует сайт и как пользователь может ими управлять.",
  },
  {
    slug: "review-consent",
    title: "Согласие на публикацию отзыва",
    fileName: "Согласие на публикацию отзыва.txt",
    description: "Условия публикации отзывов, имени, города и приложенных материалов пользователя.",
  },
] satisfies LegalDocumentMeta[];

export function getLegalDocumentMeta(slug: string) {
  return legalDocuments.find((document) => document.slug === slug) ?? null;
}

export const getLegalDocument = cache((slug: string) => {
  const meta = getLegalDocumentMeta(slug);

  if (!meta) {
    return null;
  }

  const filePath = path.join(process.cwd(), "docs", meta.fileName);
  const content = readFileSync(filePath, "utf8");

  return { ...meta, content };
});
