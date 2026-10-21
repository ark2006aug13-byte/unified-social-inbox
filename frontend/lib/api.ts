import type {
  DashboardResponse,
  Integration,
  IntegrationListResponse,
  Message,
  MessageListResponse,
  ReplyResponse,
  SessionResponse,
  SummaryResponse,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

/**
 * Error type that keeps the HTTP status and the structured field errors the
 * backend returns, so the UI can show a precise message instead of a generic
 * "something went wrong".
 */
export class ApiError extends Error {
  status: number;
  fieldErrors: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Array<{ field: string; message: string }> = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

function extractMessage(
  payload: Record<string, unknown> | null,
  fallback: string,
): string {
  if (!payload) {
    return fallback;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.details === "string" && payload.details.trim()) {
    return payload.details;
  }

  return fallback;
}

function extractFieldErrors(
  payload: Record<string, unknown> | null,
): Array<{ field: string; message: string }> {
  if (!payload || !Array.isArray(payload.details)) {
    return [];
  }

  return payload.details
    .filter(
      (entry): entry is { field: string; message: string } =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as { message?: unknown }).message === "string",
    )
    .map((entry) => ({
      field: entry.field ?? "form",
      message: entry.message,
    }));
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(
      "Cannot reach the backend. Check that the API is running and that NEXT_PUBLIC_API_BASE_URL is correct.",
      0,
    );
  }

  if (!response.ok) {
    let payload: Record<string, unknown> | null = null;

    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch (_error) {
      payload = null;
    }

    const message = extractMessage(
      payload,
      response.statusText || `Request failed with status ${response.status}`,
    );

    throw new ApiError(message, response.status, extractFieldErrors(payload));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (_error) {
    throw new ApiError("The backend returned an unreadable response.", response.status);
  }
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
  list(params?: { q?: string; provider?: string; category?: string; limit?: number }) {
    const search = new URLSearchParams();

    if (params?.q) search.set("q", params.q);
    if (params?.provider) search.set("provider", params.provider);
    if (params?.category) search.set("category", params.category);
    if (params?.limit) search.set("limit", String(params.limit));

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiFetch<MessageListResponse>(`/api/messages${suffix}`);
  },
  get(id: string) {
    return apiFetch<{ message: Message }>(`/api/messages/${encodeURIComponent(id)}`);
  },
};

export const gmailApi = {
  connect() {
    redirectToBackend("/api/gmail/connect");
  },
  list(params?: { q?: string; limit?: number }) {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.limit) search.set("limit", String(params.limit));

    const suffix = search.toString() ? `?${search.toString()}` : "";
    return apiFetch<Message[]>(`/api/gmail/messages${suffix}`);
  },
  sync(maxResults = 25) {
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
    return apiFetch<IntegrationListResponse>("/api/integrations");
  },
};

export const dashboardApi = {
  stats() {
    return apiFetch<DashboardResponse>("/api/dashboard");
  },
};

export type { Integration };
