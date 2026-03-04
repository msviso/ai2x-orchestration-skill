import type {
  ContentJob,
  NormalizedDisplay,
  ResolvedTarget,
  RuntimeContext
} from "../types/index.js";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function fromDisplay(display: NormalizedDisplay): ResolvedTarget {
  return {
    assignmentId: display.assignmentId,
    nickname: display.nickname,
    environment: display.environment
  };
}

function fallbackTarget(
  assignmentId: string,
  nickname?: string,
  environment?: ResolvedTarget["environment"]
): ResolvedTarget {
  return {
    assignmentId,
    ...(nickname ? { nickname } : {}),
    ...(environment ? { environment } : {})
  };
}

export function resolveTarget(
  ctx: RuntimeContext,
  job: ContentJob,
  displays: NormalizedDisplay[]
): ResolvedTarget | null {
  if (job.target?.assignmentId) {
    const hit = displays.find((d) => d.assignmentId === job.target.assignmentId);
    if (hit) return fromDisplay(hit);
    const nickname = job.target.nickname || job.target.assignmentId;
    return fallbackTarget(job.target.assignmentId, nickname, ctx.uiContext?.environment);
  }

  const jobNickname = job.target?.nickname || "";
  if (jobNickname) {
    const target = displays.find(
      (d) => normalizeName(d.nickname) === normalizeName(jobNickname)
    );
    if (target) return fromDisplay(target);
  }

  const requested = ctx.uiContext?.requestedDisplayNickname || "";
  if (requested) {
    const target = displays.find(
      (d) => normalizeName(d.nickname) === normalizeName(requested)
    );
    if (target) return fromDisplay(target);
  }

  const fallback = displays[0];
  if (fallback) return fromDisplay(fallback);

  return null;
}
