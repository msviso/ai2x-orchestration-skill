import type { NormalizedDisplay } from "../types/index.js";

type ListDisplaysResult = {
  devices?: Array<Record<string, unknown>>;
  count?: number;
};

export function normalizeDisplay(device: Record<string, unknown>): NormalizedDisplay | null {
  const assignmentId = String(device.assignmentId || "").trim();
  if (!assignmentId) return null;
  const nickname = String(device.nickname || "").trim();
  if (!nickname) return null;

  const displayId = String(device.deviceId || device.displayId || "").trim();
  const status = typeof device.status === "string" ? device.status : undefined;
  const leaseExpiresAt =
    typeof device.leaseExpiresAt === "string" ? device.leaseExpiresAt : undefined;

  const capabilities: Record<string, unknown> = {};
  const capKeys = [
    "trustTier",
    "trustLevel",
    "riskLevel",
    "matchedRule",
    "trustNote",
    "ip",
    "deviceMeta",
    "connected",
    "lastSeen"
  ];
  for (const key of capKeys) {
    if (device[key] !== undefined) capabilities[key] = device[key];
  }

  return {
    assignmentId,
    displayId: displayId || undefined,
    nickname,
    status,
    leaseExpiresAt,
    capabilities: Object.keys(capabilities).length ? capabilities : undefined
  } as NormalizedDisplay;
}

function pickResult(envelope: any): ListDisplaysResult {
  if (!envelope) return {};
  if (typeof envelope.ok === "boolean" && envelope.result) return envelope.result;
  if (envelope.result) return envelope.result;
  return envelope;
}

export function normalizeDisplays(envelope: any): NormalizedDisplay[] {
  const result = pickResult(envelope);
  const devices = Array.isArray(result.devices) ? result.devices : [];

  return devices
    .map((device) => normalizeDisplay(device))
    .filter((d): d is NormalizedDisplay => !!d);
}
