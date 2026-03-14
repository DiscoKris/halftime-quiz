"use client";

import { useEffect, useState } from "react";
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
  MultiSelectField,
  TextField,
} from "../../../components/admin/admin-form-fields";
import { AdminPageShell } from "../../../components/admin/admin-page-shell";
import { leaguesService, sportsService, stadiumsService } from "../../../services/firestore";
import type { League, Sport, Stadium } from "../../../types/domain";
import { slugify } from "../../../utils/admin-format";

interface StadiumFormState {
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  address: string;
  lat: string;
  lng: string;
  sportIds: string[];
  leagueIds: string[];
  imageUrl: string;
  isActive: boolean;
}

function createEmptyStadiumForm(): StadiumFormState {
  return {
    name: "",
    slug: "",
    city: "",
    state: "",
    country: "USA",
    timezone: "America/Chicago",
    address: "",
    lat: "",
    lng: "",
    sportIds: [],
    leagueIds: [],
    imageUrl: "",
    isActive: true,
  };
}

export default function AdminStadiumsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStadiumId, setSelectedStadiumId] = useState<string | null>(null);
  const [form, setForm] = useState<StadiumFormState>(createEmptyStadiumForm());
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [sportsData, leaguesData, stadiumsData] = await Promise.all([
        sportsService.listAll(),
        leaguesService.listAll(),
        stadiumsService.listAll(),
      ]);
      setSports(sportsData);
      setLeagues(leaguesData);
      setStadiums(stadiumsData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load stadiums.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setSelectedStadiumId(null);
    setForm(createEmptyStadiumForm());
    setFeedback(null);
    setError(null);
  }

  function beginEdit(stadium: Stadium) {
    setSelectedStadiumId(stadium.id);
    setForm({
      name: stadium.name,
      slug: stadium.slug,
      city: stadium.city,
      state: stadium.state ?? "",
      country: stadium.country,
      timezone: stadium.timezone,
      address: stadium.address ?? "",
      lat: stadium.geo?.lat != null ? String(stadium.geo.lat) : "",
      lng: stadium.geo?.lng != null ? String(stadium.geo.lng) : "",
      sportIds: stadium.sportIds,
      leagueIds: stadium.leagueIds,
      imageUrl: stadium.imageUrl ?? "",
      isActive: stadium.isActive,
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    const payload: Omit<Stadium, "id"> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      country: form.country.trim(),
      timezone: form.timezone.trim(),
      address: form.address.trim() || undefined,
      geo:
        form.lat.trim() && form.lng.trim()
          ? {
              lat: Number(form.lat),
              lng: Number(form.lng),
            }
          : undefined,
      sportIds: form.sportIds,
      leagueIds: form.leagueIds,
      imageUrl: form.imageUrl.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (selectedStadiumId) {
        await stadiumsService.update(selectedStadiumId, payload);
        setFeedback(`Updated ${payload.name}.`);
      } else {
        await stadiumsService.create(payload);
        setFeedback(`Created ${payload.name}.`);
      }

      await loadData();
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save stadium.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="Stadiums"
      description="Manage venue records, location metadata, and the sport and league relationships that help filter event options."
      badge="Core Taxonomy"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard
          title="Existing Stadiums"
          description="Stadiums support event scheduling and location-aware experiences."
          actions={
            selectedStadiumId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                New Stadium
              </button>
            ) : null
          }
        >
          {loading ? (
            <AdminLoadingState title="Loading stadiums" message="Fetching venue, sport, and league data." />
          ) : error ? (
            <AdminErrorState title="Unable to load stadiums" message={error} />
          ) : stadiums.length === 0 ? (
            <AdminEmptyState title="No stadiums yet" message="Create a stadium so events can reference a venue." />
          ) : (
            <div className="space-y-3">
              {stadiums.map((stadium) => (
                <button
                  key={stadium.id}
                  type="button"
                  onClick={() => beginEdit(stadium)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    selectedStadiumId === stadium.id
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{stadium.name}</div>
                      <div className="mt-1 text-xs text-white/50">
                        {stadium.city}, {stadium.state ?? stadium.country} • {stadium.timezone}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stadium.isActive ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>
                      {stadium.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard
          title={selectedStadiumId ? "Edit Stadium" : "Create Stadium"}
          description="Venue metadata stays lightweight, with multi-select links to relevant sports and leagues."
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
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="City"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                required
              />
              <TextField
                label="State"
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Country"
                value={form.country}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                required
              />
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
                required
              />
            </div>
            <TextField
              label="Address"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Latitude"
                type="number"
                step="any"
                value={form.lat}
                onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))}
              />
              <TextField
                label="Longitude"
                type="number"
                step="any"
                value={form.lng}
                onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))}
              />
            </div>
            <MultiSelectField
              label="Sports"
              value={form.sportIds}
              onChange={(value) => setForm((current) => ({ ...current, sportIds: value }))}
              hint="Hold Cmd/Ctrl to select multiple sports."
            >
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </MultiSelectField>
            <MultiSelectField
              label="Leagues"
              value={form.leagueIds}
              onChange={(value) => setForm((current) => ({ ...current, leagueIds: value }))}
              hint="Select the leagues that commonly use this venue."
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </MultiSelectField>
            <TextField
              label="Image URL"
              value={form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              placeholder="https://..."
            />
            <CheckboxField
              label="Stadium is active"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />

            <AdminActionRow
              isSaving={saving}
              submitLabel={selectedStadiumId ? "Update Stadium" : "Create Stadium"}
              onReset={resetForm}
            />
          </form>
        </AdminCard>
      </div>
    </AdminPageShell>
  );
}
