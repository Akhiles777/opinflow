import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "И мы Сервиные, как и другие реалии массового рынка, понимаем, что сейчас разработчики просто перегорают. И от того и хотелось бы узнать про сегментирование потребителей и то как конкуренция вынуждает улучшать потребительский опыт и то, как и для чего можно использовать это исследование.",
    author: "Галина Елизавета",
    role: "Маркетолог",
    company: "Adobe",
    image: null,
  },
  {
    quote:
      "Запуск и всё прочие там по линии сбудется благодаря нарастающей потребности масштабирования систем отслеживания пользователей. UX-теплые продажи и исследования профессионального рынка.",
    author: "Михаил Дмитрий",
    role: "Product Manager",
    company: "Яндекс",
    image: null,
  },
];

const caseStudy = {
  title: "Как бренд X сэкономил 500 000 ₽ на исследовании",
  description:
    "Для комплексного и всегда там находящейся коммуникационной модели. Проекты и интересующие связи от корпоративных единиц между нами для того чтобы каждому было по заслугам. По масштабам результатов обсуждения перед этим и модулей.",
  author: "Курдюков Ярослав",
  role: "CEO",
  image: null,
};

const companies = [
  { name: "Adobe", logo: null },
  { name: "S7", logo: null },
  { name: "Яндекс", logo: "/yandexAuth.png" },
];

const stats = [
  { value: "800+", label: "проведённых исследований по всей России" },
  { value: "15+", label: "лет суммарного опыта команды" },
];

export default function Testimonials() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading mb-12 lg:mb-16">
            Нам доверяют
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* First testimonial - spans 2 columns */}
          <RevealOnScroll className="lg:col-span-2">
            <div className="bg-site-bg rounded-2xl p-6 lg:p-8 h-full border border-site-border">
              <p className="text-site-body leading-relaxed mb-6">
                {testimonials[0].quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold">
                  {testimonials[0].author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-site-heading">
                    {testimonials[0].author}
                  </p>
                  <p className="text-sm text-site-muted">{testimonials[0].role}</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Second testimonial */}
          <RevealOnScroll delay={100}>
            <div className="bg-site-bg rounded-2xl p-6 lg:p-8 h-full border border-site-border">
              <p className="text-site-body leading-relaxed mb-6">
                {testimonials[1].quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  {testimonials[1].author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-site-heading">
                    {testimonials[1].author}
                  </p>
                  <p className="text-sm text-site-muted">{testimonials[1].role}</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Stats and companies */}
          <RevealOnScroll delay={150}>
            <div className="bg-site-bg rounded-2xl p-6 lg:p-8 border border-site-border">
              <div className="space-y-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-4xl font-bold text-brand">
                      {stat.value}
                    </p>
                    <p className="text-sm text-site-muted mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-site-border">
                <p className="text-xs text-site-muted uppercase tracking-wider mb-4">
                  Нам доверяют
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  {companies.map((company) =>
                    company.logo ? (
                      <Image
                        key={company.name}
                        src={company.logo}
                        alt={company.name}
                        width={80}
                        height={32}
                        className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <span
                        key={company.name}
                        className="text-sm font-semibold text-site-muted"
                      >
                        {company.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Case study - spans 2 columns */}
          <RevealOnScroll delay={200} className="lg:col-span-2">
            <div className="bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl p-6 lg:p-8 border border-brand/20">
              <h3 className="font-display text-xl font-bold text-site-heading mb-4">
                {caseStudy.title}
              </h3>
              <p className="text-site-body leading-relaxed mb-6">
                {caseStudy.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold">
                  {caseStudy.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-site-heading">
                    {caseStudy.author}
                  </p>
                  <p className="text-sm text-site-muted">{caseStudy.role}</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
