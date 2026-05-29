import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { num: "25 000+", label: "проверенных респондентов" },
  { num: "87%", label: "качество данных" },
  { num: "15+", label: "категорий аудитории" },
  { num: "3–15", label: "минут на опрос" },
];

export default function StatsBar() {
  return (
    <section className="bg-white py-14 lg:py-20 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-manrope text-[40px] sm:text-[52px] font-[800] tracking-[-2px] text-[#6438D9] leading-none">{s.num}</div>
                <div className="mt-2 text-[14px] lg:text-[15px] text-[#6B5F9E] leading-[1.4]">{s.label}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
