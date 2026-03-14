import type {
  Difficulty,
  Question,
  QuestionSourceType,
} from "../types/domain";

export const QUESTION_SOURCE_TYPES: QuestionSourceType[] = [
  "team",
  "league",
  "sport",
];

export const QUESTION_DIFFICULTIES: Difficulty[] = [
  "easy",
  "medium",
  "hard",
];

export interface QuestionListFilters {
  sportId?: string;
  leagueId?: string;
  teamId?: string;
  sourceType?: QuestionSourceType | "all";
  isActive?: boolean | "all";
}

export interface BulkQuestionSeed {
  questionText: string;
  options: string[];
  correctIndex: number;
}

export interface BulkQuestionParseResult {
  questions: BulkQuestionSeed[];
  errors: string[];
}

export function normalizeQuestionOptions(options: string[]) {
  return options.map((option) => option.trim()).filter(Boolean);
}

export function validateQuestionPayload(payload: Omit<Question, "id">) {
  const errors: string[] = [];
  const normalizedOptions = normalizeQuestionOptions(payload.options);

  if (!payload.questionText.trim()) {
    errors.push("Question text is required.");
  }

  if (normalizedOptions.length !== 4) {
    errors.push("Each question must have exactly 4 options.");
  }

  if (!Number.isInteger(payload.correctIndex) || payload.correctIndex < 0 || payload.correctIndex > 3) {
    errors.push("Correct answer index must be between 0 and 3.");
  }

  if (!payload.sourceType) {
    errors.push("Source type is required.");
  }

  if (!payload.sourceId.trim() || !payload.sourceName.trim()) {
    errors.push("Source id and source name are required.");
  }

  if (!payload.sportId.trim() || !payload.sportName.trim()) {
    errors.push("Sport metadata is required.");
  }

  if (payload.sourceType === "team") {
    if (!payload.teamId?.trim() || !payload.teamName?.trim()) {
      errors.push("Team questions must include team metadata.");
    }

    if (!payload.leagueId?.trim() || !payload.leagueName?.trim()) {
      errors.push("Team questions must include league metadata.");
    }
  }

  if (payload.sourceType === "league") {
    if (!payload.leagueId?.trim() || !payload.leagueName?.trim()) {
      errors.push("League questions must include league metadata.");
    }
  }

  if (payload.sourceType === "sport") {
    if (payload.teamId?.trim() || payload.teamName?.trim()) {
      errors.push("Sport questions should not include team metadata.");
    }
  }

  if (payload.sourceType === "league" && (payload.teamId?.trim() || payload.teamName?.trim())) {
    errors.push("League questions should not include team metadata.");
  }

  return errors;
}

export function matchesQuestionFilters(
  question: Question,
  filters: QuestionListFilters,
) {
  if (filters.sportId && question.sportId !== filters.sportId) {
    return false;
  }

  if (filters.leagueId && question.leagueId !== filters.leagueId) {
    return false;
  }

  if (filters.teamId && question.teamId !== filters.teamId) {
    return false;
  }

  if (filters.sourceType && filters.sourceType !== "all" && question.sourceType !== filters.sourceType) {
    return false;
  }

  if (typeof filters.isActive === "boolean" && question.isActive !== filters.isActive) {
    return false;
  }

  return true;
}

export function getQuestionSourceLabel(question: Pick<Question, "sourceType" | "sourceName">) {
  return `${question.sourceType}: ${question.sourceName}`;
}

export function parseBulkQuestionText(value: string): BulkQuestionParseResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      questions: [],
      errors: ["Paste at least one question block before importing."],
    };
  }

  const blocks = trimmed
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const questions: BulkQuestionSeed[] = [];
  const errors: string[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const fields: Partial<Record<"Q" | "A" | "B" | "C" | "D" | "ANSWER", string>> = {};

    lines.forEach((line) => {
      const match = line.match(/^(Q|A|B|C|D|ANSWER)\s*:\s*(.+)$/i);
      if (!match) {
        errors.push(`Question ${blockIndex + 1}: invalid line "${line}".`);
        return;
      }

      const key = match[1].toUpperCase() as "Q" | "A" | "B" | "C" | "D" | "ANSWER";
      fields[key] = match[2].trim();
    });

    const missing = ["Q", "A", "B", "C", "D", "ANSWER"].filter((key) => !fields[key as keyof typeof fields]);
    if (missing.length > 0) {
      errors.push(`Question ${blockIndex + 1}: missing ${missing.join(", ")}.`);
      return;
    }

    const answerValue = fields.ANSWER?.toUpperCase();
    const answerMap: Record<string, number> = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    };

    if (!answerValue || !(answerValue in answerMap)) {
      errors.push(`Question ${blockIndex + 1}: ANSWER must be A, B, C, or D.`);
      return;
    }

    questions.push({
      questionText: fields.Q ?? "",
      options: [
        fields.A ?? "",
        fields.B ?? "",
        fields.C ?? "",
        fields.D ?? "",
      ],
      correctIndex: answerMap[answerValue],
    });
  });

  return {
    questions,
    errors,
  };
}
