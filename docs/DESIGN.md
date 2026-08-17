# DESIGN.md — ServiceHub

> **Dual-Platform Design System** — Mobile App + Web/Desktop Application
>
> This document defines two complete, professional design specifications: one for the native mobile app and one for the web/desktop application. Both share the same brand identity but are designed independently for their respective platforms.

---

## 0. Brief

ServiceHub is a service marketplace connecting customers with individual workers (plumbers, electricians, cleaners, tutors, event staff, etc.). Two hiring paths: direct search-and-hire, and post-a-job-and-receive-applications.

**Who uses this:** working people on both sides — customers hiring help for real problems (a leak, an event, a lesson), and tradespeople trying to win jobs and build a reputation. Not a tech-forward audience. Many users are on mid-range Android phones, often on imperfect connections.

**Design mandate:** this must read as a **serious, trustworthy, professional product**, not a hackathon demo or a generic AI-generated SaaS template. The reference feeling is closer to **Airbnb's trust-through-photography approach** crossed with **the plainspoken utility of a well-run hardware store's paperwork** — warm, grounded, a little tactile, not sterile.

**Important:** This project has NO in-app chat or messaging feature. Users will share Telegram handles externally for communication. Do not design chat UI, message inboxes, or messaging-related components.

---

## 1. MVP Scope (P0/P1 Only)

This design system covers ONLY what's in scope for the 5-day MVP. Items marked P2 or "Postponed" are NOT included.

### In Scope (P0 — Must Have)

- Telegram Auth & role switching
- Job posting & bidding system
- Basic search/filtering
- Payment integration (Chapa)
- Ratings & reviews

### In Scope (P1 — Should Have)

- Landing page
- Worker profile edit

### Explicitly OUT of Scope (Do NOT Design)

- ❌ Admin dashboard (P2 — seed DB instead for MVP)
- ❌ Category management (P2 — seed DB instead)
- ❌ Business profiles (merged with Worker for MVP)
- ❌ Escrow (excluded per FR-041)
- ❌ GPS / location matching (excluded per Section 22.1)
- ❌ Advanced verification badges (postponed per Section 22.5)
- ❌ Multi-language support (English only per Section 22.2)
- ❌ Chat / messaging (removed for MVP — users share Telegram handles)
- ❌ Direct Hire as separate flow (uses same Job entity with `targetWorkerId`)

---

## 2. Design Principles

These are the "why" behind every rule in this document. When a new screen or edge case isn't covered below, design against these.

1. **Trust before conversion.** A customer should feel confident about a provider before being pushed toward hiring. Never rush someone past evaluation.
2. **Utility over decoration.** Every visual element should improve comprehension, navigation, or confidence — not exist to look modern.
3. **Human over technological.** ServiceHub connects people. The interface should feel local and human, not futuristic or "AI-powered."
4. **Evidence over claims.** Show reviews, experience, portfolio, verification, response time, and completed jobs — never just assert "top-rated professional."
5. **Mobile-first practicality.** Assume mid-range Android hardware and imperfect connectivity as the default case, not the edge case.
6. **Progressive disclosure.** Card → profile → verification details → reviews → portfolio. Don't front-load everything at once.
7. **Consistency over novelty.** Don't invent unusual interaction patterns just to look innovative.
8. **Platform-native patterns.** Mobile app follows iOS/Material Design conventions; web follows desktop application patterns. Don't force one platform's patterns onto the other.

---

## 3. Color System

| Token                 | Hex       | Usage                                                              |
| --------------------- | --------- | ------------------------------------------------------------------ |
| `color-primary`       | `#1D4ED8` | Primary actions, links, active states — Trust Blue                 |
| `color-primary-dark`  | `#1E40AF` | Primary hover/pressed states                                       |
| `color-primary-light` | `#DBEAFE` | Primary-tinted backgrounds, selected chips                         |
| `color-accent`        | `#D97706` | Ratings, highlights, featured content — Warm Amber                 |
| `color-accent-light`  | `#FEF3C7` | Accent-tinted backgrounds                                          |
| `color-success`       | `#16A34A` | Completed jobs, verified badges, success states                    |
| `color-success-light` | `#DCFCE7` | Success backgrounds                                                |
| `color-warning`       | `#EA580C` | Pending states, attention required                                 |
| `color-warning-light` | `#FFF7ED` | Warning backgrounds                                                |
| `color-info`          | `#4F6D7A` | Neutral informational states (e.g. "payment processes within 24h") |
| `color-info-light`    | `#E4ECEF` | Info-tinted backgrounds                                            |
| `color-error`         | `#DC2626` | Errors, destructive actions                                        |
| `color-error-light`   | `#FEF2F2` | Error backgrounds                                                  |
| `color-ink`           | `#1C1917` | Primary text — warm near-black, never pure `#000000`               |
| `color-ink-secondary` | `#44403C` | Secondary text, labels                                             |
| `color-ink-muted`     | `#78716C` | Captions, metadata, placeholder                                    |
| `color-background`    | `#FAFAF9` | App background — warm off-white                                    |
| `color-surface`       | `#FFFFFF` | Cards, sheets, modals                                              |
| `color-surface-alt`   | `#F5F5F4` | Alternate surface, input backgrounds                               |
| `color-border`        | `#E7E5E4` | Default borders/dividers                                           |
| `color-border-strong` | `#A8A29E` | Emphasized borders, focus states (WCAG AA compliant)               |

**Color Usage Rules:**

- **Primary (Blue):** Get Started, Hire, Apply, Accept, Post Job, Pay Now, Continue, navigation active states
- **Accent (Amber):** Star ratings, featured badges, highlights — NOT for primary CTAs
- **Success (Green):** Completed states, verified badges, success confirmations
- **Warning (Orange):** Pending states, attention indicators
- **Error (Red):** Validation errors, destructive actions, failures

**Gradients:** No gradients anywhere except one permitted subtle use — a soft one-directional tint behind the landing page hero section, never on buttons or cards.

---

## 4. Typography

| Token          | Family                                        | Weight(s)          | Usage                                             |
| -------------- | --------------------------------------------- | ------------------ | ------------------------------------------------- |
| `font-display` | **Fraunces** (Google Fonts, serif)            | 500, 600           | H1/H2 headlines, hero statements                  |
| `font-body`    | **Public Sans** (Google Fonts, humanist sans) | 400, 500, 600, 700 | Body text, UI labels, buttons, forms              |
| `font-mono`    | **IBM Plex Mono**                             | 400                | Reference numbers only (job IDs, transaction IDs) |

### Type Scale

