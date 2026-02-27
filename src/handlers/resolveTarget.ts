import type { ContentJob, NormalizedDisplay, RuntimeContext } from "../types/index.js";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function resolveTarget(
  ctx: RuntimeContext,
  job: ContentJob,
  displays: NormalizedDisplay[]
) {
  if (job.target?.assignmentId) {
    const hit = displays.find((d) => d.assignmentId === job.target.assignmentId);
    return {
      assignmentId: job.target.assignmentId,
      nickname: hit?.nickname
    };
  }

  const jobNickname = job.target?.nickname || "";
  if (jobNickname) {
    const target = displays.find(
      (d) => normalizeName(d.nickname) === normalizeName(jobNickname)
    );
    if (target) return { assignmentId: target.assignmentId, nickname: target.nickname };
  }

  const requested = ctx.uiContext?.requestedDisplayNickname || "";
  if (requested) {
    const target = displays.find(
      (d) => normalizeName(d.nickname) === normalizeName(requested)
    );
    if (target) return { assignmentId: target.assignmentId, nickname: target.nickname };
  }

  const fallback = displays[0];
  if (fallback) return { assignmentId: fallback.assignmentId, nickname: fallback.nickname };

  return null;
}
