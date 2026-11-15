# Consolidated Review Report (round 2)

**Target:** `docs/prd/scheduled-in-person-sessions.md` (262 lines, full file), after the round-1 decisions were applied (commits `edf9088`, `3cda24a`, `9089f88` on `docs/prd-review-fixes`).
**Mode:** Consolidated run, one review round per stage, no fixes applied. The PRD was not modified.
**Context given to reviewers (except Stage 6):** `docs/decisions/first-release.md`, `docs/plans/trainer-web.md`, `docs/plans/phase-1-repo-foundation.md`, `Architecture.md`. Reviewers did not see the round-1 reports, which are archived in `review-round-1/`.

## What ran

| Stage | Report | Reviewers | Raw findings (B / M / N) |
| --- | --- | --- | --- |
| 5 Initial Zoom Out | `zoom_out_report.md` | zoom-out, inventive-catalyst | 0 / 10 / 11 |
| 6 Comprehension Test | `comprehension_report.md` | comprehension (document alone) | 0 / 8 / 10 |
| 7 Critic Review | `critic_report.md` | design, structural, style | 0 / 16 / 20 (header count; some Nits are grouped under one heading) |
| 8 Intermediate Zoom Out | `intermediate_zoom_out_report.md` | zoom-out | 0 / 7 / 3 |
| 9 Implementation Readiness | not run | n/a | n/a |

All reviewers completed. Stage 9 was skipped again because the PRD has no implementation-plan section.

## Progress against round 1

- **Both round-1 Blockers are gone as Blockers.** The 24-hour window colliding with session start (A-1) is closed by PDR-006 and PDR-007, and the competing-request gap (A-2) by PDR-008. Stage 8 confirms "an approval is never pending at session start" holds. Stage 7's Alternatives-section Blocker no longer appears: the section now exists, and Stage 8 argues it should go.
- **No Blockers in this round.** Counts went up (round 1 had 7 + 8 + 11 + 1 Majors across stages), because the PRD is now more specific and gives reviewers more to check. Stage 8 says most findings come from two causes (below), not from new product gaps.
- **New problems the decisions created:** the cancellation cutoff and the 1-hour window interact, the 1-hour clock runs around the clock, uncapped holds let one client hold overlapping times with several trainers, and a late expiry sweep could leave a stale hold.

## Reading guide: where the stages disagree

Stage 8 judged the earlier stages. This report follows it, and each disagreement is marked below.

- **Root causes, not 60 separate fixes.** Stage 8 traces most findings to (1) applying four labels (Confirmed, Derived, Proposed, Open) sentence by sentence, and (2) restating each rule in four to six places. Fixing those two removes most label and drift findings at once.
- **Cutoff and response-window interaction.** Stage 7 says any booking accepted in the last 2 hours of the notice window can only be cancelled late and that the cutoff "protects no one". Stage 8 says this is overstated. Only a request submitted between 3 and 4 hours before start can be accepted after the 3-hour cutoff. Stage 5 had it right. This report follows Stage 5 and 8.
- **Stage 6 false positives.** It says PDR-013 "says nothing about cancellation". The log's PDR-013 does say the address is hidden again; the PRD's section 2 row omits it, so the fix is copying the clause. It also flags the decision log and older plans as hidden dependencies, which is by design (one sentence suffices).
- **Severity inflation.** Stage 8 rates several Stage 6 and 7 Majors as Nits in a draft PRD: the line 3 label claim, the "owner" column in the risk table, mobile "work well" wording, open-question list hygiene, and "older plans undefined".
- **Goals section.** Stage 7 asks for a Goals and Non-Goals section. Stage 8 says sections 8 and 9 already serve that purpose; add only a problem paragraph.
- **Section 11 (Alternatives).** Stage 8 says remove it, and not expand it as Stage 7 asks. You chose "Apply it, add sections" in round 1, so this is your decision (D-6).
- **Volume of new Proposed rules.** Stage 8 says do not turn every review suggestion into a Proposed rule (quiet hours, cooldowns, auto-withdrawal, re-review after edits). Record the underlying questions as open items instead.
- **Line numbers** in the stage reports can be off by a few lines. Anchor each edit by section or quoted text.

