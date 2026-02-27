# Multi-Agent Playbook (AI2X)

Goal: multiple agents can collaborate without stepping on each other.

## State model
Maintain a single source of truth in the calling orchestration layer:
- displaySession.assignmentId
- displaySession.nickname
- displaySession.leaseUntil (if available)
- displaySession.lastPush (templateId + ts)

## Recommended workflow
1) Pairing
   - Ask user to open https://AI2X.link on the display and share the 6-digit pair code.
   - Call `ai2x_multi.claim_display`.

2) Push content
   - Prefer `ai2x_multi.orchestrate_display`.
   - Use `ai2x_multi.push_content` only for templates not supported by orchestrateDisplay (e.g. pdf.v2) or when you must send exact payloads.

3) Lease / renew
   - Do not auto-renew in background unless user requests.
   - If user says “still viewing”: call `ai2x_multi.renew_assignment`.

## Failure handling
- PAIR_CODE_NOT_FOUND: ask for a new code (pair codes expire/one-time).
- delivery ok=false: re-pair and retry.
- schema/enum errors: verify template input shape (document=body; stack=blocks kinds).

## Safety
- Never paste tokens.
- Treat displays as public/untrusted unless explicitly marked private.
