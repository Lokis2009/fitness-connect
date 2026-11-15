## Comprehension Test: docs/prd/scheduled-in-person-sessions.md (lines 1-262, round 2)

The reviewer read only this document and its persona file. No document standard was applied.

**What this proposes**

Fitness Connect would let clients find fitness trainers and request scheduled, in-person sessions. The first release covers one loop. An admin approves a trainer, who then publishes price and availability. A client picks a time at least 3 hours ahead and submits a request, which holds the trainer's slot. The trainer has 1 hour to accept or decline, and the request expires if they don't answer. Once accepted, the booking is confirmed and the exact address is revealed. Either party can cancel up to 3 hours before the start, and later cancellations are allowed but flagged. After the session the trainer marks it completed, and the client can dispute that, which creates an issue for an admin. The client pays the trainer directly in person. Online sessions, on-demand dispatch, platform payments, reviews, rebooking and native apps are deferred.

**How the existing system works, per this document**

Three web app shells exist (client, trainer, admin). Each has only a login, which the document calls "development auth" and says is not production authentication (lines 53 and 118). All product screens are new. An Architecture.md file is the source of truth for technical architecture. According to the document it supplies these rules:
- confirmed bookings never overlap (section 6.1);
- timestamps are stored in UTC;
- there is a single configured time zone;
- native apps are ruled out (section 7).

"Older implementation plans" describe a broader launch, and the PRD overrides them for product scope. A separate decision log holds the owner-confirmed decisions (PDR-xxx), and it wins over the PRD on any disagreement.

I could paraphrase every section, so there are no Blockers.

## Findings

**1. Major. Lines 6-8, 21, 229. The "why" is missing.**
- The PRD states what is built but not the problem it solves or who the target users are (the launch city is open, O7).
- It gives no goal for the first release.
- Line 229 says the rationale lives only in the decision log, and the PRD does not summarize it.
- A reader with only this document cannot tell why trainer approval, direct in-person payment or in-person-only sessions were chosen.
- Recommendation: add a short problem and goals paragraph to section 1, and one line of rationale per headline decision.

**2. Major. Lines 3, 19, 31, 225. The decision log is a hidden dependency.**
- Every "Confirmed" claim points to the decision log, and the log wins on conflicts. That makes the PRD's confirmed content unverifiable without the log.
- PDR-005 is referenced but never described apart from "24-hour window".
- O1, O2, O3, O5 and O8 are listed as closed (line 225), but their questions are never stated.
- Recommendation: state the closed questions inline, or say explicitly that the PRD is not meant to be read standalone.

**3. Major. Lines 19, 262. "Older implementation plans" and "the older trainer plan's full roadmap" are undefined.**
- They are neither named nor linked, yet the reader is told not to treat them as scope.
- Recommendation: name or link them, or drop the references.

**4. Major. Lines 120, 158, 245, 255. Architecture.md content is cited by section number only.**
- Several requirements are "Derived from Architecture.md section 6.1", and the document points to sections 6.4, 7 and 9.
- Decisions D8, D9 and D11 are mentioned with no description at all (line 245).
- Only the Architecture.md link on line 19 is given. The sections cited are not summarized.
- Recommendation: summarize each cited rule in one line and say what D8, D9 and D11 are.

**5. Major. Lines 33, 89, 154, 219. "Slot" is never defined.**
- It is unclear how bookable times are generated from weekly hours, exceptions and durations. Durations are Open (O7).
- It is also unclear whether a hold covers only the exact start time or any overlapping time.
- The whole hold and race logic depends on this.
- Recommendation: define a slot, and say how requested times map to availability.

**6. Major. Lines 35, 163, 253. The "late cancellation flagged in history" requirement depends on a Proposed feature.**
- PDR-010 is Confirmed and requires the flag "in the history".
- The status-change history itself is only Proposed (line 163), and admin lookup and history are Proposed (line 127).
- Line 253 says the address is "hidden again after cancellation (PDR-013)". PDR-013 (line 38) says nothing about cancellation.
- Recommendation: make the history Derived or Confirmed, or say where the flag lives. Either add the post-cancellation hiding to PDR-013 or mark it Proposed.

