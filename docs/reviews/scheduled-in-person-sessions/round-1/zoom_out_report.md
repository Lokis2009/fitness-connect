# Goldfish Review Report (Stage 5: Initial Zoom Out)

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md` (`lines 1-192`, full file)

**Baseline reading given to each reviewer:** `docs/decisions/first-release.md`, `docs/plans/trainer-web.md`, `docs/plans/phase-1-repo-foundation.md`, `Architecture.md`.

**Precedence note:** the PRD states its first-release decisions take precedence over the older plans' broader launch scope. Differences from those plans (on-demand, video, payments, earnings, Phase 7 and 8 scope) were not flagged. Only real ambiguity or conflict is reported.

## Reviewer Status

| Reviewer | Lens | Status |
| --- | --- | --- |
| `egm-zoom-out` | Simplicity, scope, root problem, reuse | completed |
| `egm-inventive-catalyst` | False compromises, contradiction elimination | completed |

## Severity Summary

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 7 |
| Nit | 13 |

Findings reported by both reviewers are merged and list both lenses. Line references are to the PRD unless stated.

**Overall:** The PRD keeps confirmed scope (PDR-001 to PDR-005) apart from proposals, stays at product level, and does not reinvent anything. `libs/backend` holds only `common`, `database` and `identity`, so there is no booking, availability or venue code to reuse. The main risk is scope creep through unapproved proposals. A few confirmed rules also collide with each other: the 24-hour expiry against session start, and pending requests against slot holds.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Release acceptance is built on unapproved proposals - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Section 5 (L38, L97), Section 9 acceptance items 1 and 6 (L163-L171), L5
* **Discrepancy Description**:
  * Acceptance item 1 requires "the agreed onboarding and verification process", but verification is O3 and not approved.
  * Item 6 requires "chosen cancellation, notification, and session-outcome flows" to work end to end. Those flows are O5, O6 and O8, all undefined.
  * Section 5 lists reviews, rebooking, reminders, completion reporting and admin status history as "Required experience in the proposed release".
  * The release definition therefore grows with every open question. Retention items (rebook, return-booking metric, reviews) are not in the decision log's confirmed set.
* **Rationale & Recommendation**: Split Section 5 and Section 9 into two tiers.
  * Core is what follows from PDR-001 to PDR-005: trainer profile, one venue, published price and availability, client request, trainer accept or decline, 24-hour expiry, shared status, in-app trainer alert, production auth.
  * Candidates are everything else (reviews, rebook, reminders, completion and no-show, withdrawal and cancellation, admin dispute handling). Mark them "decide in or out", not implicitly required.
  * Line 191 already names the minimal outcome of one trainer publishing availability and one client getting an accepted booking. Make that the anchor of the acceptance list.

### PRD contradicts itself on whether retention is in the first release - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L8, L36-L38, L58, L68, journey diagram S2/S3, success metrics (L161)
* **Discrepancy Description**: L8 says the first release "should support... a client attending a session and returning for another booking". L68 allows review and rebook only "if those capabilities are retained in the release". L38 says they need review. The journey diagram and the success metrics assume them.
* **Rationale & Recommendation**: State one position. Either mark S2/S3 and the return-booking metric as "candidate, not core", or remove the L8 claim.

### Competing pending requests vs. slot holds (O2) leave a hole and a false binary - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** Section 6 "Proposed safeguards" (L124-L125), Section 7 "Two clients want the same time" (L137), acceptance item 4 (L168), O2 (L180), payment assumption (L129); Architecture 6.1
* **Discrepancy Description**:
  * Without holds, two clients can have pending requests for the same time. The PRD does not say what happens to the loser when the trainer accepts one. Options are auto-decline, stay pending, or fail the acceptance. Acceptance item 4 requires no conflicting confirmations but does not say how the loser is resolved.
  * L124 frames the choice as binary (hold the slot or do not) and names one downside only. Requests cost nothing (no platform payment, L120, L129). A hold on every pending request lets one client block a trainer's calendar for 24 hours with several unanswered requests. It also turns L137 into a first-come lockout, so the trainer never chooses between clients.
  * O2 also drives the data model. Architecture 6.1 suggests an exclusion constraint on time ranges. It must cover pending rows with holds, and confirmed rows only without holds.
* **Rationale & Recommendation**: Make O2 a must-decide before feature breakdown, and add a one-line rule for the loser case.
  * Separate "avoid conflicting confirmations" from "reserve inventory". Apply the hard no-overlap guarantee to Confirmed bookings only, as Architecture 6.1 already specifies.
  * Let several Pending requests coexist for one slot. Accepting one atomically resolves the others as "slot taken", which is a distinct reason and not an expiry. The losing client needs a clear message and a recovery path.
  * If a hold is still wanted, make it adaptive: cap concurrent pending requests per client and per client per trainer, reject overlapping pending requests from the same client, and bound the hold to min(deadline, an approved cutoff before session start).
  * Either way the acceptance-time conflict check must be atomic.
  * Costs: more trainer comparison UI and notification logic, and caps limit comparison shopping.

### Fixed 24-hour expiry collides with session start; no minimum notice approved - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** L24, L109, L116, L118, L136, L166 (acceptance item 2), L179 (O1); first-release.md L16, L41
* **Discrepancy Description**:
  * L116 states as confirmed that the deadline is submission plus 24 elapsed hours. L136 says "never leave approval pending after session start". With no approved minimum notice, a request for a session 2 to 3 hours out would stay pending long after the session started. The two statements cannot both hold unqualified.
  * This appears as open in Section 7 and O1 but not in the "Confirmed requirements" list, and it is not marked as blocking the booking-request feature.
  * A shorter deadline would change what PDR-005 confirms ("expires after 24 elapsed hours"). L136 does not say this needs owner re-approval.
  * Acceptance item 2 ("the correct deadline") cannot be tested until this is settled.
* **Rationale & Recommendation**:
  * Define the deadline as a derived value: min(submission + 24h, session start - buffer). Keep 24 hours as the cap and show the effective deadline to the client before submitting.
  * Alternatively, filter bookable slots to those at least buffer plus response window away, so the short-deadline case never arises. Or mark O1 as blocking the booking-request feature.
  * Record the chosen option as an owner decision that supersedes the PDR-005 wording, per the decision log update rule (first-release.md L41). Reword L116 to "up to 24 hours" or make it conditional on O1.
  * Costs: a variable deadline complicates UI copy ("respond by X") and reminder timing. "Expired unanswered" (L159) no longer measures one fixed window.

### Trainer notification is treated as open, but the confirmed flow depends on it - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** Section 5 "Notifications" (L94, L96), Section 7 "Notification fails" (L143), O6 (L184), success measure for expired requests (L159); Architecture 5 `notifications` and the iOS web-push note (about L171); trainer-web.md Phase 9
* **Discrepancy Description**:
  * The trainer has 24 hours to respond or the request expires. If the trainer is never told a request exists, the confirmed flow degrades into mass expiry. Channels and reminder timing are left open (O6), and L143 says in-app status is authoritative. That protects data integrity but does nothing for a trainer who never saw the request.
  * "Requests that expire unanswered" (L159) would then measure notification gaps as much as trainer intent, so pilot data would mislead.
* **Rationale & Recommendation**: Split notifications into two parts, and treat the core part as a prerequisite of the 24-hour rule.
  * Core: a trainer request alert and a client decision alert, on the cheapest guaranteed channel. Email is already modeled by Architecture 5 via domain events.
  * Candidate: reminders, SMS and push. Move O6 earlier in the dependency order.
  * Consider an escalating reminder tied to the deadline, and a tracked delivery state so an unseen request is distinguishable from a seen-and-ignored one.
  * Costs: more templates, a scheduler or delayed jobs, delivery-state storage, trainer notification fatigue, and SMS cost if chosen.

### "Existing client, trainer, and admin web apps provide the delivery surfaces" is misleading - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (cross-document note)
* **Affected Scope:** L34; phase-1-repo-foundation.md (W5-W7); Architecture 11 (about L174, L233)
* **Discrepancy Description**: The apps are only login and placeholder-home shells, and the shared UI library has a handful of components. A fresh reader could assume the booking, availability and review surfaces partly exist.
* **Rationale & Recommendation**: Reword, for example "Three web app shells with login exist; all product screens are new." State that the admin app needs at least a trainer-approval screen if O3 stays "manual admin review".

### Trainer verification may be heavier than the pilot needs - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L72, L80, L181 (O3); trainer-web.md Phase 4; Architecture Q9
* **Discrepancy Description**: The older plan assumes document upload via S3 pre-signed URLs, a multi-step Signal Forms wizard, and a verification status screen with resubmit. The PRD correctly does not specify upload, but it does not say a minimal path is acceptable. For a single-city pilot with few trainers, an admin approve or request-changes flag would do, with credentials collected out of band.
* **Rationale & Recommendation**: Add a "simplest acceptable verification" option under O3, so the feature breakdown does not inherit the broad Phase 4 scope.

---

### State names differ from Architecture and the trainer-web plan - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** L102-L112; Architecture 5 `booking` row (about L108); trainer-web.md Phase 6 (about L104) and Phase 7
* **Discrepancy Description**: The PRD uses Pending, Confirmed, Declined, Expired, Withdrawn and Cancelled, and calls the trainer action "accept". Architecture's `booking` lifecycle is "requested, confirmed, completed, cancelled", with no declined or expired. The trainer-web plan uses "confirm, decline, cancel with reason", and Phase 7 has on-demand "expiry".
* **Rationale & Recommendation**: Add a one-line glossary (Pending corresponds to Architecture's "requested"). Note that the Architecture lifecycle needs updating at feature breakdown.

### Older plan defaults can be mistaken for decisions - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L181; trainer-web.md Q3; Architecture Q9
* **Discrepancy Description**: Both older documents carry "Document upload plus manual admin review" as a default. The PRD says "Credentials plus manual admin review. Not approved."
* **Rationale & Recommendation**: Cross-reference the three, or note in O3 that the older defaults are not approvals.

### Time zone handling is more general than the single-city decision needs - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L128; Architecture D13 and Section 9
* **Discrepancy Description**: The PRD requires dates in "the relevant local time zone, with the zone visible". With a single launch city there is one zone.
* **Rationale & Recommendation**: A single configured zone with UTC storage retained is enough for the pilot. A per-user or per-venue zone is premature. State it as an assumption against O7.

### Venue cardinality and venue-entry cost ownership are unclear - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L64, L95, L99, L152, L181 (O4, O7); trainer-web.md Phase 5; Architecture Q4
* **Discrepancy Description**: L152 says multiple venues per trainer is "not specified" and its placement "needs review", while O4 proposes one venue. The older plan has venue entries, travel radius and service area. The PRD does not say whether Architecture Q4's default ("venue as text plus coordinates") applies. Gym-entry and venue-entry costs have no named data owner (free-text field on the venue, or a trainer-entered amount).
* **Rationale & Recommendation**: Point L152 to O4. State that exact maps are not needed (L99 hints at it). Name the owner of the entry-cost data.

### Venue and client-information privacy is not specified - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** L63, L66, L74, L95, L99; Architecture 7, 9 and about L203; O9
* **Discrepancy Description**:
  * Pre-sign-in browsing exposes the trainer, price and venue publicly. The PRD does not say whether the exact address and meeting instructions appear only after acceptance (L66 implies this) or on the public profile.
  * The trainer sees "client information" (L74) before deciding, and the PRD does not mention privacy or consent. Architecture says to define retention and consent rules before launch.
  * Anonymous browsing needs unauthenticated read endpoints. The Phase 1 apps put `/` behind `authGuard`, and the API uses a global JWT guard. This matters for feature breakdown, not for the PRD text. SSR (Architecture 7, Proposed) is not required, so SEO should not be assumed.
* **Rationale & Recommendation**: State the disclosure rule (exact address and contact details only after acceptance, hidden again after decline or expiry). Show a minimal client profile (first name, goal, time) on the request. Tie the minimum client profile to O9.

### "Confirmed requirements" overstates provenance - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** L114-L121, L3; first-release.md L10-L16
* **Discrepancy Description**: The decision log has only PDR-001 to PDR-005. Several items under "Confirmed requirements" are derived, not owner-stated: only the assigned trainer decides, four distinguishable states, no reviving of expired requests, and elapsed-hour calculation.
* **Rationale & Recommendation**: Relabel as "derived from confirmed decisions (PDR-003, PDR-005)", or add them to the log. Keep the owner-approved set limited to Section 2.

### "Not approved" and "open question" lists are not exhaustive or in sync - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** PRD L38, L112, L138, L152, L177-L187; first-release.md L22-L30
* **Discrepancy Description**:
  * The PRD lists notifications, completion reporting, withdrawal and cancellation as needing review. The log's unapproved table does not list them.
  * Two open items appear in the PRD body without an O-ID: availability changes after a request (L138), and placement of recurring bookings, packages, chat, calendar sync and multi-venue (L152). Review and rebook retention scope is only partly covered by O9. The PRD and log both say open questions live in Section 10.
* **Rationale & Recommendation**: Give the missing items IDs, or say Section 10 is not exhaustive, and keep one authoritative "not approved" list. For availability edits, require explicit resolution of affected pending and confirmed bookings before saving, which keeps "no silent cancellation" (L138).

### "Pilot", "first release" and "public pilot" are used interchangeably - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst`
* **Affected Scope:** L8, L129, L156, L171, L173, L181, O4; Architecture L239 and Next steps item 4; Architecture D20
* **Discrepancy Description**: Acceptance item 7 gates production auth on a "public pilot", which implies a non-public pilot might not need it. Architecture says "before a real-user launch", and production builds ship `UnconfiguredAuthService`, so real users cannot sign in without Cognito anyway.
* **Rationale & Recommendation**: Define one term (for example pilot = invited real users, release = public). Align acceptance item 7 and Architecture Next steps item 4.

