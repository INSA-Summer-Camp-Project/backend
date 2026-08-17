# FIGMA-DESIGN.md — ServiceHub

> **Figma AI Generation Guide** — Optimized prompts for consistent, high-quality UI generation
>
> This file is structured for Figma AI consumption. Use the master `DESIGN.md` for full specifications.

---

## Quick Reference — Design Tokens

Before any generation, establish these in your Figma file:

### Colors

```
Primary:        #1D4ED8 (Trust Blue — buttons, links, active states)
Primary Dark:   #1E40AF (hover/pressed)
Primary Light:  #DBEAFE (backgrounds, selected)
Accent:         #D97706 (ratings ONLY — NOT for buttons)
Accent Light:   #FEF3C7
Success:        #16A34A
Success Light:  #DCFCE7
Warning:        #EA580C
Warning Light:  #FFF7ED
Error:          #DC2626
Error Light:    #FEF2F2
Info:           #4F6D7A
Info Light:     #E4ECEF
Ink:            #1C1917 (primary text)
Ink Secondary:  #44403C
Ink Muted:      #78716C
Background:     #FAFAF9 (page background)
Surface:        #FFFFFF (cards)
Surface Alt:    #F5F5F4 (inputs, alternate)
Border:         #E7E5E4
Border Strong:  #A8A29E
```

### Typography

```
Display:  Fraunces 500/600 (headlines only)
Body:     Public Sans 400/500/600/700
Mono:     IBM Plex Mono 400 (job IDs, transaction IDs)

Scale:
Hero:     48px desktop / 36px mobile
H1:       36px / 28px
H2:       28px / 24px
H3:       22px / 20px
H4:       18px / 16px
Body LG:  16px
Body:     14px
Caption:  12px
Button:   14px/600
```

### Spacing

```
4px  | xs
8px  | sm
16px | md
24px | lg
32px | xl
48px | 2xl
64px | 3xl
```

### Border Radius

```
6px   | sm (buttons, inputs, chips)
10px  | md (cards)
16px  | lg (modals, bottom sheets)
9999px | full (avatars, pills)
```

### Shadows

```
sm: 0 1px 2px rgba(28,25,23,0.06)
md: 0 4px 12px rgba(28,25,23,0.10)
lg: 0 12px 32px rgba(28,25,23,0.16)
```

---

## Global Rules (Apply to Every Screen)

```
STYLE: Modern/Friendly with professional trust cues
MOOD: Trustworthy, clean, approachable — NOT corporate, NOT playful
BACKGROUND: Warm off-white #FAFAF9, NOT pure white
CARDS: White #FFFFFF with subtle shadow
RADIUS: 6-10px (NOT pill-shaped, NOT heavily rounded)
FONTS: Fraunces for headlines, Public Sans for everything else
ICONS: Lucide, regular weight
ANIMATIONS: Minimal — 150-250ms only for state changes
GRADIENTS: None except subtle landing hero tint
CHAT/MESSAGING: Do NOT include — this feature does not exist
DARK MODE: Do NOT generate — light mode only
BUSINESS PROFILES: Do NOT generate — workers only
GPS/LOCATION: Do NOT include functional location controls
VERIFICATION: Only Phone and Identity verified for MVP
```

---

## Badge Text Colors (WCAG AA Compliant)

When creating badges/pills, use these EXACT text colors on light backgrounds:

```
Success badge:  bg #DCFCE7, text #15803D
Warning badge:  bg #FFF7ED, text #C2410C
Error badge:    bg #FEF2F2, text #B91C1C
Primary badge:  bg #DBEAFE, text #1E40AF
Accent badge:   bg #FEF3C7, text #92400E
```

---

---

# PHASE 1: Design Foundation

> Generate these FIRST to establish visual consistency

---

## P1.1 Color Styles

Create Figma color styles matching the tokens above. Name them:

- `primary/default`, `primary/dark`, `primary/light`
- `accent/default`, `accent/light`
- `success/default`, `success/light`
- etc.