## Owner decisions needed

These are the questions only you can answer. Each one gates one or more action items below.

| ID | Question | Why it matters |
| --- | --- | --- |
| D-1 | A request submitted 3 to 4 hours before start can only be accepted after the 3-hour cancellation cutoff, so every cancellation of it is flagged immediately. Is that acceptable, and must the pre-submit "cancellation terms" say so? | Gates M-4. A grace period would change PDR-010. |
| D-2 | Should one client be able to hold overlapping times with several trainers (PDR-008, no cap)? If both accept, the client has two overlapping confirmed sessions. Options: first acceptance wins and the other pending requests are withdrawn, or no rule. | Gates M-6. |
| D-3 | Time zone: display the venue's time zone (Architecture section 9), or a single configured zone for launch? The PRD currently says both. | Gates M-8. |
| D-4 | A trainer never records completion, or no-show happens: what is the product rule? Stage 8 advises not adding rules until you answer; the questions go into O10. | Gates M-5. |
| D-5 | The 1-hour clock runs around the clock, so a late-evening request for a morning session may expire while the trainer sleeps. Accept this for the first release, or restrict when requests can be made? | Gates M-7. Any restriction changes PDR-006. |
| D-6 | Keep section 11 (Alternatives considered), or remove it? | Stage 8 recommends removal. |

## Consolidated action items

### 🔴 Blocker

None.

### 🟡 Major

**M-1. Fix the label scheme at the root.**
- Confirmed, Derived, Proposed and Open are attached to nearly every row and bullet, and each re-citation of a PDR is another chance to over-claim. Over-claims found: Accounts row (PDR-016 only requires production auth before real users sign in); Availability row (time zone and weekly hours are not in PDR-014); acceptance items 2, 5 and 8 (the deadline display, time zone and ownership checks are not in PDR-006, PDR-013 or PDR-016); "no paid or unpaid status" cited to PDR-004; client and withdrawal notices labelled Confirmed (only PDR-012 confirms a notification); "no platform monetary penalties" labelled Derived though PDR-010's consequence says it; the line 3 claim that everything else is labelled; and "Derived from Architecture.md 6.1" for rules 6.1 does not contain.
- Fix: keep Confirmed with a PDR ID only in section 2. Elsewhere write plain statements that cite a PDR where needed, and use a short "Not approved" note where something is Proposed or Open. Reword line 3 so unlabelled text is descriptive context. Move proposed items out of the acceptance list, or label them as dependent on an open decision.

**M-2. State each rule once.**
- The 1-hour, 3-hour, hold and cutoff rules appear in sections 2, 4, 5, 6, 7, 9 and 12. The inconsistent cutoff wording comes straight from this repetition.
- Fix: one authoritative place per rule (section 2 for PDRs, section 6 for lifecycle rules). Sections 4, 5, 7 and 9 refer to it ("see PDR-010"). Drop per-decision rationale (the log holds it), the O1/O2/O3/O5/O8 numbering, and the D8, D9 and D11 references. Link `docs/plans/trainer-web.md` once at line 19. Add one sentence saying the PRD is read together with the decision log.

**M-3. Bring the engineering mechanics back to product level.**
- "One record with a status", "authoritative server time even if expiry processing is delayed", "a late sweep cannot revive an expired request" and "acceptance is atomic" are design decisions, not product requirements. They also create the conflict with Architecture's separate `booking` and `sessions` records. Stage 5 adds a real product issue behind them: a late expiry sweep could leave a stale hold blocking a slot beyond 1 hour, and the overlap rule covers only confirmed bookings although pending requests hold slots. Durations are open (O7), so it is unclear whether holds cover only identical slots or overlapping time ranges.
- Fix: replace those bullets with one product invariant: "A request past its deadline never blocks a time range and cannot be accepted, whenever notifications go out. At most one active (pending or confirmed) booking exists for one trainer time range." Define "slot" as a time range. Leave outbox, sweeper, email provider, exclusion constraints and the request-versus-booking record design to feature breakdown and Architecture.md.

