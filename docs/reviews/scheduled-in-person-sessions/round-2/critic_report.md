# Goldfish Review Report

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md` (`lines 1-262`)

**Round:** single review round, no fixes applied. The target was not modified.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-structural` | completed |
| `egm-style` | completed |

## Summary

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 16 |
| Nit | 20 |

Differences from the older plans were not flagged, per the precedence rule. The PRD does include Alternatives (section 11) and Risks (section 12), and the section 2 decision table matches the decision log.

Three themes recur across all reviewers:

1. **Label accuracy.** Several rows marked Confirmed or Derived say more than the cited PDR (Majors 1-5, 14).
2. **The 3-hour cutoff and 1-hour window.** Their interaction is described inconsistently and is not stated in full (Majors 4, 6).
3. **Missing lifecycle and operational rules.** Overlap, completion and dispute, notification reliability, and trust and safety are under-specified or ungated (Majors 9-12).

## Prioritized Findings (Blockers -> Major -> Nits)

No Blockers.

### Confirmed label on Accounts, Authorization and PDR-004 claims exceeds PDR text - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** line 118 (Accounts), line 209 (acceptance item 8), line 159, line 41
* **Discrepancy Description**: Line 118 marks "registration, recovery, role-appropriate access" as Confirmed (PDR-016). PDR-016 only requires production authentication before real users sign in. Acceptance item 8 (line 209) cites PDR-016 for cross-role and booking-ownership enforcement, which PDR-016 does not say. Line 159 attributes "no paid or unpaid status" and "completion must not imply payment" to PDR-004, which does not say this. It is Derived, as line 160 already treats a similar claim. The row on line 41 is titled "Terminology" but carries the production-auth requirement.
* **Rationale & Recommendation**: Split each row. Mark only what the PDR says as Confirmed, and mark the rest Derived (for example from Architecture.md 6.4) or Proposed. Retitle the line 41 row.

### Notification behaviors labeled Confirmed; client notice channel undefined - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** lines 70-73 (flowchart), 92, 95, 125, 172, 176, 204; O6 (line 218)
* **Discrepancy Description**: Line 172 labels "notify the client" on expiry as Confirmed (PDR-006). Line 176 labels "notify the trainer" on withdrawal as Confirmed (PDR-015). Neither PDR mentions notifying anyone. The only confirmed notification is the trainer request alert (PDR-012). Line 125 calls the other notices Derived, so the PRD contradicts itself. The flowchart draws these steps in the confirmed style. No channel is defined for client notices, and O6 covers only reminders and "other channels". Acceptance item 3 depends on these notices.
* **Rationale & Recommendation**: Relabel as Derived or Proposed, consistently across lines 125, 172, 176 and the flowchart. Add an open item or a Proposed channel for client notices (in-app only, or email too).

### Status history labeled Proposed while Confirmed decisions depend on it - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** lines 36, 109, 127, 165, 177, 178
* **Discrepancy Description**: Lines 127 and 165 label status history Proposed, as does the decision log's "not yet approved" table. PDR-010 says a late cancellation is "flagged in the booking history". PDR-011 says admin "sees it with the booking history". Lines 177 and 178 label those rows Confirmed, and line 109 calls the same capability Derived from PDR-011. The same capability carries three different labels.
* **Rationale & Recommendation**: State that a minimal history (status changes, timestamp, late-cancel flag) is Derived from PDR-010 and PDR-011. Keep only the extra fields (actor, reason) as Proposed.

### Cancellation after the cutoff is described inconsistently - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** lines 35, 177 versus 77, 94, 103, 123, 208
* **Discrepancy Description**: PDR-010 and lines 35 and 177 say a later cancellation is allowed and flagged. The journeys (94, 103), the capability row (123, Confirmed PDR-010) and acceptance item 7 ("up to the 3-hour cutoff") describe only cancellation before the cutoff. The flowchart edge on line 77 shows neither the cutoff nor the flag. Whether exactly 3 hours counts as late is not stated. The request rule says "at least 3 hours", and the cancel rule says "up to 3 hours". An implementer could read this as the UI blocking late cancellation.
* **Rationale & Recommendation**: State "cancellation is allowed at any time, and cancellation less than 3 hours before start is flagged" in the journeys, capability table, lifecycle diagram and acceptance item 7. Define the boundary as inclusive or exclusive.

