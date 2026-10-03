import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../../api/apiFetch";
import { generateId } from "../../utils/generateId";
import { isCustomerPath, nextTrafficSession } from "../../utils/traffic";

const memory = new Map();
function read(key) { try { return localStorage.getItem(key) ?? memory.get(key); } catch { return memory.get(key); } }
function write(key, value) { memory.set(key, value); try { localStorage.setItem(key, value); } catch { /* Private browsing fallback. */ } }
function excluded() {
  return import.meta.env.DEV || ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname) || navigator.webdriver ||
    Boolean(read("nemesis_admin_access_token") || read("nemesis_superadmin_access_token")) ||
    /bot|crawler|spider|headless|lighthouse|pagespeed/i.test(navigator.userAgent);
}
let lastNavigation = null;
let lastActivityWrite = 0;
function session(force = false) {
  const now = Date.now();
  let previous;
  try { previous = JSON.parse(read("nemesis_traffic_session") || "null"); } catch { previous = null; }
  const next = nextTrafficSession(previous, now, generateId);
  if (force || now - lastActivityWrite > 1000) {
    write("nemesis_traffic_session", JSON.stringify(next)); lastActivityWrite = now;
  }
  return next.id;
}

export default function TrafficTracker() {
  const { pathname, search, key } = useLocation();
  useEffect(() => {
    if (!isCustomerPath(pathname) || excluded()) return;
    const navigation = `${key}:${pathname}:${search}`;
    // Scheduling avoids duplicate effect setup in React StrictMode.
    const timer = setTimeout(() => {
      if (lastNavigation === navigation) return;
      lastNavigation = navigation;
      let visitorId = read("nemesis_visitor_id");
      if (!visitorId) { visitorId = generateId(); write("nemesis_visitor_id", visitorId); }
      const body = JSON.stringify({ visitorId, sessionId: session(true), eventId: generateId(), pageUrl: pathname });
      // Retrying uses the same event ID: the server counts it only once.
      const send = () => apiFetch("/api/Stats/track-visit", { method: "POST", body });
      send().catch(() => send().catch(() => {}));
    }, 0);
    const activity = () => { if (Date.now() - lastActivityWrite < 1000) return; if (!document.hidden && !excluded()) session(); };
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity, { passive: true });
    window.addEventListener("scroll", activity, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity);
    };
  }, [key, pathname, search]);
  return null;
}
