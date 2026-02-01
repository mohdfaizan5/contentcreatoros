# Content OS — Product Requirements Document (v0)

## 1. Product Vision

### What This Product Is

Content OS is a **daily-use system for creators** to:

* Capture ideas
* Turn them into structured content
* Maintain consistency across platforms
* Stay consistent in posting
* Think in **series**, not random posts

It is designed for **solo creators and very small teams**.

### What It Is NOT

* Not a social media scheduler
* Not an analytics tool
* Not a community platform
* Not an all-in-one marketing suite

This tool is about **thinking, planning, and execution clarity** — not distribution.

---

## 2. Target User

### Primary User

* Solo creator
* Indie founder creating content
* Early-stage startup founder building a personal brand

### Secondary User

* Small creator team (1–3 people)

---

## 3. Core Philosophy (Must Be Preserved)

> Content should move from **raw thought → structured idea → repeatable output**.

Everything in this product must support that flow.

---

## 4. Information Architecture (v1)

```
/app/
/app/ideas
/app/templates
/app/inspiration
/app/planning
/app/series
/app/links
/app/lead-magnets

# Public routes
/[username]              → Public links page
/m/[magnet-slug]         → Lead magnet landing page
```

User lands on **/app** by default (this is intentional).

---

## 5. Core Objects (Conceptual)

### Idea

* id
* title
* rawText
* ideaType: `standalone | series_concept`
* status: `dumped | refined | planned | scripted`
* linkedSeriesId (optional — only for standalone ideas that belong to a series)
* createdAt

### Template

* id
* platformType (X, YouTube, LinkedIn, etc.)
* structureFields
* instructions
* createdAt

### Series

* id
* name
* description
* targetPlatform
* totalPlannedItems
* originIdeaId (the series_concept idea that spawned this)
* linkedIdeas[] (individual content items)
* createdAt

### LinkProfile

* id
* userId
* username (unique, used for public URL)
* displayName
* bio (optional)
* avatarUrl (optional)
* createdAt

### Link

* id
* profileId
* title
* url
* icon (optional — e.g., platform icon)
* order (for sorting)
* isActive
* createdAt

### LeadMagnet

* id
* userId
* slug (unique, used for public URL)
* title
* description
* collectFields: `email_only | name_and_email`
* deliveryType: `download | redirect | content`
* deliveryUrl (file URL or redirect URL)
* deliveryContent (rich text shown after submission)
* isActive
* createdAt

### Lead

* id
* magnetId
* email
* name (optional)
* createdAt

---

## 6. Feature Specifications

---

## 6.1 Template Section

### Problem

Creators repeat the same thinking process every time they create content.

### Solution

Templates act as **thinking scaffolds**, not content generators.

### Behavior

* User can create a new template
* First input: **Template Type**

  * X (Twitter)
  * YouTube
  * LinkedIn
  * Generic

### Template Creation Flow

1. User selects platform
2. System asks guided questions:

   * Hook style?
   * Length?
   * Tone?
   * CTA style?
3. User saves template

### Usage

* Templates are applied when refining an idea
* Templates do NOT auto-publish content

### Non-Goals

* No marketplace (v1)
* No AI auto-posting
* No versioning of templates

---

## 6.2 Inspiration Section

### Problem

Creators consume content but fail to systematically learn from it.

### Solution

A structured place to **collect and reference inspiration**.

### Behavior

* User can add:

  * Creator profile links
  * Individual content links
* Optional notes on:

  * Why it was good
  * What worked (hook, framing, angle)

### Rules

* Inspiration does NOT convert directly into ideas
* It is reference-only

### Non-Goals

* No scraping
* No analytics
* No engagement tracking

---

## 6.3 Idea Dump (Core Entry Point)

### Problem

Ideas come randomly and get lost. Sometimes ideas are for a single post, sometimes they're concepts for an entire series.

### Solution

A fast, zero-friction **idea dumping space** that captures both standalone ideas and series concepts.

### Behavior

* Single large input area
* Free-form text
* No structure required
* Optional toggle: **"This is a Series Concept"**

### Idea Types

| Type | Description | Example |
|------|-------------|--------|
| `standalone` | A single content piece | "Thread about why MVPs fail" |
| `series_concept` | A multi-part content concept | "21 Startup Terms to Know" |

### Rules

* Ideas enter with status = `dumped`
* Default type = `standalone`
* No validation, no required fields
* Series concepts can later be **expanded** into multiple standalone ideas

This is intentional chaos — controlled later.

---

## 6.4 Content Planning

### Problem

Creators jump from ideas to posting without structure. Series get started but never finished.

### Solution

A middle layer between ideas and execution with **series-aware planning**.

### Flow (Standalone Ideas)

1. Select idea from Idea Dump
2. Refine using Template (optional) + manual edits
3. Move to **Planned**

### Flow (Series Concepts)

