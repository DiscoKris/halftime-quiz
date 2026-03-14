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
import { leaguesService, sportsService } from "../../../services/firestore";
import type { League, Sport } from "../../../types/domain";
import { slugify } from "../../../utils/admin-format";

interface LeagueFormState {
  name: string;
  slug: string;
  sportId: string;
  sportName: string;
  logoUrl: string;
  isActive: boolean;
}

function createEmptyLeagueForm(): LeagueFormState {
  return {
    name: "",
    slug: "",
    sportId: "",
    sportName: "",
    logoUrl: "",
    isActive: true,
  };
}

export default function AdminLeaguesPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [form, setForm] = useState<LeagueFormState>(createEmptyLeagueForm());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [sportsData, leaguesData] = await Promise.all([
        sportsService.listAll(),
        leaguesService.listAll(),
      ]);
      setSports(sportsData);
      setLeagues(leaguesData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load leagues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedSport = useMemo(
    () => sports.find((sport) => sport.id === form.sportId) ?? null,
    [sports, form.sportId],
  );

  function resetForm() {
    setSelectedLeagueId(null);
    setForm(createEmptyLeagueForm());
    setFeedback(null);
    setError(null);
  }

  function beginEdit(league: League) {
    setSelectedLeagueId(league.id);
    setForm({
      name: league.name,
      slug: league.slug,
      sportId: league.sportId,
      sportName: league.sportName,
      logoUrl: league.logoUrl ?? "",
      isActive: league.isActive,
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const payload: Omit<League, "id"> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sportId: form.sportId,
      sportName: selectedSport?.name ?? form.sportName,
      logoUrl: form.logoUrl.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (selectedLeagueId) {
        await leaguesService.update(selectedLeagueId, payload);
        setFeedback(`Updated ${payload.name}.`);
      } else {
        await leaguesService.create(payload);
        setFeedback(`Created ${payload.name}.`);
      }

      await loadData();
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save league.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="Leagues"
      description="Manage league records and keep them tied to the correct sport for filtering and event setup."
      badge="Core Taxonomy"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard
          title="Existing Leagues"
          description="Each league stays linked to a sport and can later support league-wide question pools."
          actions={
            selectedLeagueId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New League
              </button>
            ) : null
          }
        >
          {loading ? (
            <AdminLoadingState title="Loading leagues" message="Fetching sports and league records." />
          ) : error ? (
            <AdminErrorState title="Unable to load leagues" message={error} />
          ) : leagues.length === 0 ? (
            <AdminEmptyState title="No leagues yet" message="Create a league after adding at least one sport." />
          ) : (
            <div className="space-y-3">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  type="button"
                  onClick={() => beginEdit(league)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedLeagueId === league.id
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{league.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {league.sportName} • {league.slug}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${league.isActive ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>
                      {league.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard
          title={selectedLeagueId ? "Edit League" : "Create League"}
          description="Leagues should always stay attached to a selected sport."
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
              placeholder="MLS"
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              required
            />
            <SelectField
              label="Sport"
              value={form.sportId}
              onChange={(event) => {
                const sport = sports.find((item) => item.id === event.target.value) ?? null;
                setForm((current) => ({
                  ...current,
                  sportId: event.target.value,
                  sportName: sport?.name ?? "",
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
            <TextField
              label="Logo URL"
              value={form.logoUrl}
              onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
              placeholder="https://..."
            />
            <CheckboxField
              label="League is active"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />

            <AdminActionRow
              isSaving={saving}
              submitLabel={selectedLeagueId ? "Update League" : "Create League"}
              onReset={resetForm}
            />
          </form>
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
