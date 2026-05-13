import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { legalDocuments } from "@/lib/legal-docs";

export const metadata = {
  title: "Юридические документы — ПотокМнений",
  description: "Пользовательские соглашения, оферты, согласия и политики платформы ПотокМнений.",
};

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen bg-site-bg text-site-body">
      <Header />
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-site-body/80 dark:text-site-body">
              Документы
            </p>
            <h1 className="mt-4 font-display text-4xl text-site-heading sm:text-5xl">
              Юридическая информация
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-site-body/85 dark:text-site-body">
              Здесь собраны документы, регулирующие использование платформы, обработку персональных данных,
              участие респондентов, работу заказчиков и использование cookie.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {legalDocuments.map((document) => (
              <Link
                key={document.slug}
                href={`/legal/${document.slug}`}
                className="rounded-2xl border border-site-border bg-site-card p-6 transition-colors hover:border-brand/30 hover:bg-site-section"
              >
                <h2 className="font-display text-xl text-site-heading">{document.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-site-body/80 dark:text-site-body">
                  {document.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
