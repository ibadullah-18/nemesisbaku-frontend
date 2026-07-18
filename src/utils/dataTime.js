export function toLocalDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

export function localDateTimeToIso(value) {
  if (!value) return null;

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) throw new Error("Tarix formatı düzgün deyil.");

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tarix formatı düzgün deyil.");
  }

  return date.toISOString();
}

export function isEndAfterStart(startIso, endIso) {
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}
