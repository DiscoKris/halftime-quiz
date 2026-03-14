'use client';

import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebaseConfig';
import {
  eventsService,
  leaderboardsService,
  quizResultsService,
  usersService,
} from '../../../services/firestore';
import type {
  Event,
  EventQuestion,
  Leaderboard,
} from '../../../types/domain';

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const eventId = params?.quizId;

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        router.replace('/login');
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!eventId || !authUser) {
      return;
    }

    async function loadQuiz() {
      try {
        setLoading(true);
        setError(null);
        const [loadedEvent, loadedQuestions, loadedLeaderboard] = await Promise.all([
          eventsService.getById(eventId),
          eventsService.listEventQuestions(eventId),
          leaderboardsService.getByEventId(eventId),
        ]);

        if (!loadedEvent) {
          throw new Error('Event not found.');
        }

        if (loadedQuestions.length === 0) {
          throw new Error('This event does not have a frozen question snapshot yet.');
        }

        setEvent(loadedEvent);
        setQuestions(loadedQuestions);
        setLeaderboard(loadedLeaderboard);

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
          setSeconds((current) => current + 1);
        }, 1000);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    }

    void loadQuiz();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [authUser, eventId]);

  const currentQuestion = useMemo(() => questions[idx], [idx, questions]);
  const totalQuestions = questions.length;
  const timerLabel = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  function handleSelect(index: number) {
    setSelectedIndex(index);
  }

  function handleNext() {
    if (!currentQuestion || selectedIndex == null) {
      return;
    }

    const nextScore =
      selectedIndex === currentQuestion.correctIndex ? score + 1 : score;

    setScore(nextScore);
    setSelectedIndex(null);

    if (idx < totalQuestions - 1) {
      setIdx((current) => current + 1);
      return;
    }

    void finishQuiz(nextScore);
  }

  async function finishQuiz(finalScore: number) {
    if (!event || !authUser) {
      return;
    }

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setSubmitting(true);
      const userProfile = await usersService.getByUid(authUser.uid);

      await quizResultsService.submit({
        eventId: event.id,
        sportId: event.sportId,
        leagueId: event.leagueId,
        homeTeamId: event.homeTeamId,
        awayTeamId: event.awayTeamId,
        userId: authUser.uid,
        username: userProfile?.username ?? authUser.email ?? 'Player',
        score: finalScore,
        timeSeconds: seconds,
        correctCount: finalScore,
        totalQuestions,
        completedAt: new Date(),
        city: userProfile?.city,
        adViewed: false,
        adSkipped: false,
      });

      setFinished(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save quiz result.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="opacity-80">Loading quiz...</div>
      </main>
    );
  }

  if (error || !event || questions.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="space-y-3 text-center">
          <div className="text-lg font-semibold">Unable to start quiz</div>
          <div className="opacity-80">{error ?? 'This event is not playable right now.'}</div>
          <Link href="/choose" className="inline-block rounded-xl bg-white/10 px-4 py-2 text-sm">
            Back to Events
          </Link>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-semibold">Quiz Complete</h1>
            <p className="mt-2 text-white/75">{event.title}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Score</div>
                <div className="mt-2 text-2xl font-semibold">{score} / {totalQuestions}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Time</div>
                <div className="mt-2 text-2xl font-semibold">{timerLabel}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">Leaderboard</div>
                <div className="mt-2 text-sm text-white/75">
                  {leaderboard ? `${leaderboard.playerCount} recorded players` : 'Cached leaderboard not available yet'}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/choose" className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">
                Back to Events
              </Link>
              <Link href="/sports/soccer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                View Soccer Events
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm opacity-80">
            Event: <span className="font-semibold">{event.title}</span>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-1 font-mono text-sm">{timerLabel}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider opacity-70">Question</div>
            <div className="text-xs opacity-70">
              {idx + 1} / {totalQuestions}
            </div>
          </div>

          <p className="mb-5 text-lg font-semibold">{currentQuestion?.questionText}</p>

          <div className="grid gap-3">
            {currentQuestion?.options.map((option, optionIndex) => {
              const isSelected = selectedIndex === optionIndex;
              return (
                <button
                  key={`${currentQuestion.id}-${optionIndex + 1}`}
                  onClick={() => handleSelect(optionIndex)}
                  className={[
                    'w-full rounded-xl border px-4 py-3 text-left transition',
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500 text-black'
                      : 'border-white/10 bg-white/5 text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs opacity-70">All players see this same frozen event snapshot.</div>
            <button
              onClick={handleNext}
              disabled={selectedIndex == null || submitting}
              className={[
                'rounded-xl px-5 py-2 font-semibold transition',
                selectedIndex != null && !submitting
                  ? 'bg-emerald-500 text-black hover:bg-emerald-600'
                  : 'cursor-not-allowed bg-white/10 text-white/60',
              ].join(' ')}
            >
              {idx < totalQuestions - 1 ? 'Next' : submitting ? 'Submitting...' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