| Token          | Desktop     | Mobile      | Family  | Weight |
| -------------- | ----------- | ----------- | ------- | ------ |
| `text-hero`    | 48px / 56px | 36px / 44px | display | 600    |
| `text-h1`      | 36px / 44px | 28px / 36px | display | 600    |
| `text-h2`      | 28px / 36px | 24px / 32px | display | 500    |
| `text-h3`      | 22px / 30px | 20px / 28px | display | 500    |
| `text-h4`      | 18px / 26px | 16px / 24px | body    | 700    |
| `text-body-lg` | 16px / 24px | 16px / 24px | body    | 400    |
| `text-body`    | 14px / 20px | 14px / 20px | body    | 400    |
| `text-caption` | 12px / 16px | 12px / 16px | body    | 500    |
| `text-button`  | 14px / 20px | 14px / 20px | body    | 600    |

**Localization note:** Don't size containers or buttons around English text length. Copy in Amharic/Oromo will run longer — allow buttons and labels to expand.

---

## 5. Spacing Scale

Base unit: `4px`

| Token       | Value |
| ----------- | ----- |
| `space-xs`  | 4px   |
| `space-sm`  | 8px   |
| `space-md`  | 16px  |
| `space-lg`  | 24px  |
| `space-xl`  | 32px  |
| `space-2xl` | 48px  |
| `space-3xl` | 64px  |

---

## 6. Radius & Elevation

| Token         | Value  | Usage                  |
| ------------- | ------ | ---------------------- |
| `radius-sm`   | 6px    | Buttons, inputs, chips |
| `radius-md`   | 10px   | Cards                  |
| `radius-lg`   | 16px   | Modals, bottom sheets  |
| `radius-full` | 9999px | Avatars, pills         |

| Token       | Value                             | Usage                     |
| ----------- | --------------------------------- | ------------------------- |
| `shadow-sm` | `0 1px 2px rgba(28,25,23,0.06)`   | Cards at rest             |
| `shadow-md` | `0 4px 12px rgba(28,25,23,0.10)`  | Cards on hover, dropdowns |
| `shadow-lg` | `0 12px 32px rgba(28,25,23,0.16)` | Modals, sheets            |

---

## 7. Z-Index / Layer System

| Token            | Value |
| ---------------- | ----- |
| `layer-base`     | 0     |
| `layer-sticky`   | 10    |
| `layer-dropdown` | 20    |
| `layer-modal`    | 30    |
| `layer-toast`    | 40    |
| `layer-critical` | 50    |

---

## 8. Motion

Motion should communicate state, not decorate the interface.

| Token           | Duration  | Usage                                                |
| --------------- | --------- | ---------------------------------------------------- |
| `motion-fast`   | 100–150ms | Micro-interactions (button press, toggle)            |
| `motion-normal` | 150–250ms | Standard transitions (modal open, tab switch)        |
| `motion-slow`   | 250–350ms | Larger layout shifts (page transition, sheet expand) |

Rules:

- No bouncing UI, no decorative floating objects, no unnecessary parallax
- Animate state changes only — not critical actions like payment confirmation
- Respect `prefers-reduced-motion`; provide non-animated equivalents

---

## 9. Accessibility

- Target WCAG 2.2 AA
- Minimum 4.5:1 contrast for normal text; minimum 3:1 for large text and UI components
- Never communicate state through color alone — status badges always pair color with text label
- Web interface fully keyboard-navigable, with visible focus states (`color-primary` outline, 2px width, 2px offset)
- Minimum 44×44px interactive targets everywhere
- Form errors associated with their fields (not just summary banners)
- All images have meaningful alt text
- Respect `prefers-reduced-motion`

---

## 10. Imagery & Iconography

- **Photography, not illustration, wherever a real provider or job is shown.** Documentary-style, natural light, people mid-task
- **No AI-generated illustration style** — no floating 3D blobs, no gradient mesh backgrounds
- Icons: **Lucide Icons**, regular weight, `color-ink-muted` default / `color-primary` when active
- No sparkle, rocket, or robot iconography — legitimate star ratings are exempt
- Verified badge: small solid checkmark in `color-success`, not a shiny gradient seal

**Image Ratios:**

- Worker profile photo: 1:1 (square)
- Portfolio images: 4:3
- Hero imagery: 16:9 or responsive
- Category icons: 1:1

---

## 11. Voice & Microcopy

Plain, direct, respectful — the tone of someone competent explaining something clearly.

- ✅ "Get applications from workers in your area."
- ❌ "Unlock a world of possibilities with our AI-powered marketplace ✨"
- ✅ "Payment confirmed."
- ❌ "Woohoo! You're all set! 🎉"

---

## 12. Trust & Verification Components

Trust is the core UX problem. Define visual patterns for:

```
✓ Verified Provider
✓ Completed Jobs
⭐ Rating
💳 Paid through ServiceHub
⏱ Response Time
```

**Card-level trust signals:**

```
┌─────────────────────────────┐
│ [Photo]                     │
│ Abel Mekonen         ✓     │
│ Plumbing                    │
│                             │
│ ⭐ 4.9 (42 reviews)        │
│ ✓ 42 completed jobs         │
│ Usually responds in 20 min  │
│                             │
│ From ETB 500                │
│              [View Profile] │
└─────────────────────────────┘
```

**Profile-level verification (expand on full profile):**

```
Verification
✓ Phone verified
✓ Identity verified
```

Note: Advanced verification badges (Business, Certificates) are postponed for MVP.

---

## 13. Form Validation States

| State    | Visual Treatment                                       |
| -------- | ------------------------------------------------------ |
| Default  | `color-border` border, `color-surface-alt` background  |
| Focus    | `color-primary` border, `color-primary-light` ring     |
| Filled   | `color-border-strong` border                           |
| Disabled | `color-surface-alt` background, `color-ink-muted` text |
| Error    | `color-error` border, error icon + message below field |
| Success  | `color-success` border, checkmark icon                 |
| Loading  | Spinner icon, field disabled                           |

**Error message format:**

```
Label
Input [error border]
⚠ This field is required.
```

Always use icon + text + color for validation — never color alone.

---

## 14. Empty States

Design each individually — different situations deserve different messaging.

| State             | Heading                  | Action                                                                     |
| ----------------- | ------------------------ | -------------------------------------------------------------------------- |
| No search results | "No professionals found" | "Try changing your filters or search another category." [Clear Filters]    |
| No jobs yet       | "No jobs posted yet"     | "Be the first to post a job and get applications." [Post a Job]            |
| No applications   | "No applications yet"    | "Workers will apply once they see your job." —                             |
| No reviews yet    | "No reviews yet"         | "Reviews appear after completed jobs." —                                   |
| No notifications  | "You're all caught up"   | —                                                                          |
| Offline           | "You're offline"         | "Some features may be unavailable. We'll reconnect automatically." [Retry] |

**Pattern:** Icon + heading + explanation + single clear action

---

## 15. Payment States

Never rely on color alone. Each state needs icon + text label + color + next action:

