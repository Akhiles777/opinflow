type Props = {
  label?: string;
};

export default function RouteLoading({ label = "Загружаем страницу..." }: Props) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white shadow-card sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-brand/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand border-r-brand-light" />
            <div className="absolute inset-2 rounded-full bg-brand/10" />
          </div>
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.24em] text-white/35">ПотокМнений</p>
            <p className="mt-2 text-base font-medium leading-relaxed text-white/80">{label}</p>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-brand via-brand-light to-white/80" />
        </div>
      </div>
    </div>
  );
}
