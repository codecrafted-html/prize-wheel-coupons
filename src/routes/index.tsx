import { createFileRoute } from "@tanstack/react-router";
import { PRIZES } from "@/lib/prizes";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Poké-Loco Spin & Win — Draai en win!" },
      {
        name: "description",
        content:
          "Draai aan het rad en maak kans op een gratis ijsje, gratis soda, gratis poke bowl of 50% korting bij Poké-Loco.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-center">
        <Logo className="h-24 w-auto md:h-28" />
      </header>

      <section className="mt-12 grid items-center gap-12 md:mt-16 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
            🌿 Spin & Win
          </span>
          <h1 className="mt-5 text-5xl leading-[1.05] text-balance md:text-6xl">
            Draai aan het rad.
            <br />
            <span className="text-primary">Win iets lekkers.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground text-balance">
            Heb je een unieke link gekregen? Open hem, draai aan het rad en
            ontvang meteen je couponcode op je scherm.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:max-w-md">
            {PRIZES.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 backdrop-blur"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-sm font-medium">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[color:var(--lime)]/45 to-[color:var(--ocean)]/25 blur-2xl"
          />
          <div className="relative rounded-[2.5rem] border border-border/60 bg-card/80 p-8 backdrop-blur">
            <div className="aspect-square w-full rounded-full bg-gradient-to-br from-primary via-[color:var(--lime)] to-[color:var(--ocean)] shadow-2xl" />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Eén link · één draai · één prijs
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto pt-20 text-center text-xs text-muted-foreground">
        © Poké-Loco · Crazy Healthy &amp; Delicious
      </footer>
    </main>
  );
}