| State      | Color   | Message                    | Action  |
| ---------- | ------- | -------------------------- | ------- |
| Pending    | warning | "Waiting for confirmation" | —       |
| Processing | info    | "Processing payment"       | —       |
| Completed  | success | "Payment confirmed"        | —       |
| Failed     | error   | "Payment failed"           | [Retry] |
| Refunded   | info    | "Refund issued"            | —       |
| Cancelled  | muted   | "Payment cancelled"        | —       |

---

## 16. Confirmation Patterns

Standardized dialogs for dangerous actions:

```
Title
Explanation of what will happen
[Cancel]  [Confirm Action]
```

Required confirmations:

- Cancel job
- Withdraw application
- Reject applicant
- Submit without preview

---

## 17. Responsive Behavior Rules

| Breakpoint          | Behavior                                                 |
| ------------------- | -------------------------------------------------------- |
| Desktop (>1024px)   | Sidebar navigation + content area, 3-column grids        |
| Tablet (768-1024px) | Collapsed sidebar or top nav, 2-column grids             |
| Mobile (<768px)     | Bottom tab navigation, 1-column stacks, full-width cards |

**Navigation transitions:**

- Desktop: Fixed left sidebar (260px) + top bar
- Tablet: Collapsible sidebar (hamburger toggle)
- Mobile: Bottom tab bar (5 items max)

---

## 18. Badge Contrast (WCAG AA)

Badge text colors must meet 4.5:1 contrast on their light backgrounds. Use these darker variants:

| Badge Type | Background | Text Color | Contrast Ratio |
| ---------- | ---------- | ---------- | -------------- |
| `success`  | `#DCFCE7`  | `#15803D`  | 5.2:1          |
| `warning`  | `#FFF7ED`  | `#C2410C`  | 4.8:1          |
| `error`    | `#FEF2F2`  | `#B91C1C`  | 5.1:1          |
| `primary`  | `#DBEAFE`  | `#1E40AF`  | 5.8:1          |
| `accent`   | `#FEF3C7`  | `#92400E`  | 4.9:1          |

Do not use the base `color-success`, `color-warning`, etc. for badge text — use the darker variants above.

---

## 19. Numeric & Tabular Figures

For any display of numbers that users compare or scan (prices, ratings, counts, IDs, time), apply:

```css
font-variant-numeric: tabular-nums;
```

**Apply to:**

- All price/amount displays (ETB values)
- Rating numbers (4.8, 4.9)
- Review counts (126 reviews)
- Job counts (42 completed)
- Budget fields
- Pagination numbers
- Time displays

**Do not apply to:**

- Body text paragraphs
- Headlines
- Labels without numbers

This ensures numbers align in columns and don't shift width when values change.

---

## 20. Offline Banner

A persistent global banner that appears when the user loses connectivity — separate from the empty/error states.

**Desktop:**

- Position: Fixed below top navigation bar
- Background: `color-warning-light`
- Text: `color-ink-secondary`, 14px
- Icon: warning triangle, `color-warning`
- Height: 40px
- z-index: `layer-sticky` + 1
- Auto-hides when connection restored

**Mobile:**

- Position: Fixed below mobile header
- Same styling as desktop
- Height: 36px

**Behavior:**

- Appears immediately when `navigator.onLine` becomes false
- Dismiss automatically when `navigator.onLine` returns true
- Non-dismissible by user
- Does not block interaction with the rest of the app

---

## 21. Text Truncation Rules

Standardize how overflow text is handled across the UI.

| Context                              | Truncation    | Lines | Behavior                        |
| ------------------------------------ | ------------- | ----- | ------------------------------- |
| Card titles (worker name, job title) | Single line   | 1     | Ellipsis after overflow         |
| Card descriptions (job desc preview) | Limited lines | 2     | Ellipsis after 2 lines          |
| Body text (worker bio, job detail)   | No truncation | —     | Full text, scrollable if needed |
| Navigation labels                    | Single line   | 1     | Ellipsis after overflow         |
| Button text                          | No truncation | —     | Allow wrapping or expand button |
| Table cells                          | Single line   | 1     | Ellipsis, full text in tooltip  |
| Search input                         | No truncation | —     | Scrolls horizontally            |
| Toast messages                       | Limited lines | 2     | Ellipsis after 2 lines          |

**CSS pattern for single line:** `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`

**CSS pattern for multi-line:** `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`

---

## 22. Input Behavior & Keyboard Types

Define which keyboard type to show on mobile for each input field.

| Input Field     | Keyboard Type        | inputmode | Notes                     |
| --------------- | -------------------- | --------- | ------------------------- |
| Job title       | Default text         | `text`    | —                         |
| Job description | Default text         | `text`    | Multi-line textarea       |
| Budget (ETB)    | Numeric with decimal | `decimal` | Allow cents for precision |
| Proposed price  | Numeric with decimal | `decimal` | Worker bid amount         |
| Estimated time  | Numeric              | `numeric` | Hours or minutes          |
| Search          | Default text         | `search`  | Show search key           |
| Phone number    | Phone pad            | `tel`     | Future use                |
| Email           | Email keyboard       | `email`   | Future use                |

**Rules:**

- Always use `inputmode` attribute on mobile for correct keyboard
- Budget/price fields should show numeric keyboard with decimal point
- Estimated time should show numeric keyboard without decimal
- Search fields should show search key on keyboard
- Never use `type="number"` for prices — use `type="text"` with `inputmode="decimal"` to avoid spinners

---

## 23. Secondary Button Border Contrast

The secondary button border `color-border-strong` (`#D6D3D1`) may not meet 3:1 contrast against white backgrounds for non-text UI components.

**Updated value:** Change `color-border-strong` from `#D6D3D1` to `#A8A29E` for better contrast.

This darker border ensures the button outline is clearly visible against white backgrounds while maintaining the warm neutral palette.

---

---

# PART A: MOBILE APP DESIGN

> Native mobile application (iOS/Android) — the primary platform for ServiceHub

---

## M1. Mobile Navigation

### Bottom Tab Bar

**Height:** 56px (iOS), 56px (Android)
**Background:** white, top border: 1px `color-border`
**Safe area:** Respect iOS safe area (bottom padding for home indicator)

**Customer Tabs:**

| Icon        | Label         | Screen              |
| ----------- | ------------- | ------------------- |
| Home        | Home          | Customer Dashboard  |
| Search      | Search        | Worker Search       |
| Plus Circle | Post Job      | Post Job Form       |
| Bell        | Notifications | Notification Center |
| User        | Profile       | Customer Profile    |

**Worker Tabs:**

| Icon        | Label         | Screen              |
| ----------- | ------------- | ------------------- |
| Home        | Home          | Worker Dashboard    |
| Briefcase   | Find Jobs     | Job Board           |
| CheckSquare | My Work       | Active Jobs         |
| Bell        | Notifications | Notification Center |
| User        | Profile       | Worker Profile      |

