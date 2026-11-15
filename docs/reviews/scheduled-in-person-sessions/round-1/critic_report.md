# Goldfish Review Report

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md` (lines 1-192, full file)

Mode: REVIEW, single round. No fixes were applied and the PRD was not modified.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-structural` | completed |
| `egm-style` | completed |

Standard: `feature-spec-standard.md` applied by `egm-design` and `egm-structural`. `egm-style` had no standard.
Baseline: `docs/decisions/first-release.md`, `docs/plans/trainer-web.md`, `docs/plans/phase-1-repo-foundation.md`, `Architecture.md`.

## Summary

| Severity | Count |
| --- | --- |
| Blocker | 1 |
| Major | 11 |
| Nit | 14 |

Line numbers come from the reviewers' reports. The reviewers' line references agree with each other.

**Confirmed, proposed and open separation.** The reviewers agree it is mostly accurate.
- The five rows in section 2 match PDR-001 to PDR-005 exactly.
- O1 to O4 match the decision log's unapproved table.
- Section 7 is the most consistent section, because each row is prefixed Confirmed, Open or Proposed.
- The Architecture D8, D9 and D11 qualifiers and the trainer-web and phase-1 historical banners agree with the PRD.
- Differences from the older plans' broader launch scope were treated as expected. No real conflict with them was found.

The separation breaks down at the edges:
- **Over-claimed:** some items are labelled "Confirmed" but are not in the decision log.
- **Under-claimed:** some items sit under "Proposed" although a PDR already covers them.
- **Unlabelled:** many rules appear inside Open or Proposed rows with no label.
- **"Agreed":** the word is used for unapproved items.
- **Precedence clause:** it covers proposed content.

## Prioritized Findings (Blockers -> Major -> Nits)

### No Alternatives Considered section - Severity: Blocker
* **Reviewer Lens:** `egm-design` (F1), `egm-structural` (B1)
* **Affected Scope:** Whole document. Sections 2 (lines 14-24), 6 (line 124) and 8 (lines 145-152).
* **Discrepancy Description**: The standard fails a spec that proposes a single path without documenting rejected alternatives and their trade-offs. The PRD records chosen paths and deferrals but gives no technical or scope rationale for rejecting these options:
  * instant booking (which `first-release.md:14` places out of scope);
  * on-demand dispatch and online sessions;
  * platform payments;
  * no slot hold, or first-accepted-wins;
  * a shorter or longer response window, or a minimum notice period;
  * one venue versus several (O4);
  * manual admin verification versus no gating or automated checks;
  * browse-before-sign-in versus sign-in first.
  Only the slot hold names a trade-off, and only in one clause (line 124). The decision log holds owner quotes only, so it does not fill the gap. The standard also prohibits attributing a rejection to the owner without a link.
* **Rationale & Recommendation**: Add an "Alternatives considered" section. For each option, give why it was not chosen for this release and what would trigger revisiting it. For open items O1, O2 and O4, list the options with their trade-offs. If the standard is deliberately not applied to product-level PRDs, record that exemption explicitly in the document.

### Precedence clause covers unapproved content - Severity: Major
* **Reviewer Lens:** `egm-style` (M1), `egm-structural` (M1)
* **Affected Scope:** Lines 3, 10, 191.
* **Discrepancy Description**: Line 10 says the PRD "defines the proposed product experience". The same paragraph says "the first-release decisions in this PRD take precedence" over older plans. The PRD mixes confirmed and proposed content. A reader could conclude that unapproved items override older defaults, for example manual verification (O3) against `trainer-web.md` Q3 and Architecture open item 9. This contradicts line 3 and `first-release.md:30`. Line 10 also says the log holds "rationale", but the log records owner quotes and consequences.
* **Rationale & Recommendation**: Limit precedence to the section 2 decisions, PDR-001 to PDR-005. State that proposals carry no precedence until approved. Change "rationale" to "owner confirmations".

