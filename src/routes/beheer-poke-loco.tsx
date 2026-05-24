import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PRIZES, prizeMeta, type Prize } from "@/lib/prizes";
import { Logo } from "@/components/Logo";

// 🔒 Privé beheerpagina — het wachtwoord wordt server-side gevalideerd
// door de Supabase RPC `admin_list_spin_links`. Er staat geen wachtwoord
// in de client-bundle.
const STORAGE_KEY = "pl-admin-pwd";

export const Route = createFileRoute("/beheer-poke-loco")({
  ssr: false,
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Beheer · Poké-Loco" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

interface Row {
  slug: string;
  prize: Prize;
  claimed: boolean;
  email: string | null;
  coupon_code: string | null;
  created_at: string;
}

function AdminPage() {
  const [pwd, setPwd] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setPwd(saved);
    }
  }, []);

  async function tryLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;
    setSubmitting(true);
    // Server-side validatie: roep de RPC één keer aan; bij verkeerd wachtwoord
    // gooit Postgres "unauthorized". Geen client-side wachtwoord vergelijking.
    const { error } = await supabase.rpc("admin_list_spin_links", {
      _passphrase: input,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Verkeerd wachtwoord");
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, input);
    setPwd(input);
  }

  if (!pwd) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={tryLogin}
          className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-xl"
        >
          <Logo className="mx-auto h-20 w-auto" />
          <h1 className="mt-4 font-display text-2xl">Beheerderspagina</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voer je wachtwoord in om door te gaan.
          </p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Wachtwoord"
            className="mt-6 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2"
          />
          <button
            disabled={submitting}
            className="mt-3 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Bezig…" : "Inloggen"}
          </button>
        </form>
      </main>
    );
  }

  return <AdminInner passphrase={pwd} onLogout={() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPwd(null);
    setInput("");
  }} />;
}

function AdminInner({ onLogout }: { onLogout: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Prize>("all");
  const [showClaimed, setShowClaimed] = useState<"all" | "open" | "claimed">("open");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_spin_links", {
        _passphrase: ADMIN_PASSWORD,
      });
      if (error) toast.error(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filter !== "all" && r.prize !== filter) return false;
        if (showClaimed === "open" && r.claimed) return false;
        if (showClaimed === "claimed" && !r.claimed) return false;
        return true;
      }),
    [rows, filter, showClaimed],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const claimed = rows.filter((r) => r.claimed).length;
    return { total, claimed, open: total - claimed };
  }, [rows]);

  function copyAll() {
    const text = filtered.map((r) => `${origin}/spin/${r.slug}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`${filtered.length} links gekopieerd`);
  }

  function copyCouponsFor(prize: Prize | "all") {
    const codes = rows
      .filter((r) => r.coupon_code && (prize === "all" || r.prize === prize))
      .map((r) => r.coupon_code!) ;
    if (codes.length === 0) {
      toast.error("Geen coupons gevonden");
      return;
    }
    navigator.clipboard.writeText(codes.join("\n"));
    const m = prize === "all" ? "alle prijzen" : prizeMeta(prize).label;
    toast.success(`${codes.length} coupons gekopieerd (${m})`);
  }

  function downloadCsv() {
    const header = "url,prize,claimed,email,coupon_code\n";
    const body = rows
      .map(
        (r) =>
          `${origin}/spin/${r.slug},${r.prize},${r.claimed},${r.email ?? ""},${r.coupon_code ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pokeloco-spin-links.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo className="h-16 w-auto" />
          <div>
            <h1 className="font-display text-3xl">Campagnelinks</h1>
            <p className="text-sm text-muted-foreground">
              Eén link = één draaibeurt.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Kopieer zichtbare links
          </button>
          <button
            onClick={downloadCsv}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            Download CSV
          </button>
          <button
            onClick={onLogout}
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Uitloggen
          </button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Totaal" value={stats.total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Geclaimd" value={stats.claimed} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Kopieer couponcodes
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => copyCouponsFor("all")}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Alle coupons
          </button>
          {PRIZES.map((p) => (
            <button
              key={p.key}
              onClick={() => copyCouponsFor(p.key)}
              className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-accent"
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </div>



      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Alle prijzen
        </Chip>
        {PRIZES.map((p) => (
          <Chip
            key={p.key}
            active={filter === p.key}
            onClick={() => setFilter(p.key)}
          >
            {p.emoji} {p.label}
          </Chip>
        ))}
        <span className="mx-2 w-px self-stretch bg-border" />
        <Chip active={showClaimed === "all"} onClick={() => setShowClaimed("all")}>
          Alles
        </Chip>
        <Chip active={showClaimed === "open"} onClick={() => setShowClaimed("open")}>
          Open
        </Chip>
        <Chip active={showClaimed === "claimed"} onClick={() => setShowClaimed("claimed")}>
          Geclaimd
        </Chip>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Laden…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Prijs</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Coupon</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const url = `${origin}/spin/${r.slug}`;
                const m = prizeMeta(r.prize);
                return (
                  <tr key={r.slug} className="border-t border-border">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="mr-1">{m.emoji}</span>
                      {m.label}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          toast.success("Link gekopieerd");
                        }}
                        className="font-mono text-xs text-primary hover:underline"
                        title={url}
                      >
                        /spin/{r.slug}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {r.claimed ? (
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          Geclaimd
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.coupon_code ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Geen links gevonden voor deze filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