**Active state:** `color-primary` icon + label
**Inactive state:** `color-ink-muted` icon + label

### Mobile Header

**Height:** 56px
**Background:** white
**Shadow:** `shadow-sm` on scroll
**Content:** Back button (left) | Title (center) | Action (right)

---

## M2. Mobile Screen Specifications

### M2.1 Landing Page (Not logged in)

**Layout:** Vertical scroll, single column

```
┌─────────────────────────────────┐
│ [Logo]                    [Skip]│
├─────────────────────────────────┤
│                                 │
│  Find the right person          │
│  for the job                    │
│                                 │
│  [Search bar — full width]      │
│                                 │
├─────────────────────────────────┤
│  Popular Categories             │
│  [Horizontal scroll chips]      │
│  Plumbing | Cleaning | Tutoring │
├─────────────────────────────────┤
│  How it Works                   │
│  1. Search                      │
│  2. Compare                     │
│  3. Hire                        │
│  4. Pay securely                │
├─────────────────────────────────┤
│  [Get Started — full width]     │
│  Already have account? Log in   │
└─────────────────────────────────┘
```

### M2.2 Customer Dashboard

**Layout:** Vertical scroll, stat cards + job list

```
┌─────────────────────────────────┐
│ Good morning, Sarah      [Bell] │
├─────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐       │
│ │ Active  │  │ Total   │       │
│ │ Jobs: 2 │  │ Spent   │       │
│ │         │  │ 4,500ETB│       │
│ └─────────┘  └─────────┘       │
├─────────────────────────────────┤
│ Recent Jobs              [See] │
│ ┌─────────────────────────────┐ │
│ │ Fix leaking pipe            │ │
│ │ Status: In Progress  ETB 500│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ House cleaning              │ │
│ │ Status: Completed   ETB 800│ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [Post a Job — full width]       │
└─────────────────────────────────┘
```

### M2.3 Worker Search

**Layout:** Search bar + filter chips + scrollable card list

```
┌─────────────────────────────────┐
│ [Search bar]              [Filter]│
├─────────────────────────────────┤
│ [Plumbing] [Cleaning] [All ▼]  │ ← Filter chips (horizontal scroll)
├─────────────────────────────────┤
│ Showing 48 professionals        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [Photo]                     │ │
│ │ Abebe Plumbing       ✓     │ │
│ │ ⭐ 4.8 (126)               │ │
│ │ Addis Ababa                 │ │
│ │ From ETB 500                │ │
│ │              [View Profile] │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [Photo]                     │ │
│ │ Meron Cleaning       ✓     │ │
│ │ ⭐ 4.9 (89)                │ │
│ │ Bole                        │ │
│ │ From ETB 300                │ │
│ │              [View Profile] │ │
│ └─────────────────────────────┘ │
│ ...                             │
└─────────────────────────────────┘
```

**Filter bottom sheet (tap Filter icon):**

```
┌─────────────────────────────────┐
│ Filters                    [X]  │
├─────────────────────────────────┤
│ Category                        │
│ [All Plumbing ▼]               │
│                                 │
│ Minimum Rating                  │
│ [★ 4+ ▼]                      │
│                                 │
│ Price Range                     │
│ [ETB 0 ──────●───── ETB 5000] │
│                                 │
│ [Clear All]        [Apply 48]  │
└─────────────────────────────────┘
```

### M2.4 Worker Profile

**Layout:** Vertical scroll, hero section + details

```
┌─────────────────────────────────┐
│ [← Back]           [Share]      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      [Large Photo]          │ │
│ │         1:1 ratio           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Abebe Mekonnen           ✓    │
│ Plumbing Professional          │
│ Addis Ababa                    │
│                                 │
│ ⭐ 4.9 (126 reviews)          │
│ ✓ 342 completed jobs           │
│ Usually responds in 20 min     │
│                                 │
│ [Hire Abebe — full width]      │
│                                 │
├─────────────────────────────────┤
│ About                          │
│ 6 years experience...          │
├─────────────────────────────────┤
│ Services                       │
│ • Pipe repair                  │
│ • Installation                 │
│ • Emergency fixes              │
├─────────────────────────────────┤
│ Portfolio                      │
│ [4:3 image grid, 2 columns]    │
├─────────────────────────────────┤
│ Verification                   │
│ ✓ Phone ✓ Identity             │
├─────────────────────────────────┤
│ Reviews                        │
│ ⭐⭐⭐⭐⭐ "Excellent work..."  │
│ ⭐⭐⭐⭐⭐ "Very professional"  │
└─────────────────────────────────┘
```

### M2.5 Post Job Form

**Layout:** Single-column form, scrollable

```
┌─────────────────────────────────┐
│ [← Back]    Post a Job    [X]   │
├─────────────────────────────────┤
│ Job Title                       │
│ [What do you need done?]       │
│                                 │
│ Description                     │
│ [Describe the job in detail...] │
│                                 │
│ Category                        │
│ [Select category ▼]            │
│                                 │
│ Budget (ETB)                    │
│ [Enter amount]                 │
│                                 │
│ [Post Job — full width]        │
└─────────────────────────────────┘
```

### M2.6 Job Detail (Customer)

**Layout:** Job info card + applications list

```
┌─────────────────────────────────┐
│ [← Back]          [More ⋮]     │
├─────────────────────────────────┤
│ Fix leaking pipe                │
│ Posted 2 hours ago              │
│                                 │
│ I have a leaking pipe in my     │
│ kitchen that needs immediate    │
│ attention...                    │
│                                 │
│ Category: Plumbing              │
│ Budget: ETB 500                 │
│ Status: Open                    │
├─────────────────────────────────┤
│ Applications (3)                │
│ ┌─────────────────────────────┐ │
│ │ [Avatar] Abebe    ⭐ 4.8   │ │
│ │ Proposed: ETB 450           │ │
│ │ Timeline: 2 hours           │ │
│ │              [Accept] [View]│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [Avatar] Samuel    ⭐ 4.5   │ │
│ │ Proposed: ETB 500           │ │
│ │ Timeline: 3 hours           │ │
│ │              [Accept] [View]│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### M2.7 Checkout

**Layout:** Order summary + payment method

```
┌─────────────────────────────────┐
│ [← Back]        Checkout        │
├─────────────────────────────────┤
│ Order Summary                   │
│ Service fee          ETB 450    │
│ Platform fee          ETB 23    │
│ ─────────────────────────────  │
│ Total                ETB 473    │
│                                 │
│ Payment Method                  │
│ (●) Telebirr                    │
│ ( ) Chapa                       │
│ ( ) Cash                        │
│                                 │
│ [Pay ETB 473 — full width]     │
│                                 │
│ 🔒 Secure payment via ServiceHub│
└─────────────────────────────────┘
```

### M2.8 Worker Dashboard

**Layout:** Vertical scroll, stat cards + job lists

```
┌─────────────────────────────────┐
│ Hello, Abebe             [Bell] │
├─────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐       │
│ │Active: 1│  │ Earnings │       │
│ │         │  │ 12,400ETB│       │
│ └─────────┘  └─────────┘       │
├─────────────────────────────────┤
│ Available Jobs           [See]  │
│ ┌─────────────────────────────┐ │
│ │ Fix electrical issue        │ │
│ │ Budget: ETB 800             │ │
│ │ Posted 1h ago               │ │
│ │              [Apply]        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ My Applications                 │
│ ┌─────────────────────────────┐ │
│ │ House cleaning              │ │
│ │ Status: Pending             │ │
│ │ Bid: ETB 400                │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### M2.9 Worker Job Board