1. Select series_concept from Idea Dump
2. **Expand Series**: Define individual content items
   * Enter titles for each part (e.g., "Part 1: Term X", "Part 2: Term Y")
   * Each becomes a standalone idea linked to the series
3. Each item follows the standard refinement flow

### Planning View Modes

| View | Shows |
|------|-------|
| All Content | Every idea regardless of series |
| By Series | Grouped by series with progress bars |
| Standalone Only | Ideas not linked to any series |

### Planning View Shows

* Idea title
* Target platform
* Linked template
* Status
* **Series badge** (if part of a series, shows "Part X of Y")

### Non-Goals

* No calendar scheduling
* No posting dates (v1)

---

## 6.5 Series

### Problem

Random content does not compound. Series are often conceived during ideation but get lost or fragmented.

### Solution

Series-first thinking, **born from ideas, not separate from them**.

### How Series Are Created

1. **From Ideation**: User dumps an idea marked as `series_concept`
2. **Expansion**: In Content Planning, user expands the concept into individual items
3. **Auto-creation**: A Series object is created, linked to the origin idea and all spawned items

### Series Object Contains

* Name (from the original series_concept idea)
* Platform
* Total planned pieces
* Origin idea reference
* Linked content items

### Rules

* A series is a **container** spawned from a **series_concept idea**
* Ideas belong to series, not vice versa
* Existing standalone ideas can be **attached** to a series later
* Series can also be created directly (empty container first, fill later)

### Key UX Rules

Series Dashboard shows:

* **Progress bar**: Visual completion %
* Planned count
* In-progress count (status = `refined` or `planned`)
* Completed count (status = `scripted`)
* Remaining count

### Workflow Summary

```
Idea Dump (series_concept)
       ↓
Content Planning → "Expand Series"
       ↓
Series created + Individual ideas spawned
       ↓
Each idea → Refine → Plan → Script
       ↓
Series Progress updates automatically
```

---

## 6.6 Links Section (Public Profile)

### Problem

Creators need a single link to share across platforms that directs to all their other social profiles and content.

### Solution

A simple **link-in-bio style page** with a unique public URL.

### Behavior

* User claims a unique username (e.g., `contentcreator.app/johndoe`)
* User adds links with:
  * Title (e.g., "Follow me on X")
  * URL
  * Optional icon (auto-detected or manual)
* Links can be reordered via drag-and-drop
* Links can be toggled active/inactive

### Public Page Shows

* Display name
* Bio (optional)
* Avatar (optional)
* List of active links as clickable buttons

### Rules

* Username must be unique across all users
* No custom themes (v1) — one clean default design
* Page is always public (no private mode)

### Non-Goals

* No link analytics or click tracking (v1)
* No custom domains
* No embedded content previews

---

## 6.7 Lead Magnet Section

### Problem

Creators want to grow their email list by offering free content in exchange for email addresses.

### Solution

Simple **lead magnet pages** that collect emails and deliver downloadable content.

### Behavior

* User creates a lead magnet with:
  * Title (e.g., "Free Startup Glossary PDF")
  * Description
  * Slug (unique URL, e.g., `/m/startup-glossary`)
  * Collect fields: Email only (default)
  * Delivery type:
    * **Download**: Direct file download after submission
    * **Redirect**: Redirect to external URL
    * **Content**: Show rich text content on success page

### Visitor Flow

1. Visitor lands on `/m/[slug]`
2. Sees title, description, and email input
3. Submits email
4. Receives content based on delivery type

### Lead Storage

* All collected emails are stored in a simple list per magnet
* User can view and export leads as CSV

### Rules

* Slug must be unique per user
* No double opt-in or email verification (v1)
* No automated email sending (v1)

### Non-Goals

* No email sequences or automation
* No A/B testing
* No conversion analytics (v1)
* No payment integration

---

## 7. Explicit Non-Goals (v1)

* Scheduling
* Publishing
* Analytics
* Collaboration permissions
* Monetization tools
* AI-generated final content

---

## 8. Success Criteria

This product succeeds if:

* Ideas are not lost
* Content becomes consistent
* Series get completed
* Creator thinks in systems, not bursts

---

## 9. Strong Nudges (Design & Scope)

### Add (Aligned)

* Idea status pipeline (Dumped → Refined → Planned)
* Series progress indicator
* Series-aware Content Planning views

### Kill Early

* Calendars
* Notifications
* Social integrations
* Engagement metrics

Those come later — if ever.

---

## Final Advice (Straight Talk)

You now have **two strong products**:

1. SaaSfollo — Product & execution clarity
2. Content OS — Creator thinking & output clarity

Do **not merge them** yet.
Build them as **separate mental models**, even if they share auth later.

If you want next:

* I can turn this into a **single-page AI-ready PRD**
* Or merge both PRDs into a **founder OS ecosystem roadmap**

Say what you want next, and I'll keep it disciplined.
