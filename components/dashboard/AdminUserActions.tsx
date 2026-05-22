"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import { toggleUserBlockAction } from "@/actions/admin-settings";

type Props = {
  userId: string;
  currentStatus: "ACTIVE" | "PENDING_VERIFICATION" | "BLOCKED";
};

export default function AdminUserActions({ userId, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBlocked = currentStatus === "BLOCKED";

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserBlockAction(userId);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className={[
          "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
          isBlocked
            ? "border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
        ].join(" ")}
      >
        {isBlocked ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
        {isBlocked ? "Разблокировать" : "Заблокировать"}
      </button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setError(null); }}
        title={isBlocked ? "Разблокировать пользователя?" : "Заблокировать пользователя?"}
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-body">
            {isBlocked
              ? "Пользователь снова получит полный доступ к платформе."
              : "Пользователь потеряет доступ к платформе. Это действие можно отменить."}
          </p>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className={[
                "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
              ].join(" ")}
            >
              {isPending ? "Сохраняем..." : isBlocked ? "Разблокировать" : "Заблокировать"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="flex-1 rounded-xl border border-dash-border py-2.5 text-sm font-semibold text-dash-muted transition-colors hover:bg-dash-bg"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
