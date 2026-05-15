import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/theme/Providers";
import CookieNotice from "@/components/legal/CookieNotice";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

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
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} ${inter.variable} bg-site-bg text-site-body antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <CookieNotice />
        </Providers>
      </body>
    </html>
  );
}
