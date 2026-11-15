# Consolidated Review Report

**Target:** `docs/prd/scheduled-in-person-sessions.md` (192 lines, full file)
**Mode:** Consolidated run, no checkpoints. One review round per stage, no fixes applied. The PRD was not modified.
**Context given to reviewers (except Stage 6):** `docs/decisions/first-release.md`, `docs/plans/trainer-web.md`, `docs/plans/phase-1-repo-foundation.md`, `Architecture.md`.

## What ran

| Stage | Report | Reviewers | Raw findings (B / M / N) |
| --- | --- | --- | --- |
| 5 Initial Zoom Out | `zoom_out_report.md` | zoom-out, inventive-catalyst | 0 / 7 / 13 |
| 6 Comprehension Test | `comprehension_report.md` | comprehension (document alone) | 0 / 8 / 4 |
| 7 Critic Review | `critic_report.md` | design, structural, style | 1 / 11 / see note |
| 8 Intermediate Zoom Out | `intermediate_zoom_out_report.md` | zoom-out | 0 / 1 / 5 |
| 9 Implementation Readiness | not run | n/a | n/a |

All reviewers completed. None was recorded as `not run`.

Notes on the counts:
- Stage 7's report header says 14 Nits but lists 12 headed entries (some merge several findings). The 12 are used here.
- Stage 6 labels finding 8 "Minor-to-Major (reported as Major)". It is counted as a Major.
- Stage 9 was skipped because the PRD has no implementation-plan section (no `## Implementation Plan` or equivalent header), so there is no `DetailedRange` to test. The PRD itself says it does not split work into features or tickets (L12).

## Reading guide: where reviewers disagree

- **Stage 7 Blocker ("No Alternatives Considered section")**: Stage 8 downgrades it to a Nit. The Blocker comes from `feature-spec-standard`, which is written for technical specs. Stage 7's own overlap note says the Blocker drops if the PRD is exempt from that standard. This report follows Stage 8 but marks it as an **owner decision** (A-12), because only the owner can say whether the standard applies to product PRDs.
- **Stage 7 "Risks & Mitigations" Major**: Stage 8 says a risk table is too heavy for this PRD and keeps only three rules. This report follows Stage 8 (A-7, A-12).
- **Stage 6 finding 1 (missing system baseline)**: Stage 8 says a one-line fix at L34 is enough, not a new section (A-9).
- **Stage 7 claim that Architecture 6.1 "implies a hold at creation"**: Stage 8 says Architecture 6.1 only requires transactional double-booking protection and does not reserve slots for pending requests. This report follows Stage 8.
- **Line numbers**: Stage 8 found that some line references in Stages 6 and 7 are off by a few lines. Anchor each fix by section or quoted text, not by line number.

## Consolidated action items

### 🔴 Blocker (confirmed text cannot be implemented as written)

**A-1. The fixed 24-hour expiry collides with session start.**
- L116 says the deadline is submission plus 24 elapsed hours (PDR-005). L136 says "never leave approval pending after session start". No minimum notice is approved (O1, L24, L179), so a request for a session a few hours away cannot satisfy both.
- L136 also floats "a shorter response deadline", which would reopen PDR-005 without saying so. Acceptance item 2 ("the correct deadline") cannot be tested.
- Fix: choose one rule and record it. Options raised: deadline = earlier of (submission + 24h) and (session start minus a buffer); or only offer slots far enough ahead that the case never arises (this is O1). Treat any change to the 24-hour rule as an owner decision that supersedes PDR-005 wording. Mark the "never pending after session start" sentence as Proposed until then. Reword L116 to "up to 24 hours" or make it conditional on O1.

**A-2. Competing requests for the same slot have no defined outcome (O2).**
- Without a hold, several clients can have pending requests for one time. When the trainer accepts one, the others are neither declined nor expired, and the lifecycle (L104-112) has no state for them. A trainer-accept that fails against an existing confirmed booking has no state either.
- With a hold, one client can block a trainer's calendar for 24 hours with several free requests. The PRD frames the choice as hold or no hold (L124) and names one trade-off.
- Fix: make O2 a must-decide before feature breakdown. Add a one-line rule for the losing request under both options, for example a "Superseded" or "slot taken" reason that is not an expiry. Apply the hard no-overlap guarantee to Confirmed bookings only (Architecture 6.1 already requires this; relabel L125 "atomic" as derived, not proposed). If a hold is kept, add a cap on pending requests per client and per client per trainer.

### 🟡 Major