**M-4. Cancellation: one statement, in one place.** (Needs D-1.)
- Journeys, the capability row, the lifecycle diagram edge and acceptance item 7 say "before the cutoff" or "up to 3 hours". PDR-010 allows a later, flagged cancellation. The boundary at exactly 3 hours is not defined.
- Fix: state once in section 6 that cancellation is allowed at any time, and a cancellation less than 3 hours before start is flagged. Define the boundary. Add one consequence beside the "never pending at session start" line for the 3-to-4-hour case. Add the flagged path to acceptance. Do not invent a grace period.

**M-5. Completion and dispute: narrow, do not add rules.** (Needs D-4.)
- Gaps: a session whose completion is never recorded stays Confirmed indefinitely and undercounts the success metric; a client can dispute only a recorded completion, so a no-show with no record has no channel; there is no earliest recording time, dispute window or end state for an issue. Acceptance item 7 asks for dispute "end to end, including failure states" while admin remedies are open.
- Fix: reword item 7 to "a dispute creates an admin issue that shows the booking history". Extend O10 with the questions above. Add no Proposed rules until you answer.

**M-6. Notifications: relabel, record the client channel as open, require one telemetry line.** (Needs D-2 for the overlap part.)
- Only the trainer alert is decided (PDR-012). Notices to the client for accept, decline, expiry, withdrawal and cancellation have no source decision and no channel, yet acceptance item 3 depends on them. The core loop relies on a 1-hour email and in-app alert, and "watch the expiry rate" has no way to separate missed alerts from trainer choice.
- Fix: label notice content as following from the decisions, put the client-notice channel under O6, and add one product line that the system records whether each trainer alert was sent or failed. Leave delivery design to feature breakdown. Stage 5 also raises overlapping client holds across trainers: if D-2 is yes, record it as an open item, not a rule.

**M-7. Problem statement, and the around-the-clock window.** (Needs D-5.)
- Section 1 says what the product is but gives almost no why. This is the one real context gap (Stages 6 and 7). Add a two-to-three-sentence problem paragraph. Do not add a Goals section.
- Record the around-the-clock expiry as an open question under O6 (1-hour clock outside working hours). Do not write quiet-hours or submission guards as rules.

**M-8. Time zone: pick one.** (Needs D-3.)
- Line 120 puts time zone in a Confirmed row, line 166 calls it Proposed and Open, line 219 calls a single zone an existing architecture decision. Architecture D13 only fixes single city/country and one language; section 9 says to store the venue or user time zone. Acceptance item 5 requires the display.
- Fix: follow D-3, use one label everywhere, and correct the Architecture attribution.

**M-9. Address privacy and trust and safety.**
- "Hidden again after cancellation" is a UI-only rule, since the client has already seen the address. The PDR-013 row in section 2 also omits the cancellation clause that the log contains. Line 255 says trust, safety and privacy "must be defined before launch", but section 10 has no matching row. Admin account creation is also unplaced (Architecture 6.4 does not decide it).
- Fix: reword the risk row ("shown only after acceptance; not revoked from someone who has seen it"), copy the cancellation clause into the section 2 PDR-013 row and the cancellation exception, and add one Open row: trust, safety and privacy rules and admin account creation before the first real session. No acceptance gate or retention section.

**M-10. Hold and spam mitigations over-claim.**
- The risk table says a 1-hour hold limits spam and hoarding, but a client can withdraw and resubmit. "Sign-in required" is not decided by any PDR. Holds also block a trainer's availability edits (PDR-014) for up to an hour.
- Fix: reword the risk rows so they do not claim a control that is not there, say that holds can block availability edits, and refer to rate limits in Architecture section 9. A cooldown or caps are owner decisions; add them as open questions only if you want them.

**M-11. Section 11 (Alternatives considered).** (Needs D-6.)
- Many rows are not in the decision log (the cap, "no gating", "public on the profile", "trainer or admin only"), and the text admits the trade-offs are not owner statements. Stage 8 says remove it; Stage 7 asks for more rows.
- Fix: follow D-6. If removed, move any trade-off you want kept into the log as an editor note.

