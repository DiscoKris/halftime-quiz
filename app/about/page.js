import Image from "next/image";
import Link from "next/link";

const STEPS = [
  {
    title: "Scan QR code",
    description:
      "Open MyHalftimeQuiz on your phone from the stadium screen, table tent, or event signage.",
  },
  {
    title: "Choose your game",
    description:
      "Find the live event you are attending and join the correct halftime quiz experience.",
  },
  {
    title: "Play during halftime",
    description:
      "Answer the same frozen question set as every other fan during the live halftime window.",
  },
  {
    title: "Check the leaderboard",
    description:
      "See where your score and time rank once the event leaderboard updates.",
  },
];

const SPORTS = [
  { name: "Soccer", icon: "/icons/soccer.png" },
  { name: "Football", icon: "/icons/football.png" },
  { name: "Basketball", icon: "/icons/basketball.png" },
  { name: "Hockey", icon: "/icons/hockey.png" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/sports-login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_35%),linear-gradient(180deg,rgba(10,10,10,0.55),rgba(10,10,10,0.92))]" />

        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <Image
                  src="/HQ25_logo.png"
                  alt="MyHalftimeQuiz"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  MyHalftimeQuiz.com
                </p>
                <p className="text-sm text-white/65">
                  Live sports trivia built for halftime moments
                </p>
              </div>
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Turn halftime into a live fan competition.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              MyHalftimeQuiz lets fans join a live event, answer a shared halftime quiz,
              and compete on the same leaderboard without slowing down under crowd traffic.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/choose"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Choose Your Game
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Log In
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {SPORTS.map((sport) => (
                <div
                  key={sport.name}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="relative h-8 w-8 shrink-0">
                    <Image src={sport.icon} alt={sport.name} fill className="object-contain" />
                  </div>
                  <span className="text-sm text-white/80">{sport.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              A simple live flow for fans in the stadium or at home.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="text-sm font-semibold text-emerald-300">
                  0{index + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Built For Events
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Stable for game day, simple for fans.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
              Public gameplay uses event-specific frozen question snapshots and lightweight
              leaderboard reads, so the fan experience stays fast even when everyone joins at once.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:w-[360px]">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/45">
              Ready To Play
            </p>
            <p className="mt-3 text-lg font-semibold">
              Join the next available event and compete during halftime.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/choose"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                View Live Events
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Player Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
