# DESIGN.md — ServiceHub

## 0. Brief

ServiceHub is a service marketplace connecting customers with individual workers and businesses (plumbers, electricians, cleaners, tutors, event staff, etc.). Two hiring paths: direct search-and-hire, and post-a-job-and-receive-applications.

**Who uses this:** working people on both sides — customers hiring help for real problems (a leak, an event, a lesson), and tradespeople/small businesses trying to win jobs and build a reputation. Not a tech-forward audience. Many users are on mid-range Android phones on the web version first, often on imperfect connections.

**Design mandate:** this must read as a **serious, trustworthy, professional product**, not a hackathon demo or a generic AI-generated SaaS template. If it looks like every other "AI app" — purple-to-blue gradient hero, glassmorphism cards, floating 3D blob shapes, Inter font, pill buttons with soft glows, stock photos of people in blazers shaking hands — that is a failure of this brief. The reference feeling is closer to **Airbnb's trust-through-photography approach** crossed with **the plainspoken utility of a well-run hardware store's paperwork** — warm, grounded, a little tactile, not sterile.

---

## 1. Design Principles

These are the "why" behind every rule in this document. When a new screen or edge case isn't covered below, design against these.

1. **Trust before conversion.** A customer should feel confident about a provider before being pushed toward hiring. Never rush someone past evaluation.
2. **Utility over decoration.** Every visual element should improve comprehension, navigation, or confidence — not exist to look modern.
3. **Human over technological.** ServiceHub connects people. The interface should feel local and human, not futuristic or "AI-powered."
4. **Evidence over claims.** Show reviews, experience, portfolio, verification, response time, and completed jobs — never just assert "top-rated professional."
5. **Mobile-first practicality.** Assume mid-range Android hardware and imperfect connectivity as the default case, not the edge case.
6. **Progressive disclosure.** Card → profile → verification details → reviews → portfolio. Don't front-load everything at once.
7. **Consistency over novelty.** Don't invent unusual interaction patterns just to look innovative.

---

## 2. Color System

| Token                 | Hex       | Usage                                                                                                    |
| --------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `color-primary`       | `#C1622D` | Primary actions, links, active states — a burnt terracotta, not a tech blue                              |
| `color-primary-dark`  | `#9C4C21` | Primary hover/pressed                                                                                    |
| `color-primary-tint`  | `#F1DFCF` | Primary-tinted backgrounds, selected chips                                                               |
| `color-accent`        | `#2F6F5E` | Trust/verification signals — verified badge, success confirmations, completed status                     |
| `color-accent-tint`   | `#DCEAE4` | Accent-tinted backgrounds                                                                                |
| `color-info`          | `#4F6D7A` | Neutral informational states (e.g. "payment processes within 24h") — distinct from success/warning/error |
| `color-info-tint`     | `#E4ECEF` | Info-tinted backgrounds                                                                                  |
| `color-ink`           | `#211D18` | Primary text — a warm near-black, never pure `#000000`                                                   |
| `color-ink-muted`     | `#5B564C` | Secondary text, captions, metadata                                                                       |
| `color-background`    | `#FAF6EF` | App background — warm off-white/limestone, never pure white                                              |
| `color-surface`       | `#FFFFFF` | Cards, sheets, modals                                                                                    |
| `color-surface-alt`   | `#F3EDE1` | Alternate surface (e.g. filters panel, input backgrounds)                                                |
| `color-border`        | `#E4DCC9` | Default borders/dividers                                                                                 |
| `color-border-strong` | `#CBBFA3` | Emphasized borders (focused input, active tab underline)                                                 |
| `color-error`         | `#B3261E` | Errors, destructive actions                                                                              |
| `color-warning`       | `#B5790F` | Pending/attention states (e.g. unverified business, pending payment)                                     |
| `color-success`       | `#2F6F5E` | Reuses accent — success and trust are the same visual language here                                      |
| `color-star`          | `#C1622D` | Rating stars — reuse primary, not a separate yellow                                                      |

**Rule:** No gradients anywhere except one permitted subtle use — a soft one-directional tint (`color-primary` → `color-primary-tint`) behind the landing page hero photograph, never a multi-hue gradient, never on buttons or cards.

