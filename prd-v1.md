# ContentCreator OS - Product Requirements Document V1

> **Version:** 1.0  
> **Last Updated:** February 4, 2026  
> **Status:** Draft

---

## 📋 Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
  - [Ideas Dumping](#1-ideas-dumping-appideas)
  - [Content Planning](#2-content-planning-appplanning)
  - [AI Assistant](#3-ai-assistant-appai)
- [Additional Features](#additional-features)
- [Technical Specifications](#technical-specifications)
- [UI/UX Design References](#uiux-design-references)

---

## Overview

ContentCreator OS is a comprehensive content creation and planning tool designed to streamline the workflow from idea generation to content publishing. V1 focuses on providing a frictionless experience for capturing ideas, planning content through a customizable kanban board, and AI-assisted content creation.

### Target Users
- Content creators (YouTubers, LinkedIn creators)
- in-house video editors
- Social media managers
- Individual creators managing content across platforms

---

## Core Features

### 1. Ideas Dumping (`app/ideas/`)

**Purpose:** A frictionless way to capture and organize content ideas quickly.

#### User Stories
- As a creator, I want to quickly dump my ideas without friction, so I can capture inspiration when it strikes
- As a creator, I want to view and filter my ideas easily, so I can find the right idea when I'm ready to create
- As a creator, I want to click on an idea to expand it and take action, so I can move from ideation to execution

#### Features

**Capture & Organization:**
- Quick capture interface with minimal friction
- Search functionality to find ideas quickly
- Filtration system for ideas
- **Masonry/Waterfall layout** - sorted by last edited date
- Each idea is clickable, opening a dialog with action buttons

**Rich Content Support:**
- **Editor.js integration** for rich text formatting
  - Support for headings, lists, quotes, code blocks
  - Embedded media support
  - Clean, block-based editing experience

**Dialog Actions:**
- "Move to Planning" button
- Edit/Delete options
- Series assignment (optional)


#### Acceptance Criteria
- [ ] Ideas can be created via a dedicated dialog
- [ ] Ideas page displays in masonry/waterfall layout
- [ ] Search bar filters ideas in real-time
- [ ] Each idea card shows: title, preview, last edited date
- [ ] Clicking idea opens dialog with Editor.js content
- [ ] Editor.js supports basic formatting (headings, bold, italic, lists, links)
- [ ] Ideas are sorted by last edited (most recent first)

---

### 2. Content Planning (`app/planning/`)

**Purpose:** A customizable kanban board for managing content workflow from ideation to publication.

#### Ideology
The workflow follows this pattern:
1. Generate and dump ideas in the Ideas section
2. Pick ideas and move them to the Planning board
3. Progress content through custom workflow stages (e.g., Starting Point → Script → Record → Edit → Schedule)
4. Track content across different platforms and formats

#### Features

##### **First-Time Onboarding Flow**

On first visit to Content Planning, users are guided through a quick setup:

**Onboarding Steps:**
1. **Welcome Screen** - Explain the purpose of content planning
2. **Workflow Selection** - Show 3-4 preset workflow options in beautifully designed cards:
   - **Simple:** `Starting Point → Edited → Done`
   - **Basic Creator:** `Idea → Script → Record → Edit → Schedule`
   - **Advanced:** `Idea → Script → Record Audio → Record Video → Edit → Schedule → Published`
   - **Custom:** Manual input fields (3-4 inputs) to create custom column names

**Wireframe Reference:**

![Content Planning Wireframe](C:/Users/Faizan/.gemini/antigravity/brain/486fa278-f4ee-43d6-ad94-7c4005033007/uploaded_media_0_1770149681446.png)

> [!IMPORTANT]
> The onboarding should be sleek, fast, and non-intrusive. Users should be able to complete it in under 30 seconds.

##### **Kanban Board**

**Layout:**
- Column-based layout representing workflow stages
- Drag-and-drop between columns
- Cards represent individual content pieces

**Card Features:**
- Title and description
- Platform badges (YouTube, TikTok, LinkedIn, etc.)
- Content type indicator (Short video, Long-form, LinkedIn post, etc.) this should be dynamic based on the platform selected
- Series assignment (optional)
- Hover-activated checkbox for completion tracking

**Card Interaction:**
- **Hover behavior:** When hovering on a card, a checkmark button slowly appears before the text
- **Checkbox logic:** Clicking the checkmark shows a checked checkbox but **does NOT move the card** to another column
- **Purpose:** Track completion within a stage without auto-progression

**Create Content Dialog:**

Users can create content via the "Create content" button:

![Create Content Dialog](C:/Users/Faizan/.gemini/antigravity/brain/486fa278-f4ee-43d6-ad94-7c4005033007/uploaded_media_1_1770149681446.png)

**Dialog Fields:**
1. **Pick from ideas or start fresh** - Search/select existing idea or create new
2. **Platform multiselect** - Twitter, LinkedIn, YouTube Title, Other

3. **Content type** - Shorts, Long-form video, etc.
   - *Smart feature:* Content types adapt based on selected platform
4. **Series assignment** - Dropdown showing existing series or create new
   - Shows "none" by default
   - Displays suggestions of existing series
   - Can create new series inline

##### **Series Implementation**

**Data Model:**
- Simple field within content cards (not a separate table)
- 1-to-N relationship: One series can have multiple content pieces
- Implementation: Can be a simple string field or a separate `series` table with foreign key

**User Flow Example:**
- User creates "Learn to Code - Part 1"
- Assigns series name: "Learn to Code"
- Next time, when creating content, the series dropdown shows "Learn to Code" as a suggestion
- User can select it or create a new series

**Benefits:**
- Easy to track content series (e.g., tutorial series, challenge series)
- Helps maintain consistency across multi-part content
- Simple to filter/group content by series

#### Technical Requirements

**Drag-and-Drop:**
- Use [Atlassian Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop/about)
- Smooth animations during drag
- Clear drop zones with visual feedback

**Animations:**
- Use [Motion.dev](https://motion.dev/) for smooth transitions
- Animate card movements between columns
- Hover animations for checkboxes
- Dialog open/close animations

#### Acceptance Criteria
- [ ] First-time users see onboarding on first visit to `/app/planning`
- [ ] Onboarding shows 3-4 preset workflow options + custom option
- [ ] Users can manually add 3-4 custom column names
- [ ] Selected workflow creates corresponding kanban columns
- [ ] Cards can be dragged between columns smoothly
- [ ] Hover on card shows checkmark button with animation
- [ ] Clicking checkmark toggles checkbox without moving card
- [ ] "Create content" button opens dialog
- [ ] Dialog allows picking from existing ideas or starting fresh
- [ ] Platform multiselect works correctly
- [ ] Content type options adapt to selected platforms
- [ ] Series dropdown shows existing series + ability to create new
- [ ] Cards display platform badges and content type

---

### 3. AI Assistant (`app/ai/`)

**Purpose:** A simple AI chatbot to assist creators with content-related tasks.

#### Features

**V1 Scope:**
- Simple chat interface
- Powered by **Claude** (Anthropic)
- add navigation in left sidebar under "Content" section



#### Technical Implementation

**Stack:**
- [Vercel AI SDK](https://sdk.vercel.ai/) (latest version)
- Claude API integration
- Streaming responses for better UX

**Environment Variables:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

**UI Requirements:**
- Clean chat interface
- Message history
- Streaming text display
- Copy message functionality
- Clear conversation button

#### Acceptance Criteria
- [ ] Messages send and receive responses from Claude
- [ ] Responses stream in real-time
- [ ] Conversation persists during session
- [ ] Users can copy AI responses
- [ ] Users can clear conversation

---

## Additional Features



**Placement:**
- Tooltips with video links
- Help section in sidebar
- First-time user tooltips

### Payments Integration
- Use [Polar.sh](https://polar.sh) for payment processing
- Subscription tiers (to be defined in V2)

---


**Libraries:**
- [Editor.js](https://editorjs.io/) - Rich text editing for ideas
- [Atlassian Pragmatic Drag-and-Drop](https://atlassian.design/components/pragmatic-drag-and-drop/about) - DnD for kanban
- [Motion.dev](https://motion.dev/) - Animations
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI chat integration

**External Services:**
- Anthropic Claude API - AI assistant
- Polar.sh - Payments (future)

### Database Schema (Draft)

**Tables:**

```sql
-- Ideas table
ideas (
  id uuid primary key,
  user_id uuid references auth.users,
  title text,
  content jsonb, -- Editor.js format
  created_at timestamp,
  updated_at timestamp
)

-- Content pieces (planning board)
content (
  id uuid primary key,
  user_id uuid references auth.users,
  title text,
  description text,
  idea_id uuid references ideas(id), -- optional link to original idea
  platforms text[], -- ['youtube', 'tiktok', 'linkedin']
  content_type text, -- 'short', 'long-form', 'linkedin-post'
  series text, -- Simple string field or FK to series table
  column_id text, -- Current kanban column
  checked boolean default false,
  created_at timestamp,
  updated_at timestamp
)

-- User workflows (onboarding)
user_workflows (
  id uuid primary key,
  user_id uuid references auth.users unique,
  columns jsonb, -- ['Starting Point', 'Edited', 'Done']
  created_at timestamp
)

-- Optional: Series table (if not using string field)
series (
  id uuid primary key,
  user_id uuid references auth.users,
  name text,
  created_at timestamp
)
```



## UI/UX Design References

### Design System
- **Clean and sleek aesthetic** throughout
- **Fast interactions** - no unnecessary loading states
- **Smooth animations** using Motion.dev
- **Consistent spacing** and typography

### Color Palette
*To be defined - should align with existing ContentCreator OS branding*

### Wireframes

**Content Planning Board:**
![Planning Board Wireframe](C:/Users/Faizan/.gemini/antigravity/brain/486fa278-f4ee-43d6-ad94-7c4005033007/uploaded_media_0_1770149681446.png)

**Create Content Dialog:**
![Create Content Dialog](C:/Users/Faizan/.gemini/antigravity/brain/486fa278-f4ee-43d6-ad94-7c4005033007/uploaded_media_1_1770149681446.png)

---

## Implementation Priority

### Must-Have (V1.0)
1. ✅ Ideas dumping with Editor.js
2. ✅ Content Planning kanban with onboarding
3. ✅ Create content dialog with platform/type/series
4. ✅ Drag-and-drop functionality
5. ✅ AI chatbot (basic)



## Open Questions

1. **Database design:** Should series be a separate table with FK relationship, or a simple string field? 
   - *Recommendation:* Start with string field for MVP, migrate to table if needed

2. **Platform list:** Should we hardcode platforms or allow custom platform addition?
   - *Recommendation:* Start with hardcoded common platforms, add "Other" option

3. **User workflows:** Can users edit their workflow columns after initial onboarding?
   - *Needs clarification*



## Success Metrics (V1)

- Users can create and organize ideas in under 10 seconds
- 90% of users complete onboarding in under 30 seconds
- Users successfully move content through workflow stages
- AI chatbot provides helpful responses 80%+ of the time