**Layout:** Similar to search, but job listings

```
┌─────────────────────────────────┐
│ [Search jobs]            [Filter]│
├─────────────────────────────────┤
│ [Plumbing] [All Categories ▼]  │
├─────────────────────────────────┤
│ Showing 24 available jobs       │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Fix leaking pipe            │ │
│ │ Posted by Sarah     ⭐ 4.8 │ │
│ │ Budget: ETB 500             │ │
│ │ 3 applications              │ │
│ │              [Apply] [View] │ │
│ └─────────────────────────────┘ │
│ ...                             │
└─────────────────────────────────┘
```

---

## M3. Mobile-Specific Components

### M3.1 Bottom Sheet

**Usage:** Filters, confirmations, actions
**Border radius:** 16px top corners
**Handle:** 32px × 4px bar, `color-border-strong`, centered, 8px from top
**Background:** white
**Shadow:** `shadow-lg`

### M3.2 Swipe Actions

**Left swipe:** Delete / Remove (red background)
**Right swipe:** Complete / Accept (green background)
**Threshold:** 80px to trigger action

### M3.3 Pull to Refresh

**Indicator:** Standard Material/iOS refresh indicator
**Trigger:** 60px pull distance

### M3.4 Toast Notifications

**Position:** Top, below status bar
**Width:** Full width minus 32px margin
**Duration:** 4 seconds auto-dismiss
**Swipe up to dismiss**

---

---

# PART B: WEB/DESKTOP APPLICATION DESIGN

> Browser-based web application — responsive desktop experience

---

## W1. Web Navigation

### Top Navigation Bar

**Height:** 64px
**Background:** white
**Border bottom:** 1px `color-border`
**Max width:** 1200px, centered

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]    Home    Search    Post Job    [Notifications] [Avatar] │
└──────────────────────────────────────────────────────────────┘
```

**Active state:** `color-primary` text, 2px bottom border
**Hover state:** `color-ink-secondary` text

### Dashboard Sidebar (Logged in)

**Width:** 260px (expanded), 64px (collapsed)
**Background:** white
**Border right:** 1px `color-border`

**Customer Sidebar:**

| Icon            | Label         |
| --------------- | ------------- |
| LayoutDashboard | Dashboard     |
| Briefcase       | My Jobs       |
| PlusCircle      | Post Job      |
| Bell            | Notifications |
| User            | Profile       |

**Worker Sidebar:**

| Icon            | Label         |
| --------------- | ------------- |
| LayoutDashboard | Dashboard     |
| Search          | Find Jobs     |
| CheckSquare     | My Work       |
| Bell            | Notifications |
| User            | Profile       |

**Active item:** `color-primary-light` background, `color-primary` text, left border accent (3px)
**Item height:** 44px
**Padding:** 12px 16px

---

## W2. Web Screen Specifications

### W2.1 Landing Page

**Layout:** Full-width hero → categories → social proof → CTA

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Login] [Sign Up]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │                      │  │                              │ │
│  │ Find the right       │  │    [Hero Image/Photo]        │ │
│  │ person for the job   │  │    Worker helping customer   │ │
│  │                      │  │                              │ │
│  │ [Search bar]         │  │                              │ │
│  │                      │  │                              │ │
│  │ [Get Started]        │  │                              │ │
│  │                      │  │                              │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Popular Categories                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 🔧      │ │ 🧹      │ │ 📚      │ │ 🎉      │          │
│  │Plumbing │ │Cleaning │ │Tutoring │ │ Events  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  How ServiceHub Works                                        │
│  1. Search      2. Compare      3. Hire      4. Pay         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Ready to find help?                                   │  │
│  │  [Post a Job — primary button]                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Footer: About | Terms | Privacy | Contact                   │
└──────────────────────────────────────────────────────────────┘
```

### W2.2 Search Results (Desktop)

**Layout:** Filters sidebar + results grid

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ FILTERS  │  Showing 124 professionals                        │
│          │  Sort by: [Relevant ▼]                            │
│ Category │                                                   │
│ [All   ▼]│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│          │  │ Worker  │ │ Worker  │ │ Worker  │            │
│ Rating   │  │ Card 1  │ │ Card 2  │ │ Card 3  │            │
│ [★ 4+  ▼]│  │         │ │         │ │         │            │
│          │  └─────────┘ └─────────┘ └─────────┘            │
│ Budget   │                                                   │
│ [0-5000] │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│          │  │ Worker  │ │ Worker  │ │ Worker  │            │
│ [Clear]  │  │ Card 4  │ │ Card 5  │ │ Card 6  │            │
│          │  │         │ │         │ │         │            │
│          │  └─────────┘ └─────────┘ └─────────┘            │
│          │                                                   │
│          │  [1] [2] [3] ... [12]                             │
└──────────┴───────────────────────────────────────────────────┘
```

**Worker Card (Desktop Grid):**

```
┌─────────────────────────────────┐
│ [Photo — 4:3 ratio]             │
│                                 │
│ Abebe Mekonnen           ✓     │
│ Plumbing                       │
│ ⭐ 4.8 (126 reviews)          │
│ Addis Ababa · 5 km            │
│                                 │
│ Usually responds in 20 min     │
│ From ETB 500                   │
│                                 │
│ [View Profile]                 │
└─────────────────────────────────┘
```

### W2.3 Worker Profile (Desktop)

**Layout:** Two-column (header + content)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────────────────────────────────────────────────────────┤
│ [← Back to Search]                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  Abebe Mekonnen                          ✓   │
│  │          │  Plumbing Professional                        │
│  │  [Photo] │  Addis Ababa                                  │
│  │  1:1     │                                               │
│  │          │  ⭐ 4.9 (126 reviews) · 342 completed jobs   │
│  └──────────┘  Usually responds in 20 min                   │
│                                                              │
│  [Hire Abebe — primary button]                               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │ About               │  │ Services                    │   │
│  │                     │  │                             │   │
│  │ 6 years experience  │  │ • Pipe repair               │   │
│  │ in residential and  │  │ • Installation              │   │
│  │ commercial plumbing │  │ • Emergency fixes           │   │
│  │                     │  │                             │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Portfolio                                             │   │
│  │ [Image] [Image] [Image] [Image]                       │   │
│  │ [Image] [Image]                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Verification                                          │   │
│  │ ✓ Phone · ✓ Identity                                 │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Reviews (126)                                         │   │
│  │                                                       │   │
│  │ ⭐⭐⭐⭐⭐  Sarah K. · 2 weeks ago                    │   │
│  │ "Excellent work. Fixed the pipe quickly..."           │   │
│  │                                                       │   │
│  │ ⭐⭐⭐⭐⭐  Daniel M. · 1 month ago                   │   │
│  │ "Very professional and reliable..."                   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W2.4 Customer Dashboard (Desktop)

**Layout:** Sidebar + main content area

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ Dashboard│  Good morning, Sarah                              │
│ ─────── │                                                   │
│ My Jobs  │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ Post Job │  │ Active  │ │ Total   │ │Completed│            │
│ Notifs   │  │ Jobs: 2 │ │ Spent   │ │ Jobs: 8 │            │
│ Profile  │  │         │ │ 4,500ETB│ │         │            │
│          │  └─────────┘ └─────────┘ └─────────┘            │
│          │                                                   │
│          │  Recent Jobs                          [See All]   │
│          │  ┌───────────────────────────────────────────┐   │
│          │  │ Fix leaking pipe    In Progress   ETB 500 │   │
│          │  │ House cleaning      Completed     ETB 800 │   │
│          │  │ Electrical repair   Open          ETB 600 │   │
│          │  └───────────────────────────────────────────┘   │
│          │                                                   │
│          │  [Post a New Job — primary button]                │
└──────────┴───────────────────────────────────────────────────┘
```

