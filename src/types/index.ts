export type RuntimeContext = {
  requestId: string;
  ownerScope: { tenantId: string; userId: string };
  userToken: string;
  /** Optional per-user MCP endpoint override (preferred for simple setup flows). */
  mcpBaseUrl?: string;
  uiContext?: {
    locale?: string;
    timezone?: string;
    requestedDisplayNickname?: string;
    environment?: "unknown" | "private" | "shared" | "public";
  };
};

export type NormalizedDisplay = {
  assignmentId: string;
  displayId?: string;
  nickname: string;
  status?: string;
  leaseExpiresAt?: string;
  capabilities?: Record<string, unknown>;
};

export type ContentJob = {
  target: { assignmentId?: string; nickname?: string };
  slot: "primary" | "ticker" | "left" | "right";
  op: "REPLACE" | "APPEND";
  templateId:
    | "document.v2"
    | "stack.v2"
    | "cards.v2"
    | "pdf.v2"
    | "image.v2"
    | "imageGallery.v1"
    | "imageList.v1"
    | "list.v2"
    | "kv.v2"
    | "ticker.v2"
    | "chart.v2"
    | "alert.v2"
    | "youtube.v2";
  data: Record<string, unknown>;
};

export type ListDisplaysResult = {
  ok: boolean;
  displays: NormalizedDisplay[];
  reason?: string;
};

export type ClaimDisplayInput = {
  pairCode: string;
  nickname?: string;
  leaseMs?: number;
};

export type ClaimDisplayResult = {
  ok: boolean;
  assignmentId?: string;
  nickname?: string;
  display?: NormalizedDisplay;
  reason?: string;
  details?: string;
};

export type RevokeAssignmentInput = {
  assignmentId: string;
};

export type RevokeAssignmentResult = {
  ok: boolean;
  assignmentId: string;
  reason?: string;
};

export type RenewAssignmentInput = {
  assignmentId: string;
  leaseMs?: number;
};

export type RenewAssignmentResult = {
  ok: boolean;
  assignmentId: string;
  leaseUntil?: string;
  reason?: string;
};

export type PushContentResult = {
  ok: boolean;
  pushed?: unknown;
  degraded?: boolean;
  reason?: string;
  target?: { assignmentId?: string; nickname?: string; slot?: string };
};

export type HelpResult = {
  ok: boolean;
  project: string;
  vendor: string;
  what: string;
  displayEntryUrl: string;
  pairing: string[];
  support: {
    email: string;
    referenceSite: string;
  };
  notes: string[];
};