### "Confirmed" items are not traceable to the decision log - Severity: Major
* **Reviewer Lens:** `egm-style` (M2), `egm-structural` (M3), `egm-design` (F8, F14)
* **Affected Scope:** Lines 102-120 (lifecycle, state diagram and "Confirmed requirements"). Also line 18 and line 129.
* **Discrepancy Description**:
  * Lines 116, 117 and 120 trace to PDR-005, PDR-003 and PDR-004.
  * These items are derived inferences, not owner decisions:
    * the `Declined` state;
    * `Expired` as a distinct state;
    * "cannot subsequently be accepted; a new request is needed" (line 118);
    * "only the assigned trainer can approve or decline" (line 117);
    * the four visible states (line 119);
    * "accept or decline" in line 18 (PDR-005 does not mention decline).
  * "A new request is needed" is a new rule, because reopening an expired request is the alternative.
  * Line 129 ("Do not create a paid/unpaid status") sits under "Proposed safeguards", although PDR-004 already forbids payment verification. This is under-claimed.
  * The PRD never cites PDR IDs, so a reader cannot check which bullets are owner-confirmed.
* **Rationale & Recommendation**: Add the PDR ID to each confirmed bullet and to the section 2 rows. Label derived rules "Confirmed (derived from PDR-00x)", or add them to the log as new PDR entries after owner sign-off. Move line 129 to the confirmed side with a PDR-004 reference.

### Line 136 conflicts with the confirmed 24-hour window - Severity: Major
* **Reviewer Lens:** `egm-style` (M3), `egm-design` (F4, in part)
* **Affected Scope:** Lines 66, 74, 109, 116, 136.
* **Discrepancy Description**:
  * The row is labelled Open. It offers "an explicit shorter response deadline rule", which would change the confirmed 24-hour window (PDR-005) without saying so.
  * Its last sentence, "Never leave approval pending after session start", is an unlabelled absolute.
  * For a request made less than 24 hours ahead, the sentence contradicts line 109 (expiry only after 24 hours) and line 116 (deadline equals submission plus 24 elapsed hours).
  * Lines 66 and 74 promise an "exact response deadline", which this rule would change.
* **Rationale & Recommendation**: State that a shorter deadline would reopen PDR-005. Label "never pending after session start" as Proposed, or tie it to O1. If it is kept, add the early-expiry path to the lifecycle.

### "Agreed" used for unapproved items - Severity: Major
* **Reviewer Lens:** `egm-style` (M4), `egm-structural` (M4), `egm-design` (F9)
* **Affected Scope:** Lines 82, 165, 191.
* **Discrepancy Description**:
  * Line 82 ("within an agreed authority model"): O8 says "To define".
  * Line 165 (acceptance criterion 1, "the agreed onboarding and verification process"): O3 is "Not approved", as are line 38 and `first-release.md:27`.
  * Line 191 ("split the agreed journey"): line 38 says the journeys are proposed.
  * Line 165 also makes an acceptance criterion depend on an open decision.
* **Rationale & Recommendation**: Replace "agreed" with "proposed", "chosen" or "to be agreed". Reserve "confirmed" for PDR items. Make criterion 1 explicitly depend on O3 being closed.

### Section 10 is not a complete register of open decisions - Severity: Major
* **Reviewer Lens:** `egm-style` (M5), `egm-design` (F5), `egm-structural` (N4)
* **Affected Scope:** Lines 93, 127, 131-143, 152, 175-187. Decision log line 30.
* **Discrepancy Description**: The log says exact open questions live in PRD section 10, so gaps propagate. These items are marked Open, Proposed or unspecified in the body but have no O-ID:
  * availability changes after a request (line 138);
  * maps and exact search filters (line 93; O9 covers filters only, and Architecture open item 4 covers maps);
  * "material changes need participant agreement", where "material" is undefined (line 142);
  * the shorter response deadline option (line 136; not in O1);
  * status-change history (line 127);
  * keeping the agreed price and venue (line 142; the log lists "preserve booking price/details" at line 28);
  * "notify client and offer another slot" (line 135);
  * the time-zone display rule (line 128);
  * recurring bookings, packages, chat and calendar sync (line 152);
  * public versus post-acceptance disclosure of the venue address.