### Time zone rules conflict with each other and with Architecture.md - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-structural`, `egm-style`
* **Affected Scope:** lines 120, 166, 206, 219 (O7)
* **Discrepancy Description**: Line 120 requires the venue's time zone inside a Confirmed (PDR-014) row. Line 166 says launch "uses a single configured time zone" and labels it both Proposed and Open (O7). Line 219 calls it an "existing architecture decision". Architecture D13 only fixes single city or country and one language. Architecture section 9 says to store the venue or user time zone, which does not match a single configured zone. Acceptance item 5 (line 206) requires time zone display, although Proposed content carries no precedence under line 19.
* **Rationale & Recommendation**: Pick one label for time zone behavior and use it on lines 120, 166 and 206. Drop the Architecture attribution on line 219 or cite the exact section. Move Proposed items out of acceptance, or promote them to Derived or Confirmed.

### 3-hour cancellation cutoff and 1-hour response window interact unstated - Severity: Major
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** lines 33, 35, 43, 94, 103, 177
* **Discrepancy Description**: A request can be submitted exactly 3 hours before start, and the trainer can accept up to 1 hour later (2 hours before start). That booking is already inside the cancellation cutoff when it is confirmed. Any booking accepted in the last 2 hours of the notice window can only ever be cancelled "late" and flagged, so the "cancel before the cutoff" journeys cannot happen for it. Line 43 derives one consequence of the two windows but misses this one. This also means PDR-010's cutoff protects no one for fast-accepted requests.
* **Rationale & Recommendation**: State the intended behavior, or add an open question for the owner. This needs an owner decision.

### No problem statement - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** lines 6-8, 45-53 (sections 1 and 3)
* **Discrepancy Description**: Section 1 describes the product and the label and precedence rules, but never states the business or user problem. Section 3 lists outcomes per user. The feature-spec standard's problem-statement area is only partly covered. (`egm-design` judged the problem and purpose sufficient, so this is a single-lens finding.)
* **Rationale & Recommendation**: Add a short problem and motivation block in section 1 or under its own heading.

### No explicit Goals section; Non-Goals only partly mapped - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** lines 183-190 (section 8), 192-211 (section 9)
* **Discrepancy Description**: Non-goals exist as "Explicitly deferred" in section 8. Goals are scattered across sections 1, 3 and 9. Section 9 has measures but no targets, and deferring the targets is acceptable.
* **Rationale & Recommendation**: Add a "Goals and Non-Goals" section, or rename and cross-reference sections 3 and 8.

### Overlap invariant covers only confirmed bookings; "slot" undefined - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 33, 120, 158, 174, 203 (item 4)
* **Discrepancy Description**: Line 158 says "Confirmed bookings never overlap", citing Architecture 6.1. PDR-008 makes a pending request hold the slot too, so a confirmed-only rule does not stop two overlapping pending holds. "Slot" is never defined. Durations are Open under O7, so partial overlaps are unspecified (for example a 60-minute request against a 30-minute slot at a different start). The PRD does not say whether the invariant is per trainer, per client or both.
* **Rationale & Recommendation**: State the invariant as "no two active (pending or confirmed) bookings overlap for one trainer", over time ranges. Say explicitly whether client-side overlap is allowed. Resolve the session-duration part of O7 before feature breakdown.

### Completion and dispute path under-specified; acceptance item 7 not testable - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 143, 148, 178, 197-198, 208, 221 (O10)
* **Discrepancy Description**: The PRD does not say when the trainer may record completion, what happens if the trainer never does (the booking stays Confirmed forever and has no home in the section 9 metric), whether disputes have a time limit, which state a disputed booking shows, or whether a booking can be cancelled after its start time. Admin remedies are Open (O10), yet acceptance item 7 requires dispute to work "end to end, including failure states".
* **Rationale & Recommendation**: Add Proposed rules for these questions, including a completion deadline or auto-close, or mark them Open. Reword item 7 to "a dispute creates an admin issue visible with history" until O10 is closed, and name which failure states it covers.