### Admin and completion scope should stay minimal - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L76, L79-L82, L98; Architecture 5 `sessions` and `admin`
* **Discrepancy Description**: Booking lookup plus status history is a read-only support tool. Dispute handling, suspensions and cancellation overrides are deferred or open. Architecture's `sessions` includes check-in and check-out, but the PRD needs only a completion record. The PRD says "record completion or report an issue", but "report an issue" is not in the capabilities table.
* **Rationale & Recommendation**: Keep dispute handling out of the core. Store completion on the booking, with no separate `sessions` entity or lifecycle. Add "report an issue" to the capabilities table or drop it.

### Expiry implementation should stay lazy - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L125; Architecture 5 and 6.8 (BullMQ and Redis queues)
* **Discrepancy Description**: The PRD's server-time check at read and accept time is the right design. Architecture proposes job queues, which expiry alone does not need.
* **Rationale & Recommendation**: For the feature plan, evaluate expiry at read and accept time plus a simple periodic sweep for notifications. Do not add a job queue only for expiry.

### Decline and expiry send the client back to the start - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Journey flowchart (L53-L55), L135
* **Discrepancy Description**: The flow routes B4 and B5 back to C1 (browse), which treats a wasted wait of up to 24 hours as unavoidable. L135 proposes "offer another slot/trainer", but the diagram does not show it.
* **Rationale & Recommendation**: Carry the request context (time, session type) into a prefilled "request another trainer or slot" step. Alternatively allow a bounded set of parallel requests for the same time to different trainers, with the first acceptance auto-withdrawing the rest. PDR-003 still holds because each trainer approves individually. Parallel requests add trainer load and interact with the competing-requests finding above.

