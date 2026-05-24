import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SpinWheel } from "@/components/SpinWheel";
import { Logo } from "@/components/Logo";
import { prizeMeta, type Prize } from "@/lib/prizes";

export const Route = createFileRoute("/spin/$slug")({
  ssr: false,
  component: SpinPage,
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-4xl">Link niet gevonden</h1>
        <p className="mt-3 text-muted-foreground">
          Controleer of je de juiste link hebt geopend.
        </p>
      </div>
    </main>
  ),
  head: () => ({ meta: [{ title: "Spin & Win — Poké-Loco" }] }),
});

type Stage = "intro" | "spinning" | "email" | "done";

interface LinkRow {
  slug: string;
  prize: Prize;
  claimed: boolean;
}

function SpinPage() {
  const { slug } = Route.useParams();
  const [link, setLink] = useState<LinkRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_spin_link", { _slug: slug });
      if (error) {
        setLoadError(error.message);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setLoadError("not_found");
        return;
      }
      setLink(row as LinkRow);
      if (row.claimed) setStage("done");
    })();
  }, [slug]);

  if (loadError === "not_found") {
    throw notFound();
  }

  if (!link) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-muted-foreground">
        Laden…
      </main>
    );
  }

  const prize = link.prize;
  const meta = prizeMeta(prize);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !link) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("claim_prize", {
      _slug: link.slug,
      _email: email.trim(),
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message.includes("invalid_email")
        ? "Ongeldig e-mailadres."
        : error.message.includes("link_not_found")
        ? "Deze link bestaat niet."
        : "Er ging iets mis. Probeer opnieuw.";
      toast.error(msg);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setCoupon(row?.coupon_code ?? null);
    setStage("done");
    toast.success("Gefeliciteerd! 🎉");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <a href="/" className="self-start">
        <Logo className="h-16 w-auto" />
      </a>

      <div className="mt-8 flex-1">
        {stage === "intro" && (
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-5xl">
              Klaar om te draaien?
            </h1>
            <p className="mt-3 text-muted-foreground">
              Deze link is voor jou alleen — je kan maar één keer draaien.
            </p>
            <div className="mt-8">
              <SpinWheel targetPrize={prize} spinning={false} onDone={() => {}} />
            </div>
            <button
              onClick={() => setStage("spinning")}
              className="mt-10 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:scale-[1.02] hover:bg-primary/90 active:scale-95"
            >
              🎯 DRAAI HET RAD
            </button>
          </div>
        )}

        {stage === "spinning" && (
          <div className="text-center">
            <h2 className="font-display text-3xl">Veel succes…</h2>
            <div className="mt-8">
              <SpinWheel
                targetPrize={prize}
                spinning={true}
                onDone={() => setStage("email")}
              />
            </div>
          </div>
        )}

        {stage === "email" && (
          <div className="mx-auto max-w-md text-center">
            <div className="text-6xl">{meta.emoji}</div>
            <h2 className="mt-4 font-display text-4xl">{meta.label}!</h2>
            <p className="mt-3 text-muted-foreground">{meta.description}</p>

            {prize === "no_win" || prize === "try_again" ? (
              <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center shadow-lg">
                <p className="text-sm text-muted-foreground">
                  Bedankt voor je deelname! Houd onze acties in de gaten via{" "}
                  <a
                    href="https://www.pokeloco.be/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline"
                  >
                    pokeloco.be
                  </a>
                  .
                </p>
                <button
                  onClick={async () => {
                    if (!link) return;
                    await supabase.rpc("claim_prize", {
                      _slug: link.slug,
                      _email: "no-win@pokeloco.local",
                    });
                    setStage("done");
                  }}
                  className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Sluiten
                </button>
              </div>
            ) : (

            <form
              onSubmit={handleClaim}
              className="mt-8 rounded-3xl border border-border bg-card p-6 text-left shadow-lg"
            >
              <label className="text-sm font-medium text-foreground">
                E-mail om je couponcode te ontvangen
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@email.com"
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-primary/40 focus:ring-2"
              />
              <button
                disabled={submitting}
                className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? "Bezig…" : "Claim mijn prijs"}
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                We gebruiken je mail enkel voor deze coupon.
              </p>
            </form>
            )}
          </div>

        )}

        {stage === "done" && (
          <div className="mx-auto max-w-md text-center">
            <div className="text-7xl">{meta.emoji}</div>
            <h2 className="mt-4 font-display text-4xl">{meta.label}</h2>
            <p className="mt-2 text-muted-foreground">{meta.description}</p>

            {prize === "no_win" || prize === "try_again" ? (
              <p className="mt-8 text-sm text-muted-foreground">
                Bedankt voor je deelname! Houd onze acties in de gaten via{" "}
                <a
                  href="https://www.pokeloco.be/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline"
                >
                  pokeloco.be
                </a>
                .
              </p>
            ) : (
              <>
                <div className="mt-8 rounded-3xl border-2 border-dashed border-primary/50 bg-card p-8 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Jouw couponcode
                  </p>
                  <p className="mt-3 select-all font-display text-3xl font-bold text-primary md:text-4xl">
                    {coupon ?? "—"}
                  </p>
                  <button
                    onClick={() => {
                      if (coupon) {
                        navigator.clipboard.writeText(coupon);
                        toast.success("Code gekopieerd!");
                      }
                    }}
                    className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Kopieer code
                  </button>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                  Toon deze code bij je volgende bestelling op{" "}
                  <a
                    href="https://www.pokeloco.be/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline"
                  >
                    pokeloco.be
                  </a>
                  .
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