### Core loop depends on notification reliability; mitigation is only monitoring - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 125, 181, 197, 207, 251; Architecture sections 5, 6.3, 8
* **Discrepancy Description**: Every request has a 1-hour window, and PDR-012 allows only email and in-app alerts. In-app alerts need the app open, and real-time is only Proposed in Architecture 6.3. Email is the only reliable channel for away trainers, but Architecture has no email provider decision or delivery requirement. Domain events are in-process (Architecture 5), so a crash between commit and alert can silently lose the alert. Expiry notices need a sweeper, which needs single-run semantics across multiple Fargate tasks. Line 197 reads the expiry rate "alongside notification delivery", but no requirement says delivery status is recorded.
* **Rationale & Recommendation**: Add product requirements to sections 9 and 12: an alert is created atomically with the request (outbox or equivalent), send-failure and bounce state is recorded, there is a target time from request to email send, and the trainer's contact email is verified before the trainer becomes bookable. Choose the email provider before feature breakdown.

### Trust, safety and privacy acknowledged but not gated - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** lines 192-211, 253-255; O9 (line 222)
* **Discrepancy Description**: Line 255 says safety of in-person sessions between strangers and health-related data "must be defined before launch" (Architecture 9), but section 9 has no acceptance item and the O-items do not cover it. Line 253 says the address is "hidden again after cancellation". That hides it only in the UI, and a client who saw it on acceptance and then cancels freely keeps it. Free cancellation until 3 hours before start makes this a harvesting path for home venues. What client information the trainer sees before accepting (O9) is also open, though it is the trainer's only safety signal.
* **Rationale & Recommendation**: Add an Open item or a release-acceptance gate for data retention, consent, a reporting path, and handling of an abusive client or trainer. Reword the risk row to say the address is shown only after acceptance and is not revoked from someone who already saw it. Consider recording address views in the booking history. Add the address rule to section 2 or 6, since it currently appears only in the log and line 253.

### Unresolved conflicts with Architecture; section 13 names only one update - Severity: Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 19, 131, 158, 262
* **Discrepancy Description**: Line 131 says a request and a booking are one record and that completion is stored on it. Architecture sections 5 and 6.1 define separate `booking` and `sessions` modules ending in the same `sessions` entity. Line 262 asks only for the `booking` lifecycle to change. Architecture section 10 item 9 still defaults verification to document upload plus manual admin review, and section 6.8 lists certification documents. PDR-009 overrides both. Architecture section 9 lists "reviews" under trust and safety, and PDR-015 removes reviews from the first release. Line 19 says Architecture is the source of truth for technical architecture, while line 262 says to change Architecture to match the PRD, which is circular.
* **Rationale & Recommendation**: List the Architecture items to update: booking versus `sessions` ownership of completion, section 10 item 9, section 6.8, and the section 9 reviews reference. State that the PRD governs product behavior and Architecture governs technology.

### Line 3 label claim is not true of the document - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-structural`
* **Affected Scope:** lines 3, 53, 84, 89, 91, 102, 131, 148
* **Discrepancy Description**: Line 3 says "Everything else is marked Derived, Proposed or Open." These statements have no label: line 53 (mobile), line 84 ("a simple default"), line 91 (the "Awaiting trainer approval" status), line 102 ("same confirmed booking for both participants"), line 131 (one record with a status) and the "not a separate booking state" clause on line 148. Line 131 is a data-model decision in a document that disclaims data design (line 21). Line 89 cites PDR-007 and PDR-010 for a pre-submit disclosure list (duration, price, venue-entry charges), and those PDRs only support the 3-hour limit and cancellation terms.
* **Rationale & Recommendation**: Label each statement, or reword line 3 to say unlabeled statements are descriptive context. Move or label line 131. Correct the line 89 citation.

### Unmeasurable requirements and acceptance wording - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-design`
* **Affected Scope:** lines 53, 204, 208
* **Discrepancy Description**: Line 53 says mobile usability "matters" and that the web apps must "work well" in phone browsers. That cannot be tested, and section 9 has no mobile check. Line 204 uses "consistent confirmation" and "correctly reflected". Line 208 says "work end to end, including failure states" without naming the failure states.
* **Rationale & Recommendation**: State a testable criterion, for example main flows completable at a stated viewport width, and add it to acceptance if required. Name the observable result for each acceptance wording.

