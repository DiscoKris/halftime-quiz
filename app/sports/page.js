'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const SPORTS = [
  { key: "soccer",    name: "Soccer",            icon: "/icons/soccer.png" },
  { key: "football",  name: "American Football", icon: "/icons/football.png" },
  { key: "basketball",name: "Basketball",        icon: "/icons/basketball.png" },
  { key: "hockey",    name: "Ice Hockey",        icon: "/icons/hockey.png" },
  { key: "rugby",     name: "Rugby",             icon: "/icons/rugby.png" },
  { key: "cricket",   name: "Cricket",           icon: "/icons/cricket.png" },
];

export default function SportsChooserPage() {
  const router = useRouter();

  const onChoose = useCallback((sport) => {
    try {
      localStorage.setItem(
        "selectedSport",
        JSON.stringify({ key: sport.key, name: sport.name })
      );
    } catch {}
    router.push(`/sports/${sport.key}`);
  }, [router]);

  return (
    <main
      className="min-h-screen w-full relative flex items-start justify-center bg-black"
      style={{
        backgroundImage: "url('/sports-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />

      <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        {/* Much bigger HQ logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/HQ25_logo.png"
            alt="Halftime Quiz"
            className="w-32 h-32 drop-shadow-lg"
          />
        </div>

        {/* Grid of sport squares */}
        <section className="grid grid-cols-2 gap-4 sm:gap-6">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => onChoose(s)}
              className="group relative aspect-square rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden hover:border-white/30 hover:shadow-2xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`Open ${s.name} menu`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Icon fills most of the square */}
                <div className="w-3/4 h-3/4 relative drop-shadow">
                  <Image
                    src={s.icon}
                    alt={s.name}
                    fill
                    className="object-contain transition-transform duration-200 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>

              {/* subtle gradient shine on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 60%)",
                }}
              />
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