**Background usage guidance:** `color-background` is an environmental layer, not a decorative one. Don't let large stretches of warm beige plus plain white cards read as a "premium lifestyle brand" — ServiceHub needs to feel useful first, beautiful second. Use `color-surface-alt` to break up large white card stacks where it helps scanability (e.g. alternating sections on the landing page), not for visual flourish.

---

## 3. Typography

| Token          | Family                                                       | Weight(s)          | Usage                                             |
| -------------- | ------------------------------------------------------------ | ------------------ | ------------------------------------------------- |
| `font-display` | **Fraunces** (Google Fonts, serif, optical size + soft slab) | 500, 600           | H1/H2 headlines, hero statements, page titles     |
| `font-body`    | **Public Sans** (Google Fonts, humanist sans)                | 400, 500, 600, 700 | Body text, UI labels, buttons, forms, navigation  |
| `font-mono`    | **IBM Plex Mono**                                            | 400                | Reference numbers only (job IDs, transaction IDs) |

Chosen instead of Inter/Poppins/Roboto — clean but with more personality and less "default AI tool" association.

### Type scale (responsive)

| Token          | Desktop       | Mobile         | Family  | Weight |
| -------------- | ------------- | -------------- | ------- | ------ |
| `text-hero`    | 48–56px / 1.1 | 36–40px / 1.15 | display | 600    |
| `text-h1`      | 40px / 46px   | 32px / 38px    | display | 600    |
| `text-h2`      | 28px / 34px   | 24px / 30px    | display | 500    |
| `text-h3`      | 22px / 28px   | 20px / 26px    | display | 500    |
| `text-h4`      | 18px / 24px   | 18px / 24px    | body    | 700    |
| `text-body-lg` | 16px / 24px   | 16px / 24px    | body    | 400    |
| `text-body`    | 14px / 20px   | 14px / 20px    | body    | 400    |
| `text-caption` | 12px / 16px   | 12px / 16px    | body    | 500    |
| `text-button`  | 14px / 20px   | 14px / 20px    | body    | 600    |

`text-hero` is reserved for the landing page only ("Find the right person for the job."). All other page titles use `text-h1`. Headlines (`font-display`) are used sparingly — never for body copy, buttons, or form fields.

**Localization note:** don't size containers or buttons around English text length. Copy in Amharic/Oromo will run longer — allow buttons and labels to expand, avoid text baked into images, and design notification templates assuming variable message length.

---

## 4. Spacing Scale

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

## 5. Layout & Grid

- Max content width: `1120px`, centered, `space-lg` side padding on desktop, `space-md` on mobile.
- Web: 12-column grid, `24px` gutter.
- Mobile breakpoint: `< 768px` — single column, cards stack full-width.
- Bottom tab navigation on mobile app (5 items max); top nav bar on web.
- Minimum touch target: `44×44px` for all interactive elements, regardless of platform.

---

## 6. Radius & Elevation

| Token       | Value | Usage                  |
| ----------- | ----- | ---------------------- |
| `radius-sm` | 6px   | Buttons, inputs, chips |
| `radius-md` | 10px  | Cards                  |
| `radius-lg` | 16px  | Modals, bottom sheets  |

Deliberately not the heavily-rounded "pill everything" look common in AI-generated UI.

| Token       | Value                             | Usage                     |
| ----------- | --------------------------------- | ------------------------- |
| `shadow-sm` | `0 1px 2px rgba(33,29,24,0.06)`   | Cards at rest             |
| `shadow-md` | `0 4px 12px rgba(33,29,24,0.10)`  | Cards on hover, dropdowns |
| `shadow-lg` | `0 12px 32px rgba(33,29,24,0.16)` | Modals, sheets            |

No glow/neon shadows, no glassmorphism. Shadows are soft, warm-toned (derived from `color-ink`), used sparingly.

---

## 7. Motion

Motion should communicate state, not decorate the interface.

| Token           | Duration  | Usage                                                |
| --------------- | --------- | ---------------------------------------------------- |
| `motion-fast`   | 100–150ms | Micro-interactions (button press, toggle)            |
| `motion-normal` | 150–250ms | Standard transitions (modal open, tab switch)        |
| `motion-slow`   | 250–350ms | Larger layout shifts (page transition, sheet expand) |

Rules:

- No bouncing UI, no decorative floating objects, no unnecessary parallax.
- Animate state changes only — not critical actions like payment confirmation, which should feel immediate and certain.
- Respect `prefers-reduced-motion`; provide a non-animated equivalent for every transition.