* **Rationale & Recommendation**: Give every Open or Proposed item an O-ID, or link each section 7 row to an O-ID. Note low-risk defaults as defaults.

### No Risks & Mitigations section; security and trust risks unaddressed - Severity: Major
* **Reviewer Lens:** `egm-design` (F2), `egm-structural` (M5)
* **Affected Scope:** Whole document. Sections 4 to 8 (lines 63-98, 122-129, 145-152) contain only fragments.
* **Discrepancy Description**: The standard requires failure modes, security implications, scalability limits and mitigations. These are not covered, or are only mentioned in passing:
  * **Safety:** in-person sessions between strangers have no safety model beyond "report an issue" (lines 76, 82). Architecture section 9 says trust and safety "are part of the product".
  * **Health data:** there is no mention of health or liability disclosures. Architecture section 9 treats health-adjacent data as sensitive and requires retention and consent rules before launch.
  * **Privacy and address exposure:**
    * Line 77 shows "client information" to the trainer before acceptance. O9 leaves the minimum client profile undefined.
    * Lines 63 and 64 allow public browsing and venue review before sign-in.
    * Line 67 releases meeting instructions only on acceptance.
    * The PRD never says what is public (venue name or area) and what is released after confirmation (exact address). A trainer's home or private studio could be exposed.
  * **Role assignment:** line 90 requires "role-appropriate access". Nothing says how a user becomes a trainer or admin. Architecture section 6.4 uses Cognito groups with hosted sign-up, so a self-selected trainer role is an escalation risk.
  * **Slot hoarding:** under the proposed hold, any client can block many slots for 24 hours each. No cap on concurrent pending requests is stated.
  * **Off-platform payment:**
    * Line 129 bans a paid/unpaid status, so admin has no payment evidence for price or no-show disputes.
    * Trainers can take clients off-platform, because there is no commission and no payment signal.
    * There is no recourse for payment disputes (line 120).
  * **Trainer non-response and stalled expiry job:** neither is covered. Non-response will depress conversion under the 24-hour expiry.
  * **Spam and abuse:** request spam is not covered.
* **Rationale & Recommendation**: Add a risk table with risk, impact, mitigation and owner. Cross-reference Architecture section 9 rather than duplicating it. Include a public versus post-acceptance data-exposure rule.

### Section 1 states unapproved items as release scope - Severity: Major
* **Reviewer Lens:** `egm-structural` (M2), `egm-style` (N4)
* **Affected Scope:** Line 8. Also lines 68 and 161.
* **Discrepancy Description**: Line 8 says the first release "should support a complete journey" including verification and "returning for another booking". Line 38 and `first-release.md:28` list rebooking and review as proposed, and O9 leaves review rules open. Line 68 hedges that review and rebooking may not be "retained". The "Clients who return" metric (line 161) assumes rebooking.
* **Rationale & Recommendation**: Limit line 8 to the confirmed core: request, trainer decision, confirmation. Mark the attendance and return portion as proposed.

### Confirmed 24-hour window depends on an unapproved notification channel - Severity: Major
* **Reviewer Lens:** `egm-design` (F3)
* **Affected Scope:** Lines 38, 96, 143. O6.
* **Discrepancy Description**: Trainer alerts need review (line 38). Channels and timing are open (line 96, O6). Yet the confirmed rule says an unanswered request expires after 24 hours. If the trainer is not reliably told that a request exists, requests expire for avoidable reasons. Line 143 makes in-app status authoritative but does not say how the trainer learns of a request. Web push on iOS is limited (Architecture section 7, `trainer-web.md` section 8 "Mobile browsers"), and trainers are mostly on phones.
* **Rationale & Recommendation**: State a minimum trainer-alert requirement, for example email plus in-app, as a prerequisite of PDR-005. Alternatively, mark the 24-hour window as dependent on O6.

