# Goldfish Review Report (Stage 5: Initial Zoom Out)

**Target:** `docs/prd/scheduled-in-person-sessions.md` (lines 1-262, full file)

**Baseline read by each reviewer:** `docs/decisions/first-release.md`, `docs/plans/trainer-web.md`, `docs/plans/phase-1-repo-foundation.md`, `Architecture.md`.

**Scope note:** The PRD says only owner-confirmed PDR decisions override the older plans' broader scope. Differences from those plans were not flagged. Findings cover real ambiguity or conflict, and the accuracy of the Confirmed / Derived / Proposed / Open labels against the decision log.

## Reviewer Status

| Reviewer | Lens | Status |
| --- | --- | --- |
| `egm-zoom-out` | Simplicity, scope, duplication, label accuracy | completed |
| `egm-inventive-catalyst` | Hidden contradictions, false compromises, inventive transforms | completed |

## Severity Summary

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 10 |
| Nit | 11 |

Both lenses found no Blockers. Both confirmed that PDR-001 to PDR-016 are reproduced faithfully in section 2 (lines 25-41). Both also confirmed that the derived claim at line 43 is correct (a 1-hour window is shorter than the 3-hour notice, so no approval is pending at session start).

Findings reported by both lenses are merged below and tagged with both lens names.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Blockers

None.

---

### Majors

### 1. Confirmed and Derived labels overreach the decision log - Severity: Major
* **Reviewer Lens:** `egm-zoom-out` (primary), `egm-inventive-catalyst` (partial agreement)
* **Affected Scope:** Section 5 Accounts row (line 118), Availability row (line 120), Session details row; acceptance items 2, 5, 8 (lines 202-209); risk table line 254
* **Discrepancy Description:** The PRD says Proposed content has no precedence (line 19). Several Confirmed rows and acceptance items cite a PDR that does not say what the row claims.
  * Accounts row labels "registration and recovery" and "role-appropriate access" as Confirmed (PDR-016). PDR-016 only requires production auth before real users sign in.
  * Availability row (line 120) sits under "Confirmed (PDR-014)" but includes time-zone display, which line 166 labels Proposed. Weekly hours and exceptions are in no PDR.
  * Acceptance item 2 requires the client to see a "1-hour deadline" (PDR-006/007). The log requires expiry, not displaying the deadline.
  * Acceptance item 5 requires time zone, price and duration disclosure under PDR-013. PDR-013 covers address and instructions only.
  * Acceptance item 8 requires cross-role and booking ownership access under PDR-016. Ownership checks are Derived from Architecture.md section 6.4.
  * Line 254 says "Trainer role requires admin approval (PDR-009)". PDR-009 gates bookability, not role assignment. The journey (line 99) has trainers create an account and profile before approval.
  * Line 254 also points to "a technical decision for Architecture.md section 6.4", which does not cover how admin accounts are created.
* **Rationale & Recommendation:** Relabel these rows as Derived or Proposed, or split each into a confirmed part and a derived part. Decide whether Proposed items belong in release acceptance at all. Keep trainer verification status separate from role (a database field checked per request), because Cognito-group roles are carried in the token.

### 2. Status history is labelled inconsistently, and confirmed decisions depend on it - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both, same finding)
* **Affected Scope:** Lines 35-36, 109, 127, 164/166, 178
* **Discrepancy Description:** PDR-010 confirms the late-cancel flag "in the booking history". PDR-011 confirms the admin sees the issue "with the booking history". The PRD labels the history Proposed (lines 127, 164/166), the admin inspection Derived from PDR-011 (line 109), and the history part of a row Confirmed (line 178). These labels contradict each other.
* **Rationale & Recommendation:** State that a minimal history (status transitions, timestamps, late-cancel flag) is required by PDR-010 and PDR-011, and label it Derived. Keep only actor and reason enrichment Proposed. Make lines 109, 127, 164/166 and 178 agree. Related: line 53 says the admin app needs "at least a trainer-approval screen". PDR-011 also requires an admin view of disputes, so name it there.

### 3. Cancellation wording does not match PDR-010, and the 1-hour and 3-hour rules interact - Severity: Major
* **Reviewer Lens:** `egm-zoom-out` (primary), `egm-inventive-catalyst` (as a Nit on the same interaction)
* **Affected Scope:** Lines 43, 89, 94, 103, 123, 207, 240
* **Discrepancy Description:**
  * Journeys say "Before the cutoff, cancel a confirmed booking". Line 123 and acceptance item 7 say "up to the 3-hour cutoff". PDR-010 and line 35 also allow a later, flagged cancellation. Journeys and acceptance do not cover the flagged path.
  * A request submitted 3 to 4 hours before start can be accepted after the 3-hour cutoff has passed. That booking has at most 1 hour of unflagged cancellation, and none if submitted at exactly 3 hours. Any cancellation is then flagged immediately.
  * This also hits PDR-014. A trainer who resolves an availability conflict by cancelling such a booking is always flagged. Line 43 derives one consequence of PDR-006/007 but misses this one.
  * The pre-submit "cancellation terms" (line 89) do not say this.
