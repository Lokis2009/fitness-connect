# Goldfish Review Report

**Target:** `/Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md` (`lines 1-192`)

**Stage:** 8, Intermediate Zoom Out (single round, no fixes applied). The target file is unchanged since Stages 5-7.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |

## Verdicts Against the Zoom-Out Standard

* **Context sufficiency:** Passes. Purpose, users, scope and deferrals are clear. The Stage 6 one-sentence paraphrase matches the PRD.
* **Root problem and project alignment:** Holds. The PRD narrows scope to PDR-001 to PDR-005 and refuses to inherit the trainer-web roadmap (L10, L191).
* **Altitude:** Holds. No code-level detail. L12 states the PRD has no API contracts or tickets. The mermaid flowchart and state diagram are product-level.
* **Reuse:** Nothing to reuse. The reviewer checked the codebase. The libs are `libs/backend/{common,database,identity}`, `libs/frontend/{auth,data-access,feature-home,feature-login,ui}` and `libs/shared/api-contract`. A search for booking, availability, venue and trainer_profile across `apps` and `libs` returned nothing. Reuse pressure belongs at feature breakdown.
* **Simplicity:** The one real weakness is scope inflation through unapproved proposals, plus too many review-driven additions (see F1).

## Status of Earlier Findings

**Still stand (document unchanged):**

* Acceptance and release scope rest on unapproved proposals (Stage 5 Major; Stage 7 "Release scope for cancellation and outcomes is ambiguous" and "Section 1 states unapproved items as release scope").
* L8 retention claim versus the L68 hedge.
* 24-hour expiry versus session start (L116 against L136), with O1 open.
* Pending requests versus slot holds (O2), including the missing "loser" outcome that Stage 7 also raised.
* Trainer notification is a prerequisite of the confirmed 24-hour rule (L96, O6).
* L34 overstates the existing apps.
* "Pilot", "release" and "public pilot" drift (L171).
* Verification weight (O3).

**Mitigated or moot:**

* Stage 6 finding 1 (missing system baseline) is mostly moot. Replace "3-5 sentences per app" with a one-line fix at L34, for example "three web app shells with login exist; all product screens are new". Do not add a system-description section.
* Stage 6 finding 8 (request versus booking as one record) is a cheap, useful clarification. One sentence at the L102 state diagram resolves it (see F6).
* Stage 6 finding 2 (constraints delegated to Architecture). The L185 contradiction (O7 lists city and language as open while L185 calls them decided) is real but a Nit once O7 is narrowed. UTC storage can stay a pointer.
* Stage 5 "Expiry implementation should stay lazy" is moot at PRD altitude. L125 already says server time is authoritative. Carry it to feature planning.
* Stage 5 "Admin and completion scope should stay minimal" and "time zone is too general" remain valid but low value. Fold them into the tiering fix (F1).

## Prioritized Findings (Blockers -> Major -> Nits)

No Blockers.

### Review-driven additions would turn a product PRD into a heavy document; consolidate into one structural fix - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** whole document, mainly Sections 4, 5, 6, 9 and 10
* **Discrepancy Description**: Three stages together ask for a two-tier core versus candidate split (Stage 5), an "Alternatives considered" section and a risk table (Stage 7), a status column and flowchart styling (Stages 6 and 7), an O-ID for every open item, a glossary, PDR IDs on every confirmed bullet, and a system baseline (Stage 6). These patch one root cause separately. Confirmed, derived, proposed and open content are interleaved without a uniform marker.
* **Rationale & Recommendation**: Apply one mechanism. Add a Status column (Confirmed PDR-xxx / Derived / Proposed / Open Ox) to the Section 5 capabilities table and the Section 6 and 7 rules. Mark the proposed flowchart nodes. Make the core set the acceptance anchor: PDR-001 to PDR-005, one approved trainer publishing availability, and one client receiving an accepted booking (L191). Label everything else "decide in or out". This resolves most of Stage 5's "built on unapproved proposals", Stage 6 findings 4 and 6, and Stage 7's over-claim, "agreed", unlabelled-content and Section 1 findings. Do not also add the separate glossary, risk table, alternatives section and O-ID expansions. They would more than double the document.