**7. Major. Lines 36, 126, 178, 208. The completion and dispute rules have gaps.**
- It is not stated when the trainer may record completion, for example whether this can happen before the session ends.
- It is not stated what happens if the trainer never records completion. The booking would stay Confirmed with no auto-completion, which also skews the success metrics.
- It is not stated how long the client has to dispute.
- The "issue" object is not defined: its states, who owns it, and what the booking looks like during a dispute.
- No-show handling is deferred to O10, so these edge cases currently have no defined state.
- Recommendation: state the timing rules or add them to O10.

**8. Major. Lines 255 and 213-223. A pre-launch safety requirement is not tracked as an open decision.**
- Line 255 says trust, safety and privacy for in-person sessions between strangers "must be defined before launch", but only as a pointer to Architecture.md.
- Section 10 ("Open decisions before feature breakdown") has no entry for it.
- Line 254 also leaves admin account creation to Architecture.md.
- Recommendation: add an Open item, or state the minimum first-release safety rules in this document.

**9. Nit. Line 41. The "Terminology" row of PDR-016 mixes two unrelated things.**
- It combines a wording choice ("first release") with the production-authentication requirement.
- The reader is not told what "first release" replaces or why that matters.
- Line 53 mentions "login only" shells, and lines 41 and 118 mention "development auth", but neither says what that is.
- Recommendation: split the row, and describe the current dev auth in a sentence.

**10. Nit. Lines 40, 189. The "clients who return" metric is never defined.**
- It is excluded, but the reader does not know what it is or where it came from.
- Recommendation: add a short definition, or drop it.

**11. Nit. Lines 120, 166, 219. Time zone handling is stated two ways.**
- Times are shown "in the venue's time zone" (lines 120 and 166).
- Elsewhere there is "a single configured time zone" (lines 166 and 219).
- With a single zone, the per-venue zone is redundant, or the intent is unclear.
- Recommendation: state which one applies.

**12. Nit. Lines 7, 49-53, 89, 219, 242. "Venue", "venue area" and "venue-entry charges" are not defined.**
- It is unclear what a venue is (gym, studio, home, per line 242).
- It is unclear how coarse "venue area" is. This is the only location shown before acceptance.
- It is unclear what entry charges are.
- Recommendation: add a one-line definition of each.

**13. Nit. Line 43. The wording "an approval is never pending at session start" is imprecise.**
- It means that no request can still be pending when the session starts. An approval is not a pending object.
- Recommendation: reword.

**14. Nit. Lines 84, 217, 223. Loose ends in the journey and the open-decision list.**
- The decline and expiry paths loop back to C1. C1 is a Proposed step (browsing before sign-in).
- O4 (one venue or several) overlaps with the multiple-venues item in O12, and the two give different proposals.
- Recommendation: merge O4 and O12, and point the decline loop to a Confirmed step.

**15. Nit. Lines 125, 172. The channel for client notifications is not stated.**
- Accept, decline, expiry and cancellation notices to the client have no stated channel.
- The 1-hour expiry design stresses trainer alerts but is silent on how a client learns of the outcome.
- Recommendation: state the minimum channel (in-app at least), or reference O6.

**16. Nit. Lines 133-148. The "Lifecycle extensions" heading is confusing.**
- The diagram titled "Confirmed core lifecycle" already includes Withdrawn, Cancelled and Completed.
- The next section then calls them "extensions" and says they are Confirmed.
- Recommendation: unify the labeling.

**17. Nit. Lines 19, 262. Precedence when Architecture.md conflicts with a confirmed decision is unclear.**
- Line 19 says confirmed decisions beat older plans and the log beats the PRD, but does not say what wins against Architecture.md.
- Line 262 already implies the booking lifecycle in Architecture.md will be updated to match the PRD.
- Recommendation: state the order of precedence.

**18. Nit. Line 194. Success measures have no targets.**
- Targets are deferred until the first-release size is known. This is acceptable but leaves "success" unmeasurable for now.