* **Rationale & Recommendation:** Add the flagged path to the journeys and acceptance item 7. State the interaction as a Derived consequence. Decide whether it is acceptable and whether the cancellation terms must say so. Record elapsed time since acceptance in the history so the late flag can be filtered. Any grace period would change PDR-010 and needs an owner decision. Nothing consumes the flag today (line 240).

### 4. The completion and dispute loop has dead ends, and acceptance item 7 cannot be verified as written - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both)
* **Affected Scope:** Lines 143, 148, 178/179, 198, 207, 221 (O10)
* **Discrepancy Description:**
  * Completion is trainer-only (PDR-011). A Confirmed booking whose session time has passed with no completion record has no rule. It stays Confirmed indefinitely. No-show handling is Open (O10).
  * This affects the success metric at line 198 (it will undercount), the PDR-014 conflict checks, and what the trainer can still do.
  * A client dispute exists only for a recorded completion. If the trainer no-shows and records nothing, the client has no channel.
  * There is no earliest time for recording completion, so completion could be recorded before the start. There is no dispute window, no stated way to re-record, and no end state for an issue.
  * Acceptance item 7 requires disputes to work "end to end, including failure states", while admin remedies are Open (O10).
* **Rationale & Recommendation:** Either narrow item 7 to "the issue is created and visible to the admin with history", or add a minimal Open item for "unrecorded completion" and "issue end state". Optional low-policy additions, marked Proposed under O10: a derived, display-only "Awaiting completion" condition once the end time passes; a trainer alert; an admin-visible queue after N days; a client "report a problem" path that creates the same admin issue; completion recordable only after session start; a dispute window. These make inaction a visible signal without deciding a no-show policy. N needs an owner.

### 5. Rules are restated in several places, and drift has already started - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Sections 2, 4, 5, 6, 7, 9, 11, 12
* **Discrepancy Description:** The 1-hour, 3-hour, hold and cutoff rules appear in sections 2, 4, 5, 6, 7, 9 and 12. Sections 2 and 11 largely duplicate the decision log, which the PRD says wins (line 19). Findings 2 and 3 come from this duplication. Section 11 adds trade-offs that read as facts about the decision process, for example "a cap on pending requests was considered and not adopted" (line 238). The log records only "no cap" and "Hold without caps".
* **Rationale & Recommendation:** Keep one authoritative table per concern. Reduce section 2 to a link to the log plus the Derived consequences. Collapse or drop section 11. Have sections 4, 5 and 7 reference rule IDs rather than restate them.

### 6. A late expiry sweep can leave a stale hold blocking a slot, and the overlap invariant is under-specified - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 154, 158, 204-205, 252, 258
* **Discrepancy Description:** The PRD treats expiry as a processing step that may lag, and mitigates only revival ("deadline checks use server time at read and accept time", line 258). It does not say a delayed sweep stops blocking other clients. If a hold is `status = Pending`, a stale row blocks new requests beyond 1 hour. That contradicts PDR-006, PDR-008 and the risk-table claim "a hold lasts at most 1 hour" (line 252). Line 158 states the no-overlap invariant only for confirmed bookings and says "acceptance is atomic". With holds, a conflict arises when a hold is created, not at acceptance. It is not stated whether holds apply to overlapping time ranges or only identical slots (durations are still open, O7).
* **Rationale & Recommendation:** Define a hold as Pending AND now < deadline, with effective status derived at read and write time. The sweep then only emits notifications and persists status. Restate the invariant as "at most one active (pending-unexpired or confirmed) request per trainer time range", enforced on request creation. Say that holds apply to time ranges. Implementation caveats: a database exclusion constraint cannot reference `now()`, so creating a request must first transition overlapping expired rows in the same transaction, which needs per-trainer write locking. Notifications still depend on the sweep and can be late.