### Stage 7 Blocker "No Alternatives Considered section" is overweighted - Severity: Nit (Stage 7 rated Blocker)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** whole document, L12 and Section 10
* **Discrepancy Description**: The Blocker rests on `feature-spec-standard`, a standard for technical specs. This is a product PRD that explicitly defers feature splitting (L12). Stage 7's own overlap note concedes the Blocker drops if the PRD is exempt. The alternatives that matter already appear as open decisions with proposals: O1 (48 hours), O2 (holds), O3 (verification), O4 (venues), and the hold trade-off at L124.
* **Rationale & Recommendation**: Add one sentence stating that this PRD records confirmed decisions plus open questions, and that rationale for rejected options lives in the decision log and the O-table. For O1, O2 and O4 only, add a one-line trade-off to the "Current proposal" column. Do not write an alternatives section for deferred items (dispatch, video, payments). Architecture D8, D9 and D11 already cover them.

### Stage 7 "Risks & Mitigations" Major asks for more than a first-release PRD should carry - Severity: Nit (for the PRD; Major for feature breakdown)
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L74, L120, L129, Architecture Section 9, O9
* **Discrepancy Description**: The valid kernel is three product rules: what is public before sign-in versus released after acceptance (the exact address; L66 implies post-acceptance release), a cap on pending requests (tied to O2), and the trainer-alert prerequisite (Stage 5's notification finding). The rest (safety model, health disclosure, role assignment through Cognito groups, spam, off-platform leakage) are not PRD-level decisions.
* **Rationale & Recommendation**: Add the three rules as Open items with O-IDs (the disclosure rule fits O9). Link the rest to Architecture Section 9, which already marks trust and safety and privacy as open, in one sentence. Do not add a risk table.

### Stage 6 and Stage 7 line references drift - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Stage 6 and Stage 7 reports
* **Discrepancy Description**: Terminology evidence is cited at Stage 6 L32/82/94, but gym-entry charges are at L64, L95 and L185. "Client information" is cited at L77 but is at L74. "Meeting instructions" is cited at L67 but is at L66. "Cancellation terms" are cited at L65 but are at L64.
* **Rationale & Recommendation**: When applying fixes, anchor by section or quoted text, not line number, so the wrong text is not edited.

### Stage 7 claim that Architecture 6.1 "implies a hold at creation" is overstated - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Architecture 6.1 against PRD O2 and L125
* **Discrepancy Description**: Architecture 6.1 requires transactional protection against double booking (row locks or an exclusion constraint). It does not reserve inventory for pending requests. Only the Stage 5 reading is consistent with the file.
* **Rationale & Recommendation**: The no-overlap guarantee can apply to Confirmed bookings only, and it is already architecture-confirmed. Relabel L125's "Prevent conflicting reservations atomically" as derived from Architecture 6.1, not as a proposal. Keep only the hold decision as O2.

### Define request and booking as one status-bearing record - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** L102-112, L126
* **Discrepancy Description**: Stage 6 finding 8 leaves unclear whether the request and the booking are one entity. A single record with a status fits the lifecycle. Completion should be stored on that record, which keeps the Architecture `sessions` module (check-in and check-out) from being pulled in by default (Stage 5 point).
* **Rationale & Recommendation**: Add one sentence at the L112 extension line stating a single status-bearing record, with completion stored on it.

## Recommended Order for the Next Stage

1. Fix the conflicts between confirmed rules: L116 against L136 (O1) and the O2 loser outcome. These are the only items that make confirmed text unimplementable.
2. Apply the single status and tier mechanism (F1 above).
3. Make the small precision edits: L34, the precedence wording at L10, "agreed" at L82, L165 and L191, and the "pilot" term.
4. Skip the Alternatives section, the risk table and the extra baseline.

## Overall

The document's altitude, scope and simplicity hold. It has no code-level detail, no new-component proposals, and the core scope is correctly narrowed. The main remaining risk is too many review-driven additions. Limit additions to the status and tier mechanism plus the two confirmed-rule conflicts.

## Severity Summary

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 1 |
| Nit | 5 |
