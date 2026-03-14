"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { eventsService } from "../../../services/firestore";
import type { Event } from "../../../types/domain";

function isSoccerEvent(event: Event) {
  return event.sportName.trim().toLowerCase() === "soccer";
}

export default function SoccerTodayPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSoccerEvents() {
      try {
        setLoading(true);
        setError(null);
        const publicEvents = await eventsService.listPublic();
        setEvents(publicEvents.filter(isSoccerEvent));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load soccer events.");
      } finally {
        setLoading(false);
      }
    }

    void loadSoccerEvents();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Available Soccer Events</h1>

        {loading ? <div className="opacity-80">Loading events...</div> : null}
        {!loading && error ? <div className="text-red-300">{error}</div> : null}
        {!loading && !error && events.length === 0 ? (
          <div className="opacity-80">No public soccer events are available right now.</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/quiz/${event.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-lg font-semibold">{event.title}</div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    {event.status}
                  </span>
                </div>
                <div className="text-sm text-white/75">
                  {event.leagueName ? `${event.leagueName} • ` : ""}
                  Kickoff {event.kickoffTime.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">
                  Quiz window {event.quizStartTime.toLocaleString()} to {event.quizEndTime.toLocaleString()}
                </div>
                <div className="text-xs text-white/50">
                  Venue: {event.stadiumName}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