**A-3. Release scope and acceptance criteria rest on unapproved proposals.**
- Acceptance item 1 needs "the agreed ... verification process" (O3 is not approved). Item 6 needs cancellation, notification and outcome flows "end to end" (O5, O6, O8 are undefined). Section 5 lists reviews, rebooking, reminders and completion as required. L8 promises a client "returning for another booking", while L68 hedges "if those capabilities are retained", and the "clients who return" metric (L161) assumes it. A confirmed booking may have no way to be cancelled.
- Fix: split Section 5 and Section 9 into a **core** tier (what follows from PDR-001 to PDR-005, plus the L191 outcome: one trainer publishing availability, one client receiving an accepted booking) and a **decide in or out** tier (reviews, rebook, reminders, completion and no-show, withdrawal and cancellation, admin dispute handling). Limit L8 to the confirmed core. Align the metrics and acceptance items to whatever is retained. Resolve L8 against L68 in one direction.

**A-4. One status marker for provenance (confirmed, derived, proposed, open).** This is Stage 8's single structural fix and covers many separate findings.
- Over-claimed: "Confirmed requirements" include derived rules (the Declined state, Expired as a separate state, "new request needed", trainer-only decisions, four visible states). Under-claimed: L129 sits under Proposed although PDR-004 covers it. Unlabelled absolutes sit inside Open rows ("never overlap", "no silent cancellation"). "Agreed" is used for unapproved items at L82, L165 and L191. The flowchart draws proposed steps like settled ones. The PRD never cites PDR IDs.
- Fix: add a Status column (Confirmed PDR-xxx / Derived from PDR-xxx / Proposed / Open Ox) to the Section 5 table and to the Section 6 and 7 rules. Style the proposed flowchart nodes. Replace "agreed" with "proposed" or "to be agreed". Reserve "confirmed" for PDR items. Define request and booking as one status-bearing record, with completion stored on it (one sentence near L112).

**A-5. The precedence clause covers unapproved content.**
- L10 says the PRD "defines the proposed product experience" and that its decisions "take precedence" over older plans. A reader could conclude that unapproved items such as manual verification override the older defaults. L10 also says the decision log holds "rationale", but the log holds owner confirmations.
- Fix: limit precedence to the Section 2 decisions (PDR-001 to PDR-005). State that proposals carry no precedence until approved. Say which wins if the PRD and the decision log disagree. Change "rationale" to "owner confirmations".

**A-6. The confirmed 24-hour rule depends on an unapproved trainer alert (O6).**
- If the trainer is never told a request exists, requests expire for avoidable reasons, and the "expired unanswered" metric (L159) measures notification gaps as much as trainer behavior. In-app status being authoritative (L143) does not tell the trainer to look. Trainers are mostly on phones, and iOS web push is limited.
- Fix: state a minimum trainer request alert, and a client decision alert, as a prerequisite of PDR-005 (email plus in-app is already modeled in Architecture 5). Keep reminders, SMS and push as candidates. Move O6 earlier in the dependency order, or mark the 24-hour rule as dependent on it.

**A-7. Section 10 is not a complete register of open decisions.**
- The decision log says open questions live in Section 10. About ten Open or Proposed items have no O-ID: availability changes after a request (L138), maps and exact filters, what counts as a "material" change (L142), status-change history, the shorter-deadline option, "offer another slot" (L135), the time-zone display rule, placement of recurring bookings, packages, chat and calendar sync (L152), and address disclosure.
- Stage 8 narrows the "Risks" ask to three product rules, which should become Open items: (1) what is public before sign-in versus released after acceptance (exact address, contact details; tie to O9, and a minimum client profile shown to the trainer); (2) a cap on pending requests (tie to O2); (3) the trainer-alert prerequisite (A-6). For availability changes, require explicit resolution of affected bookings before saving.
- Fix: give each remaining item an O-ID or link its Section 7 row to one, or say Section 10 is not exhaustive. Keep one authoritative "not approved" list shared with the decision log.

**A-8. "Pilot", "first release" and "public pilot" are used interchangeably, with a security consequence.**
- Acceptance item 7 (L171) requires production auth "before a public pilot", which implies a non-public pilot with real users could run on development auth. L90 says development auth is not production authentication. Architecture says to connect Cognito "before a real-user launch". Pilot size and duration are never given, and success targets wait on them (L156).
- Fix: define one term (for example pilot = invited real users, release = public). Require production auth for any session with real users, or state exactly what a private pilot may use. Align Architecture "Next steps" item 4.

**A-9. The existing-system baseline is overstated or missing.**
- L34 says the existing apps "provide the delivery surfaces". They are login shells with a placeholder home. A reader could assume booking, availability or review screens partly exist. L185 lists city and language as open (O7) while calling them decided.
- Fix: one line at L34, for example "Three web app shells with login exist; all product screens are new." Note the admin app needs at least a trainer-approval screen if O3 stays manual review. Narrow O7 to the values that are open. Do not add a system-description section.