### No day-of coordination channel for confirmed in-person sessions - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** L74, L140-L141, L152
* **Discrepancy Description**: Chat is out of scope and cancellation and no-show are open, yet confirmed in-person sessions need day-of coordination (running late, cannot find the venue, cancelling).
* **Rationale & Recommendation**: Consider structured one-tap status messages ("running late", "cannot attend") routed through notifications. Exchanging phone numbers on confirmation is a wider alternative, but it raises off-platform leakage and privacy concerns.

### Architecture 6.5 payment sentence can mislead - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Architecture.md L149 (cross-document, no PRD change required)
* **Discrepancy Description**: Architecture says the payment model "should be settled before building trainer onboarding". PDR-004 says future payment decisions do not block this release. The PRD is consistent with PDR-004, but the older sentence can mislead.
* **Rationale & Recommendation**: Add "first release excepted" to Architecture 6.5.

---

## What the PRD gets right (zoom-out lens)
* It states precedence over the older plans, and both older plans carry a banner pointing back to it.
* Payment is cleanly excluded (PDR-004, L120, L129), consistent with Architecture 6.5 and D11.
* Sections 1 and 11 refuse to carry the older roadmap as first-release scope.
* Atomic conflict prevention and the server-time deadline check (L125) already resolve the accept-versus-expiry race at requirement level. The inventive-catalyst lens found no further false compromise there.
* The "preserve agreed price, duration and venue" and "history of status changes" safeguards are small, product-level and cheap.
