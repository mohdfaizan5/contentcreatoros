# Workflow Planner Freshness Spec

This document defines how the workflow planner should avoid repetitive weekly content while preserving strategic coverage and freshness.

## Goal

Generate weekly X content that stays on-brand without repeating the same underlying idea across nearby runs.

## Planning model

- `Pillar`: broad theme bucket
- `Content Type`: the delivery format or post mechanism
- `Content Angle`: the specific point of view or argument the post makes
- `Core Claim`: one short explicit sentence that captures the takeaway the reader should leave with
- `Weekly Brief`: an optional but strongly recommended run-level input describing the current problem, moment, tension, or theme

## Freshness rules

- `Core Claim` is the primary anti-repetition control.
- `Content Angle` is the secondary anti-repetition control.
- The planner should compare against `Committed Content`, defined as `published + scheduled` posts only.
- The fallback freshness window is the last `14 days`.
- Within the current run, angle uniqueness is soft.
- Across the last 14 days, repetition avoidance is stricter.

## Angle strategy

Use a hybrid angle strategy:

- the system owns a small canonical `Angle Library`
- the model instantiates each selected angle freshly for the current run

The planner should not rely on freeform angle invention alone, and it should not reduce the week to rigid templates.

## Weekly brief behavior

- `Weekly Brief` remains optional, but the UI should strongly encourage it.
- When present, it becomes the main freshness driver for the run.
- When absent, the planner should rotate against the last 14 days of committed content.
- A weekly brief acts as a soft override on freshness rules.
- A weekly brief may justify revisiting a nearby theme, but it should still avoid reusing the same `Core Claim`.

## Core claim format

Each planned post should carry an explicit `Core Claim` written by the model during planning.

Rules:

- one sentence
- plain language
- roughly 8-20 words
- no CTA
- no formatting tricks
- no post-like paragraph

Example:

`Founders repeat themselves when they create content without a live problem statement.`

## Recommended generation flow

1. Read brand context and optional weekly brief.
2. Load committed content from the previous 14 days.
3. Summarize recent `Core Claims` and `Content Angles`.
4. Select or rotate angle types from the angle library.
5. Draft fresh `Core Claims`.
6. Reject or rewrite claims that collide with recent committed content.
7. Generate final `suggestedPost` copy from the surviving plan items.

## Product implication

The planner should move from `brand-context-only generation` to `constraint-based generation`.

Today, planning metadata mainly describes the generated posts after the fact. The target behavior is for `Content Angle` and `Core Claim` to actively shape what gets generated in the first place.
