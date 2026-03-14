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
import { DEFAULTS } from "../../../lib/constants";
import {
  eventsService,
  leaguesService,
  sportsService,
  stadiumsService,
  teamsService,
} from "../../../services/firestore";
import type { Event, EventStatus, League, Sport, Stadium, Team } from "../../../types/domain";
import {
  fromDateTimeLocalValue,
  parseCommaSeparatedList,
  slugify,
  toDateTimeLocalValue,
} from "../../../utils/admin-format";
import { calculateQuizEndTime, calculateQuizStartTime } from "../../../utils/event-timing";

const EVENT_STATUS_OPTIONS: EventStatus[] = [
  "draft",
  "upcoming",
  "liveSoon",
  "active",
  "expired",
  "archived",
];

interface EventFormState {
  title: string;
  slug: string;
  sportId: string;
  sportName: string;
  leagueId: string;
  leagueName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  stadiumId: string;
  stadiumName: string;
  kickoffTime: string;
  halftimeOffsetMinutes: string;
  quizStartTime: string;
  quizEndTime: string;
  status: EventStatus;
  questionCount: string;
  countdownSeconds: string;
  useHomeTeam: boolean;
  useAwayTeam: boolean;
  useLeaguePool: boolean;
  useSportPool: boolean;
  adIdsText: string;
  allowQuizPlay: boolean;
  resultWriteEnabled: boolean;
  leaderboardReadEnabled: boolean;
  autoSchedule: boolean;
}

interface SnapshotStatusState {
  count: number;
  hasSnapshot: boolean;
}

function createEmptyEventForm(): EventFormState {
  return {
    title: "",
    slug: "",
    sportId: "",
    sportName: "",
    leagueId: "",
    leagueName: "",
    homeTeamId: "",
    homeTeamName: "",
    awayTeamId: "",
    awayTeamName: "",
    stadiumId: "",
    stadiumName: "",
    kickoffTime: "",
    halftimeOffsetMinutes: String(DEFAULTS.soccerQuizOffsetMinutes),
    quizStartTime: "",
    quizEndTime: "",
    status: "draft",
    questionCount: String(DEFAULTS.questionCount),
    countdownSeconds: String(DEFAULTS.countdownSeconds),
    useHomeTeam: true,
    useAwayTeam: true,
    useLeaguePool: false,
    useSportPool: false,
    adIdsText: "",
    allowQuizPlay: false,
    resultWriteEnabled: false,
    leaderboardReadEnabled: false,
    autoSchedule: true,
  };
}

function toSnapshotStatusMap(entries: Array<readonly [string, SnapshotStatusState]>) {
  return Object.fromEntries(entries) as Record<string, SnapshotStatusState>;
}