### W2.5 Post Job Form (Desktop)

**Layout:** Centered form, max-width 640px

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     Post a Job                               │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Job Title                                             │   │
│  │ [What do you need done?]                              │   │
│  │                                                       │   │
│  │ Description                                           │   │
│  │ [Describe the job in detail, including any specific   │   │
│  │  requirements or preferences...]                      │   │
│  │                                                       │   │
│  │ Category                                              │   │
│  │ [Select category ▼]                                   │   │
│  │                                                       │   │
│  │ Budget (ETB)                                          │   │
│  │ [Enter amount]                                        │   │
│  │                                                       │   │
│  │ [Post Job — primary button, full width]               │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W2.6 Job Detail with Applications (Desktop)

**Layout:** Two-column (job info + applications)

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────────────────────────────────────────────────────────┤
│ [← Back to My Jobs]                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Fix leaking pipe                                     [⋮]   │
│  Posted 2 hours ago · Status: Open                          │
│                                                              │
│  I have a leaking pipe in my kitchen that needs immediate   │
│  attention. The leak is under the sink and water is...      │
│                                                              │
│  Category: Plumbing                                         │
│  Budget: ETB 500                                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Applications (3)                              [Sort: Price] │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Avatar] Abebe Mekonnen                       ⭐ 4.8 │   │
│  │                                                      │   │
│  │ Proposed price: ETB 450                              │   │
│  │ Timeline: 2 hours                                    │   │
│  │                                                      │   │
│  │ [Accept Application]  [View Profile]                 │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ [Avatar] Samuel Tesfaye                       ⭐ 4.5 │   │
│  │                                                      │   │
│  │ Proposed price: ETB 500                              │   │
│  │ Timeline: 3 hours                                    │   │
│  │                                                      │   │
│  │ [Accept Application]  [View Profile]                 │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W2.7 Checkout (Desktop)

**Layout:** Centered card, max-width 480px

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                    Checkout                           │   │
│  │                                                       │   │
│  │  Service                              ETB 450        │   │
│  │  Platform fee                          ETB 23        │   │
│  │  ─────────────────────────────────────────────       │   │
│  │  Total                                ETB 473        │   │
│  │                                                       │   │
│  │  Payment Method                                      │   │
│  │  (●) Telebirr                                        │   │
│  │  ( ) Chapa                                           │   │
│  │  ( ) Cash                                            │   │
│  │                                                       │   │
│  │  [Pay ETB 473 — primary button, full width]          │   │
│  │                                                       │   │
│  │  🔒 Secure payment via ServiceHub                     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W2.8 Worker Dashboard (Desktop)

**Layout:** Sidebar + main content

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]     Home     Search     Post Job     [Notifications] [👤]│
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ Dashboard│  Hello, Abebe                                     │
│ ─────── │                                                   │
│ Find Jobs│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ My Work  │  │ Active: │ │Earnings │ │Completed│            │
│ Notifs   │  │    1    │ │12,400ETB│ │  Jobs:42│            │
│ Profile  │  └─────────┘ └─────────┘ └─────────┘            │
│          │                                                   │
│          │  Available Jobs                        [See All]  │
│          │  ┌───────────────────────────────────────────┐   │
│          │  │ Fix electrical issue    ETB 800    [Apply]│   │
│          │  │ Clean office space      ETB 600    [Apply]│   │
│          │  └───────────────────────────────────────────┘   │
│          │                                                   │
│          │  My Applications                                 │
│          │  ┌───────────────────────────────────────────┐   │
│          │  │ House cleaning    Pending    Bid: ETB 400 │   │
│          │  └───────────────────────────────────────────┘   │
└──────────┴───────────────────────────────────────────────────┘
```

---

## W3. Web-Specific Components

### W3.1 Dropdown Menu

**Trigger:** Click on avatar, kebab menu
**Width:** 200-240px
**Background:** white
**Border:** 1px `color-border`
**Shadow:** `shadow-md`
**Border radius:** `radius-md`
**Item height:** 40px
**Hover:** `color-surface-alt` background

### W3.2 Tooltip

**Background:** `color-ink`
**Text:** white, 12px
**Border radius:** 4px
**Padding:** 6px 10px
**Position:** 8px from trigger element
**Arrow:** 6px, pointing to trigger

### W3.3 Pagination

```
[← Previous]  [1] [2] [3] ... [12]  [Next →]
```

**Active page:** `color-primary` background, white text
**Inactive:** white background, `color-ink` text
**Hover:** `color-surface-alt` background

### W3.4 Data Tables

**Header:** `color-surface-alt` background, `color-ink-secondary` text, 600 weight
**Row height:** 48px
**Border bottom:** 1px `color-border`
**Hover row:** `color-surface-alt` background
**Striped (optional):** Alternating `color-surface` / `color-surface-alt`

### W3.5 Breadcrumbs

```
Home > My Jobs > Fix leaking pipe
```

**Separator:** `/` or chevron, `color-ink-muted`
**Current page:** `color-ink` (not a link)
**Links:** `color-primary`, hover underline

---

## W4. Desktop Responsive Breakpoints

| Breakpoint  | Layout                      | Grid       |
| ----------- | --------------------------- | ---------- |
| >1280px     | Full sidebar + content      | 12 columns |
| 1024-1280px | Collapsed sidebar + content | 12 columns |
| 768-1024px  | Top nav + content           | 8 columns  |
| <768px      | Switch to mobile layout     | 4 columns  |

---

---

# PART C: SHARED COMPONENTS

> Components used in both platforms with consistent styling

---

## C1. Buttons

### Primary Button

- Background: `color-primary` (#1D4ED8)
- Text: white, `text-button` (14px/600)
- Padding: 10px 20px (desktop), 12px 24px (mobile)
- Border radius: `radius-sm` (6px)
- Hover: `color-primary-dark` (#1E40AF)
- Active: darken 10%
- Disabled: `color-surface-alt` bg, `color-ink-muted` text
- Focus ring: `color-primary` 2px, offset 2px

### Secondary Button

- Background: white
- Border: 1px `color-border-strong`
- Text: `color-ink-secondary`
- Hover: `color-surface-alt` bg
- Active: `color-border` bg

### Destructive Button

- Background: `color-error` (#DC2626)
- Text: white
- Hover: darken 10%

### Ghost Button

- Background: transparent
- Text: `color-primary`
- Hover: `color-primary-light` bg

### Button Sizes

| Size | Padding (Desktop) | Padding (Mobile) | Height |
| ---- | ----------------- | ---------------- | ------ |
| `sm` | 6px 12px          | 8px 14px         | 32px   |
| `md` | 10px 20px         | 12px 24px        | 40px   |
| `lg` | 12px 24px         | 14px 28px        | 48px   |

---

## C2. Badges / Pills

| Type      | Background          | Text (darker for contrast) | Usage                |
| --------- | ------------------- | -------------------------- | -------------------- |
| `default` | `color-surface-alt` | `color-ink-secondary`      | Neutral info         |
| `success` | `#DCFCE7`           | `#15803D`                  | Completed, verified  |
| `warning` | `#FFF7ED`           | `#C2410C`                  | Pending, in progress |
| `error`   | `#FEF2F2`           | `#B91C1C`                  | Rejected, failed     |
| `primary` | `#DBEAFE`           | `#1E40AF`                  | Categories, tags     |
| `accent`  | `#FEF3C7`           | `#92400E`                  | Featured, ratings    |

