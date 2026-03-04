import type { EnvironmentSetting, NormalizedDisplay } from "../types/index.js";
import { coerceEnvironment } from "../utils/environment.js";

type ListDisplaysResult = {
  devices?: Array<Record<string, unknown>>;
  count?: number;
};

const ENVIRONMENT_HINT_KEYS = [
  "environment",
  "defaultEnvironment",
  "environmentHint",
  "environmentTag",
  "deploymentEnvironment",
  "locationEnvironment"
];

const NESTED_ENV_SOURCES = [
  "assignment",
  "assignmentMeta",
  "deviceMeta",
  "metadata",
  "capabilities"
];

function coerceFromHint(value: unknown): EnvironmentSetting | undefined {
  const direct = coerceEnvironment(value);
  if (direct) return direct;
  if (value && typeof value === "object") {
    const container = value as Record<string, unknown>;
    const inner = container.value ?? container.name ?? container.label;
    return coerceEnvironment(inner);
  }
  return undefined;
}

function extractEnvironment(device: Record<string, unknown>): EnvironmentSetting | undefined {
  const sources: Array<unknown> = [device];
  for (const key of NESTED_ENV_SOURCES) {
    const candidate = (device as Record<string, unknown>)[key];
    if (candidate) sources.push(candidate);
  }

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const scoped = source as Record<string, unknown>;
    for (const key of ENVIRONMENT_HINT_KEYS) {
      if (!(key in scoped)) continue;
      const env = coerceFromHint(scoped[key]);
      if (env) return env;
    }
  }

  return undefined;
}

export function normalizeDisplay(device: Record<string, unknown>): NormalizedDisplay | null {
  const assignmentId = String(device.assignmentId || "").trim();
  if (!assignmentId) return null;
  const nickname = String(device.nickname || "").trim();
  if (!nickname) return null;

  const displayId = String(device.deviceId || device.displayId || "").trim();
  const status = typeof device.status === "string" ? device.status : undefined;
  const leaseExpiresAt =
    typeof device.leaseExpiresAt === "string" ? device.leaseExpiresAt : undefined;
  const environment = extractEnvironment(device);

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
    environment,
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
