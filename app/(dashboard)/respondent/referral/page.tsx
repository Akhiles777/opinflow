import PageHeader from "@/components/dashboard/PageHeader";
import { formatRub, getRespondentReferralData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";
import CopyButton from "@/components/dashboard/CopyButton";

type Row = {
  name: string;
  date: string;
  bonus: string;
};

export default async function RespondentReferralPage() {
  const session = await requireRole("RESPONDENT");
  const data = await getRespondentReferralData(session.user.id);
  const rows: Row[] = data.referrals.map((item) => ({
    name: item.name,
    date: item.date,
    bonus: formatRub(item.bonus),
  }));

  return (
    <div>
      <PageHeader title="Рефералы" subtitle="Ссылка, статистика и приглашённые пользователи." />

      {/* Top row: link card + 3 stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
        {/* Referral link card */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
          <h2 className="text-[17px] font-semibold text-dash-heading">Ваша реферальная ссылка</h2>
          <p className="mt-1 text-[13px] text-dash-muted">Отправляйте ссылку друзьям и получайте вознаграждения.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={`https://opinflow-xi.vercel.app/register?ref=${data.referralCode}`}
              className="h-11 min-w-0 flex-1 rounded-xl border border-dash-border bg-dash-bg px-4 text-[14px] text-dash-body"
            />
            <CopyButton text={`https://opinflow-xi.vercel.app/register?ref=${data.referralCode}`} />
          </div>
        </div>

        {/* 3 stat mini-cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Приглашено", value: String(data.invitedCount), icon: "/cabinets/icons/sidebar/menu icon_referal 20px.svg" },
            { label: "Зарегистрировалось", value: String(data.registeredCount), icon: "/cabinets/icons/sidebar/menu icon_users 20px.svg" },
            { label: "Заработано", value: formatRub(data.earned), icon: "/cabinets/icons/sidebar/menu icon_money 20px.svg" },
          ].map((s) => (
            <div key={s.label} className="min-w-30 rounded-[18px] border border-dash-border bg-dash-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE8FF] dark:bg-[#6D3AE2]/20">
                <img src={s.icon} alt="" width={20} height={20} className="h-5 w-5" style={{ filter: "invert(28%) sepia(64%) saturate(970%) hue-rotate(243deg) brightness(80%) contrast(95%)" }} />
              </div>
              <p className="text-[24px] font-bold tabular-nums text-dash-heading">{s.value}</p>
              <p className="mt-1 text-[13px] text-dash-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invited table */}
      <div className="mt-6 rounded-[18px] border border-dash-border bg-dash-card">
        <div className="border-b border-dash-border px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold text-dash-heading">Приглашённые</h2>
            {rows.length > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dash-bg text-[12px] font-semibold text-dash-muted">
                {rows.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-dash-muted">Список пользователей, зарегистрировавшихся по вашей ссылке.</p>
        </div>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dash-border bg-dash-bg/40">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">ФИО</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Дата</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Заработано</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                {rows.map((r) => (
                  <tr key={r.name + r.date} className="transition-colors hover:bg-dash-bg/30">
                    <td className="px-6 py-4 text-[15px] font-medium text-dash-body">{r.name}</td>
                    <td className="px-6 py-4 text-[13px] text-dash-body">{r.date}</td>
                    <td className="px-6 py-4 text-[14px] font-semibold tabular-nums text-dash-body">{r.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex min-h-45 items-center justify-center rounded-xl border-2 border-dashed border-dash-border p-6 text-center">
              <p className="text-[14px] text-dash-muted">
                Вы ещё никого не пригласили. Поделитесь ссылкой с друзьями.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