**M-12. Architecture and log follow-ups.**
- The PRD names only the Architecture `booking` lifecycle update. Also stale: Architecture section 10 item 9 (document upload default, against PDR-009), item 10 (cancellation still open, against PDR-010), section 6.8 (certification documents), the `sessions` entity versus completion stored on the booking, and the reviews reference in section 9 (against PDR-015). The log's PDR-016 says it replaces "PRD acceptance item 7", but the auth item is now item 8.
- Fix: list these in section 13 as feature-breakdown follow-ups, and correct the log's item number in a small separate commit. Also clarify the precedence line: the PRD governs product behavior, Architecture governs technology.

### 🟢 Nit

| ID | Item |
| --- | --- |
| N-1 | Status history: PDR-010 and PDR-011 depend on a minimal history (status changes, timestamps, late-cancel flag), but it is labelled Proposed in one place, Derived in another and Confirmed in a third. State that the minimal history is required and keep only actor and reason fields as Proposed. Name the admin dispute view where the PRD says the admin app needs "at least a trainer-approval screen". |
| N-2 | Lifecycle section: the diagram titled "Confirmed core lifecycle" already holds Withdrawn, Cancelled and Completed, and "Lifecycle extensions" then calls them confirmed. Retitle the diagram "Lifecycle". Add terminal transitions and the dispute if useful. |
| N-3 | Flowchart: the "client withdraws" edge hangs off the trainer-response decision; C1 and C2 are dashed though only browsing before sign-in is Proposed; "a simple default" (line 84) has none of the four labels. |
| N-4 | Wording: "an approval is never pending at session start" should say "a request"; "a request is accepted only if it is submitted at least 3 hours before" should say "validly submitted"; "held slot" should say "held time range"; define or remove "sweep", "alert delivery" and "off-platform leakage"; line 158 packs three claims into one bullet; the "Awaiting trainer approval" note reads clumsily ("the status must name the pending state; the wording is not fixed"). |
| N-5 | Open-question list: merge O4 into O12 with a default; O7 and O9 bundle several questions each; "basic filters" is vague; line 100 says trainers publish durations while O7 leaves durations open; state that the remainder of O8 moved to O10. |
| N-6 | Formatting: add a blank line between "Status:" and "Updated:" so they render as separate lines; "Terminology" row of PDR-016 mixes a wording choice with the production-auth rule, so split it. |
| N-7 | Risk table: the "Mitigation or owner" header names no owners (rename it "Mitigation"); "Watch the expiry rate" and "Revisit if hoarding appears" name no signal or action (point to the O6 reminder decision); drop the scalability and volume-assumption suggestion, since targets are already deferred. |
| N-8 | Acceptance coverage: nothing checks the PDR-014 availability block, the PDR-010 late-cancel flag, or PDR-013 address hiding after cancellation. Add one line each, in the same plain wording (no new rules). |
| N-9 | Deferred, not needed in the PRD (Stage 8): a rate, denominator and period for each metric; an "Architecture touchpoints" paragraph; a mobile acceptance criterion at a stated viewport; linking every cross-reference; re-review after profile edits. Move the last one to an open question if you want it tracked. |
| N-10 | "No platform monetary penalties": cite PDR-010 and drop the Derived label. |
| N-11 | Voice: journey steps mix imperative and descriptive voice; "A useful initial planning outcome" is soft. |

## Traceability matrix

"S5/S6/S7/S8" are the round-2 stage reports. Numbers follow each report's own finding numbers; Stage 7 findings are named because that report is unnumbered.