**A-10. Trainer verification (O3) may inherit heavy Phase 4 scope.**
- The older plan assumes document upload, a multi-step wizard and a resubmit screen. For a single-city pilot an admin approve or request-changes flag, with credentials collected out of band, may be enough. The older documents also list "document upload plus manual admin review" as a default, which can be mistaken for approval.
- Fix: add a "simplest acceptable verification" option under O3. Add one sentence saying planning defaults in the other documents are not approvals. Section 4 stops at "approve or request changes"; state whether rejection or suspension is in scope.

**A-11. The admin and outcome flows have no named actor or definition.**
- The flowchart step "Record session completion" has no actor (O8 is open). "Report an issue" appears for trainers and admins (L76, L82) without a definition and is not in the capabilities table. Acceptance item 6 requires outcome flows "end to end" without naming them. Several items use "cancelled" (a booking status) next to completed or no-show (outcomes) as if they were one set (L161).
- Fix: define "issue" in one line or add it as an open item. Mark S2 and S3 in the diagram as unapproved. Name the flows in criterion 6, or state it cannot be accepted until O5 and O8 are decided. Keep dispute handling out of the core.

**A-12. Owner decision: does the feature-spec standard apply to this PRD? (Alternatives and risks)**
- Stage 7 raised a Blocker for a missing "Alternatives considered" section and a Major for a missing "Risks & Mitigations" section. Stage 8 rates them Nits for this PRD and recommends against adding both sections, because the PRD defers feature splitting and the rejected options are already covered by Architecture D8, D9 and D11 and by Section 10.
- Fix if exempt (recommended by Stage 8): add one sentence saying this PRD records confirmed decisions plus open questions, and that rationale for rejected options lives in the decision log and Section 10. Add a one-line trade-off to the "Current proposal" column for O1, O2 and O4 only. Link the privacy, safety and role-assignment risks to Architecture Section 9 in one sentence.
- Fix if not exempt: add both sections. The owner should decide before the document is edited.

### 🟢 Nit

| ID | Item | Where |
| --- | --- | --- |
| N-1 | Terminology drift: "gym-entry charges", "additional venue charge" and "venue-entry costs" are one concept; "approve" vs "accept"; "request" vs "booking"; "meeting details" vs "meeting instructions". Add a short glossary line; define "withdrawal" at first use (L94). | L64, L66, L95, L117, L185 |
| N-2 | State names differ from Architecture's `booking` lifecycle ("requested, confirmed, completed, cancelled") and the trainer-web plan. Map Pending to "requested" and note Architecture needs updating at feature breakdown. | L102-112 |
| N-3 | "Total price" vs venue charges: say whether venue charges are included and who collects them, or mark the step as dependent on O5 and O7. Name the owner of entry-cost data. | L64-65, L95 |
| N-4 | Add short Problem and Goals subsections, and expected pilot scale. Rename Section 8 "Non-goals / Deferred". | L6-12, L145-173 |
| N-5 | Section 8: cite the source for native-app deferral, add instant booking (log L14), move "not specified" items (L152) to Section 10, point multi-venue at O4, trim repeated "not approved" statements (48-hour, hold). | L24, L124, L145-152, L179-182 |
| N-6 | Time zone: name the venue's time zone and state a single configured zone for a single-city pilot. "Mobile usability matters" needs a requirement (responsive web on phone browsers). | L34, L128, L169 |
| N-7 | Vague or opinion wording: "basic filters", "chosen ... flows", "a useful initial outcome" (it presupposes the unapproved verification gate). | L93, L170, L191 |
| N-8 | Alignment gaps: L191 outcome vs Architecture 11 step 3 phrasing; PDR link on each Section 2 row; decision log omits withdrawal, status history and notification failure, and PDR-005 does not mention "decline". | L14-24, L18, L191 |
| N-9 | Mermaid and headings: make the L102 lifecycle an H3; quote or reword flowchart labels containing semicolons. | L53, L56, L102 |
| N-10 | UI strings: say whether "Awaiting trainer approval" and "Pay the trainer in person" are required copy or examples. | L63-67 |
| N-11 | Decline and expiry send the client back to browse. Carry request context into a prefilled "request another slot or trainer" step; the diagram does not show L135. | L53-55, L135 |
| N-12 | Day-of coordination for in-person sessions is missing (running late, cannot attend). Consider structured one-tap status messages. | L74, L140-141, L152 |
| N-13 | Architecture 6.5 says payment "should be settled before building trainer onboarding"; add "first release excepted" (cross-document, no PRD change). | Architecture.md L149 |
| N-14 | Feature-planning notes, not PRD edits: keep expiry lazy (evaluate at read and accept time plus a periodic sweep, no job queue only for expiry); store completion on the booking rather than a separate `sessions` entity; anonymous browsing needs unauthenticated read endpoints, and the apps currently put `/` behind `authGuard`. | L125, L76, L63 |

