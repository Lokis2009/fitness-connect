# First-release product decisions

Updated: 2026-11-15
Source: product-owner discussions on 2026-11-15 (initial scope, then PRD review follow-up).

This log records confirmed owner choices separately from recommendations. The [PRD](../prd/scheduled-in-person-sessions.md) describes their product experience. Technical decisions remain in [Architecture.md](../../Architecture.md).

## Confirmed decisions

| ID | Decision | Owner confirmation | Consequence |
|---|---|---|---|
| PDR-001 | Prioritize scheduled sessions for the first release. | "scheduled sessions" | Build availability and booking first. On-demand dispatch remains a longer-term capability. |
| PDR-002 | First-release sessions are in person. | "agree with 'in person'" | Provide venue and meeting details. Defer online/video sessions. |
| PDR-003 | Trainer approval is required for each booking. | "I prefer trainer approval" | A request is pending until accepted. Submission is not confirmation; instant booking is outside first-release scope. |
| PDR-004 | Defer platform payments; assume clients pay trainers in person. | "payment is frozen, we'll introduce it later, assume thet pay in person" | Do not build checkout, deposits, commissions, refunds, payouts, or payment verification now. Future provider/model decisions do not block this release's payment flow. |
| PDR-005 | Trainer response window is 24 hours. **Superseded by PDR-006.** | "24 hours is okay" | An unanswered request expired after 24 elapsed hours. Kept for history. |
| PDR-006 | Trainer response window is 1 hour for every request. Supersedes PDR-005. | "3h booking window, and 1h approval. which means traner should answer quickly" | An unanswered request expires 1 hour after submission, whatever the session date. Trainers must be alerted reliably (PDR-012). |
| PDR-007 | A request must be submitted at least 3 hours before the session starts. | "3h booking window" (read as minimum notice and confirmed in review) | Closes PRD open question O1. The earlier 48-hour suggestion is dropped. Because the response window (1 hour) is shorter than the minimum notice (3 hours), an approval can never be pending at session start. |
| PDR-008 | A pending request holds the trainer's slot. No cap on pending requests per client. | "Hold without caps" | The slot is released on decline, expiry, or withdrawal. A second client cannot request a held slot. Closes O2. |
| PDR-009 | Trainers become bookable after a manual admin approval flag. | "Admin approve flag" | Trainer submits profile; admin approves or requests changes with a reason. Credentials are collected outside the app. No document upload in the first release. Closes O3. |
| PDR-010 | Either party may cancel a confirmed booking. The cutoff is 3 hours before start. | "Either party, cutoff before start", "3 hours" | A later cancellation is still allowed but is flagged in the booking history. No platform penalties, because money moves outside the platform. Closes O5. |
| PDR-011 | The trainer records session completion. The client can dispute it, which creates an issue for the admin. | "Trainer, client can dispute" | An issue is a client dispute of a recorded outcome. Admin sees it with the booking history. Closes O8 for completion. No-show handling is not part of this decision. |
| PDR-012 | Trainer request alerts go by email and in-app, as a prerequisite of the 1-hour window. | "Email plus in-app" | Reminders, SMS and push stay out of scope until decided (O6 narrowed). |
| PDR-013 | Exact venue address and meeting instructions are shown only after acceptance. | "Only after acceptance" | The public profile shows the venue name and area only. Address and instructions are hidden again after cancellation. |
| PDR-014 | A trainer cannot save an availability change that conflicts with pending or confirmed bookings until they are resolved. | "Block until resolved" | No silent cancellation. |
| PDR-015 | In first-release scope: client withdrawal of a pending request, cancellation of a confirmed booking, and trainer-recorded completion. | Selected "Client withdraws pending", "Cancel confirmed booking", "Record completion" | Reviews, rebooking and the "clients who return" metric are not in the first release (see below). |
| PDR-016 | The word "pilot" is dropped. The document says "first release". Production authentication is required before any real user signs in. | "Drop 'pilot'" | Replaces the "public pilot" auth gate in PRD acceptance item 7. |

These decisions narrow first-release scope; they do not remove on-demand, video, or platform payments from the longer-term product vision.

## Recommendations not yet approved

| Recommendation | Status |
|---|---|
| One listed venue per trainer | Proposed; venue cardinality remains open (O4). |
| Browse before sign-in | Proposed; search filters and minimum client profile remain open (O9). |
| Reviews after attendance and rebooking | Not in the first release (PDR-015). Revisit after the first release. |
| Reminders before a session | Proposed; channels and timing remain open (O6). |
| No-show reporting and its dispute handling | Open; not covered by PDR-011. |
| Preserve the booking's agreed price, duration and venue after profile edits | Proposed; "material change" rule remains open. |
| Keep a status history with actor, time and reason | Proposed. |

Silence and agreement to a neighboring decision do not approve these recommendations. Exact open questions are maintained in PRD section 10.

## Relationship to existing documents

- Architecture D8/D9 describe the broader matching/session vision; the first-release qualification now points to PDR-001/PDR-002.
- Architecture D11 describes the future payment boundary; PDR-004 explicitly defers its implementation.
- The foundation plan is historical context for the implemented login foundation, not a current missing-work list.
- The trainer-web plan is a broader roadmap. Its dispatch, video, and payment phases are deferred; its old starting-point inventory is historical. Its document-upload verification default does not apply (PDR-009).
- Architecture's `booking` lifecycle (requested, confirmed, completed, cancelled) needs updating at feature breakdown to match the PRD states.

## Updating this log

Record future owner-approved decisions with a stable ID, rationale or confirmation, and scope consequences. When a decision changes, preserve the old entry and mark it superseded by the replacement. Move approved proposals into the confirmed table and update the PRD and relevant architecture references together.
