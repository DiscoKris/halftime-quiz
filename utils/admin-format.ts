export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toDateTimeLocalValue(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  return value ? new Date(value) : null;
}

export function parseCommaSeparatedList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