---

## 8. Z-Index / Layer System

| Token            | Value |
| ---------------- | ----- |
| `layer-base`     | 0     |
| `layer-sticky`   | 10    |
| `layer-dropdown` | 20    |
| `layer-modal`    | 30    |
| `layer-toast`    | 40    |
| `layer-critical` | 50    |

Keeps navbar, dropdowns, bottom sheets, modals, and toasts from colliding as the product grows.

---

## 9. Accessibility

- Target WCAG 2.2 AA.
- Minimum 4.5:1 contrast for normal text; minimum 3:1 for large text and UI components.
- Never communicate state through color alone — status badges always pair color with a text label and, where useful, an icon.
- Web interface fully keyboard-navigable, with visible focus states (`color-primary` outline).
- Minimum 44×44px interactive targets everywhere.
- Form errors are associated with their fields (not just a summary banner).
- All images have meaningful alt text.
- Respect `prefers-reduced-motion` (see Section 7).

---

## 10. Performance & Device Constraints

Design mobile-first and assume mid-range Android hardware with imperfect connectivity — this is a product-design constraint, not just an engineering one.

- Avoid unnecessary animation and large video backgrounds.
- Optimize and lazy-load provider photography; serve responsive image sizes.
- Keep initial JS payload small; avoid effects that require high-end GPU rendering.
- Every important action (posting a job, applying, confirming payment) must remain usable on a slow connection — show clear pending/retry states rather than a frozen UI.

---

## 11. Imagery & Iconography

- **Photography, not illustration, wherever a real provider or job is shown.** Documentary-style, natural light, people mid-task. Avoid glossy corporate stock photography.
- **No AI-generated illustration style** — no floating 3D blobs, no gradient mesh backgrounds, no generic isometric app-illustration people. For empty states, use simple flat line-art in `color-ink-muted` on `color-background`.
- Icons: **Phosphor Icons** or **Lucide**, regular weight, `color-ink-muted` default / `color-primary` when active.
- Do not use sparkle, rocket, or robot iconography as a generic signal of "AI," "premium," or "magic." This does **not** restrict legitimate marketplace use of stars for ratings (`★ 4.8`) or as a "favorite" affordance — those are earned, evidence-based uses, not decorative AI-signaling.
- Verified badge: a small solid checkmark in `color-accent`, not a shiny gradient seal.

---

## 12. Voice & Microcopy

Plain, direct, respectful — the tone of someone competent explaining something clearly, not marketing-speak.

- ✅ "Get applications from workers in your area."
- ❌ "Unlock a world of possibilities with our AI-powered marketplace ✨"
- ✅ "Payment confirmed."
- ❌ "Woohoo! You're all set! 🎉"

---

## 13. Component Notes

- **Buttons:** solid `color-primary` fill for primary actions, `radius-sm`, no gradient, subtle darken to `color-primary-dark` on hover — no glow. Secondary buttons are outlined, `color-border-strong`, transparent fill.
- **Forms:** labels above fields, `color-surface-alt` input background, `radius-sm`, clear inline validation in `color-error` tied to the specific field, no floating-label animation gimmicks.
- **Empty states:** simple line icon + one sentence + one clear action. No mascot characters. See Section 15 for the full set of states to design.

### Provider cards (search results)

The card must let a customer answer four questions almost immediately: **Who are they? Can they do my job? Can I trust them? Are they near me?**

```
┌─────────────────────────────────────┐
│ [provider photo]                    │
│                                      │
│ Abebe Plumbing              ✓       │
│ ★ 4.8 (126)                         │
│ Addis Ababa · 5 km                  │
│                                      │
│ Plumbing · Pipe repair · Installation│
│                                      │
│ 6 years experience                  │
│ Usually responds within 20 min      │
│ From ETB 500                        │
│                                      │
│              View profile           │
└─────────────────────────────────────┘
```

Response-time ("usually responds within X") is a required field on the card wherever available — it's one of the strongest practical signals for whether hiring someone is realistic right now.

### Verification

Don't show every verification badge everywhere. On cards: a single generic `✓ Verified` badge is enough. On the full profile, expand into specifics:

```
Verification
✓ Phone
✓ Identity
✓ Business
✓ Certificates
```

### Payment states

Never rely on color alone (🟢/🔴). Each payment state needs an icon, text label, color, and — where relevant — a next action:

