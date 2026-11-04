import { API_URL } from "./brand";

export type AuthSessionResponse = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
};

const SESSION_KEY = "insurance.session";
let refreshInProgress: Promise<string | null> | null = null;

type StoredSession = AuthSessionResponse & { expires_at: number };

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    return session.access_token && session.refresh_token && Number.isFinite(session.expires_at) ? session : null;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(data: Partial<AuthSessionResponse>) {
  if (typeof window === "undefined" || !data.access_token || !data.refresh_token) return false;
  const expiresAt = data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  }));
  return true;
}

export function clearSession() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(SESSION_KEY);
}

async function refreshSession(session: StoredSession): Promise<string | null> {
  const response = await fetch(`${API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (response.status === 401) {
    clearSession();
    return null;
  }
  if (!response.ok) throw new Error("Unable to refresh your session. Please try again.");
  const refreshed = await response.json() as Partial<AuthSessionResponse>;
  if (!saveSession(refreshed)) {
    clearSession();
    return null;
  }
  return refreshed.access_token ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  const session = readSession();
  if (!session) return null;
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session.access_token;
  if (!refreshInProgress) {
    refreshInProgress = refreshSession(session).finally(() => { refreshInProgress = null; });
  }
  return refreshInProgress;
}