### Lifecycle cannot represent "same slot, no hold" outcome - Severity: Major
* **Reviewer Lens:** `egm-design` (F4)
* **Affected Scope:** Lines 104-112, 124, 136-137. O2.
* **Discrepancy Description**: The lifecycle has only Pending, Confirmed, Declined and Expired. If the hold is not approved, several pending requests can target the same time. When the trainer accepts one, the others have no defined outcome. They are not declined and not expired. Acceptance can also fail because it overlaps an existing confirmed booking, and the diagram has no such state. Line 137 says only "Open hold policy", so feature breakdown is blocked on a decision whose state-model consequences are not described.
* **Rationale & Recommendation**: Describe the outcome for competing requests under both hold and no-hold. Add a state or reason code such as "Unavailable" or "Superseded".

### Release scope for cancellation and outcomes is ambiguous - Severity: Major
* **Reviewer Lens:** `egm-design` (F6)
* **Affected Scope:** Lines 64-66, 76, 97, 112, 139-141, 160-170. O5, O8.
* **Discrepancy Description**: Journeys, metrics and acceptance criteria assume cancellation terms, completion recording and cancellation and no-show flows work "end to end" (line 170). The confirmed scope contains none of these.
  * Line 65 requires showing cancellation terms before submission, but O5 says "To define".
  * Lines 64 and 66 say "if retained in the release", while the metrics on lines 160-161 require outcomes and returns.
  * Line 161 lumps "cancelled" (a booking status) with session outcomes (completed or no-show), which line 112 records separately.
  * Without a decision, a confirmed booking may have no way to be cancelled.
* **Rationale & Recommendation**: Add an owner decision on the minimum cancellation and outcome set for the first release. Align the success metrics and acceptance criteria to whatever is retained.

### "Pilot" and "public pilot" undefined, with a security consequence - Severity: Major
* **Reviewer Lens:** `egm-design` (F7), `egm-style` (N2), `egm-structural` (N3)
* **Affected Scope:** Lines 129, 171, 181, 185. Also line 90.
* **Discrepancy Description**: The PRD uses "first release", "release" and "pilot" interchangeably. Line 171 requires production authentication "before a public pilot". That implies a non-public pilot with real users could run on development auth. This conflicts with line 90 ("Existing development auth is not production authentication"). It also conflicts with Architecture D20 and next step 4, which say to connect Cognito "before a real-user launch".
* **Rationale & Recommendation**: Define "pilot" once. Require production auth for any session involving real users, or state exactly what a private pilot may use.

### Proposed and confirmed content mixed in sections 4 and 5 without labels - Severity: Nit
* **Reviewer Lens:** `egm-structural` (N2), `egm-style` (N5), `egm-design` (F9)
* **Affected Scope:** Lines 40-59 (flowchart), 84-98 (section 5), 136-138, 140.
* **Discrepancy Description**:
  * The section 5 Booking row (line 94) mixes confirmed behaviour (24-hour expiry) with proposed behaviour (withdrawal, notification).
  * The flowchart draws proposed gates, such as admin review and sign-in after browsing, as settled.
  * Normative statements in Open or Proposed rows carry no label: "never overlap" (137), "no silent cancellation" (138) and "No automatic monetary penalties" (140, derivable from PDR-004).
  * Line 125 lists atomic overlap prevention as proposed, yet lines 92, 137, 168 and 171 treat no-overlap as settled, and Architecture 6.1 already requires transactional slot reservation.
* **Rationale & Recommendation**: Add a Status column (Confirmed, Proposed, Open) to section 5. Add a legend or node styling for proposed items in the flowchart. Label each normative statement and align the no-overlap labels.

