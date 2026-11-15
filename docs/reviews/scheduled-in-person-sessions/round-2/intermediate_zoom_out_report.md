# Goldfish Review Report: Stage 8 Intermediate Zoom Out

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md` (`lines 1-262`)

Single review round. No fixes applied. The reviewer read the standard (`zoom-out-standard.md`), the target, the four baseline files, and the Stage 5, 6 and 7 reports. It did not read `review-round-1/`.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |

## Overall verdict

* **Context sufficiency:** passes. The PRD states the objective (one scheduled, in-person request, accept and complete loop) and matches the owner decisions in the log.
* **Root problem and project alignment:** hold. The scope is the minimal loop. The deferrals (dispatch, video, platform payments, reviews, rebooking) agree with Architecture.md and the decision log.
* **Blockers:** none.
* **What is wrong is altitude and restatement, not scope.** Three stages have produced about 60 findings. Most trace to two structural causes (Findings 1 and 2 below). Several remedies proposed in Stages 6 and 7 would make both worse.
* **Reuse check:** the PRD proposes no new utilities. `libs/backend` holds only `common`, `database` and `identity`, with no notification or email module, so there is nothing to reuse or duplicate. Notification mechanics belong at feature breakdown.

## What Stages 6 and 7 add, and where they should not be followed

### Corroborated by all three stages (real work, each a small edit)
1. The status history is labelled inconsistently, while PDR-010 and PDR-011 depend on it.
2. The cancellation cutoff is described inconsistently, and the flagged late path is missing from the journeys and acceptance.
3. Completion has no rule for "never recorded". Acceptance item 7 is not testable while O10 is open.
4. Notification labels exceed what the PDRs confirm.
5. The Accounts row, the Availability row and acceptance item 8 over-claim.
6. "Slot" and the overlap invariant are undefined.
7. The time zone statements conflict.
8. The lifecycle heading is mislabelled.

### New and valid from Stages 6 and 7
* **Problem statement missing (Stage 6 #1, Stage 7).** Section 1 says what the product is but gives almost no why. This is the only context-sufficiency gap. Add a two-to-three sentence paragraph. Do not add a Goals and Non-Goals section: section 8 (deferred) and section 9 (measures) already serve that purpose.
* **Address hiding is UI-only (Stage 7).** Line 253 reads as a guarantee that the address is "hidden again after cancellation". It cannot be, because the client already saw it. Reword the row.
* **Trust and safety has no open item (Stage 6 #8, Stage 7).** Line 255 says it "must be defined before launch" but section 10 has no row for it.
* **Architecture conflicts beyond the `booking` lifecycle (Stage 7).** Architecture.md section 10 items 9 and 10, section 6.8, and the `sessions` entity versus the PRD's "one record" are real. They are partly covered by Stage 5 #18.
* **Stale cross-reference in the log (Stage 7).** `first-release.md` PDR-016 cites "PRD acceptance item 7", but the auth item is item 8. This is outside the target and should be fixed separately.

### Likely false positives caused by reviewer isolation
* **Stage 6 #6** says PDR-013 "says nothing about cancellation". The log's PDR-013 consequence does say the address is hidden again after cancellation. The PRD's section 2 row omits it. Copy the clause into the row. Do not mark it Proposed.
* **Stage 6 #2 and #3** flag the log and older plans as hidden dependencies. This is by design, because the log wins on conflicts. One sentence ("read together with the log") and a link to `trainer-web.md` is enough.

### Stage 7 errors not to propagate
* **Cutoff and window interaction.** Stage 7 says any booking accepted in the last 2 hours of the notice window can only be cancelled late, and that the cutoff "protects no one for fast-accepted requests". Both are overstated. Stage 5 #3 had it right. Only requests submitted between 4 and 3 hours before start can be accepted after the 3-hour cutoff. The rest keep an unflagged cancellation window of between 0 and about 2 hours, shrinking toward the edge.
* **Severity inflation.** Stage 7 reports 16 Majors. Several are Nits in a draft PRD (the line 3 label claim, the "owner" column header in the risk table, the mobile "work well" phrasing, open-question list hygiene). Stage 6 rates "older plans undefined" and "Architecture cited by section number" as Majors. These are Nits.

## Prioritized Findings (Blockers -> Major -> Nits)

No Blockers.

### The four-label taxonomy applied sentence by sentence is the root cause of most findings - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** line 3, the section 1 label table (lines 10-17), and labels throughout sections 5, 6, 7 and 12.
* **Discrepancy Description**: Confirmed, Derived, Proposed and Open are attached to nearly every row and bullet. Each re-citation of a PDR is another chance to over-claim. All three stages found this defect class: sections 2 and 5 and the acceptance list against the log's consequence column, and "Derived from Architecture.md 6.1" claims that 6.1 does not contain. The log's consequence column already records most "Derived" rules, so the PRD's Derived label duplicates it.
* **Rationale & Recommendation**:
  * Keep Confirmed (with PDR ID) only in section 2.
  * Elsewhere, use a short "Not approved" note where something is Proposed or Open. Write the rest as plain statements that cite a PDR where needed.
  * Reword line 3 so unlabelled text is descriptive context, not a labelled claim.
  * This resolves at the root Stage 5 #1, #9 and #16, Stage 7 Majors 1, 2 and 14, and Stage 6 #6, without label-fixing edits at each site.

### Each rule is restated in 4 to 6 places, and the proposed fixes add more restatement sites - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** sections 2, 4, 5, 6, 7, 9 and 12. Stage 7's cancellation remedies (journeys, capability row, lifecycle diagram, acceptance item 7) and Stage 6's per-decision rationale would add more.
* **Discrepancy Description**: Stage 5 #5 identified the duplication. Later stages treat each drift as a local patch, which keeps the duplication that causes the drift. The inconsistent cutoff wording comes directly from restating PDR-010 in the journeys, the capability row, the diagram and acceptance.
* **Rationale & Recommendation**: State each rule once, in section 6, or in section 2 where it is a PDR. Make sections 4, 5, 7 and 9 reference it ("see PDR-010"). Do not add per-decision rationale (Stage 6 #1). The log holds the rationale, and line 229 correctly forbids inventing owner statements.

### Altitude drop: data-model and engineering mechanics in a product PRD, and Stage 7 pushes deeper - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 131, 148, 152, 158, 258. Also Stage 7's outbox and sweeper single-run semantics, hold-as-Pending-AND-now<deadline, and verified trainer email.
* **Discrepancy Description**: "One record with a status", "authoritative server time even if expiry processing is delayed", "a late sweep cannot revive" and "atomic" are design decisions, not product requirements. They also create the Architecture conflict Stage 7 lists (booking versus the `sessions` entity). Removing them removes that conflict, so there is no need to document it.
* **Rationale & Recommendation**:
  * Replace these bullets with one product invariant: "A request past its deadline never blocks a time range and cannot be accepted, whenever notifications go out. Two accepted bookings never overlap for one trainer." This covers Stage 5 #6 and #11 at the right level.
  * Leave outbox, sweeper, email provider choice and exclusion constraints to feature breakdown and Architecture.md.
  * Keep one product line: record whether a trainer alert was sent or failed, since line 197 depends on that signal.

### Cancellation: owner decision plus one statement, stated once - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 35, 43, 89, 94, 103, 123, 177, 208.
* **Discrepancy Description**: The PRD describes cancellation up to the cutoff, while PDR-010 allows a later flagged cancellation. The cutoff and the 1-hour window interact only for requests submitted 3 to 4 hours before start (see the Stage 7 correction above).
* **Rationale & Recommendation**:
  * State once in section 6: "cancellation is allowed at any time; cancellation within 3 hours of start is flagged". Define the boundary as inclusive or exclusive.
  * Add one Derived consequence next to line 43 for the 3 to 4 hour case.
  * Ask the owner whether that case is acceptable. Do not invent a grace period.

### Completion and dispute: resolve by narrowing, not by adding rules - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 143, 148, 178-179, 198, 208, 221.
* **Discrepancy Description**: The gaps are real (completion never recorded, no earliest recording time, no dispute window, no issue end state). Stages 5 to 7 together propose about eight new Proposed behaviours: an "Awaiting completion" display, a trainer alert, an admin queue after N days, a client "report a problem", a dispute window, a completion time lock, a completion deadline, and auto-close. That is a speculative rule set for a first release, built on one unresolved no-show question.
* **Rationale & Recommendation**: Reword acceptance item 7 to "a dispute creates an admin issue that shows the booking history". Add one Open row, or extend O10, listing the questions (unrecorded completion, earliest recording time, dispute window, issue end state). Add no Proposed rules until the owner answers.

### Restrain the volume of new Proposed rules coming out of the review loop - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 5 #7, #8, #10 and Stage 7's notes on quiet hours, a submission-time guard, a per-client cooldown, auto-withdrawal of overlapping client requests, re-review after profile edits, a volume assumption in the risk table, and "request another slot". Applies to sections 7, 10 and 12.
* **Discrepancy Description**: These are product rules no owner has asked for. Each costs a design, a notification and an edge case. Several (quiet hours, auto-withdrawal) contradict or reshape confirmed PDR-006, PDR-003 and PDR-008.
* **Rationale & Recommendation**:
  * Record the underlying questions in the open-decision list. Candidates: overlapping client holds across trainers, the 1-hour clock outside working hours, and re-review after edits. Merge into O6 and O10 where possible.
  * Do not write them up as Proposed rules.
  * Skip the scalability and volume-assumption risk. Targets are already deferred in section 9, and sizing is premature at this stage.

### Section 11 (Alternatives) is not product content, and Stage 7 asks to expand it - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 227-245, and Stage 7's request for alternatives on structural choices.
* **Discrepancy Description**: Many alternatives in the table are not in the log (the cap, "no gating", "public on profile"). The text admits the trade-offs are not owner statements, yet it reads as decision history. Expanding it adds more material to maintain.
* **Rationale & Recommendation**: Remove the section. If a trade-off is worth keeping, move it to the log, tagged as an editor note. Do not add alternatives for structural choices.

### Section 2 repeats the decision log - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 23-43 and 245.
* **Discrepancy Description**: The log is authoritative and line 19 says so. Section 2 is still the table that makes the labelling hold, so keep it, but drop the "consequence" repetition elsewhere. Likewise, do not copy Architecture.md content that can drift (Stage 6's request to summarize Architecture sections).
* **Rationale & Recommendation**: Keep section 2 as the single place for confirmed decisions. Drop the O1, O2, O3, O5, O8 numbering and the D8, D9 and D11 references at line 245. Link to `docs/plans/trainer-web.md` once at line 19.

### Proportionality of the remaining Stage 6 and 7 Nits - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** lines 3-4, 43, 217, 223, 229-245, 258 and section 9.
* **Discrepancy Description**: Handle in passing, not as separate work items.
* **Rationale & Recommendation**:
  * Do now (one line each): the blank line after "Status:" (lines 3-4); the "sweep" and "off-platform leakage" terms (define or remove); the lifecycle title; O4 merged into O12; "slot" defined as a time range; the "an approval is never pending" wording at line 43; the PDR-013 "hidden after cancellation" clause added to the section 2 row.
  * Decline or defer: a rate, denominator and period for each metric (targets are already deferred); an "Architecture touchpoints" paragraph (Architecture.md holds this); a mobile acceptance criterion at a stated viewport (belongs in feature breakdown); linking every cross-reference.

### Pre-release trust and safety belongs in section 10 as one Open row - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** line 255 and section 10 (lines 213-225).
* **Discrepancy Description**: Line 255 says the rules "must be defined before launch", but section 10 has no matching open item.
* **Rationale & Recommendation**: Add one open question ("trust, safety and privacy rules before the first real session"). Do not add an acceptance gate or a retention and consent section.

## Priority for the caller

1. Apply the first three Major findings first. They change how the rest is fixed.
2. Then the cancellation and completion findings (the owner-facing questions).
3. Then remove section 11 and trim section 2 repetition.
4. Treat the Proposed-rule volume finding and the Nits as an Open-question cleanup, not as new requirements.

Calibration note: Stage 5 had the better calibration on the cutoff interaction and the stale hold. Stage 7 has the better grounding on the address-hiding claim, the log's stale item reference, and the Architecture items 9 and 10 gaps. Stage 6's isolation produced the useful "why is missing" finding and two false positives.

## Severity breakdown

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 7 |
| Nit | 3 |
