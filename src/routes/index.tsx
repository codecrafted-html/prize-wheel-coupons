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
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
                <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-foreground drop-shadow" />
              </div>
              <div
                className="relative h-full w-full rounded-full shadow-2xl ring-8 ring-card"
                style={{
                  background: `conic-gradient(
                    oklch(0.85 0.13 75) 0deg 45deg,
                    oklch(0.72 0.16 230) 45deg 90deg,
                    oklch(0.74 0.17 145) 90deg 135deg,
                    oklch(0.68 0.22 25) 135deg 180deg,
                    oklch(0.85 0.13 75) 180deg 225deg,
                    oklch(0.72 0.16 230) 225deg 270deg,
                    oklch(0.74 0.17 145) 270deg 315deg,
                    oklch(0.68 0.22 25) 315deg 360deg
                  )`,
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`div-${i}`}
                    className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-white/70"
                    style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
                  />
                ))}
                {["🍦", "🥤", "🥗", "💰", "🍦", "🥤", "🥗", "💰"].map((e, i) => (
                  <div
                    key={`emoji-${i}`}
                    className="absolute left-1/2 top-1/2 text-3xl"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${i * 45 + 22.5}deg) translateY(-95px)`,
                    }}
                  >
                    <span className="block">{e}</span>
                  </div>
                ))}
                <div className="absolute left-1/2 top-1/2 z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-xl ring-4 ring-card" />
              </div>
            </div>
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