- Border radius: `radius-full` (pill)
- Padding: 4px 10px
- Font size: 12px, weight 600

---

## C3. Form Elements

### Input

- Height: 40px
- Padding: 0 12px
- Border: 1px `color-border`
- Border radius: `radius-sm` (6px)
- Background: `color-surface-alt`
- Text: `color-ink`, 14px
- Placeholder: `color-ink-muted`
- Focus: `color-primary` border, `color-primary-light` ring (2px)
- Error: `color-error` border, error message below
- Disabled: `color-surface-alt` bg, `color-ink-muted` text

### Textarea

- Same as Input
- Min height: 120px
- Resizable: vertical only

### Select

- Same as Input
- Chevron icon right-aligned
- Dropdown: white bg, `shadow-md`, `radius-md`

### Checkbox / Radio

- Size: 18px
- Border: 2px `color-border-strong`
- Checked: `color-primary` fill, white checkmark
- Focus ring: 2px `color-primary`

---

## C4. Avatar

| Size | Dimensions | Usage             |
| ---- | ---------- | ----------------- |
| `xs` | 24px       | Inline mentions   |
| `sm` | 32px       | List items        |
| `md` | 40px       | Cards, forms      |
| `lg` | 56px       | Profiles, headers |
| `xl` | 80px       | Profile page hero |

- Border radius: `radius-full`
- Placeholder: `color-surface-alt` bg with user initials (`color-ink-muted`)

---

## C5. Rating Stars

