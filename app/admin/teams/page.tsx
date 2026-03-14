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
  TextField,
} from "../../../components/admin/admin-form-fields";
import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { leaguesService, sportsService, teamsService } from "../../../services/firestore";
import type { League, Sport, Team } from "../../../types/domain";
import { slugify } from "../../../utils/admin-format";

interface TeamFormState {
  name: string;
  slug: string;
  shortName: string;
  sportId: string;
  sportName: string;
  leagueId: string;
  leagueName: string;
  city: string;
  nickname: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

function createEmptyTeamForm(): TeamFormState {
  return {
    name: "",
    slug: "",
    shortName: "",
    sportId: "",
    sportName: "",
    leagueId: "",
    leagueName: "",
    city: "",
    nickname: "",
    logoUrl: "",
    primaryColor: "#111111",
    secondaryColor: "#f5f5f5",
    isActive: true,
  };
}

export default function AdminTeamsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamFormState>(createEmptyTeamForm());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [sportsData, leaguesData, teamsData] = await Promise.all([
        sportsService.listAll(),
        leaguesService.listAll(),
        teamsService.listAll(),
      ]);
      setSports(sportsData);
      setLeagues(leaguesData);
      setTeams(teamsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredLeagues = useMemo(() => {
    if (!form.sportId) {
      return leagues;
    }

    return leagues.filter((league) => league.sportId === form.sportId);
  }, [form.sportId, leagues]);

  function resetForm() {
    setSelectedTeamId(null);
    setForm(createEmptyTeamForm());
    setFeedback(null);
    setError(null);
  }

  function beginEdit(team: Team) {
    setSelectedTeamId(team.id);
    setForm({
      name: team.name,
      slug: team.slug,
      shortName: team.shortName ?? "",
      sportId: team.sportId,
      sportName: team.sportName,
      leagueId: team.leagueId,
      leagueName: team.leagueName,
      city: team.city ?? "",
      nickname: team.nickname ?? "",
      logoUrl: team.logoUrl ?? "",
      primaryColor: team.primaryColor ?? "#111111",
      secondaryColor: team.secondaryColor ?? "#f5f5f5",
      isActive: team.isActive,
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const selectedSport = sports.find((sport) => sport.id === form.sportId) ?? null;
    const selectedLeague = leagues.find((league) => league.id === form.leagueId) ?? null;

    const payload: Omit<Team, "id"> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      shortName: form.shortName.trim() || undefined,
      sportId: form.sportId,
      sportName: selectedSport?.name ?? form.sportName,
      leagueId: form.leagueId,
      leagueName: selectedLeague?.name ?? form.leagueName,
      city: form.city.trim() || undefined,
      nickname: form.nickname.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
      primaryColor: form.primaryColor.trim() || undefined,
      secondaryColor: form.secondaryColor.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (selectedTeamId) {
        await teamsService.update(selectedTeamId, payload);
        setFeedback(`Updated ${payload.name}.`);
      } else {
        await teamsService.create(payload);
        setFeedback(`Created ${payload.name}.`);
      }

      await loadData();
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="Teams"
      description="Manage teams under their sports and leagues so events can be assembled with clean references and denormalized names."
      badge="Core Taxonomy"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard
          title="Existing Teams"
          description="Team records power event matchups and team-first question pools."
          actions={
            selectedTeamId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New Team
              </button>
            ) : null
          }
        >
          {loading ? (
            <AdminLoadingState title="Loading teams" message="Fetching sports, leagues, and team records." />
          ) : error ? (
            <AdminErrorState title="Unable to load teams" message={error} />
          ) : teams.length === 0 ? (
            <AdminEmptyState title="No teams yet" message="Create teams after adding at least one sport." />
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => beginEdit(team)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedTeamId === team.id
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{team.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {team.sportName}
                        {team.leagueName ? ` • ${team.leagueName}` : ""} • {team.city ?? "No city"}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${team.isActive ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>
                      {team.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard
          title={selectedTeamId ? "Edit Team" : "Create Team"}
          description="Teams should stay tied to a sport, and optionally to a league, with denormalized names captured at save time."
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {feedback ? <AdminFeedbackBanner tone="success" message={feedback} /> : null}
            {error ? <AdminFeedbackBanner tone="error" message={error} /> : null}

            <TextField
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug:
                    current.slug === "" || current.slug === slugify(current.name)
                      ? slugify(event.target.value)
                      : current.slug,
                }))
              }
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                required
              />
              <TextField
                label="Short Name"
                value={form.shortName}
                onChange={(event) => setForm((current) => ({ ...current, shortName: event.target.value }))}
                placeholder="LAFC"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Sport"
                value={form.sportId}
                onChange={(event) => {
                  const nextSport = sports.find((sport) => sport.id === event.target.value) ?? null;
                  const leagueStillMatches = leagues.find(
                    (league) => league.id === form.leagueId && league.sportId === event.target.value,
                  );
                  setForm((current) => ({
                    ...current,
                    sportId: event.target.value,
                    sportName: nextSport?.name ?? "",
                    leagueId: leagueStillMatches ? current.leagueId : "",
                    leagueName: leagueStillMatches ? current.leagueName : "",
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
              <TextField
                label="City"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
              <TextField
                label="Nickname"
                value={form.nickname}
                onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
              />
            </div>
            <TextField
              label="Logo URL"
              value={form.logoUrl}
              onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
              placeholder="https://..."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Primary Color"
                type="color"
                value={form.primaryColor}
                onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
              />
              <TextField
                label="Secondary Color"
                type="color"
                value={form.secondaryColor}
                onChange={(event) => setForm((current) => ({ ...current, secondaryColor: event.target.value }))}
              />
            </div>
            <CheckboxField
              label="Team is active"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />

            <AdminActionRow
              isSaving={saving}
              submitLabel={selectedTeamId ? "Update Team" : "Create Team"}
              onReset={resetForm}
            />
          </form>
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
