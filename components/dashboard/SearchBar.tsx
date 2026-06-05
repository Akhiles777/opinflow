"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Clock, FileText, User, LayoutDashboard, CheckCircle, X, ArrowRight, Loader2 } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
};

type SearchGroup = {
  label: string;
  type: string;
  results: SearchResult[];
};

const RECENT_KEY = "dash_recent_searches_v1";
const MAX_RECENT = 6;

function getRecent(): string[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const list = getRecent().filter((r) => r !== q);
    list.unshift(q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {}
}

function deleteRecent(q: string) {
  try {
    const list = getRecent().filter((r) => r !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

function clearAllRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[#6D3AE2]/15 px-0.5 font-semibold text-[#6438D9] dark:bg-[#A98BFF]/20 dark:text-[#C4B0FF] not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function TypeIcon({ type, active }: { type: string; active: boolean }) {
  const cls = "h-4 w-4";
  const color = active ? "text-[#6D3AE2] dark:text-[#A98BFF]" : "text-dash-muted";
  if (type === "page") return <LayoutDashboard className={`${cls} ${color}`} />;
  if (type === "user") return <User className={`${cls} ${color}`} />;
  if (type === "completed") return <CheckCircle className={`${cls} ${color}`} />;
  return <FileText className={`${cls} ${color}`} />;
}

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on click outside
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setRecent(getRecent());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups ?? []);
      }
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(value), 280);
  }

  function handleFocus() {
    setRecent(getRecent());
    setOpen(true);
    setActiveIdx(-1);
  }

  function clear() {
    setQuery("");
    setGroups([]);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  function navigate(href: string, searchQuery?: string) {
    if (searchQuery?.trim()) saveRecent(searchQuery.trim());
    setOpen(false);
    setQuery("");
    setGroups([]);
    router.push(href);
  }

  // Flatten results for keyboard nav
  const allResults = groups.flatMap((g) => g.results);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (query) {
        clear();
      } else {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (!open) return;

    const isResults = query.trim().length > 0;
    const items = isResults ? allResults : recent;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isResults) {
        if (activeIdx >= 0 && activeIdx < allResults.length) {
          navigate(allResults[activeIdx].href, query);
        } else if (query.trim()) {
          navigate(`${pathname}?q=${encodeURIComponent(query.trim())}`, query.trim());
        }
      } else {
        if (activeIdx >= 0 && activeIdx < recent.length) {
          const r = recent[activeIdx];
          setQuery(r);
          handleChange(r);
        }
      }
    }
  }

  const showRecent = open && !query.trim() && recent.length > 0;
  const showResults = open && query.trim().length > 0;
  const showEmpty = showResults && !loading && groups.length === 0;
  const showDropdown = showRecent || showResults;
  const total = groups.reduce((s, g) => s + g.results.length, 0);

  return (
    <div ref={wrapRef} className="relative w-full max-w-[460px]">
      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div
        className={[
          "flex h-10 items-center gap-2 rounded-full border px-4 transition-all duration-200",
          open
            ? "border-[#6D3AE2]/50 bg-dash-card shadow-[0_0_0_3px_rgba(109,58,226,0.08)]"
            : "border-dash-border bg-dash-card/60",
          "dark:bg-white/[0.07]",
        ].join(" ")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#6D3AE2]" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-dash-muted" />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Поиск по кабинету"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-dash-body placeholder:text-dash-muted outline-none"
        />

        <div className="flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); clear(); }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-dash-border text-dash-muted transition-colors hover:bg-[#6D3AE2]/15 hover:text-[#6D3AE2]"
              aria-label="Очистить"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-dash-border px-1.5 py-0.5 text-[10px] font-medium text-dash-muted lg:block">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Dropdown ────────────────────────────────────────────────────────── */}
      {showDropdown && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[340px] overflow-hidden rounded-[18px] border border-dash-border bg-dash-card shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

          {/* Recent searches */}
          {showRecent && (
            <div className="p-2">
              <div className="mb-1 flex items-center justify-between px-3 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-dash-muted">
                  Недавние поиски
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); clearAllRecent(); setRecent([]); }}
                  className="text-[11px] text-dash-muted transition-colors hover:text-dash-heading"
                >
                  Очистить
                </button>
              </div>
              {recent.map((r, i) => (
                <div
                  key={r}
                  onMouseDown={() => { setQuery(r); handleChange(r); }}
                  className={[
                    "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    activeIdx === i ? "bg-[#6D3AE2]/10" : "hover:bg-dash-bg",
                  ].join(" ")}
                >
                  <Clock className="h-4 w-4 shrink-0 text-dash-muted" />
                  <span className="flex-1 text-[13px] text-dash-body">{r}</span>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      deleteRecent(r);
                      setRecent(getRecent());
                    }}
                    className="opacity-0 text-dash-muted transition-all group-hover:opacity-100 hover:text-dash-heading"
                    aria-label="Удалить"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <div className="mt-2 border-t border-dash-border px-3 pt-2 pb-1">
                <p className="text-[11px] text-dash-muted/60">Начните вводить для поиска</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {showResults && loading && groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#6D3AE2]/50" />
              <p className="text-[13px] text-dash-muted">Ищем...</p>
            </div>
          )}

          {/* Empty */}
          {showEmpty && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dash-bg">
                <Search className="h-5 w-5 text-dash-muted/40" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-dash-heading">Ничего не найдено</p>
                <p className="mt-0.5 text-[12px] text-dash-muted">
                  По запросу «{query}» результатов нет
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && groups.length > 0 && (
            <div className="p-2">
              <div className="mb-1 flex items-center justify-between px-3 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-dash-muted">
                  Результаты {total > 0 && `(${total})`}
                </span>
                <span className="hidden text-[10px] text-dash-muted/50 sm:block">
                  ↑↓ навигация · Enter выбор · Esc закрыть
                </span>
              </div>

              {groups.map((group, gi) => {
                const offset = groups.slice(0, gi).reduce((s, g) => s + g.results.length, 0);
                return (
                  <div key={group.label} className={gi > 0 ? "mt-1.5 border-t border-dash-border pt-1.5" : ""}>
                    <p className="mb-1 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dash-muted/70">
                      {group.label}
                    </p>
                    {group.results.map((result, ri) => {
                      const flatIdx = offset + ri;
                      const active = activeIdx === flatIdx;
                      return (
                        <div
                          key={result.id + ri}
                          onMouseDown={() => navigate(result.href, query)}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                          className={[
                            "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                            active ? "bg-[#6D3AE2]/10" : "hover:bg-dash-bg",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                              active
                                ? "bg-[#6D3AE2]/15 text-[#6438D9] dark:text-[#A98BFF]"
                                : "bg-dash-bg text-dash-muted",
                            ].join(" ")}
                          >
                            <TypeIcon type={group.type} active={active} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-dash-body">
                              <Highlight text={result.title} query={query} />
                            </p>
                            {result.subtitle && (
                              <p className="truncate text-[11px] text-dash-muted">{result.subtitle}</p>
                            )}
                          </div>
                          <ArrowRight
                            className={[
                              "h-3.5 w-3.5 shrink-0 transition-opacity",
                              active ? "opacity-60 text-[#6D3AE2]" : "opacity-20 text-dash-muted",
                            ].join(" ")}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: "show all" */}
          {showResults && total > 0 && (
            <div className="border-t border-dash-border px-4 py-2.5">
              <button
                type="button"
                onMouseDown={() => navigate(`${pathname}?q=${encodeURIComponent(query.trim())}`, query.trim())}
                className="flex w-full items-center justify-between text-[12px] text-dash-muted transition-colors hover:text-dash-body"
              >
                <span>
                  Все результаты для{" "}
                  <span className="font-medium text-dash-body">«{query}»</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