### 7. Uncapped holds can give a client overlapping confirmed bookings - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst` (primary), `egm-zoom-out` (partial, in the "confirmed bookings never overlap" ambiguity)
* **Affected Scope:** Lines 33, 120, 158, 238, 252
* **Discrepancy Description:** PDR-008 allows no cap on a client's pending requests. "Confirmed bookings never overlap" does not say whose bookings (per trainer or also per client). A client can hold the same time with two trainers. If both accept, the client has two overlapping confirmed sessions and the PRD gives no rule.
* **Rationale & Recommendation:** Add a Proposed rule that keeps PDR-008 intact: the first acceptance wins and the client's other overlapping pending requests are auto-withdrawn with notices (or the second acceptance fails with a clear reason). List it in section 10 for owner approval. Costs: a per-client check across trainers at acceptance, trainers may see an acceptance fail or a request vanish, more notification volume.

### 8. The 1-hour clock runs around the clock, and expiry from missed alerts is treated as inevitable - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 31, 69, 197, 236, 251, O6
* **Discrepancy Description:** PDR-006 applies the 1-hour window to every request regardless of session date, so a late-evening request for a morning session is likely to expire while the trainer sleeps. The PRD only says "watch the expiry rate" and to read it "alongside notification delivery" (line 197), but no requirement captures delivery data. Email is asynchronous, in-app only helps when the app is open, and web push is limited on iOS (Architecture.md section 7, trainer-web Phase 9). O6 (reminders) is deferred although it is the cheapest fix.
* **Rationale & Recommendation:** Make alert telemetry a requirement (sent, delivered or bounced, first-seen per request). Consider raising O6 to a pre-release decision, since a mid-window reminder complements PDR-012. Optionally, mark a Proposed submission-time guard that opens the request form only when the trainer's working hours plus a response buffer cover the window. This leaves PDR-003 and PDR-006 intact but reduces bookable inventory. Do not add standing auto-accept, which conflicts with PDR-003 ("each booking").

### 9. Notification behaviours are labelled Confirmed or Derived with no source decision - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst` (primary), `egm-zoom-out` (as a Nit)
* **Affected Scope:** Lines 69-73 (flowchart steps B4, B5, B6), 125, 172, 174, 176
* **Discrepancy Description:** Only the trainer alert is decided (PDR-012). Line 172 labels "notify the client" Confirmed (PDR-006), which PDR-006 does not say. Line 176 labels the trainer notice on withdrawal Confirmed (PDR-015), but PDR-015 only places withdrawal in scope, and hold release comes from PDR-008. Line 174 labels "shows as temporarily unavailable" Confirmed, while PDR-008 only says a second client cannot request a held slot (line 154 labels the same thing Derived). Line 125 labels client response, expiry and cancellation notices Derived with no channel. Decline, expiry, acceptance, withdrawal and cancellation notices have no channel or source.
* **Rationale & Recommendation:** Relabel notice content Derived and channel Proposed or Open, and add the client-notice channel to O6. If email becomes a client channel, the delivery-telemetry cost from finding 8 applies.

### 10. Spam and hoarding mitigations do not address re-request loops - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst` (primary), `egm-zoom-out` (partial, in a Nit)
* **Affected Scope:** Lines 238, 252, 257
* **Discrepancy Description:** "No cap" is treated as "no control". Line 257 lists "hold limit of 1 hour and sign-in required" as the mitigation. A 1-hour hold does not stop a client withdrawing and resubmitting, or resubmitting after expiry, or requesting many slots of one trainer. "Sign-in required" is not decided by any PDR. Holds also block the trainer from saving availability changes (PDR-014) for up to an hour.
* **Rationale & Recommendation:** Keep PDR-008 and add abuse-triggered limits as Proposed (request rate limits already appear in Architecture.md section 9, or a short per-client-and-trainer cooldown after repeated withdrawn or expired requests). Reword lines 252 and 257 so they do not claim the 1-hour hold limits abuse. A cooldown is a new product rule and needs an owner decision, and thresholds risk false positives.

---

### Nits

### 11. Technical rules labelled "Derived from Architecture.md 6.1" are not in it - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 131, 152, 158, 258
* **Discrepancy Description:** Architecture section 6.1 only requires transactional slot reservation. "One record with a status", "authoritative server time even if expiry processing is delayed" and "a late sweep cannot revive an expired request" are new technical design choices.
* **Rationale & Recommendation:** Label them Proposed or technical constraints, or drop them to keep the PRD at product level.

### 12. The lifecycle section is mislabelled - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 133-148
* **Discrepancy Description:** The diagram titled "Confirmed core lifecycle" already contains Withdrawn, Cancelled and Completed, then "Lifecycle extensions" says these are confirmed. Declined and Expired are named states that no PDR names.
* **Rationale & Recommendation:** Retitle the diagram "Lifecycle" or move the later states out. Label Declined and Expired Derived.