| Raw finding | Source | Action item |
| --- | --- | --- |
| Confirmed and Derived labels overreach the decision log | S5 #1, #16, #17; S7 (Accounts, PDR-004 claims); S7 line 3 claim | M-1 |
| Label scheme as root cause | S8 Major 1 | M-1 |
| Rules restated in several places | S5 #5 (as discussed in S8); S8 Major 2 | M-2 |
| Decision log and older plans are hidden dependencies | S6 #2, #3, #4 | M-2 (one sentence, one link) |
| Engineering mechanics in a product PRD | S8 Major 3; S5 #11 | M-3 |
| Stale expiry hold; overlap invariant; "slot" undefined | S5 #6; S7 (overlap invariant); S6 #5 | M-3 |
| Architecture `sessions` and `booking` conflict | S7 (conflicts with Architecture); S5 #18 | M-3, M-12 |
| Cancellation after cutoff described inconsistently | S5 #3; S7 (cancellation inconsistent); S8 Major 4 | M-4 |
| 3-hour cutoff and 1-hour window interaction | S5 #3; S7 (interaction) | M-4 (with S8's correction) |
| Completion and dispute dead ends | S5 #4; S6 #7; S7 (completion and dispute); S8 Major 5 | M-5 |
| Notification labels and client-notice channel | S5 #9; S6 #15; S7 (notification behaviors) | M-6 |
| Notification reliability and telemetry | S5 #8; S7 (core loop depends on notifications) | M-6 |
| Uncapped holds, overlapping client bookings | S5 #7 | M-6 / D-2 |
| 1-hour clock around the clock | S5 #8; S7 (risk coverage) | M-7 / D-5 |
| Problem statement missing | S6 #1; S7 (no problem statement) | M-7 |
| Goals section missing | S7 (no explicit Goals); S8 (declined) | M-7 (declined) |
| Time zone conflicts | S5 #13; S6 #11; S7 (time zone) | M-8 |
| Address hiding is UI-only; PDR-013 clause missing | S5 #15; S7 (trust, safety, privacy); S6 #6 (false positive) | M-9 |
| Trust and safety has no open item; admin account creation | S6 #8; S7 (trust, safety, privacy); S8 Nit | M-9 |
| Spam and hoarding mitigations over-claim; holds block availability edits | S5 #10, #21; S7 (risk table) | M-10 |
| Section 11 not product content | S7 (alternatives Nit); S8 Major 6 | M-11 / D-6 |
| Proposed-rule volume from the review loop | S8 Major 7 | M-5, M-6, M-7 (open questions, not rules) |
| Architecture and log follow-ups | S5 #18; S7 (conflicts with Architecture; stale log reference) | M-12 |
| Status history labelled inconsistently | S5 #2; S7 (status history) | N-1 |
| Lifecycle heading mislabelled | S5 #12; S6 #16; S7 (label inconsistencies) | N-2 |
| Flowchart issues | S7 (flowchart) ; S6 #14 | N-3 |
| Wording, jargon, imprecise phrases | S5 #19; S6 #13; S7 (jargon) | N-4 |
| Open-question list hygiene; O8 closure | S5 #14; S6 #14; S7 (open-question list hygiene) | N-5 |
| Header rendering; PDR-016 row mixes two things | S7 (rendering); S6 #9 | N-6 |
| Risk table owners and vague mitigations | S7 (risks table); S5 #17 | N-7 |
| Acceptance coverage gaps | S7 (acceptance gaps) | N-8 |
| Metrics, mobile criterion, touchpoints, re-review after edits | S7 (several Nits); S6 #18 | N-9 |
| "No monetary penalties" label | S5 #16 | N-10 |
| Voice and soft wording | S7 (voice) | N-11 |
| "Why" missing; precedence versus Architecture; time-zone phrasing; venue not defined | S6 #1, #17, #11, #12 | M-7, M-12, M-8, N-4 |
| "Clients who return" metric undefined | S6 #10 | Moot (metric removed by PDR-015; drop the mention) |
| Success measures have no targets | S6 #18 | No action (targets deferred by design) |

## Recommended order of work

1. Answer D-1 to D-6.
2. Apply the structural fixes first (M-1, M-2, M-3), because they change how everything else is edited.
3. Then the owner-facing items (M-4 to M-8), the privacy and risk edits (M-9, M-10), and section 11 (M-11).
4. Finish with M-12 and the Nits (N-1 to N-11).
5. Rerun `/egm:egm-review`. Stage 8 expects the count to fall sharply once labels and restatement are fixed, since they cause most of the findings.
