## Comprehension Test: /Users/Stanislav_Blokh/WebstormProjects/fitness-connect/docs/prd/scheduled-in-person-sessions.md (lines 1-192)

Mode: REVIEW. The reviewer read only this document. No document standard was applied.

**What this proposes**

Fitness Connect is a product where clients find fitness trainers and book scheduled, in-person sessions. This PRD defines the first release. A trainer applies and an admin approves them. The trainer then publishes a price, a venue and their availability. A client browses, picks a time and submits a booking request. The trainer has 24 hours to accept or decline. If the trainer doesn't respond, the request expires. Once accepted, the session is confirmed, the client attends in person and pays the trainer directly, with no platform payments. After the session the flow runs through completion recording, review and rebooking. The PRD separates a short confirmed core from a larger set of proposals that are not approved. The proposals are slot holds, withdrawal, cancellation, no-show handling, notifications, reviews, manual verification and public browsing. Section 10 lists the open decisions. The goal is to review the scope and then split it into features.

**How the existing system works, per this document**

The document says very little about the existing system. Three web apps already exist, one each for clients, trainers and admins (line 34). Development-only authentication exists and is not production-grade (line 90). An `Architecture.md` and "older implementation plans" exist. The architecture requires UTC storage and is described as having a single city/country and one language, and no native mobile apps. The older plans describe a broader launch, which this PRD narrows. The document never says what those apps can do today. It doesn't say whether profiles, availability or bookings already exist, or what "older trainer plan" means. I can't tell what is greenfield and what is a change to existing behavior.

### Findings

**1. Major. Lines 10, 34, 90, 150, 191. The existing system baseline is not described.**
- The PRD refers to "existing client, trainer, and admin web apps", "existing development auth", "the existing launch architecture", "older implementation plans" and "the older trainer plan's full roadmap".
- It never states what exists today or what this release adds.
- A reader with only this document can't tell whether the release builds trainer profiles from scratch or modifies them.
- They also can't tell which "older plan" is being overridden.
- Recommendation: add 3-5 sentences, or a short table, of current capabilities per app and the current auth state. Name the older plan(s) being superseded. Say which constraints come from Architecture.md.

**2. Major. Lines 10, 128, 185. Constraints are delegated to Architecture.md without being stated.**
- "Store instants in UTC as required by the architecture" and "single city/country and one language are existing architecture decisions" push the substance into a linked file.
- The reader can't see the constraint or its scope.
- Line 185 lists "launch city/country, language" as open (O7), while saying they're already decided. The reader can't tell which of the two is true.
- Recommendation: state the actual constraints inline (for example, "one city, one language, UTC storage"). Then reduce O7 to the values that really are open.

**3. Major. Lines 8, 26-32. The "why" and the pilot context are thin.**
- The document says what is built and for whom. It never says why this scope is the first release or what problem it solves for the business.
- "Pilot" appears (lines 129, 156, 171) with no definition. It doesn't say whether the pilot is a limited-audience launch, or its size, duration or participants.
- The document has no stated problem or goal beyond "a complete journey". Line 9 gives the journey but not the reason.
- Success targets are deferred to "after pilot size ... defined" (line 156).
- Recommendation: add a short problem and goal statement. Define the pilot, or say that it is the first release. Use one term consistently ("first release", "pilot", "proposed release").

**4. Major. Lines 10, 38, 112, 124, 138. Authority levels for decisions are hard to track.**
- The document works hard to mark confirmed against proposed against open, and that is good.
- But the same item sits at different levels in different places.
  - Line 38 says the "slot holds" journey step needs review.
  - Line 124 says the hold is a recommendation.
  - Line 138 says "Two clients want the same time: Open hold policy".
  - O2 says "Yes... Not approved".
- Section 4 shows the journey flowchart with the proposed steps (verification, browsing before sign-in) drawn the same as the confirmed ones. The flowchart doesn't mark which steps are proposed.
- The reader must compare four places to know the status of holds.
- Recommendation: mark proposed steps in the flowchart (dashed or labeled). Give each open item one ID and reference the ID from the other places.