### 13. Time-zone claims conflict - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both)
* **Affected Scope:** Lines 89, 120, 166, 219; Architecture.md section 9, D13
* **Discrepancy Description:** O7 (line 219) calls "single configured time zone" an existing architecture decision, but D13 says only single city/country and one language, and Architecture section 9 says to store venue/user time zone. Line 120 shows time zone under Confirmed, line 166 as Proposed, line 89 as Derived, and line 166 marks the zone Open while line 219 treats it as settled.
* **Rationale & Recommendation:** Pick per-venue or global. Label display of the venue time zone Derived from Architecture section 9 and keep "single configured zone" Open.

### 14. O8 closure is overstated, and several O-numbers are undefined - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both)
* **Affected Scope:** Lines 217-225
* **Discrepancy Description:** Line 225 says PDR-011 closes O8, but the log says it closes O8 "for completion" only. The remainder (no-show) moved to O10. O1, O2, O3, O5 and O8 are never defined, so a fresh reader cannot follow the references. O4 and O12 have no log backing (acceptable for Open or Proposed). O12 repeats "multiple venues" from O4.
* **Rationale & Recommendation:** State that the remainder of O8 moved to O10. Add one-line definitions for each O-number or drop the numbers.

### 15. PDR-013 "hidden again after cancellation" is missing from the requirement and acceptance lists - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both)
* **Affected Scope:** Lines 38, 177, 206, 253
* **Discrepancy Description:** The rule appears only in the risk table (line 253). It is absent from the PDR-013 row, the cancellation exception and acceptance item 5. Behaviour after completion is unstated. If the acceptance email carries the address, hiding it afterwards cannot be enforced.
* **Rationale & Recommendation:** Add it to the PDR-013 row, the cancellation exception and acceptance. Have notification emails link to in-app details rather than carry the address (cost: one extra sign-in step on a phone).

### 16. "No platform monetary penalties" is understated as Derived - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 160
* **Discrepancy Description:** Labelled Derived from PDR-004, but PDR-010's consequence column states "No platform penalties" as confirmed.
* **Rationale & Recommendation:** Cite PDR-010 and label it Confirmed.

### 17. Risk-table references and claims are slightly off - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 254, 257
* **Discrepancy Description:** Architecture section 6.4 does not discuss how admin accounts are created (see also finding 1). The spam row relies on "sign-in required", which no PDR decides.
* **Rationale & Recommendation:** Correct the references and label the mitigations Derived or Proposed.

### 18. Stale Architecture.md items are not in the next-step list - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both)
* **Affected Scope:** Line 262 (and line 19); Architecture.md section 10 items 9 and 10 (around line 223), sections 5 and 6.1
* **Discrepancy Description:** Line 262 lists only the Architecture `booking` lifecycle update. Item 9 still defaults to "Document upload plus manual admin review", against PDR-009. Item 10 still lists cancellation as open, against PDR-010. Sections 5 and 6.1 describe a separate `sessions` entity, while the PRD stores completion on the booking record.
* **Rationale & Recommendation:** Add these to the next-step list.

### 19. Wording ambiguity in the notice rule - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Lines 153, 154
* **Discrepancy Description:** "A request is accepted only if it is submitted at least 3 hours before" overlaps with the trainer's acceptance. "Held slot" should say "held time range".
* **Rationale & Recommendation:** Use "validly submitted" or "submittable", and "held time range".

### 20. Other loose ends - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Line 197, line 53
* **Discrepancy Description:** Line 197 says to read the expiry rate "alongside notification delivery", but no delivery logging is required (see finding 8). Line 53 names only a trainer-approval screen for the admin app (see finding 2).
* **Rationale & Recommendation:** Resolve with findings 8 and 2.

### 21. Hold abuse also blocks trainer availability edits - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** PDR-008 and PDR-014 interaction (lines 33, 41)
* **Discrepancy Description:** Spam and hoarding holds (PDR-008) block the trainer from saving availability changes (PDR-014) for up to an hour.
* **Rationale & Recommendation:** Say so in the risk table, or define how an availability edit treats an unexpired hold.

---

## Label Accuracy Summary (against the decision log)

* **Confirmed rows that match the log:** section 2 (lines 25-41).
* **Confirmed rows that overreach:** Accounts, Availability (time zone) and Session details rows in section 5; acceptance items 2, 5, 8; notification rows at lines 172, 174, 176 (findings 1, 9).
* **Labelled Proposed or Derived but confirmed decisions depend on it:** status history (finding 2), no platform penalties (finding 16).
* **Labelled Derived or Confirmed without a source decision:** technical rules attributed to Architecture 6.1 (finding 11), client notifications (finding 9).
* **Open-question closure:** O8 closed only for completion (finding 14).
