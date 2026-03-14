'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { eventsService } from "../../services/firestore";

export default function ChoosePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");
        const publicEvents = await eventsService.listPublic();
        setEvents(publicEvents);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load available events.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvents();
  }, []);

  return (
    <main
      className="relative flex min-h-screen w-full items-start justify-center bg-black"
      style={{
        backgroundImage: "url('/sports-login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-20 sm:px-6">
        <div className="mb-8 flex flex-col items-center">
          <img src="/HQ25_logo.png" alt="Halftime Quiz" className="h-24 w-24 drop-shadow-lg" />
          <h1 className="mt-4 text-2xl font-bold tracking-wide text-white">Available Events</h1>
          <p className="mt-2 text-center text-sm text-white/70">
            Public quiz play now reads the production events and frozen event question snapshots.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur-md">
          {loading ? <p className="text-sm text-white/70">Loading available events...</p> : null}
          {!loading && error ? <p className="text-sm text-red-300">{error}</p> : null}
          {!loading && !error && events.length === 0 ? (
            <p className="text-sm text-white/70">No public events are available right now.</p>
          ) : null}

          <div className="grid gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/quiz/${event.id}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white">{event.title}</div>
                    <div className="mt-1 text-sm text-white/70">
                      {event.sportName}
                      {event.leagueName ? ` • ${event.leagueName}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      Quiz window {event.quizStartTime.toLocaleString()} to {event.quizEndTime.toLocaleString()}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
