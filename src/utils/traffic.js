export const SESSION_IDLE_MS = 30 * 60 * 1000;
export function nextTrafficSession(previous, now, makeId) {
  return { id: previous?.id && now >= previous.lastActivity && now - previous.lastActivity < SESSION_IDLE_MS
    ? previous.id : makeId(), lastActivity: now };
}
export function isCustomerPath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") &&
    !/^\/(admin|superadmin|api|tests)(\/|$)/i.test(path);
}
export function trafficDateRange(start, end) {
  return { from: start ? `${start}T00:00:00+04:00` : undefined,
    to: end ? new Date(new Date(`${end}T00:00:00+04:00`).getTime() + 86400000).toISOString() : undefined };
}
