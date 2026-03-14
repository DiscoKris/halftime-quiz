import { DEFAULTS } from "../lib/constants";
import type { Event, EventStatus } from "../types/domain";

interface OffsetResolutionOptions {
  sportDefaultOffsetMinutes?: number | null;
  leagueDefaultOffsetMinutes?: number | null;
  eventOverrideMinutes?: number | null;
}

interface QuestionCountResolutionOptions {
  sportDefaultQuestionCount?: number | null;
  leagueDefaultQuestionCount?: number | null;
  eventOverrideCount?: number | null;
}

export function resolveQuizOffsetMinutes({
  sportDefaultOffsetMinutes,
  leagueDefaultOffsetMinutes,
  eventOverrideMinutes,
}: OffsetResolutionOptions) {
  if (typeof eventOverrideMinutes === "number") {
    return eventOverrideMinutes;
  }

  if (typeof leagueDefaultOffsetMinutes === "number") {
    return leagueDefaultOffsetMinutes;
  }

  if (typeof sportDefaultOffsetMinutes === "number") {
    return sportDefaultOffsetMinutes;
  }

  return DEFAULTS.soccerQuizOffsetMinutes;
}

export function resolveQuestionCount({
  sportDefaultQuestionCount,
  leagueDefaultQuestionCount,
  eventOverrideCount,
}: QuestionCountResolutionOptions) {
  if (typeof eventOverrideCount === "number") {
    return eventOverrideCount;
  }

  if (typeof leagueDefaultQuestionCount === "number") {
    return leagueDefaultQuestionCount;
  }

  if (typeof sportDefaultQuestionCount === "number") {
    return sportDefaultQuestionCount;
  }

  return DEFAULTS.questionCount;
}

export function calculateQuizStartTime(
  kickoffTime: Date,
  halftimeOffsetMinutes: number = DEFAULTS.soccerQuizOffsetMinutes,
) {
  return new Date(kickoffTime.getTime() + halftimeOffsetMinutes * 60_000);
}

export function calculateQuizEndTime(
  quizStartTime: Date,
  durationMinutes: number = DEFAULTS.quizWindowDurationMinutes,
) {
  return new Date(quizStartTime.getTime() + durationMinutes * 60_000);
}

export function calculateQuizWindow(
  kickoffTime: Date,
  halftimeOffsetMinutes: number = resolveQuizOffsetMinutes({}),
  durationMinutes = DEFAULTS.quizWindowDurationMinutes,
) {
  const quizStartTime = calculateQuizStartTime(kickoffTime, halftimeOffsetMinutes);
  const quizEndTime = calculateQuizEndTime(quizStartTime, durationMinutes);

  return {
    quizStartTime,
    quizEndTime,
  };
}

export function deriveEventStatus(event: Pick<Event, "quizStartTime" | "quizEndTime" | "status">, now = new Date()): EventStatus {
  if (event.status === "draft" || event.status === "archived") {
    return event.status;
  }

  const startBuffer = event.quizStartTime.getTime() - 10 * 60_000;

  if (now.getTime() < startBuffer) {
    return "upcoming";
  }

  if (now.getTime() < event.quizStartTime.getTime()) {
    return "liveSoon";
  }

  if (now.getTime() <= event.quizEndTime.getTime()) {
    return "active";
  }

  return "expired";
}

export function isEventPlayable(event: Pick<Event, "allowQuizPlay" | "resultWriteEnabled" | "quizStartTime" | "quizEndTime" | "status">, now = new Date()) {
  const status = deriveEventStatus(event, now);
  return event.allowQuizPlay && event.resultWriteEnabled && status === "active";
}

export function getTeamQuestionSplit(questionCount: number) {
  const homeCount = Math.ceil(questionCount / 2);
  const awayCount = Math.floor(questionCount / 2);

  return {
    homeCount,
    awayCount,
  };
}
