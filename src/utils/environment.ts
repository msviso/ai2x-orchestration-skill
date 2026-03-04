import type { EnvironmentSetting, RuntimeContext } from "../types/index.js";

const ENV_ORDER: Record<EnvironmentSetting, number> = {
  unknown: 0,
  public: 1,
  shared: 2,
  private: 3
};

const ENV_ALIASES: Record<string, EnvironmentSetting> = {
  unknown: "unknown",
  public: "public",
  shared: "shared",
  private: "private",
  confidential: "private",
  secure: "private",
  trusted: "private",
  residence: "private",
  office: "shared",
  workspace: "shared",
  studio: "shared",
  lobby: "public",
  atrium: "public",
  kiosk: "public"
};

export function coerceEnvironment(value: unknown): EnvironmentSetting | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return ENV_ALIASES[normalized] || undefined;
}

export function strictestEnvironment(
  values: Array<EnvironmentSetting | undefined>
): EnvironmentSetting | undefined {
  let candidate: EnvironmentSetting | undefined;
  let score = Number.POSITIVE_INFINITY;
  for (const value of values) {
    if (!value) continue;
    const rank = ENV_ORDER[value];
    if (rank < score) {
      candidate = value;
      score = rank;
    }
  }
  return candidate;
}

export function applyEnvironmentToContext(
  ctx: RuntimeContext,
  environment?: EnvironmentSetting
): RuntimeContext {
  if (!environment) return ctx;
  const current = ctx.uiContext?.environment;
  if (current === environment) return ctx;
  return {
    ...ctx,
    uiContext: {
      ...(ctx.uiContext || {}),
      environment
    }
  };
}