**5. Major. Lines 24, 136, 179, 116-118. The conflict between the 24-hour window and short-notice bookings is unresolved in a way a reader can't act on.**
- A 24-hour response window is confirmed. Minimum notice is open (O1). The sessions can start in under 24 hours.
- The document says "Never leave approval pending after session start" (line 136). That conflicts with the confirmed rule that expiry is 24 hours after submission, so it needs a decision.
- The document doesn't say which rule wins when a session starts in less than 24 hours. The reader can't tell the confirmed behavior for this case.
- Recommendation: state explicitly that the confirmed behavior is undefined for this case. Or state the interim behavior, such as "the request expires at the earlier of the deadline and the session start". Mark whichever you choose as proposed.

**6. Major. Lines 57-58, 76, 97, 129, 169. The completion and "record completion" flow is shown in the diagram but its actor is undefined.**
- The flowchart includes "Record session completion" (S2). The text says "who records completion" is open (O8).
- Who performs S2 isn't stated in the diagram.
- Acceptance criterion 6 requires "session-outcome flows work end to end" without saying which flow.
- The PRD describes a journey (reviews, rebooking) that can't be tested against acceptance criteria while its rules are undefined.
- Recommendation: say that S2 and S3 are unapproved in the diagram. Define what "end to end" means in criterion 6, or say it cannot be accepted until O5 and O8 are decided.

**7. Major. Lines 29, 32, 81-82, 98, 170. Admin responsibilities are underspecified.**
- The admin's goals are "help resolve booking or session issues" and "handle reported issues within an agreed authority model".
- The document defines no reported-issue concept. It doesn't say who reports an issue or where.
- Lines 76 and 82 mention "report an issue" as a trainer capability and as admin work, with no definition of what an issue is.
- Recommendation: define "issue" in one line, or mark it open with an ID in Section 10. As written, the admin outcome can't be tested.

**8. Minor-to-Major (reported as Major). Lines 113, 126, 137. Statuses and entities are defined inconsistently.**
- The lifecycle diagram shows four states: Pending, Confirmed, Declined, Expired.
- The text mentions "Withdrawn", "Cancelled", "completed" and "no-show" as proposals. Line 119 requires the client to tell apart "pending, confirmed, declined, and expired".
- Whether "booking" and "request" are one entity is unclear. The text uses "request/booking" (line 126), and a "request" becomes a "booking" on acceptance (B3 in the flowchart).
- That implies two entities, or one entity in a different state. This matters for slot holds, history and rebooking.
- Recommendation: state that the request and the booking are the same record with a status. Or say they are different and explain.

**9. Nit. Lines 63, 66, 67. UI strings are quoted without saying they're required copy.**
- "Awaiting trainer approval" and "Pay the trainer in person" are quoted.
- It is unclear whether they are mandated wording or illustrations.
- Recommendation: say which.

**10. Nit. Lines 94, 140. "Withdrawal" and "confirmed cancellation" are called "distinct proposed actions" without a plain definition at first use.**
- "Withdrawal" is defined only on line 112 and in the table on line 139, after its first use on line 94.
- Recommendation: define it at first use.

**11. Nit. Lines 32, 82, 94. Several terms are used before they're explained.**
- "Gym-entry charges" (line 64) and "venue-entry costs" (line 185) are the same concept under two names.
- "Additional venue charge" (line 95) is a third name for it.
- Recommendation: use one term and define it. It means a fee the venue charges to enter, separate from the trainer's price.

**12. Nit. Line 3, 36-38. Heading and status wording.**
- Line 3 says "Agreed scope is recorded below" while the first-release decisions are in a separate decision log (line 10).
- The reader is told to treat the decision log as the rationale source but not told whether this PRD or the log wins if they disagree. Line 10 says Architecture.md wins for technical matters and this PRD wins over older plans.
- Recommendation: add one sentence on precedence between the PRD and the decision log.

### Overall

A reader can say what is being built (scheduled, in-person bookings with trainer approval, 24-hour expiry, and direct payment) and for whom (clients, trainers and admins). They can mostly say why the scope is limited, because Section 8 lists what is deferred. The reviewer found no section it couldn't paraphrase, so there are no Blockers. The main weakness is that the existing-system baseline is missing (Findings 1 and 2). The document is otherwise strong at separating confirmed, proposed and open items, but it tracks that status inconsistently across the diagram and tables (Findings 4 to 6).
