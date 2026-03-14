import { DEFAULTS } from "../lib/constants";
import type { Leaderboard, LeaderboardEntry, QuizResult } from "../types/domain";

export function compareLeaderboardEntries(
  left: Pick<LeaderboardEntry, "score" | "timeSeconds" | "completedAt">,
  right: Pick<LeaderboardEntry, "score" | "timeSeconds" | "completedAt">,
) {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  if (left.timeSeconds !== right.timeSeconds) {
    return left.timeSeconds - right.timeSeconds;
  }

  return left.completedAt.getTime() - right.completedAt.getTime();
}

export function createLeaderboardEntry(result: QuizResult): LeaderboardEntry {
  return {
    userId: result.userId,
    username: result.username,
    score: result.score,
    timeSeconds: result.timeSeconds,
    completedAt: result.completedAt,
    city: result.city,
  };
}

export function rankLeaderboardEntries(entries: LeaderboardEntry[], limit = DEFAULTS.leaderboardTopEntries) {
  return [...entries].sort(compareLeaderboardEntries).slice(0, limit);
}

export function mergeLeaderboardEntries(
  existingEntries: LeaderboardEntry[],
  nextEntry: LeaderboardEntry,
  limit = DEFAULTS.leaderboardTopEntries,
) {
  return rankLeaderboardEntries([...existingEntries, nextEntry], limit);
}

export function isResultLeaderboardCandidate(
  existingEntries: LeaderboardEntry[],
  nextEntry: LeaderboardEntry,
  limit = DEFAULTS.leaderboardTopEntries,
) {
  if (existingEntries.length < limit) {
    return true;
  }

  const thresholdEntry = rankLeaderboardEntries(existingEntries, limit)[limit - 1];

  if (!thresholdEntry) {
    return true;
  }

  return compareLeaderboardEntries(nextEntry, thresholdEntry) < 0;
}

export function buildLeaderboardSummary(params: {
  eventId: string;
  title: string;
  results: QuizResult[];
  version?: number;
  playerCount?: number;
}): Leaderboard {
  const topEntries = rankLeaderboardEntries(
    params.results.map(createLeaderboardEntry),
  );

  return {
    eventId: params.eventId,
    title: params.title,
    topEntries,
    playerCount: params.playerCount ?? params.results.length,
    lastUpdated: new Date(),
    version: params.version ?? 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
