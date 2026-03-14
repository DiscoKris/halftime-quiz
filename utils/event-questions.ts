import type { Event, EventQuestion, Question } from "../types/domain";
import { getTeamQuestionSplit } from "./event-timing";

export interface FrozenEventSnapshotBuildResult {
  allocation: {
    homeTeam: number;
    awayTeam: number;
    league: number;
    sport: number;
  };
  selectedQuestions: Question[];
  snapshotQuestions: EventQuestion[];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function takeUniqueQuestions(
  pool: Question[],
  count: number,
  label: string,
  usedQuestionIds: Set<string>,
) {
  if (count === 0) {
    return [];
  }

  const availablePool = pool.filter((question) => !usedQuestionIds.has(question.id));

  if (availablePool.length < count) {
    throw new Error(
      `Not enough active ${label} questions to build this event snapshot. Required ${count}, found ${availablePool.length}.`,
    );
  }

  const selected = shuffle(availablePool).slice(0, count);
  selected.forEach((question) => usedQuestionIds.add(question.id));
  return selected;
}

function getRequestedTeamCounts(
  event: Pick<Event, "questionCount" | "questionSources">,
) {
  const useHomeTeam = event.questionSources.useHomeTeam;
  const useAwayTeam = event.questionSources.useAwayTeam;

  if (useHomeTeam && useAwayTeam) {
    return getTeamQuestionSplit(event.questionCount);
  }

  if (useHomeTeam) {
    return {
      homeCount: event.questionCount,
      awayCount: 0,
    };
  }

  if (useAwayTeam) {
    return {
      homeCount: 0,
      awayCount: event.questionCount,
    };
  }

  return {
    homeCount: 0,
    awayCount: 0,
  };
}

export function buildFrozenEventQuestions(
  event: Pick<
    Event,
    | "sportId"
    | "leagueId"
    | "homeTeamId"
    | "awayTeamId"
    | "questionCount"
    | "questionSources"
  >,
  questions: Question[],
): FrozenEventSnapshotBuildResult {
  const activeQuestions = questions.filter((question) => question.isActive);
  const homePool = activeQuestions.filter(
    (question) => question.sourceType === "team" && question.teamId === event.homeTeamId,
  );
  const awayPool = activeQuestions.filter(
    (question) => question.sourceType === "team" && question.teamId === event.awayTeamId,
  );
  const leaguePool = activeQuestions.filter(
    (question) => question.sourceType === "league" && question.leagueId === event.leagueId,
  );
  const sportPool = activeQuestions.filter(
    (question) => question.sourceType === "sport" && question.sportId === event.sportId,
  );
  const { homeCount, awayCount } = getRequestedTeamCounts(event);
  const usedQuestionIds = new Set<string>();
  const selectedQuestions: Question[] = [];

  selectedQuestions.push(
    ...takeUniqueQuestions(homePool, homeCount, "home team pool", usedQuestionIds),
  );
  selectedQuestions.push(
    ...takeUniqueQuestions(awayPool, awayCount, "away team pool", usedQuestionIds),
  );

  let leagueCount = 0;
  let sportCount = 0;

  if (event.questionSources.useLeaguePool && selectedQuestions.length < event.questionCount) {
    leagueCount = event.questionCount - selectedQuestions.length;
    selectedQuestions.push(
      ...takeUniqueQuestions(leaguePool, leagueCount, "league pool", usedQuestionIds),
    );
  }

  if (event.questionSources.useSportPool && selectedQuestions.length < event.questionCount) {
    sportCount = event.questionCount - selectedQuestions.length;
    selectedQuestions.push(
      ...takeUniqueQuestions(sportPool, sportCount, "sport pool", usedQuestionIds),
    );
  }

  if (selectedQuestions.length !== event.questionCount) {
    throw new Error(
      `Snapshot generation requires ${event.questionCount} questions, but only ${selectedQuestions.length} could be selected from the enabled pools.`,
    );
  }

  return {
    allocation: {
      homeTeam: homeCount,
      awayTeam: awayCount,
      league: leagueCount,
      sport: sportCount,
    },
    selectedQuestions,
    snapshotQuestions: selectedQuestions.map((question, index): EventQuestion => ({
      id: `${question.id}-${index + 1}`,
      originalQuestionId: question.id,
      questionText: question.questionText,
      options: [...question.options],
      correctIndex: question.correctIndex,
      sourceType: question.sourceType,
      sourceId: question.sourceId,
      sourceName: question.sourceName,
      sortOrder: index + 1,
      createdAt: new Date(),
    })),
  };
}