- Star size: 16px (compact), 20px (standard)
- Filled: `color-accent` (#D97706)
- Empty: `color-border`
- Numeric value: `color-ink-secondary`, 14px, next to stars

---

## C6. Status Indicators

| Status           | Color             | Label         |
| ---------------- | ----------------- | ------------- |
| Open / Available | `color-primary`   | "Open"        |
| In Progress      | `color-warning`   | "In Progress" |
| Completed        | `color-success`   | "Completed"   |
| Cancelled        | `color-ink-muted` | "Cancelled"   |
| Disputed         | `color-error`     | "Disputed"    |

---

## C7. Modal / Dialog

**Desktop:**

- Overlay: `rgba(28,25,23,0.4)`
- Background: white
- Border radius: `radius-lg` (16px)
- Padding: 24px
- Shadow: `shadow-lg`
- Max width: 480px (small), 640px (medium), 800px (large)
- Close button: top-right, `color-ink-muted`

**Mobile:**

- Same overlay
- Slides up from bottom
- Border radius: 16px top corners
- Full width

---

## C8. Toast Notifications

**Desktop:**

- Position: top-right, 16px from edges
- Width: 360px max
- Background: white
- Border radius: `radius-md`
- Shadow: `shadow-md`
- Left border: 4px (color by type)
- Auto-dismiss: 5 seconds

**Mobile:**

- Position: top, below status bar
- Width: full width minus 32px
- Same styling as desktop

---

## C9. Skeleton Loading

**Pattern:** Match the geometry of the component being loaded

**Worker Card Skeleton:**

```
┌─────────────────────────────────┐
│ [color-border rectangle — 4:3]  │
│                                 │
│ [color-border bar — 60% width]  │
│ [color-border bar — 40% width]  │
│ [color-border bar — 30% width]  │
│                                 │
│ [color-border bar — 50% width]  │
│ [color-border bar — 40% width]  │
│                                 │
│ [color-border bar — button]     │
└─────────────────────────────────┘
```

**Animation:** Shimmer effect, 1.5s infinite, linear

---

---

# PART D: PAGE INVENTORY

> Complete list of screens to design for each platform — P0/P1 only

---

## D1. Mobile App Pages

### Batch 1 — Discovery & Onboarding (P0)

1. Landing page (search, categories, how-it-works)
2. Login (Telegram auth)
3. Role selection (Customer or Worker)
4. Search results (filterable list)

### Batch 2 — Customer Experience (P0)

5. Customer dashboard
6. Worker profile
7. Post job form
8. Job detail with applications
9. Accept application confirmation

### Batch 3 — Worker Experience (P0)

10. Worker dashboard
11. Job board (browse available jobs)
12. Job detail with apply form
13. My applications (status list)
14. Profile edit (P1)

### Batch 4 — Payments & Completion (P0)

15. Checkout (method selection)
16. Payment processing state
17. Payment success/failure
18. Job completion confirmation
19. Review submission

### Batch 5 — System States

20. Notification center
21. Empty states (no jobs, no results, etc.)
22. Error states (offline, server error)
23. Loading/skeleton states
24. Verification status

---

## D2. Web/Desktop Pages

### Batch 1 — Public & Discovery (P0/P1)

1. Landing page (hero, categories, social proof, CTA) — P1
2. Login page
3. Search results (sidebar filters + grid)
4. Worker profile (full page)

### Batch 2 — Customer Dashboard (P0)

5. Customer dashboard (stats + recent jobs)
6. My jobs list (with status filters)
7. Job detail with applications
8. Post job form

### Batch 3 — Worker Dashboard (P0)

9. Worker dashboard (stats + available jobs)
10. Job board (browse + apply)
11. My applications (status tracking)
12. Active jobs management
13. Profile edit (P1)

### Batch 4 — Checkout & Completion (P0)

14. Checkout page (payment method selection)
15. Payment processing
16. Payment success/failure
17. Job completion
18. Review submission

### Batch 5 — System States

19. Empty and error states
20. Notification center
21. Loading/skeleton states

---

---

# PART E: AI GENERATION PROMPTS

> Ready-to-use prompts for AI design tools (Figma AI, v0, Google Stitch, etc.)

---

## E1. Mobile App Prompts

**Base prompt for mobile:**

```
Design a [screen] for ServiceHub mobile app.
Style: Modern/Friendly with professional trust cues.
Colors: Trust Blue (#1D4ED8) primary, Warm Amber (#D97706) for ratings only, warm gray neutrals (#FAFAF9 background).
Font: Fraunces for headlines, Public Sans for body.
Border radius: 6-10px.
Mobile-native patterns: bottom tab navigation, full-width cards, touch-friendly 44px targets.
Clean, spacious layout with clear hierarchy. No chat or messaging UI.
```

**Component prompts (mobile):**

- **Worker Card:** "Mobile worker profile card with 1:1 photo, name, verified badge, star rating, services, price range, and view profile button. Touch-friendly, full-width."
- **Job Card:** "Mobile job posting card with title, budget, posted time, application count, status badge, and apply button."
- **Dashboard:** "Mobile marketplace dashboard with stat cards in 2-column grid, recent activity list, bottom tab navigation, and quick action button."
- **Search:** "Mobile search results with search bar at top, horizontal filter chips, and scrollable worker cards list."
- **Profile:** "Mobile worker profile with large 1:1 photo, name, verification badges, hire button, about section, services list, portfolio grid, and reviews."
- **Checkout:** "Mobile payment screen with order summary, payment method selection (Telebirr, Chapa, Cash), and pay button."

---

## E2. Web/Desktop Prompts

**Base prompt for web:**

```
Design a [screen] for ServiceHub web application.
Style: Modern/Friendly with professional trust cues.
Colors: Trust Blue (#1D4ED8) primary, Warm Amber (#D97706) for ratings only, warm gray neutrals (#FAFAF9 background).
Font: Fraunces for headlines, Public Sans for body.
Border radius: 6-10px.
Desktop patterns: sidebar navigation, 12-column grid, 3-column card layouts, hover states.
Clean, spacious layout with clear hierarchy. No chat or messaging UI.
```

**Component prompts (web):**

- **Worker Card:** "Desktop worker profile card in grid layout with 4:3 photo, name, verified badge, star rating, services, price range, response time, and view profile button."
- **Job Card:** "Desktop job posting card with title, budget, posted time, application count, status badge, and apply button."
- **Dashboard:** "Desktop marketplace dashboard with sidebar navigation, stat cards row, recent jobs table, and quick action button."
- **Search:** "Desktop search results page with 260px filter sidebar (category, rating, budget) and 3-column grid of worker cards with pagination."
- **Profile:** "Desktop worker profile with two-column layout: large 1:1 photo and info on left, about/services/portfolio/verification/reviews on right."
- **Checkout:** "Desktop checkout page centered card with order summary, payment method selection, and pay button."

---

---

# PART F: SPECIFICATION CHECKLIST

> Use this to verify completeness before generation

---

## F1. Design System Completeness

- [x] Color tokens defined with hex values
- [x] Color usage rules (which color for which purpose)
- [x] Typography scale (responsive for desktop and mobile)
- [x] Font families specified (Fraunces, Public Sans, IBM Plex Mono)
- [x] Spacing scale defined
- [x] Border radius tokens
- [x] Shadow/elevation tokens
- [x] Z-index layer system
- [x] Motion/animation tokens
- [x] Accessibility requirements (WCAG AA)
- [x] Focus states defined
- [x] Touch target sizes (44px minimum)

## F2. Component Completeness

- [x] Buttons (primary, secondary, destructive, ghost)
- [x] Badges/pills (all status types)
- [x] Form elements (input, textarea, select, checkbox)
- [x] Avatar (5 sizes)
- [x] Rating stars
- [x] Status indicators
- [x] Modal/dialog (desktop and mobile)
- [x] Toast notifications
- [x] Skeleton loading states
- [x] Empty states (6 scenarios)
- [x] Error states
- [x] Payment states (6 scenarios)
- [x] Confirmation dialogs
- [x] Trust/verification badges

## F3. Page Completeness

- [x] Mobile pages defined (24 screens)
- [x] Web pages defined (21 screens)
- [x] Both platforms have same feature coverage
- [x] Navigation patterns defined for both
- [x] Responsive behavior rules

## F4. Interaction Completeness

- [x] Hover states
- [x] Focus states
- [x] Active/pressed states
- [x] Disabled states
- [x] Loading states
- [x] Empty states
- [x] Error states
- [x] Success states
- [x] Confirmation patterns
- [x] Form validation states
- [x] Offline banner (persistent global)
- [x] Text truncation rules
- [x] Numeric keyboard/input types
- [x] Tabular figures (font-variant-numeric)

## F5. Accessibility Completeness

- [x] Badge contrast meets WCAG AA (4.5:1)
- [x] Secondary button border contrast (3:1)
- [x] Focus states visible (2px outline)
- [x] Touch targets 44px minimum
- [x] Color not used alone for state
- [x] Tabular figures for numeric data

## F6. Scope Compliance

- [x] NO admin dashboard (P2 — out of scope)
- [x] NO category management (P2 — seed DB instead)
- [x] NO business profiles (merged with Worker)
- [x] NO escrow (excluded per FR-041)
- [x] NO GPS/location matching (excluded)
- [x] NO advanced verification badges (postponed)
- [x] NO multi-language support (English only)
- [x] NO chat/messaging UI (removed for MVP)
- [x] NO dark mode (V1 is light only)
- [x] NO excessive animations
- [x] NO glassmorphism or gradients on components
- [x] NO generic AI illustration style

---

**Document Version:** 2.2
**Last Updated:** 2026
**Platforms:** Mobile App (iOS/Android) + Web/Desktop
**MVP Scope:** P0/P1 only (5-day timeline)
**Status:** Ready for AI generation