---

## P1.2 Typography Styles

Create text styles:

- `display/hero`, `display/h1`, `display/h2`, `display/h3`
- `body/lg`, `body/default`, `body/sm`, `body/caption`
- `button/default`, `button/small`, `button/large`
- `mono/default`

---

## P1.3 Button Components

### Primary Button

```
Background: #1D4ED8
Text: White, 14px/600
Radius: 6px
Padding: 12px 24px
Hover: #1E40AF
Disabled: #F5F5F4 bg, #78716C text
Focus: 2px #1D4ED8 outline, 2px offset
```

### Secondary Button

```
Background: White
Border: 1px #A8A29E
Text: #44403C, 14px/600
Hover: #F5F5F4 bg
```

### Destructive Button

```
Background: #DC2626
Text: White, 14px/600
Hover: darken 10%
```

---

## P1.4 Input Components

### Text Input

```
Height: 40px
Background: #F5F5F4
Border: 1px #E7E5E4
Radius: 6px
Text: #1C1917, 14px
Placeholder: #78716C
Focus: #1D4ED8 border, #DBEAFE ring
Error: #DC2626 border, error message below
```

### Select Dropdown

```
Same as text input
Chevron icon right
Dropdown: white, shadow-md, 6px radius
```

---

## P1.5 Card Component

### Standard Card

```
Background: White
Border: None
Radius: 10px
Shadow: sm (0 1px 2px rgba(28,25,23,0.06))
Padding: 20px
Hover: shadow-md, translateY(-1px)
```

---

## P1.6 Badge Components

Create variants for each type:

```
Default:   bg #F5F5F4, text #44403C
Success:   bg #DCFCE7, text #15803D
Warning:   bg #FFF7ED, text #C2410C
Error:     bg #FEF2F2, text #B91C1C
Primary:   bg #DBEAFE, text #1E40AF
Accent:    bg #FEF3C7, text #92400E

All: radius 9999px, padding 4px 10px, 12px/600
```

---

## P1.7 Avatar Component

```
Sizes: 24px (xs), 32px (sm), 40px (md), 56px (lg), 80px (xl)
Radius: 9999px (circle)
Placeholder: #F5F5F4 bg, #78716C initials
```

---

## P1.8 Rating Stars

```
Star size: 16px (compact), 20px (standard)
Filled: #D97706
Empty: #E7E5E4
Numeric value: #44403C, 14px, next to stars
```

---

---

# PHASE 2: Mobile App Screens

> Generate these in order. Each screen builds on the previous.

---

## M1. Landing Page (Not Logged In)

```
GENERATE: Mobile landing page for ServiceHub

LAYOUT: Single column, vertical scroll

VISUAL HIERARCHY:
1. Logo (top left)
2. Hero headline + subtext
3. Search bar
4. Category chips (horizontal scroll)
5. How it works steps
6. CTA button
7. Login link

CONTENT:
- Headline: "Find the right person for the job"
- Subtext: "Browse verified professionals in your area"
- Categories: Plumbing, Cleaning, Tutoring, Events
- Steps: 1. Search → 2. Compare → 3. Hire → 4. Pay
- CTA: "Get Started" (primary blue button)
- Footer: "Already have an account? Log in"

CONSTRAINTS:
- NO gradients except subtle hero tint
- NO AI illustrations — use photo or simple icons
- NO chat or messaging elements
- Background: #FAFAF9
```

---

## M2. Login

```
GENERATE: Mobile login screen for ServiceHub

LAYOUT: Centered card, minimal

CONTENT:
- Logo centered
- "Login with Telegram" button (Telegram blue #0088cc)
- "By logging in, you agree to our Terms" small text

CONSTRAINTS:
- NO email/password fields
- NO social logins except Telegram
- Clean, lots of whitespace
- Background: #FAFAF9
```

---

## M3. Role Selection

