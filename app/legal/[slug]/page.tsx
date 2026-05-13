import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getLegalDocument, getLegalDocumentMeta, legalDocuments } from "@/lib/legal-docs";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalDocuments.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const document = getLegalDocumentMeta(slug);

  if (!document) {
    return {
      title: "Документ не найден — ПотокМнений",
    };
  }

  return {
    title: `${document.title} — ПотокМнений`,
    description: document.description,
  };
}

export default async function LegalDocumentPage({ params }: Props) {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  if (!document) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-site-bg text-site-body">
      <Header />
      <article className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/legal" className="text-sm font-semibold text-brand transition-colors hover:text-brand-light">
            ← Все документы
          </Link>

          <div className="mt-8 rounded-3xl border border-site-border bg-site-card p-6 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-site-body/80 dark:text-site-body">
              Юридический документ
            </p>
            <h1 className="mt-4 font-display text-3xl text-site-heading sm:text-4xl">
              {document.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-site-body/80 dark:text-site-body">
              {document.description}
            </p>

            <div className="mt-8 border-t border-site-border pt-8">
              <pre className="whitespace-pre-wrap break-words font-body text-[15px] leading-7 text-site-body">
                {document.content}
              </pre>
            </div>
          </div>
        </div>
      </article>
      <Footer />
    </main>
  );
}
