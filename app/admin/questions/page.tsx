"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActionRow } from "../../../components/admin/admin-action-row";
import { AdminCard } from "../../../components/admin/admin-card";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "../../../components/admin/admin-data-state";
import { AdminFeedbackBanner } from "../../../components/admin/admin-feedback-banner";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components/admin/admin-form-fields";
import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { questionsService, leaguesService, sportsService, teamsService } from "../../../services/firestore";
import type {
  Difficulty,
  League,
  Question,
  QuestionSourceType,
  Sport,
  Team,
} from "../../../types/domain";
import { QUESTION_DIFFICULTIES, QUESTION_SOURCE_TYPES, getQuestionSourceLabel, parseBulkQuestionText } from "../../../utils/questions";

type QuestionStatusFilter = "all" | "active" | "inactive";

interface QuestionFiltersState {
  sportId: string;
  leagueId: string;
  teamId: string;
  sourceType: QuestionSourceType | "all";
  status: QuestionStatusFilter;
}

interface QuestionFormState {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: string;
  sourceType: QuestionSourceType;
  sportId: string;
  leagueId: string;
  teamId: string;
  difficulty: Difficulty | "";
  category: string;
  isActive: boolean;
}

function createEmptyFilters(): QuestionFiltersState {
  return {
    sportId: "",
    leagueId: "",
    teamId: "",
    sourceType: "all",
    status: "all",
  };
}

function createEmptyForm(): QuestionFormState {
  return {
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctIndex: "0",
    sourceType: "team",
    sportId: "",
    leagueId: "",
    teamId: "",
    difficulty: "",
    category: "",
    isActive: true,
  };
}

function getStatusFilterValue(status: QuestionStatusFilter) {
  if (status === "all") {
    return "all" as const;
  }

  return status === "active";
}

function resolveQuestionContext(
  form: QuestionFormState,
  sports: Sport[],
  leagues: League[],
  teams: Team[],
) {
  const selectedSport = sports.find((sport) => sport.id === form.sportId) ?? null;
  const selectedLeague = leagues.find((league) => league.id === form.leagueId) ?? null;
  const selectedTeam = teams.find((team) => team.id === form.teamId) ?? null;
  const sportId = selectedSport?.id ?? selectedLeague?.sportId ?? selectedTeam?.sportId ?? "";
  const sportName =
    selectedSport?.name ?? selectedLeague?.sportName ?? selectedTeam?.sportName ?? "";
  const leagueId = selectedLeague?.id ?? selectedTeam?.leagueId ?? undefined;
  const leagueName = selectedLeague?.name ?? selectedTeam?.leagueName ?? undefined;

  if (form.sourceType === "team") {
    return {
      sourceId: selectedTeam?.id ?? "",
      sourceName: selectedTeam?.name ?? "",
      sportId,
      sportName,
      leagueId,
      leagueName,
      teamId: selectedTeam?.id ?? undefined,
      teamName: selectedTeam?.name ?? undefined,
    };
  }

  if (form.sourceType === "league") {
    return {
      sourceId: selectedLeague?.id ?? "",
      sourceName: selectedLeague?.name ?? "",
      sportId,
      sportName,
      leagueId,
      leagueName,
      teamId: undefined,
      teamName: undefined,
    };
  }

  return {
    sourceId: selectedSport?.id ?? "",
    sourceName: selectedSport?.name ?? "",
    sportId,
    sportName,
    leagueId: undefined,
    leagueName: undefined,
    teamId: undefined,
    teamName: undefined,
  };
}