```
GENERATE: Mobile role selection screen for ServiceHub

LAYOUT: Two large cards, vertical stack

CONTENT:
- "How do you want to use ServiceHub?"
- Card 1: "I need help" → Customer icon → "Post jobs, hire professionals"
- Card 2: "I offer services" → Worker icon → "Find jobs, build reputation"

CONSTRAINTS:
- Cards should be equally sized
- Clear visual distinction between roles
- Primary blue border on selected card
```

---

## M4. Customer Dashboard

```
GENERATE: Mobile customer dashboard for ServiceHub

LAYOUT: Vertical scroll, stat cards + job list

CONTENT:
- Greeting: "Good morning, Sarah"
- Notification bell icon (top right)
- Stats row (2 columns):
  - Active Jobs: 2
  - Total Spent: 4,500 ETB
- Recent Jobs section:
  - Job 1: "Fix leaking pipe" | In Progress | ETB 500
  - Job 2: "House cleaning" | Completed | ETB 800
- "Post a Job" button (full width, primary)

NAVIGATION: Bottom tab bar
- Home (active)
- Search
- Post Job
- Notifications
- Profile

CONSTRAINTS:
- Use tabular-nums for all numbers
- Status badges use correct colors
- NO chat or messages tab
```

---

## M5. Worker Search

```
GENERATE: Mobile worker search results for ServiceHub

LAYOUT: Search bar + filter chips + scrollable card list

CONTENT:
- Search bar (full width, with filter icon)
- Filter chips (horizontal scroll): Plumbing, Cleaning, All Categories
- Results count: "Showing 48 professionals"
- Worker cards (full width, stacked):
  - 1:1 photo (left)
  - Name + verified badge
  - Star rating + review count
  - Location
  - Starting price
  - "View Profile" button

FILTER BOTTOM SHEET:
- Category dropdown
- Minimum rating dropdown
- Price range slider
- Clear All + Apply buttons

CONSTRAINTS:
- Cards answer: Who? Can they? Can I trust them? Price?
- Response time shown when available
- NO GPS/location input
```

---

## M6. Worker Profile

```
GENERATE: Mobile worker profile for ServiceHub

VISUAL HIERARCHY (in order):
1. Worker identity (photo, name, profession)
2. Trust signals (rating, completed jobs, response time)
3. Hire action
4. About/services
5. Portfolio
6. Verification
7. Reviews

CONTENT:
- Back button + Share icon (top)
- Large 1:1 photo (full width)
- Name + verified badge
- "Plumbing Professional"
- Location: "Addis Ababa"
- ⭐ 4.9 (126 reviews) · 342 completed jobs
- "Usually responds in 20 min"
- "Hire Abebe" button (full width, primary)
- About section (bio text)
- Services list (bullet points)
- Portfolio grid (4:3 images, 2 columns)
- Verification: ✓ Phone · ✓ Identity
- Reviews list (star ratings + comments)

CONSTRAINTS:
- Trust information appears BEFORE hire button
- NO chat or messaging button
- NO Telegram contact exposure
- NO business badges (postponed)
- NO escrow or payment protection claims
```

---

## M7. Post Job Form

```
GENERATE: Mobile post job form for ServiceHub

LAYOUT: Single column, scrollable

CONTENT:
- Back button + "Post a Job" title + X close
- Job Title input
- Description textarea
- Category dropdown
- Budget (ETB) input (numeric keyboard)
- "Post Job" button (full width, primary)

CONSTRAINTS:
- inputmode="decimal" for budget field
- NO location/GPS field
- NO deadline field (MVP)
- NO image upload (MVP)
- Clean, simple form
```

---

## M8. Job Detail (Customer View)

```
GENERATE: Mobile job detail for customer in ServiceHub

LAYOUT: Job info + applications list

CONTENT:
- Back button + More menu (⋮)
- Job title: "Fix leaking pipe"
- Posted time: "2 hours ago"
- Description text
- Category: Plumbing
- Budget: ETB 500
- Status badge: Open
- Applications section:
  - Application 1:
    - Avatar + name + rating
    - Proposed price: ETB 450
    - Timeline: 2 hours
    - "Accept" + "View Profile" buttons
  - Application 2:
    - Avatar + name + rating
    - Proposed price: ETB 500
    - Timeline: 3 hours
    - "Accept" + "View Profile" buttons

CONSTRAINTS:
- Accept button is primary blue
- Status badges use correct colors
- NO chat or messaging
```