### Risks table promises owners and gives none; vague mitigations - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 197, 249-258
* **Discrepancy Description**: The header on line 249 reads "Mitigation or owner", but no row names an owner. Line 251 ("Watch the expiry rate") and line 252 ("Revisit if hoarding appears") name no threshold, viewer, measure or action. Line 257 calls the 1-hour hold a spam control, but the log adds no cap and the hold does not limit spam. Line 254 cites Architecture 6.4 for how admin accounts are created, but that section does not decide it and it is not in section 10.
* **Rationale & Recommendation**: Rename the column "Mitigation" or add named owners. For the monitoring caveats, name the decision (the O6 reminder decision) and the signal, or drop the hedge. Add admin account creation to section 10.

## Nits

### Label inconsistencies - Severity: Nit
* **Reviewer Lens:** `egm-structural`, `egm-style`
* **Affected Scope:** lines 154, 174, 133, 146-148
* **Discrepancy Description**: Line 154 labels "another client cannot request a held slot" as Derived from PDR-008, and line 174 labels it Confirmed (PDR-008). The "Confirmed core lifecycle" paragraph (line 133) already contains Withdrawn, Cancelled and Completed, then the next heading, "Lifecycle extensions", calls them Confirmed extensions. The state diagram has no terminal transitions and does not show the dispute.
* **Rationale & Recommendation**: Align the two labels for the held slot. Merge the lifecycle framing or drop "core" and "extensions". Add terminal transitions and the dispute to the diagram.

### Flowchart issues - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-structural`
* **Affected Scope:** lines 69-84
* **Discrepancy Description**: "Client withdraws" hangs off the decision node "Trainer responds within 1 hour", and withdrawal is not a trainer response. Line 84 calls the decline-to-browse return a "simple default", which is none of the four labels. C1 and C2 are drawn Proposed although only browsing before sign-in is Proposed, and the B4 and B5 edges into C1 are not dashed.
* **Rationale & Recommendation**: Re-hang the withdrawal edge. Label line 84 Proposed or Derived. Mark the edges consistently.

### Duplicated and circular precedence statements - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-structural`
* **Affected Scope:** lines 19, 21, 262
* **Discrepancy Description**: Line 19 states twice that confirmed decisions take precedence over older plans, and "Proposed content carries no precedence" is implied by the first. Line 21's "next planning step after review" repeats section 13.
* **Rationale & Recommendation**: Drop the repeats.

### Jargon and ambiguity - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-design`
* **Affected Scope:** lines 43, 91, 158, 235, 236, 258
* **Discrepancy Description**: Line 43 says "an approval is never pending at session start", but a request is what is pending, so use "request". Line 158 packs three claims into one bullet, including "atomic". "Sweep" (line 258), "alert delivery" (line 236) and "off-platform leakage" (line 235) are undefined. Line 91 says "explicit" status and "The wording is illustrative" clumsily.
* **Rationale & Recommendation**: Replace or define the terms and split line 158. For line 91, say "The status must name the pending state; the wording is not fixed."

### Section 11 alternatives partly not in the decision log - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-structural`, `egm-design`
* **Affected Scope:** lines 229-243
* **Discrepancy Description**: The disclaimer on line 229 covers trade-offs but not the alternatives themselves. "Trainer or admin only; no cutoff", "Trainer only; either party", "no gating", "Public on the profile" and the pending-request cap (line 238) do not appear in the log. A reader may assume the owner chose among them. "Retention" is not a topic name in PDR-015. Line 237 ("leaves trainers little time to prepare") is speculation. There are no rows for PDR-002, PDR-012 or PDR-014. Structural choices on lines 131, 148, 158 and 258 (one record versus two, dispute as an issue versus a state, lazy expiry versus a sweep) have no alternatives.
* **Rationale & Recommendation**: Mark editor-added alternatives as such, or limit the table to alternatives recorded in the log. Add short alternatives for the structural choices, or move them to feature breakdown.

### Open-question list hygiene - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-structural`, `egm-design`
* **Affected Scope:** lines 217-225 (O4, O7, O9, O12)
* **Discrepancy Description**: O4 and O12 both ask about multiple venues, and O12's "Not specified by this PRD; placement needs review" is not a proposal. Line 99 and the flowchart say "adds venue" with no cardinality. O7 bundles about six questions and O9 four to six, so closing one cannot be tracked. "Basic filters" in O9 is vague. Line 100 says trainers publish durations, while O7 leaves durations open. Line 225 mentions closed IDs (O1, O2, O3, O5, O8) never defined in the PRD. O12 points to deferrals (recurring bookings, packages, chat, calendar sync) that section 8 does not list.
* **Rationale & Recommendation**: Merge O4 into O12 with a default. Split compound items so blocking ones (durations, currency, time zone) are visible. Define or drop the closed IDs, and align section 8 with O12.