function buildQuestionPayload(
  form: QuestionFormState,
  sports: Sport[],
  leagues: League[],
  teams: Team[],
): Omit<Question, "id"> {
  const context = resolveQuestionContext(form, sports, leagues, teams);

  return {
    questionText: form.questionText,
    options: [form.optionA, form.optionB, form.optionC, form.optionD],
    correctIndex: Number(form.correctIndex),
    sourceType: form.sourceType,
    sourceId: context.sourceId,
    sourceName: context.sourceName,
    sportId: context.sportId,
    sportName: context.sportName,
    leagueId: context.leagueId,
    leagueName: context.leagueName,
    teamId: context.teamId,
    teamName: context.teamName,
    difficulty: form.difficulty || undefined,
    category: form.category.trim() || undefined,
    isActive: form.isActive,
  };
}

export default function AdminQuestionsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filters, setFilters] = useState<QuestionFiltersState>(createEmptyFilters());
  const [form, setForm] = useState<QuestionFormState>(createEmptyForm());
  const [bulkText, setBulkText] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function loadMeta() {
    try {
      setLoadingMeta(true);
      setPageError(null);
      const [sportsData, leaguesData, teamsData] = await Promise.all([
        sportsService.listAll(),
        leaguesService.listAll(),
        teamsService.listAll(),
      ]);
      setSports(sportsData);
      setLeagues(leaguesData);
      setTeams(teamsData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load question metadata.");
    } finally {
      setLoadingMeta(false);
    }
  }

  async function loadQuestions() {
    try {
      setLoadingQuestions(true);
      setPageError(null);
      const data = await questionsService.list({
        sportId: filters.sportId || undefined,
        leagueId: filters.leagueId || undefined,
        teamId: filters.teamId || undefined,
        sourceType: filters.sourceType,
        isActive: getStatusFilterValue(filters.status),
      });
      setQuestions(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  useEffect(() => {
    void loadMeta();
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [filters]);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId],
  );

  const filteredLeagues = useMemo(() => {
    if (!form.sportId) {
      return leagues;
    }

    return leagues.filter((league) => league.sportId === form.sportId);
  }, [form.sportId, leagues]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const sportMatches = form.sportId ? team.sportId === form.sportId : true;
      const leagueMatches = form.leagueId ? team.leagueId === form.leagueId : true;
      return sportMatches && leagueMatches;
    });
  }, [form.leagueId, form.sportId, teams]);

  const filterLeagues = useMemo(() => {
    if (!filters.sportId) {
      return leagues;
    }

    return leagues.filter((league) => league.sportId === filters.sportId);
  }, [filters.sportId, leagues]);

  const filterTeams = useMemo(() => {
    return teams.filter((team) => {
      const sportMatches = filters.sportId ? team.sportId === filters.sportId : true;
      const leagueMatches = filters.leagueId ? team.leagueId === filters.leagueId : true;
      return sportMatches && leagueMatches;
    });
  }, [filters.leagueId, filters.sportId, teams]);

  function resetForm() {
    setSelectedQuestionId(null);
    setForm(createEmptyForm());
    setFormFeedback(null);
    setBulkFeedback(null);
  }

  function beginEdit(question: Question) {
    setSelectedQuestionId(question.id);
    setForm({
      questionText: question.questionText,
      optionA: question.options[0] ?? "",
      optionB: question.options[1] ?? "",
      optionC: question.options[2] ?? "",
      optionD: question.options[3] ?? "",
      correctIndex: String(question.correctIndex),
      sourceType: question.sourceType,
      sportId: question.sportId,
      leagueId: question.leagueId ?? "",
      teamId: question.teamId ?? "",
      difficulty: question.difficulty ?? "",
      category: question.category ?? "",
      isActive: question.isActive,
    });
    setFormFeedback(null);
    setBulkFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormFeedback(null);

    try {
      await questionsService.save(selectedQuestionId, buildQuestionPayload(form, sports, leagues, teams));
      setFormFeedback({
        tone: "success",
        message: selectedQuestionId ? "Question updated." : "Question created.",
      });
      await loadQuestions();
      resetForm();
    } catch (error) {
      setFormFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to save question.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkImport() {
    setBulkSaving(true);
    setBulkFeedback(null);

    try {
      const parsed = parseBulkQuestionText(bulkText);

      if (parsed.errors.length > 0) {
        throw new Error(parsed.errors.join(" "));
      }

      const basePayload = buildQuestionPayload(form, sports, leagues, teams);
      const payloads = parsed.questions.map((question) => ({
        ...basePayload,
        questionText: question.questionText,
        options: question.options,
        correctIndex: question.correctIndex,
      }));

      const createdCount = await questionsService.bulkCreate(payloads);
      setBulkFeedback({
        tone: "success",
        message: `Imported ${createdCount} questions into ${basePayload.sourceName || "the selected pool"}.`,
      });
      setBulkText("");
      await loadQuestions();
    } catch (error) {
      setBulkFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to import questions.",
      });
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleDuplicate(question: Question) {
    try {
      await questionsService.create({
        questionText: `${question.questionText} (Copy)`,
        options: [...question.options],
        correctIndex: question.correctIndex,
        sourceType: question.sourceType,
        sourceId: question.sourceId,
        sourceName: question.sourceName,
        sportId: question.sportId,
        sportName: question.sportName,
        leagueId: question.leagueId,
        leagueName: question.leagueName,
        teamId: question.teamId,
        teamName: question.teamName,
        difficulty: question.difficulty,
        category: question.category,
        isActive: question.isActive,
      });
      setFormFeedback({
        tone: "success",
        message: `Duplicated "${question.questionText}".`,
      });
      await loadQuestions();
    } catch (error) {
      setFormFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to duplicate question.",
      });
    }
  }

  async function handleToggleActive(question: Question) {
    try {
      await questionsService.setActive(question.id, !question.isActive);
      setFormFeedback({
        tone: "success",
        message: question.isActive ? "Question archived." : "Question reactivated.",
      });
      await loadQuestions();
    } catch (error) {
      setFormFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to update question state.",
      });
    }
  }

  return (
    <AdminPageShell
      title="Questions"
      description="Manage reusable question pools, keep them tied to sports, leagues, and teams, and prepare clean source banks for frozen event snapshots."
      badge="Question Pools"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <AdminCard
          title="Question Bank"
          description="Filter by source context and manage active or archived questions."
          actions={
            selectedQuestion ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New Question
              </button>
            ) : null
          }
        >
          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField
              label="Filter Sport"
              value={filters.sportId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sportId: event.target.value,
                  leagueId: "",
                  teamId: "",
                }))
              }
            >
              <option value="">All sports</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Filter League"
              value={filters.leagueId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  leagueId: event.target.value,
                  teamId: "",
                }))
              }
            >
              <option value="">All leagues</option>
              {filterLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Filter Team"
              value={filters.teamId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  teamId: event.target.value,
                }))
              }
            >
              <option value="">All teams</option>
              {filterTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Filter Source Type"
              value={filters.sourceType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sourceType: event.target.value as QuestionSourceType | "all",
                }))
              }
            >
              <option value="all">All source types</option>
              {QUESTION_SOURCE_TYPES.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {sourceType}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Filter Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as QuestionStatusFilter,
                }))
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Archived only</option>
            </SelectField>
          </div>

          {pageError ? <AdminErrorState title="Questions unavailable" message={pageError} /> : null}
          {formFeedback ? (
            <div className="mb-4">
              <AdminFeedbackBanner tone={formFeedback.tone} message={formFeedback.message} />
            </div>
          ) : null}

          {loadingMeta || loadingQuestions ? (
            <AdminLoadingState title="Loading questions" message="Fetching source metadata and current pool entries." />
          ) : questions.length === 0 ? (
            <AdminEmptyState title="No questions match these filters" message="Create the first question or loosen the current filters." />
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`rounded-xl border px-4 py-4 ${
                    selectedQuestionId === question.id
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="font-medium text-white">{question.questionText}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-white/55">
                        <span>{getQuestionSourceLabel(question)}</span>
                        {question.category ? <span>{question.category}</span> : null}
                        {question.difficulty ? <span>{question.difficulty}</span> : null}
                        <span>{question.isActive ? "Active" : "Archived"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => beginEdit(question)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDuplicate(question)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(question)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        {question.isActive ? "Archive" : "Activate"}
                      </button>
                    </div>
                  </div>
                  <ol className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-2">
                    {question.options.map((option, index) => (
                      <li
                        key={`${question.id}-${index + 1}`}
                        className={`rounded-lg border px-3 py-2 ${
                          index === question.correctIndex
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard
            title={selectedQuestion ? "Edit Question" : "Create Question"}
            description="Questions live primarily in team pools, with league and sport pools available for structured expansion."
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextAreaField
                label="Question Text"
                value={form.questionText}
                onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value }))}
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Option A"
                  value={form.optionA}
                  onChange={(event) => setForm((current) => ({ ...current, optionA: event.target.value }))}
                  required
                />
                <TextField
                  label="Option B"
                  value={form.optionB}
                  onChange={(event) => setForm((current) => ({ ...current, optionB: event.target.value }))}
                  required
                />
                <TextField
                  label="Option C"
                  value={form.optionC}
                  onChange={(event) => setForm((current) => ({ ...current, optionC: event.target.value }))}
                  required
                />
                <TextField
                  label="Option D"
                  value={form.optionD}
                  onChange={(event) => setForm((current) => ({ ...current, optionD: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Correct Answer"
                  value={form.correctIndex}
                  onChange={(event) => setForm((current) => ({ ...current, correctIndex: event.target.value }))}
                >
                  <option value="0">A</option>
                  <option value="1">B</option>
                  <option value="2">C</option>
                  <option value="3">D</option>
                </SelectField>
                <SelectField
                  label="Source Type"
                  value={form.sourceType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceType: event.target.value as QuestionSourceType,
                      teamId: event.target.value === "team" ? current.teamId : "",
                      leagueId: event.target.value === "sport" ? "" : current.leagueId,
                    }))
                  }
                >
                  {QUESTION_SOURCE_TYPES.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {sourceType}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Sport"
                  value={form.sportId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sportId: event.target.value,
                      leagueId: "",
                      teamId: "",
                    }))
                  }
                  required
                >
                  <option value="">Select a sport</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="League"
                  value={form.leagueId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      leagueId: event.target.value,
                      teamId: "",
                    }))
                  }
                  disabled={form.sourceType === "sport"}
                >
                  <option value="">Select a league</option>
                  {filteredLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Team"
                  value={form.teamId}
                  onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}
                  disabled={form.sourceType !== "team"}
                >
                  <option value="">Select a team</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Difficulty"
                  value={form.difficulty}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: event.target.value as Difficulty | "",
                    }))
                  }
                >
                  <option value="">No difficulty selected</option>
                  {QUESTION_DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </SelectField>
              </div>
              <TextField
                label="Category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="History, roster, finals, stadiums..."
              />
              <CheckboxField
                label="Question is active"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />

              <AdminActionRow
                isSaving={saving}
                submitLabel={selectedQuestion ? "Update Question" : "Create Question"}
                onReset={resetForm}
              />
            </form>
          </AdminCard>

          <AdminCard
            title="Bulk Import"
            description="Paste multiple questions in one pass. Bulk import uses the source context and metadata currently selected in the form above."
          >
            <div className="space-y-4">
              {bulkFeedback ? (
                <AdminFeedbackBanner tone={bulkFeedback.tone} message={bulkFeedback.message} />
              ) : null}
              <TextAreaField
                label="Bulk Question Text"
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={`Q: Which superstar joined LA Galaxy in 2007?
A: David Beckham
B: Wayne Rooney
C: Thierry Henry
D: Kaka
ANSWER: A`}
              />
              <button
                type="button"
                onClick={() => void handleBulkImport()}
                disabled={bulkSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkSaving ? "Importing..." : "Import Questions"}
              </button>
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
