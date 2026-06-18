import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Manrope } from "next/font/google";
import Script from "next/script";
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

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ПотокМнений — платформа маркетинговых исследований",
  description:
    "Платформа для платных опросов, таргетинга аудитории и AI-аналитики с быстрыми выплатами.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ПотокМнений",
    statusBarStyle: "black-translucent",
  },
  icons: {
    shortcut: "/favicon.ico",
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  verification: {
    yandex: "5cd4001813a70d29",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109840375', 'ym');

            ym(109840375, 'init', {
              ssr: true,
              webvisor: true,
              clickmap: true,
              ecommerce: "dataLayer",
              accurateTrackBounce: true,
              trackLinks: true
            });
          `}
        </Script>
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} bg-site-bg text-site-body antialiased`}
        suppressHydrationWarning
      >
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/109840375" style={{position:"absolute", left:"-9999px"}} alt="" />
          </div>
        </noscript>
        <Providers>
          <ServiceWorkerRegister />
          {children}
          <CookieNotice />
        </Providers>
      </body>
    </html>
  );
}