---

## M9. Worker Dashboard

```
GENERATE: Mobile worker dashboard for ServiceHub

LAYOUT: Vertical scroll, stat cards + job lists

CONTENT:
- Greeting: "Hello, Abebe"
- Notification bell icon
- Stats row (2 columns):
  - Active Jobs: 1
  - Earnings: 12,400 ETB
- Available Jobs section:
  - Job 1: "Fix electrical issue" | ETB 800 | "Apply" button
- My Applications section:
  - Application 1: "House cleaning" | Pending | Bid: ETB 400

NAVIGATION: Bottom tab bar
- Home (active)
- Find Jobs
- My Work
- Notifications
- Profile

CONSTRAINTS:
- Use tabular-nums for all numbers
- NO chat or messages tab
```

---

## M10. Job Board (Worker View)

```
GENERATE: Mobile job board for workers in ServiceHub

LAYOUT: Search + filter chips + scrollable job list

CONTENT:
- Search bar: "Search jobs"
- Filter chips: Plumbing, All Categories
- Results count: "Showing 24 available jobs"
- Job cards (full width):
  - Job title
  - Posted by customer + rating
  - Budget: ETB 500
  - Application count: "3 applications"
  - "Apply" + "View" buttons

CONSTRAINTS:
- Similar layout to worker search
- NO location filter
```

---

## M11. Checkout

```
GENERATE: Mobile checkout for ServiceHub

LAYOUT: Order summary + payment method

CONTENT:
- Back button + "Checkout" title
- Order Summary:
  - Service: ETB 450
  - Platform fee: ETB 23
  - Divider
  - Total: ETB 473
- Payment Method:
  - (●) Telebirr
  - ( ) Chapa
  - ( ) Cash
- "Pay ETB 473" button (full width, primary)
- "Secure payment via ServiceHub" + lock icon

CONSTRAINTS:
- NO escrow messaging
- NO payment protection claims beyond "Secure payment"
- Use tabular-nums for all prices
```

---

---

# PHASE 3: Web/Desktop Screens

> Generate these after mobile screens are established

---

## W1. Landing Page (Desktop)

```
GENERATE: Desktop landing page for ServiceHub

LAYOUT: Full-width hero → categories → how it works → CTA

CONTENT:
- Top nav: Logo, Home, Search, Post Job, Login, Sign Up
- Hero (two columns):
  - Left: Headline + subtext + search bar + CTA
  - Right: Hero image/illustration
- Popular Categories (4 cards in row)
- How it Works (4 steps)
- CTA section: "Ready to find help?" + button
- Footer: About, Terms, Privacy, Contact

VISUAL HIERARCHY:
1. Headline: "Find the right person for the job"
2. Search functionality
3. Category exploration
4. Trust building (how it works)
5. Conversion (CTA)

CONSTRAINTS:
- Background: #FAFAF9
- NO gradients except subtle hero tint
- NO AI illustrations
- NO chat elements
- Clean, spacious layout
```

---

## W2. Search Results (Desktop)

```
GENERATE: Desktop search results for ServiceHub

LAYOUT: Filters sidebar (260px) + results grid (3 columns)

CONTENT:
- Top nav bar
- Filters sidebar:
  - Category dropdown
  - Minimum rating dropdown
  - Budget range
  - Clear All button
- Results header: "Showing 124 professionals" + Sort dropdown
- Worker cards grid (3 columns):
  - 4:3 photo
  - Name + verified badge
  - Star rating + reviews
  - Location
  - Response time
  - Starting price
  - "View Profile" button
- Pagination: [← Previous] [1] [2] [3] ... [12] [Next →]

CONSTRAINTS:
- Cards answer: Who? Can they? Can I trust them? Price?
- NO GPS/location input
- Tabular-nums for all numbers
```

