export type ConnectedAccount = {
  id: string;
  provider: string;
  status: string;
  connectedAt: string;
  expiry: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
  connectedAccounts: ConnectedAccount[];
};

export type Message = {
  id: string;
  externalId: string;
  provider: string;
  platform?: string;
  sender: string;
  subject: string | null;
  snippet: string | null;
  body: string;
  message?: string;
  preview?: string;
  timestamp: string;
  labels: string[];
  threadId: string | null;
  isRead: boolean;
  aiCategory: string | null;
  aiSummary: string | null;
  unreadCount?: number;
  conversation?: Array<{
    id: string;
    sender: string;
    body: string;
    timestamp: string;
    direction: "inbound" | "outbound";
  }>;
};

export type SummaryResponse = {
  summary: string;
  category: string;
  urgency: "low" | "medium" | "high";
  actionItems: string[];
};

export type ReplyOption = {
  title: string;
  body: string;
};

export type ReplyResponse = {
  reply?: string;
  suggestions?: ReplyOption[];
};

export type Integration = {
  key: string;
  name: string;
  description: string;
  status: "available" | "coming_soon";
  connected: boolean;
  connectedAt: string | null;
};