export default function AdminEventsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapshotStatuses, setSnapshotStatuses] = useState<Record<string, SnapshotStatusState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshotSavingId, setSnapshotSavingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(createEmptyEventForm());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [snapshotFeedback, setSnapshotFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [pendingSnapshotAction, setPendingSnapshotAction] = useState<{
    eventId: string;
    mode: "generate" | "regenerate";
  } | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [sportsData, leaguesData, teamsData, stadiumsData, eventsData] = await Promise.all([
        sportsService.listAll(),
        leaguesService.listAll(),
        teamsService.listAll(),
        stadiumsService.listAll(),
        eventsService.listAll(),
      ]);
      const snapshotStatusEntries = await Promise.all(
        eventsData.map(async (event) => {
          const status = await eventsService.getSnapshotStatus(event.id);
          return [event.id, status] as const;
        }),
      );
      setSports(sportsData);
      setLeagues(leaguesData);
      setTeams(teamsData);
      setStadiums(stadiumsData);
      setEvents(eventsData);
      setSnapshotStatuses(toSnapshotStatusMap(snapshotStatusEntries));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.autoSchedule || !form.kickoffTime) {
      return;
    }

    const kickoffDate = fromDateTimeLocalValue(form.kickoffTime);
    if (!kickoffDate) {
      return;
    }

    const quizStart = calculateQuizStartTime(
      kickoffDate,
      Number(form.halftimeOffsetMinutes || DEFAULTS.soccerQuizOffsetMinutes),
    );
    const quizEnd = calculateQuizEndTime(quizStart);

    setForm((current) => ({
      ...current,
      quizStartTime: toDateTimeLocalValue(quizStart),
      quizEndTime: toDateTimeLocalValue(quizEnd),
    }));
  }, [form.autoSchedule, form.kickoffTime, form.halftimeOffsetMinutes]);

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

  const selectedEventSnapshotStatus = selectedEventId
    ? snapshotStatuses[selectedEventId] ?? null
    : null;

  function resetForm() {
    setSelectedEventId(null);
    setForm(createEmptyEventForm());
    setFeedback(null);
    setError(null);
    setSnapshotFeedback(null);
    setPendingSnapshotAction(null);
  }

  function beginEdit(event: Event) {
    setSelectedEventId(event.id);
    setForm({
      title: event.title,
      slug: event.slug,
      sportId: event.sportId,
      sportName: event.sportName,
      leagueId: event.leagueId,
      leagueName: event.leagueName,
      homeTeamId: event.homeTeamId,
      homeTeamName: event.homeTeamName,
      awayTeamId: event.awayTeamId,
      awayTeamName: event.awayTeamName,
      stadiumId: event.stadiumId,
      stadiumName: event.stadiumName,
      kickoffTime: toDateTimeLocalValue(event.kickoffTime),
      halftimeOffsetMinutes: String(event.halftimeOffsetMinutes),
      quizStartTime: toDateTimeLocalValue(event.quizStartTime),
      quizEndTime: toDateTimeLocalValue(event.quizEndTime),
      status: event.status,
      questionCount: String(event.questionCount),
      countdownSeconds: String(event.countdownSeconds),
      useHomeTeam: event.questionSources.useHomeTeam,
      useAwayTeam: event.questionSources.useAwayTeam,
      useLeaguePool: Boolean(event.questionSources.useLeaguePool),
      useSportPool: Boolean(event.questionSources.useSportPool),
      adIdsText: event.adIds.join(", "),
      allowQuizPlay: event.allowQuizPlay,
      resultWriteEnabled: event.resultWriteEnabled,
      leaderboardReadEnabled: event.leaderboardReadEnabled,
      autoSchedule: false,
    });
    setFeedback(null);
    setError(null);
    setSnapshotFeedback(null);
    setPendingSnapshotAction(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const sport = sports.find((item) => item.id === form.sportId) ?? null;
    const league = leagues.find((item) => item.id === form.leagueId) ?? null;
    const homeTeam = teams.find((item) => item.id === form.homeTeamId) ?? null;
    const awayTeam = teams.find((item) => item.id === form.awayTeamId) ?? null;
    const stadium = stadiums.find((item) => item.id === form.stadiumId) ?? null;
    const kickoffTime = fromDateTimeLocalValue(form.kickoffTime) ?? new Date();
    const quizStartTime =
      fromDateTimeLocalValue(form.quizStartTime) ??
      calculateQuizStartTime(kickoffTime, Number(form.halftimeOffsetMinutes));
    const quizEndTime =
      fromDateTimeLocalValue(form.quizEndTime) ?? calculateQuizEndTime(quizStartTime);

    const payload: Omit<Event, "id"> = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      sportId: form.sportId,
      sportName: sport?.name ?? form.sportName,
      leagueId: form.leagueId,
      leagueName: league?.name ?? form.leagueName,
      homeTeamId: form.homeTeamId,
      homeTeamName: homeTeam?.name ?? form.homeTeamName,
      awayTeamId: form.awayTeamId,
      awayTeamName: awayTeam?.name ?? form.awayTeamName,
      stadiumId: form.stadiumId,
      stadiumName: stadium?.name ?? form.stadiumName,
      kickoffTime,
      halftimeOffsetMinutes: Number(form.halftimeOffsetMinutes),
      quizStartTime,
      quizEndTime,
      status: form.status,
      questionCount: Number(form.questionCount),
      countdownSeconds: Number(form.countdownSeconds),
      questionSources: {
        useHomeTeam: form.useHomeTeam,
        useAwayTeam: form.useAwayTeam,
        useLeaguePool: form.useLeaguePool,
        useSportPool: form.useSportPool,
      },
      adIds: parseCommaSeparatedList(form.adIdsText),
      allowQuizPlay: form.allowQuizPlay,
      resultWriteEnabled: form.resultWriteEnabled,
      leaderboardReadEnabled: form.leaderboardReadEnabled,
    };

    try {
      if (selectedEventId) {
        await eventsService.update(selectedEventId, payload);
        setFeedback(`Updated ${payload.title}.`);
      } else {
        await eventsService.create(payload);
        setFeedback(`Created ${payload.title}.`);
      }

      await loadData();
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSnapshotGeneration() {
    if (!pendingSnapshotAction) {
      return;
    }

    setSnapshotSavingId(pendingSnapshotAction.eventId);
    setSnapshotFeedback(null);

    try {
      const result = await eventsService.generateSnapshot(pendingSnapshotAction.eventId);
      setSnapshotStatuses((current) => ({
        ...current,
        [pendingSnapshotAction.eventId]: {
          count: result.count,
          hasSnapshot: result.count > 0,
        },
      }));
      setSnapshotFeedback({
        tone: "success",
        message: `${pendingSnapshotAction.mode === "regenerate" ? "Regenerated" : "Generated"} ${result.count} frozen event questions. Allocation: home ${result.allocation.homeTeam}, away ${result.allocation.awayTeam}, league ${result.allocation.league}, sport ${result.allocation.sport}.`,
      });
      setPendingSnapshotAction(null);
    } catch (snapshotError) {
      setSnapshotFeedback({
        tone: "error",
        message:
          snapshotError instanceof Error
            ? snapshotError.message
            : "Failed to generate the event snapshot.",
      });
    } finally {
      setSnapshotSavingId(null);
    }
  }

  return (
    <AdminPageShell
      title="Events"
      description="Manage the event layer that connects sports, leagues, teams, stadiums, and quiz timing into a production-ready halftime experience."
      badge="Core Taxonomy"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <AdminCard
          title="Existing Events"
          description="Events are the canonical admin records that drive frozen eventQuestions, ads, results, and cached leaderboards."
          actions={
            selectedEventId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New Event
              </button>
            ) : null
          }
        >
          {loading ? (
            <AdminLoadingState title="Loading events" message="Fetching sports, venues, teams, and event records." />
          ) : error ? (
            <AdminErrorState title="Unable to load events" message={error} />
          ) : events.length === 0 ? (
            <AdminEmptyState title="No events yet" message="Create an event after adding the supporting sports, teams, and stadiums." />
          ) : (
            <div className="space-y-3">
              {events.map((item) => {
                const snapshotStatus = snapshotStatuses[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => beginEdit(item)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedEventId === item.id
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-black/20 hover:bg-black/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-white/50">
                          {item.sportName}
                          {item.leagueName ? ` • ${item.leagueName}` : ""} • kickoff {item.kickoffTime.toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          Snapshot: {snapshotStatus?.hasSnapshot ? `${snapshotStatus.count} frozen questions` : "not generated"}
                        </div>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
                        {item.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard
            title={selectedEventId ? "Edit Event" : "Create Event"}
            description="Sport selection can auto-fill timing defaults, while kickoff and halftime offset can recalculate the quiz window."
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              {feedback ? <AdminFeedbackBanner tone="success" message={feedback} /> : null}
              {error ? <AdminFeedbackBanner tone="error" message={error} /> : null}

              <TextField
                label="Title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                    slug:
                      current.slug === "" || current.slug === slugify(current.title)
                        ? slugify(event.target.value)
                        : current.slug,
                  }))
                }
                required
              />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Sport"
                  value={form.sportId}
                  onChange={(event) => {
                    const sport = sports.find((item) => item.id === event.target.value) ?? null;
                    setForm((current) => ({
                      ...current,
                      sportId: event.target.value,
                      sportName: sport?.name ?? "",
                      leagueId: "",
                      leagueName: "",
                      homeTeamId: "",
                      homeTeamName: "",
                      awayTeamId: "",
                      awayTeamName: "",
                      halftimeOffsetMinutes: String(
                        sport?.defaultQuizOffsetMinutes ?? DEFAULTS.soccerQuizOffsetMinutes,
                      ),
                      questionCount: String(
                        sport?.defaultQuestionCount ?? DEFAULTS.questionCount,
                      ),
                    }));
                  }}
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
                  onChange={(event) => {
                    const league = leagues.find((item) => item.id === event.target.value) ?? null;
                    setForm((current) => ({
                      ...current,
                      leagueId: event.target.value,
                      leagueName: league?.name ?? "",
                      sportId: current.sportId || league?.sportId || "",
                      sportName: current.sportName || league?.sportName || "",
                      homeTeamId: "",
                      homeTeamName: "",
                      awayTeamId: "",
                      awayTeamName: "",
                    }));
                  }}
                >
                  <option value="">No league selected</option>
                  {filteredLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Home Team"
                  value={form.homeTeamId}
                  onChange={(event) => {
                    const team = filteredTeams.find((item) => item.id === event.target.value) ?? null;
                    setForm((current) => ({
                      ...current,
                      homeTeamId: event.target.value,
                      homeTeamName: team?.name ?? "",
                    }));
                  }}
                  required
                >
                  <option value="">Select a home team</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Away Team"
                  value={form.awayTeamId}
                  onChange={(event) => {
                    const team = filteredTeams.find((item) => item.id === event.target.value) ?? null;
                    setForm((current) => ({
                      ...current,
                      awayTeamId: event.target.value,
                      awayTeamName: team?.name ?? "",
                    }));
                  }}
                  required
                >
                  <option value="">Select an away team</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </SelectField>
              </div>
              <SelectField
                label="Stadium"
                value={form.stadiumId}
                onChange={(event) => {
                  const stadium = stadiums.find((item) => item.id === event.target.value) ?? null;
                  setForm((current) => ({
                    ...current,
                    stadiumId: event.target.value,
                    stadiumName: stadium?.name ?? "",
                  }));
                }}
                required
              >
                <option value="">Select a stadium</option>
                {stadiums.map((stadium) => (
                  <option key={stadium.id} value={stadium.id}>
                    {stadium.name}
                  </option>
                ))}
              </SelectField>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Kickoff Time"
                  type="datetime-local"
                  value={form.kickoffTime}
                  onChange={(event) => setForm((current) => ({ ...current, kickoffTime: event.target.value }))}
                  required
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as EventStatus }))
                  }
                  required
                >
                  {EVENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </SelectField>
              </div>
              <CheckboxField
                label="Auto-calculate quiz window"
                checked={form.autoSchedule}
                onChange={(event) => setForm((current) => ({ ...current, autoSchedule: event.target.checked }))}
                description="When enabled, kickoff time and halftime offset recalculate quiz start and end times."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Halftime Offset Minutes"
                  type="number"
                  min="0"
                  value={form.halftimeOffsetMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, halftimeOffsetMinutes: event.target.value }))
                  }
                  required
                />
                <TextField
                  label="Question Count"
                  type="number"
                  min="1"
                  value={form.questionCount}
                  onChange={(event) => setForm((current) => ({ ...current, questionCount: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Quiz Start Time"
                  type="datetime-local"
                  value={form.quizStartTime}
                  onChange={(event) => setForm((current) => ({ ...current, quizStartTime: event.target.value }))}
                  disabled={form.autoSchedule}
                  required
                />
                <TextField
                  label="Quiz End Time"
                  type="datetime-local"
                  value={form.quizEndTime}
                  onChange={(event) => setForm((current) => ({ ...current, quizEndTime: event.target.value }))}
                  disabled={form.autoSchedule}
                  required
                />
              </div>
              <TextField
                label="Countdown Seconds"
                type="number"
                min="0"
                value={form.countdownSeconds}
                onChange={(event) => setForm((current) => ({ ...current, countdownSeconds: event.target.value }))}
                required
              />
              <TextAreaField
                label="Ad IDs"
                value={form.adIdsText}
                onChange={(event) => setForm((current) => ({ ...current, adIdsText: event.target.value }))}
                hint="Comma-separated for now. A fuller ad assignment workflow can replace this later."
                placeholder="ad-123, ad-456"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxField
                  label="Use home team pool"
                  checked={form.useHomeTeam}
                  onChange={(event) => setForm((current) => ({ ...current, useHomeTeam: event.target.checked }))}
                />
                <CheckboxField
                  label="Use away team pool"
                  checked={form.useAwayTeam}
                  onChange={(event) => setForm((current) => ({ ...current, useAwayTeam: event.target.checked }))}
                />
                <CheckboxField
                  label="Use league pool"
                  checked={form.useLeaguePool}
                  onChange={(event) => setForm((current) => ({ ...current, useLeaguePool: event.target.checked }))}
                />
                <CheckboxField
                  label="Use sport pool"
                  checked={form.useSportPool}
                  onChange={(event) => setForm((current) => ({ ...current, useSportPool: event.target.checked }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxField
                  label="Allow quiz play"
                  checked={form.allowQuizPlay}
                  onChange={(event) => setForm((current) => ({ ...current, allowQuizPlay: event.target.checked }))}
                />
                <CheckboxField
                  label="Enable result writes"
                  checked={form.resultWriteEnabled}
                  onChange={(event) => setForm((current) => ({ ...current, resultWriteEnabled: event.target.checked }))}
                />
                <CheckboxField
                  label="Enable leaderboard reads"
                  checked={form.leaderboardReadEnabled}
                  onChange={(event) => setForm((current) => ({ ...current, leaderboardReadEnabled: event.target.checked }))}
                />
              </div>

              <AdminActionRow
                isSaving={saving}
                submitLabel={selectedEventId ? "Update Event" : "Create Event"}
                onReset={resetForm}
              />
            </form>
          </AdminCard>

          {selectedEventId ? (
            <AdminCard
              title="Frozen Snapshot"
              description="Generate the event-specific question set before public traffic arrives so all players read the same frozen eventQuestions snapshot."
            >
              <div className="space-y-4">
                {snapshotFeedback ? (
                  <AdminFeedbackBanner tone={snapshotFeedback.tone} message={snapshotFeedback.message} />
                ) : null}
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-sm font-medium text-white">
                    {selectedEventSnapshotStatus?.hasSnapshot
                      ? "Snapshot ready"
                      : "Snapshot not generated"}
                  </div>
                  <p className="mt-1 text-sm text-white/65">
                    {selectedEventSnapshotStatus?.hasSnapshot
                      ? `${selectedEventSnapshotStatus.count} frozen question documents exist for this event.`
                      : "No frozen eventQuestions exist yet. Generate the snapshot after confirming the event teams and question settings."}
                  </p>
                </div>

                {pendingSnapshotAction?.eventId === selectedEventId ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-50">
                    <div className="font-medium">
                      {pendingSnapshotAction.mode === "regenerate"
                        ? "Regenerate this snapshot?"
                        : "Generate this snapshot?"}
                    </div>
                    <p className="mt-1 text-amber-50/85">
                      {pendingSnapshotAction.mode === "regenerate"
                        ? "This replaces the existing frozen eventQuestions for the selected event."
                        : "This will freeze a single event-specific question set from the enabled source pools."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleConfirmSnapshotGeneration()}
                        disabled={snapshotSavingId === selectedEventId}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {snapshotSavingId === selectedEventId ? "Working..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingSnapshotAction(null)}
                        disabled={snapshotSavingId === selectedEventId}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingSnapshotAction({
                        eventId: selectedEventId,
                        mode: selectedEventSnapshotStatus?.hasSnapshot ? "regenerate" : "generate",
                      })
                    }
                    disabled={snapshotSavingId === selectedEventId}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {selectedEventSnapshotStatus?.hasSnapshot ? "Regenerate Snapshot" : "Generate Snapshot"}
                  </button>
                )}
              </div>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </AdminPageShell>
  );
}
