# Content Strategy Planning

This context defines the planning language for how the app generates weekly social content. It exists so generation inputs, planning fields, and freshness rules stay consistent as the workflow grows.

## Language

**Content Angle**:
The specific point of view or argument a post makes about a problem, belief, workflow, product use case, or market moment.
_Avoid_: topic, idea, hook

**Angle Library**:
A small canonical set of reusable angle types that the system uses for coverage while letting each week instantiate them freshly.
_Avoid_: template bank, prompt list

**Weekly Brief**:
An optional but strongly recommended run-level input describing the current problem, moment, tension, or theme that should shape a workflow run.
_Avoid_: prompt note, extra context

**Fallback Freshness Window**:
The recent-history window the system checks when no Weekly Brief is provided, currently defined as the last 14 days of content.
_Avoid_: memory, lookback

**Committed Content**:
Posts that are already published or scheduled and therefore count as real planning history for repetition checks.
_Avoid_: drafts, generated posts

**Core Claim**:
The main takeaway the reader should leave with after reading a post, written as one short explicit sentence.
_Avoid_: summary, caption, CTA

## Relationships

- A **Weekly Brief** shapes one workflow run
- One workflow run produces multiple planned posts
- Each planned post uses one **Content Angle**
- Each **Content Angle** comes from the **Angle Library** and is instantiated freshly for the current run
- Each planned post carries one explicit **Core Claim**
- The **Fallback Freshness Window** checks **Committed Content** from the last 14 days
- Repetition control is primarily enforced through **Core Claim** and secondarily through **Content Angle**
- The **Fallback Freshness Window** helps prevent repeated **Core Claims** and repeated **Content Angles** when no **Weekly Brief** is provided

## Example dialogue

> **Dev:** "This post uses a different hook, but it still says AI helps founders create content faster. Is that new?"
> **Domain expert:** "No. The wording changed, but the **Core Claim** stayed the same. We should treat that as repetition."

## Flagged ambiguities

- "same content" was ambiguous between repeated wording and repeated strategy; resolved: the main problem is repeated **Content Angles** and repeated **Core Claims**
- `pillar`, `contentType`, and `angle` exist in the code today, but **Content Angle** is not yet being used as a true planning constraint
- recent-history checks should use **Committed Content**, not drafts