### Metrics lack rate, denominator or period - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 196-198
* **Discrepancy Description**: "Submitted requests that become confirmed bookings" has no rate, denominator or period, and "targets to be agreed" is a deferral.
* **Rationale & Recommendation**: Phrase each as a rate and state the period.

### Acceptance coverage gaps - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 200-209
* **Discrepancy Description**: Nothing covers the PDR-014 availability block, the PDR-010 late-cancellation flag, or the PDR-013 rule that the address is hidden after cancellation.
* **Rationale & Recommendation**: Add acceptance items for these.

### Voice - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** lines 91, 262
* **Discrepancy Description**: Journey steps mix imperative ("Do not describe the session as booked") with descriptive voice. "A useful initial planning outcome" on line 262 is soft.
* **Rationale & Recommendation**: Use one voice. Say "Suggested first outcome".

### Markdown rendering of header lines - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** lines 3-4
* **Discrepancy Description**: "Status:" and "Updated:" have no blank line between them, so standard Markdown renders them as one paragraph.
* **Rationale & Recommendation**: Add a blank line or a trailing break.

### Cross-references not linked; stale log reference - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** whole document; line 209; decision log PDR-016 (line 27)
* **Discrepancy Description**: "Architecture.md section 6.1" and PDR IDs are plain text, not links. The log's PDR-016 consequence says it replaces "PRD acceptance item 7", but that criterion is item 8 in the PRD (line 209). That reference is in the log, not the target, and is flagged for the owner's attention.
* **Rationale & Recommendation**: Link the references. Correct the log's item number in a separate change.

### No Proposed Architecture or touchpoints pointer - Severity: Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** lines 21, 158, 258, 262
* **Discrepancy Description**: The standard's architecture area is deferred to Architecture.md, which is defensible for a PRD. The notification path and expiry mechanism are touched on without a component or data-flow pointer.
* **Rationale & Recommendation**: Add a one-paragraph "Architecture touchpoints" pointer to Architecture.md sections 5, 6.1 and 9.

### Risk coverage gaps - Severity: Nit
* **Reviewer Lens:** `egm-structural`, `egm-design`
* **Affected Scope:** lines 31, 33, 249-258
* **Discrepancy Description**: The risks table has no scalability or limits item, and no assumption about expected trainer and request counts. It has no risk for the 1-hour window applying around the clock (a 03:00 request for a 06:00 session must be answered by 04:00, with no quiet-hours or trainer notice rule). Hold abuse (line 257) is mitigated only by "sign-in required", which is not a rate limit, although Architecture 9 plans rate limiting. Spam holds also block a trainer's availability edits until each request is declined. Notification delivery failure appears in the exceptions table (line 181) but not here beyond the expiry-rate row.
* **Rationale & Recommendation**: Add a one-line volume assumption, an overnight-request risk with an optional Proposed quiet-hours rule, and references to rate limiting, a bulk-decline action and client account verification.

### Changes after approval not addressed - Severity: Nit
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** lines 99-100, 217
* **Discrepancy Description**: Nothing says whether a verified trainer's later venue, address or profile edits need re-review, although PDR-013 and PDR-009 make the venue and the approval the trust anchor.
* **Rationale & Recommendation**: Add a Proposed rule or an open item.

### Goals/Non-goals wording on mobile - Severity: Nit
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** line 53
* **Discrepancy Description**: Mobile is stated as important with no acceptance criterion. This is the same gap as the "Unmeasurable requirements" Major, and is noted here for the acceptance list.
* **Rationale & Recommendation**: Add a release-acceptance line for core flows on phone browsers.

## Label accuracy against the decision log

* **Accurate:** every row of the section 2 table (lines 25-41) matches the log, including the PDR-006 supersession of PDR-005. The Proposed items on lines 164-165 and the Open items match the log's "Recommendations not yet approved" table. The Derived items on lines 154 (temporarily unavailable display), 155 (only the trainer can accept or decline) and 156 (expired requests cannot be accepted) are accurate.
* **Inaccurate or inconsistent:** see the first five Majors (PDR-016 and PDR-004 claims, notifications, status history, cutoff, time zone), plus the Nits on lines 89, 154 and 174.
