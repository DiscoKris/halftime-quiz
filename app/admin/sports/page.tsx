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
import { TextField, CheckboxField } from "../../../components/admin/admin-form-fields";
import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { DEFAULTS } from "../../../lib/constants";
import { sportsService } from "../../../services/firestore";
import type { Sport } from "../../../types/domain";
import { slugify } from "../../../utils/admin-format";

interface SportFormState {
  name: string;
  slug: string;
  defaultQuizOffsetMinutes: string;
  defaultQuestionCount: string;
  isActive: boolean;
}

function createEmptySportForm(): SportFormState {
  return {
    name: "",
    slug: "",
    defaultQuizOffsetMinutes: String(DEFAULTS.soccerQuizOffsetMinutes),
    defaultQuestionCount: String(DEFAULTS.questionCount),
    isActive: true,
  };
}

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [form, setForm] = useState<SportFormState>(createEmptySportForm());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadSports() {
    try {
      setLoading(true);
      setError(null);
      const data = await sportsService.listAll();
      setSports(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load sports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSports();
  }, []);

  const selectedSport = useMemo(
    () => sports.find((sport) => sport.id === selectedSportId) ?? null,
    [sports, selectedSportId],
  );

  function resetForm() {
    setSelectedSportId(null);
    setForm(createEmptySportForm());
    setFeedback(null);
    setError(null);
  }

  function beginEdit(sport: Sport) {
    setSelectedSportId(sport.id);
    setForm({
      name: sport.name,
      slug: sport.slug,
      defaultQuizOffsetMinutes: String(sport.defaultQuizOffsetMinutes),
      defaultQuestionCount: String(sport.defaultQuestionCount),
      isActive: sport.isActive,
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    const payload: Omit<Sport, "id"> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      defaultQuizOffsetMinutes: Number(form.defaultQuizOffsetMinutes),
      defaultQuestionCount: Number(form.defaultQuestionCount),
      isActive: form.isActive,
    };

    try {
      if (selectedSportId) {
        await sportsService.update(selectedSportId, payload);
        setFeedback(`Updated ${payload.name}.`);
      } else {
        await sportsService.create(payload);
        setFeedback(`Created ${payload.name}.`);
      }

      await loadSports();
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save sport.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="Sports"
      description="Manage the top-level sport taxonomy and set quiz timing defaults that downstream leagues and events can inherit."
      badge="Core Taxonomy"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard
          title="Existing Sports"
          description="These sport records drive league filtering and event default timing."
          actions={
            selectedSport ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New Sport
              </button>
            ) : null
          }
        >
          {loading ? (
            <AdminLoadingState title="Loading sports" message="Fetching the current sport taxonomy." />
          ) : error ? (
            <AdminErrorState title="Unable to load sports" message={error} />
          ) : sports.length === 0 ? (
            <AdminEmptyState title="No sports yet" message="Create the first sport to establish quiz timing defaults." />
          ) : (
            <div className="space-y-3">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => beginEdit(sport)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedSportId === sport.id
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{sport.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {sport.slug} • offset {sport.defaultQuizOffsetMinutes} min • {sport.defaultQuestionCount} questions
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sport.isActive ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>
                      {sport.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard
          title={selectedSport ? `Edit ${selectedSport.name}` : "Create Sport"}
          description="Set the sport slug and default halftime timing values that events can inherit."
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
              placeholder="Soccer"
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              placeholder="soccer"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Default Quiz Offset Minutes"
                type="number"
                min="0"
                value={form.defaultQuizOffsetMinutes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultQuizOffsetMinutes: event.target.value }))
                }
                required
              />
              <TextField
                label="Default Question Count"
                type="number"
                min="1"
                value={form.defaultQuestionCount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultQuestionCount: event.target.value }))
                }
                required
              />
            </div>
            <CheckboxField
              label="Sport is active"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />

            <AdminActionRow
              isSaving={saving}
              submitLabel={selectedSport ? "Update Sport" : "Create Sport"}
              onReset={resetForm}
            />
          </form>
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