---

## W3. Worker Profile (Desktop)

```
GENERATE: Desktop worker profile for ServiceHub

LAYOUT: Two-column (header + content)

CONTENT:
- Top nav bar
- "← Back to Search" link
- Header section (two columns):
  - Left: Large 1:1 photo
  - Right:
    - Name + verified badge
    - "Plumbing Professional"
    - Location
    - ⭐ 4.9 (126 reviews) · 342 completed jobs
    - "Usually responds in 20 min"
    - "Hire Abebe" button (primary)
- Content section (two columns):
  - Left: About + Services
  - Right: Portfolio + Verification + Reviews

VISUAL HIERARCHY:
1. Worker identity
2. Trust signals
3. Hire action
4. Experience details
5. Portfolio evidence
6. Verification
7. Reviews

CONSTRAINTS:
- Trust info appears BEFORE hire button
- NO chat/messaging
- NO business badges
- NO Telegram exposure
```

---

## W4. Customer Dashboard (Desktop)

```
GENERATE: Desktop customer dashboard for ServiceHub

LAYOUT: Sidebar (260px) + main content

CONTENT:
- Sidebar navigation:
  - Dashboard (active)
  - My Jobs
  - Post Job
  - Notifications
  - Profile
- Main content:
  - Greeting: "Good morning, Sarah"
  - Stats row (3 cards):
    - Active Jobs: 2
    - Total Spent: 4,500 ETB
    - Completed Jobs: 8
  - Recent Jobs table:
    - "Fix leaking pipe" | In Progress | ETB 500
    - "House cleaning" | Completed | ETB 800
    - "Electrical repair" | Open | ETB 600
  - "Post a New Job" button

CONSTRAINTS:
- Tabular-nums for all numbers
- Status badges use correct colors
- NO chat or messages in sidebar
```

---

## W5. Job Detail (Desktop)

```
GENERATE: Desktop job detail for customer in ServiceHub

LAYOUT: Full-width with sections

CONTENT:
- Top nav + sidebar
- "← Back to My Jobs" link
- Job header:
  - Title: "Fix leaking pipe"
  - Posted time + Status badge
- Job description
- Details: Category, Budget
- Applications section:
  - "Applications (3)" + Sort dropdown
  - Application cards:
    - Avatar + name + rating
    - Proposed price
    - Timeline
    - "Accept Application" + "View Profile" buttons

CONSTRAINTS:
- Accept button is primary blue
- NO chat or messaging
```

---

## W6. Worker Dashboard (Desktop)

```
GENERATE: Desktop worker dashboard for ServiceHub

LAYOUT: Sidebar + main content

CONTENT:
- Sidebar navigation:
  - Dashboard (active)
  - Find Jobs
  - My Work
  - Notifications
  - Profile
- Main content:
  - Greeting: "Hello, Abebe"
  - Stats row (3 cards):
    - Active Jobs: 1
    - Earnings: 12,400 ETB
    - Completed Jobs: 42
  - Available Jobs section with "Apply" buttons
  - My Applications section with status

CONSTRAINTS:
- Tabular-nums for all numbers
- NO chat or messages in sidebar
```

---

## W7. Checkout (Desktop)

```
GENERATE: Desktop checkout for ServiceHub

LAYOUT: Centered card, max-width 480px

CONTENT:
- Top nav
- Checkout card:
  - "Checkout" title
  - Order summary with line items
  - Total
  - Payment method selection (radio buttons)
  - "Pay ETB 473" button (primary, full width)
  - "Secure payment via ServiceHub" + lock icon

CONSTRAINTS:
- NO escrow messaging
- Tabular-nums for prices
- Clean, trustworthy payment UI
```

---

---

# PHASE 4: System States

> Generate these to complete the design system

---

## S1. Empty States

