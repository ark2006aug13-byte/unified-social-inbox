import type {
  Integration,
  Message,
  ReplyResponse,
  SessionResponse,
  SummaryResponse,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.details || payload.error || payload.message || message;
    } catch (_error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function redirectToBackend(path: string) {
  window.location.href = `${API_BASE_URL}${path}`;
}

export const authApi = {
  getSession() {
    return apiFetch<SessionResponse>("/auth/me");
  },
  async logout() {
    await apiFetch<void>("/auth/logout", {
      method: "POST",
    });
  },
  loginWithGoogle() {
    redirectToBackend("/auth/google");
  },
};

export const messageApi = {
  list(params?: { q?: string; provider?: string; category?: string }) {
    const search = new URLSearchParams();

    if (params?.q) search.set("q", params.q);
    if (params?.provider) search.set("provider", params.provider);
    if (params?.category) search.set("category", params.category);

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiFetch<{ messages: Message[] }>(`/api/messages${suffix}`);
  },
  get(id: string) {
    return apiFetch<{ message: Message }>(`/api/messages/${id}`);
  },
};

export const gmailApi = {
  connect() {
    redirectToBackend("/api/gmail/connect");
  },
  list(params?: { q?: string; sync?: boolean }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.sync) search.set("sync", "true");

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiFetch<Message[] | { messages: Message[] }>(`/api/gmail/messages${suffix}`);
  },
  sync(maxResults = 20) {
    return apiFetch<{ synced: number; messages: Message[] }>("/api/gmail/sync", {
      method: "POST",
      body: JSON.stringify({ maxResults }),
    });
  },
};

export const aiApi = {
  summary(input: {
    messageId?: string;
    message?: string;
    provider?: string;
    sender?: string;
    subject?: string;
  }) {
    return apiFetch<SummaryResponse>("/api/ai/summary", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  reply(input: { messageId?: string; message?: string; tone?: string }) {
    return apiFetch<ReplyResponse>("/api/ai/reply", {
      method: "POST",
      body: JSON.stringify({
        messageId: input.messageId,
        message: input.message,
        tone: input.tone || "professional",
      }),
    });
  },
};

export const integrationApi = {
  list() {
    return apiFetch<{ integrations: Integration[] }>("/api/integrations");
  },
};