### Terminology drift - Severity: Nit
* **Reviewer Lens:** `egm-style` (N1), `egm-structural` (N3), `egm-design` (F10)
* **Affected Scope:** Lines 64, 66, 95, 107, 117, 185 and others.
* **Discrepancy Description**:
  * The same charge is called "gym-entry charges", "additional venue charge" and "venue-entry costs".
  * "Request", "booking request" and "booking" are mixed, as are "meeting details", "meeting instructions" and "venue/address".
  * The state label "Pending" differs from the UI label "Awaiting trainer approval", and from Architecture section 5's "requested".
  * "Approve" means both the admin approving a trainer and the trainer approving a booking. Line 117 uses "approve or decline" while the rest of the PRD uses "accept or decline".
* **Rationale & Recommendation**: Fix a glossary. Use "accept" for bookings and "approve" for trainer applications. Reconcile the Pending state with the Architecture lifecycle.

### Total price and venue charge unclear - Severity: Nit
* **Reviewer Lens:** `egm-structural` (N5), `egm-design` (F10)
* **Affected Scope:** Lines 64, 65, 95.
* **Discrepancy Description**: Step 2 has the client review "cancellation terms" and "gym-entry charges" before submitting. These are open (O5, O7). The PRD does not say whether venue charges are part of the "total price" or who collects them. PDR-004 and line 120 cover only client-to-trainer payment.
* **Rationale & Recommendation**: State whether venue charges are included and who is paid, or mark the step as dependent on O5 and O7.

### Missing Problem Statement and Goals headings - Severity: Nit
* **Reviewer Lens:** `egm-structural` (N1), `egm-design` (F12)
* **Affected Scope:** Lines 6-12, 154-173.
* **Discrepancy Description**: The problem is one sentence (line 8) and does not give the motivation (why this marketplace, why scheduled first). Goals are implicit in sections 1 and 9. Non-goals are section 8 without a matching heading. No expected pilot scale is given, which matters for expiry processing and the metric targets (line 156).
* **Rationale & Recommendation**: Add short Problem and Goals subsections. Rename section 8 "Non-goals / Deferred". Add expected pilot scale.

### Section 8 content does not match its heading - Severity: Nit
* **Reviewer Lens:** `egm-style` (N9), `egm-structural` (N6), `egm-design` (F12)
* **Affected Scope:** Lines 145-152, 24, 124, 179, 180, 182.
* **Discrepancy Description**:
  * Native apps (line 150) are deferred by Architecture, not by a PDR, and the source is not cited.
  * Instant booking is out of scope per `first-release.md:14` but missing from the list.
  * The closing paragraph (line 152) lists items "not specified", which is not "Explicitly deferred". It lists multi-venue, which O4 treats as open.
  * The 48-hour "not approved" statement repeats at lines 24 and 179 and in the log. The hold "not approved" statement repeats at lines 124 and 180.
* **Rationale & Recommendation**: Cite sources, add instant booking, move "not specified" items to section 10 or give them their own heading, and trim the duplication.

### Cross-document defaults versus "not approved" - Severity: Nit
* **Reviewer Lens:** `egm-style` (N8), `egm-design` (F13)
* **Affected Scope:** Line 181 (O3). Architecture section 10 item 9. `trainer-web.md` Q3.
* **Discrepancy Description**: The other documents list "document upload plus manual admin review" as the default if unanswered. O3 says "Not approved".
* **Rationale & Recommendation**: Add one sentence saying planning defaults in those documents are not approvals and do not apply to the first release until O3 is approved.

### Time zone and mobile wording vague; line 34 overstates current state - Severity: Nit
* **Reviewer Lens:** `egm-style` (N3, N6), `egm-design` (F10, F12)
* **Affected Scope:** Lines 34, 128, 169.
* **Discrepancy Description**:
  * "The relevant local time zone" is vague, and acceptance criterion 5 depends on it. Architecture section 9 stores a "venue/user time zone".
  * "Existing ... web apps provide the delivery surfaces" overstates current behaviour. Per Architecture section 11 the apps currently provide login and a placeholder home only.
  * "Mobile usability matters" has no requirement.