```
Payment pending      (color-warning)   "Waiting for confirmation"
Payment authorized   (color-info)      "Funds reserved, not yet released"
Payment completed    (color-success)   "Payment confirmed"
Payment refunded     (color-info)      "Refund issued"
Payment failed       (color-error)     "Payment failed"  [Retry]
```

---

## 14. Trust & Safety

Service marketplaces live or die on trust — the product isn't just "find worker → hire," it's:

```
Find → Evaluate → Trust → Hire → Communicate → Pay → Complete → Review
```

Design UX for each of the following, not just the happy path:

- Identity verification and business verification (see Section 13)
- Reporting a provider or a customer
- Reviews (including how disputed/flagged reviews are handled)
- Dispute handling and cancellation
- Payment protection messaging (especially relevant given V1 has no escrow — be explicit with users about what protection does and doesn't exist)
- Suspicious activity / blocked users
- Verification failures (what a rejected verification looks like to the user, and what they can do next)

---

## 15. Empty & Error States

Design each of these individually — they are different situations and deserve different messaging, not one generic "Something went wrong."

**Empty states:** no search results · no jobs yet · no applications · no messages · no notifications · no reviews yet

**Error / system states:** offline · slow connection · request timeout · server unavailable · upload failed · payment callback delayed · image upload interrupted · permission denied · account suspended

Example pattern for offline:

```
You're offline
Some features may be unavailable.
We'll reconnect automatically.
[Retry]
```

This is more useful to the user than a generic failure message, and matters more here than in most products given the target connectivity conditions (Section 10).

---

## 16. Pages to Design

Group into batches of 5 for Stitch's multi-screen generation.

**Batch 1 — Core discovery & trust**

1. Landing page (search bar, categories, featured providers, how-it-works)
2. Search results (worker/business list with filters)
3. Worker profile page (bio, services, pricing, portfolio, certificates, ratings/reviews, availability, verification detail)
4. Business profile page (same pattern, business-specific fields)
5. Registration flow (role selection → phone entry → OTP verification)

**Batch 2 — Hiring flows** 6. Customer dashboard (active jobs, applications, messages, notifications) 7. Post-a-job form (title, description, category, budget, deadline, images) 8. Job detail page with received applications (comparison view: price, completion time, provider profile) 9. Direct-hire confirmation flow (selected provider → contact reveal → schedule) 10. Payment screen (method selection: cash / Telebirr / Chapa, with payment-state messaging)

**Batch 3 — Provider side** 11. Worker dashboard (available jobs, my applications, active jobs, earnings) 12. Worker profile edit screen (services, pricing, availability, portfolio upload, certificate upload) 13. Job application form (proposed price, estimated completion time) 14. Business dashboard (same pattern, business-specific) 15. Ratings/review submission screen (post-job)

**Batch 4 — Trust, admin & system states** 16. Admin dashboard (overview metrics: users, jobs, payments, reports) 17. Admin user management table + report review screen 18. Trust center / verification detail screen 19. Notification center 20. Empty and error states (see Section 15 for full list — design the 3–4 most common first: no search results, no jobs yet, offline, payment failed)

---

## 17. Explicit "Do Not" List

- Do not use a purple-to-blue gradient anywhere.
- Do not use Inter, Poppins, or Roboto as the primary font — use the pairing defined above.
- Do not use glassmorphism/frosted-glass panels.
- Do not use fully-rounded pill buttons as the default button shape.
- Do not use generic 3D-rendered illustration characters or blob backgrounds.
- Do not use sparkle (✨), rocket (🚀), or robot iconography to signal "AI" or "modern" (legitimate star ratings are exempt — see Section 11).
- Do not use stock photography of people in suits shaking hands over a laptop.
- Do not make every card a generic white rectangle with a drop shadow and no distinguishing texture.
- Do not communicate any status (payment, verification, application) through color alone.
- Do not size layouts assuming English text length only — see localization note in Section 3.

---

## 18. Tooling Note

This file follows the DESIGN.md convention understood natively by Google Stitch (stitch.withgoogle.com, free, Google Labs) — paste or import it directly into a Stitch project and it will ground every generated screen in these tokens rather than defaults. It can be validated with `npx @google/design.md lint DESIGN.md` before use, and is portable to other AI coding/design tools (Claude Code, Cursor, v0) since it's plain markdown.