## Traceability matrix

Raw finding names are shortened. "S5, S6, S7, S8" mean the stage reports.

| Raw finding | Source | Action item |
| --- | --- | --- |
| Release acceptance built on unapproved proposals | S5 | A-3 |
| Retention contradiction (L8 vs L68) | S5 | A-3 |
| Section 1 states unapproved items as release scope | S7 | A-3 |
| Release scope for cancellation and outcomes ambiguous | S7 | A-3, A-11 |
| Competing pending requests vs slot holds (O2) | S5 | A-2 |
| Lifecycle cannot represent same-slot outcome | S7 | A-2 |
| 24-hour expiry vs session start | S5, S6 (5) | A-1 |
| Line 136 conflicts with the confirmed window | S7 | A-1 |
| Trainer notification treated as open | S5 | A-6 |
| Confirmed 24-hour window depends on unapproved notification | S7 | A-6 |
| "Delivery surfaces" is misleading (L34) | S5, S7 (nit) | A-9 |
| Existing-system baseline not described | S6 (1) | A-9 |
| Constraints delegated to Architecture.md, O7 contradiction | S6 (2) | A-9 |
| Trainer verification heavier than needed | S5 | A-10 |
| Older plan defaults mistaken for decisions | S5 (nit), S7 (nit) | A-10 |
| No admin rejection or suspension path | S7 (nit) | A-10 |
| "Confirmed requirements" overstates provenance | S5 (nit), S7 | A-4 |
| "Confirmed" items not traceable to the decision log | S7 | A-4 |
| "Agreed" used for unapproved items | S7 | A-4 |
| Proposed and confirmed content mixed without labels | S7 (nit), S6 (4) | A-4 |
| Statuses and entities inconsistent; request vs booking | S6 (8), S8 (nit) | A-4 |
| Precedence clause covers unapproved content | S7 | A-5 |
| Lists not exhaustive or in sync (open and "not approved") | S5 (nit), S7 | A-7 |
| Venue and client-information privacy unspecified | S5 (nit) | A-7 |
| Risks & Mitigations missing | S7 | A-7 (three rules), A-12 |
| "Pilot" undefined, public pilot and auth | S5 (nit), S6 (3), S7 | A-8 |
| Completion actor undefined; admin and issue underspecified | S6 (6, 7), S5 (nit) | A-11 |
| No Alternatives Considered section | S7 (Blocker), S8 (nit) | A-12 |
| Review-driven additions would make the PRD heavy | S8 | A-4, A-12 (drives the "one mechanism" approach) |
| State names differ from Architecture | S5 (nit) | N-2 |
| Terminology drift, charge names, withdrawal first use | S6 (10, 11), S7 (nit) | N-1 |
| Total price and venue charge unclear; venue cardinality | S7 (nit), S5 (nit) | N-3 |
| Missing Problem and Goals headings | S7 (nit), S6 (3) | N-4 |
| Section 8 content does not match its heading | S7 (nit) | N-5 |
| Time zone and mobile wording | S5 (nit), S7 (nit) | N-6 |
| Subjective or vague wording | S7 (nit) | N-7 |
| Architecture alignment gaps; wording mismatch with log | S7 (nit) | N-8 |
| Diagram and heading asymmetry | S7 (nit) | N-9 |
| UI strings quoted without status; precedence between PRD and log | S6 (9, 12) | N-10, A-5 |
| Decline and expiry send the client back to the start | S5 (nit) | N-11 |
| No day-of coordination channel | S5 (nit) | N-12 |
| Architecture 6.5 payment sentence | S5 (nit) | N-13 |
| Expiry implementation should stay lazy; admin and completion scope | S5 (nit), S8 | N-14 |
| Line references drift in S6 and S7 | S8 (nit) | Method note (anchor fixes by section or quoted text) |
| Stage 7 claim that Architecture 6.1 implies a hold is overstated | S8 (nit) | A-2 (L125 relabeled as derived) |

## Recommended order of work

1. Fix the two conflicts inside confirmed rules: A-1 (24-hour window vs session start) and A-2 (competing requests). Both need owner decisions.
2. Apply the single status and tier mechanism (A-3, A-4), then fix the precedence wording (A-5).
3. Settle the notification prerequisite, the Section 10 register and the pilot definition (A-6, A-7, A-8).
4. Make the small precision edits (A-9, A-10, A-11) and the owner decision on alternatives and risks (A-12).
5. Do the Nits (N-1 to N-14) when editing the affected sections.

After the PRD is edited, rerun `/egm:egm-review` on the updated file. This run used one round per stage and did not check whether edits fixed anything.
