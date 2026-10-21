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

export type ProviderKey =
  | "gmail"
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "twitter";

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
  urgency?: string | null;
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
  persisted?: boolean;
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
  expiresAt?: string | null;
};

export type IntegrationListResponse = {
  integrations: Integration[];
  demoMode?: boolean;
};

export type ProviderBreakdown = {
  provider: string;
  count: number;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
};

export type ActivityPoint = {
  date: string;
  label: string;
  total: number;
  unread: number;
};

export type DashboardStats = {
  total: number;
  unread: number;
  categorized: number;
  summarized: number;
  channels: number;
  connectedAccounts: number;
};

export type DashboardResponse = {
  stats: DashboardStats;
  byProvider: ProviderBreakdown[];
  byCategory: CategoryBreakdown[];
  activity: ActivityPoint[];
  recent: Message[];
};

export type MessageListResponse = {
  messages: Message[];
  count?: number;
};