* **Rationale & Recommendation**: Name the venue's time zone. Write "responsive web usable on phone browsers; no native apps (Architecture section 7)". Note that the apps currently provide only sign-in and a placeholder home.

### Subjective or vague wording - Severity: Nit
* **Reviewer Lens:** `egm-style` (N7)
* **Affected Scope:** Lines 93, 170, 191.
* **Discrepancy Description**: "Basic filters" (line 93) is not measurable. "Chosen ... flows" (line 170) has no referent. "A useful initial outcome" (line 191) is an opinion, and "one approved trainer" presupposes the unapproved verification gate (O3).
* **Rationale & Recommendation**: Define the filters. Name the flows. Write "Proposed initial planning outcome".

### Architecture alignment gaps - Severity: Nit
* **Reviewer Lens:** `egm-structural` (N7), `egm-design` (F10)
* **Affected Scope:** Line 191. Section 2 table. Architecture sections 5, 6.1, 11.
* **Discrepancy Description**:
  * The PRD's initial outcome is "one client receiving an accepted booking". Architecture section 11 step 3 says "receiving trainer approval for a scheduled in-person booking".
  * Architecture 6.1 says the client "creates a booking" with a transactional slot reservation. This implies a hold at creation, which conflicts with the PRD treating the hold as open.
  * Section 2 rows have no PDR links.
* **Rationale & Recommendation**: Use one phrasing. Reconcile Architecture 6.1 with O2 when O2 closes. Add a PDR ID to each section 2 row.

### Diagram and heading asymmetry - Severity: Nit
* **Reviewer Lens:** `egm-structural` (N8)
* **Affected Scope:** Line 102, lines 53 and 56.
* **Discrepancy Description**: Section 6 opens with an unheaded "Confirmed core lifecycle:" paragraph, while its sibling blocks are H3s. Flowchart labels contain semicolons ("Client notified; chooses another option", "Attend in person; pay trainer directly"), which some mermaid versions treat as statement terminators.
* **Rationale & Recommendation**: Make the lifecycle an H3. Quote the labels or use commas.

### No admin rejection or suspension path - Severity: Nit
* **Reviewer Lens:** `egm-design` (F11)
* **Affected Scope:** Lines 81-82.
* **Discrepancy Description**: Section 4 stops at "approve or request changes". `trainer-web.md` Phase 4 has a rejected state.
* **Rationale & Recommendation**: Add a rejection and suspension path, or state that it is out of scope for the first release.

### Wording mismatch with decision log - Severity: Nit
* **Reviewer Lens:** `egm-design` (F14)
* **Affected Scope:** Line 18. Decision log.
* **Discrepancy Description**: Log PDR-005 does not mention "decline", but the PRD's confirmed table does. The log's "not yet approved" table omits withdrawal, status history and notification failure, which the PRD marks as proposed.
* **Rationale & Recommendation**: Update the log or the PRD so both list the same items under the same labels.

## Overlap and Disagreement Notes

- All three reviewers independently found the precedence clause, the unlabelled and over-claimed "Confirmed" items, "agreed" misuse, and the line 136 absolute. These carry the highest confidence.
- **Alternatives and Risks sections:** `egm-design` and `egm-structural` raised both. Both come from the feature-spec standard, which `egm-style` did not use. If the owner intends this product-level PRD to be exempt from that standard, the Blocker and the risk-section Major drop in severity, but the exemption should be written into the document.
- **Section 10 completeness:** `egm-style` rated it Major and `egm-structural` rated it Nit. It is kept as Major because the decision log names section 10 as the open-questions register.
- **Line 129 and no-overlap labelling:** `egm-structural` and `egm-design` reached the same conclusion. Line 129 and the lifecycle items are filed under the "Confirmed" traceability Major. The no-overlap label is in the unlabelled-content Nit.