```
GENERATE: Empty state components for ServiceHub

Create 4 empty state variations:

1. NO SEARCH RESULTS:
   - Icon: Search with X
   - Heading: "No professionals found"
   - Subtext: "Try changing your filters or search another category"
   - Action: "Clear Filters" button

2. NO JOBS YET:
   - Icon: Briefcase
   - Heading: "No jobs posted yet"
   - Subtext: "Be the first to post a job and get applications"
   - Action: "Post a Job" button

3. NO APPLICATIONS:
   - Icon: Users
   - Heading: "No applications yet"
   - Subtext: "Workers will apply once they see your job"

4. NO REVIEWS:
   - Icon: Star outline
   - Heading: "No reviews yet"
   - Subtext: "Reviews appear after completed jobs"

PATTERN: Icon + heading + explanation + single action
```

---

## S2. Loading States

```
GENERATE: Skeleton loading components for ServiceHub

Create skeleton versions of:

1. WORKER CARD SKELETON:
   - Gray rectangle (4:3 ratio) for photo
   - Gray bars for name, rating, price
   - Gray bar for button

2. JOB CARD SKELETON:
   - Gray bars for title, budget, status
   - Gray bar for button

3. DASHBOARD SKELETON:
   - Gray rectangles for stat cards
   - Gray bars for list items

ANIMATION: Subtle shimmer effect, 1.5s infinite
COLOR: Use #E7E5E4 for skeleton elements
```

---

## S3. Error States

```
GENERATE: Error state components for ServiceHub

Create error states for:

1. OFFLINE:
   - Icon: WiFi off
   - Heading: "You're offline"
   - Subtext: "Some features may be unavailable. We'll reconnect automatically."
   - Action: "Retry" button

2. SERVER ERROR:
   - Icon: Server crash
   - Heading: "Something went wrong"
   - Subtext: "Please try again later"
   - Action: "Retry" button

3. PAYMENT FAILED:
   - Icon: Credit card with X
   - Heading: "Payment failed"
   - Subtext: "Your payment could not be processed"
   - Action: "Try Again" button

PATTERN: Icon + heading + explanation + retry action
```

---

## S4. Offline Banner

```
GENERATE: Persistent offline banner for ServiceHub

LAYOUT: Fixed banner below header

CONTENT:
- Warning icon
- "You're offline. Some features may be unavailable."

STYLING:
- Background: #FFF7ED
- Text: #44403C, 14px
- Icon: #EA580C
- Height: 40px
- Non-dismissible
- Auto-hides when online

CREATE: Both mobile and desktop versions
```

---

## S5. Payment Processing

```
GENERATE: Payment processing state for ServiceHub

LAYOUT: Centered card

CONTENT:
- Spinner/loading indicator
- "Processing your payment..."
- "This may take a few seconds"
- Amount: ETB 473

STYLING:
- Clean, minimal
- No distracting animations
- Convey certainty, not anxiety

CREATE: Processing, success, and failed states
```

---

---

# Generation Checklist

Use this to verify each generated screen:

- [ ] Uses Trust Blue #1D4ED8 for primary actions
- [ ] Uses Warm Amber #D97706 for ratings ONLY
- [ ] Background is #FAFAF9 (warm off-white)
- [ ] Cards are white with subtle shadow
- [ ] Border radius is 6-10px (not pill-shaped)
- [ ] Fraunces for headlines, Public Sans for body
- [ ] Tabular-nums for all numbers
- [ ] Badge text colors meet WCAG AA contrast
- [ ] NO chat or messaging UI
- [ ] NO dark mode
- [ ] NO business profiles
- [ ] NO GPS/location controls
- [ ] NO escrow messaging
- [ ] NO excessive animations
- [ ] NO gradients (except hero tint)
- [ ] NO glassmorphism
- [ ] NO AI illustrations
- [ ] 44px minimum touch targets
- [ ] Trust signals appear before CTAs
- [ ] Consistent navigation patterns

---

**File Version:** 1.0
**Purpose:** Figma AI generation guide
**Use with:** Master DESIGN.md for full specifications
