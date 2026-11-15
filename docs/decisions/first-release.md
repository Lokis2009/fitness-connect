# First-release product decisions

Updated: 2026-11-15
Source: product-owner discussion on 2026-11-15.

This log records confirmed owner choices separately from recommendations. The [PRD](../prd/scheduled-in-person-sessions.md) describes their proposed product experience. Technical decisions remain in [Architecture.md](../../Architecture.md).

## Confirmed decisions

| ID | Decision | Owner confirmation | Consequence |
|---|---|---|---|
| PDR-001 | Prioritize scheduled sessions for the first release. | "scheduled sessions" | Build availability and booking first. On-demand dispatch remains a longer-term capability. |
| PDR-002 | First-release sessions are in person. | "agree with 'in person'" | Provide venue and meeting details. Defer online/video sessions. |
| PDR-003 | Trainer approval is required for each booking. | "I prefer trainer approval" | A request is pending until accepted. Submission is not confirmation; instant booking is outside first-release scope. |
| PDR-004 | Defer platform payments; assume clients pay trainers in person. | "payment is frozen, we'll introduce it later, assume thet pay in person" | Do not build checkout, deposits, commissions, refunds, payouts, or payment verification now. Future provider/model decisions do not block this release's payment flow. |
| PDR-005 | Trainer response window is 24 hours. | "24 hours is okay" | An unanswered request expires after 24 elapsed hours. This does not approve the separately suggested 48-hour minimum booking notice. |

These decisions narrow first-release scope; they do not remove on-demand, video, or platform payments from the longer-term product vision.

## Recommendations not yet approved

| Recommendation | Status |
|---|---|
| Minimum 48 hours' advance notice for a booking request | Proposed; do not implement as a confirmed requirement. |
| Reserve a trainer's slot while a request is pending | Proposed; decide before booking concurrency and availability rules. |
| One listed venue per trainer in the pilot | Proposed; venue cardinality remains open. |
| Manual admin verification before trainers become bookable | Proposed; verification requirements and gating remain open. |
| Browse before sign-in; preserve booking price/details; send reminders; review and rebook | Proposed experience described in the PRD; not separately approved. |

Silence and agreement to a neighboring decision do not approve these recommendations. Exact open questions are maintained in PRD section 10.

## Relationship to existing documents

- Architecture D8/D9 describe the broader matching/session vision; the first-release qualification now points to PDR-001/PDR-002.
- Architecture D11 describes the future payment boundary; PDR-004 explicitly defers its implementation.
- The foundation plan is historical context for the implemented login foundation, not a current missing-work list.
- The trainer-web plan is a broader roadmap. Its dispatch, video, and payment phases are deferred; its old starting-point inventory is historical.

## Updating this log

Record future owner-approved decisions with a stable ID, rationale or confirmation, and scope consequences. When a decision changes, preserve the old entry and mark it superseded by the replacement. Move approved proposals into the confirmed table and update the PRD and relevant architecture references together.
