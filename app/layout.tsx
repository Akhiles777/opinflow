import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ПотокМнений — платформа маркетинговых исследований",
  description:
    "Платформа для платных опросов, таргетинга аудитории и AI-аналитики с быстрыми выплатами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${syne.variable} ${inter.variable} bg-surface-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
