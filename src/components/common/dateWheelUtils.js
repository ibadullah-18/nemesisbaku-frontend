const pad = n => String(n).padStart(2, "0");
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
export function readDateParts(value) {
  return { year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)), day: Number(value.slice(8, 10)), hour: Number(value.slice(11, 13)) || 0, minute: Number(value.slice(14, 16)) || 0 };
}
export function writeDateParts(parts, withTime = false) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}${withTime ? `T${pad(parts.hour)}:${pad(parts.minute)}` : ""}`;
}
export function clampDateParts(parts, min, max, withTime = false) {
  const next = { ...parts, day: Math.min(parts.day, new Date(parts.year, parts.month, 0).getDate()) };
  const value = writeDateParts(next, withTime);
  if (min && value < min) return readDateParts(min);
  if (max && value > max) return readDateParts(max);
  return next;
}
export function dateWheelBounds(parts, min, max, currentYear) {
  const lower = min ? readDateParts(min) : null;
  const upper = max ? readDateParts(max) : null;
  const sameMinMonth = lower && parts.year === lower.year && parts.month === lower.month;
  const sameMaxMonth = upper && parts.year === upper.year && parts.month === upper.month;
  const sameMinDay = sameMinMonth && parts.day === lower.day;
  const sameMaxDay = sameMaxMonth && parts.day === upper.day;
  return {
    year: [lower?.year ?? Math.min(1900, parts.year), upper?.year ?? Math.max(currentYear + 30, parts.year)],
    month: [lower && parts.year === lower.year ? lower.month : 1, upper && parts.year === upper.year ? upper.month : 12],
    day: [sameMinMonth ? lower.day : 1, sameMaxMonth ? upper.day : new Date(parts.year, parts.month, 0).getDate()],
    hour: [sameMinDay ? lower.hour : 0, sameMaxDay ? upper.hour : 23],
    minute: [sameMinDay && parts.hour === lower.hour ? lower.minute : 0, sameMaxDay && parts.hour === upper.hour ? upper.minute : 59],
  };
}
