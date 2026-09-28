---
trigger: always_on
---

# UI / DESIGN SYSTEM RULES

## 1. DESIGN PHILOSOPHY

The interface should feel:

```text
Clean
Calm
Premium
Fast
Technical
Trustworthy
Modern
```

Avoid making the product visually loud.

The design should feel closer to:

```text
Linear
Vercel
Apple
Notion
Raycast
Stripe
```

than to:

```text
Dribbble-style concept UI
Gaming dashboard UI
Excessive glassmorphism
Neon cyberpunk interfaces
Gradient-heavy SaaS templates
```

Take inspiration from these products' principles and information hierarchy, but DO NOT copy their branding, layouts, assets, or visual identity.

---

# 2. PRIMARY DESIGN RULE

Use:

```text
Strong hierarchy
+
Simple components
+
Consistent spacing
+
Limited visual effects
+
Reusable patterns
```

Do NOT attempt to make every screen unique.

The application should feel like:

```text
ONE PRODUCT
```

rather than:

```text
20 separately designed pages
```

---

# 3. DESIGN SYSTEM FIRST

Before designing individual screens, define:

```text
Color tokens
Typography tokens
Spacing tokens
Border tokens
Radius tokens
Shadow tokens
Motion tokens
Icon rules
Component variants
Breakpoints
```

Every future page MUST use these tokens.

Do NOT introduce random:

```text
font size
color
border radius
padding
shadow
gradient
```

inside individual pages unless there is a genuine design reason.

---

# 4. COLOR SYSTEM

Use a restrained palette.

Recommended structure:

```text
Background
Surface
Surface Elevated
Border
Primary Text
Secondary Text
Muted Text
Primary Accent
Success
Warning
Error
Info
```

Use one primary brand accent.

Use status colors only where they communicate state.

Do NOT use multiple bright accent colors merely for decoration.

Avoid:

```text
rainbow gradients
neon borders everywhere
glowing buttons
multiple competing accent colors
```

Color must communicate meaning before decoration.

---

# 5. DARK MODE

Dark mode may be the primary visual direction, but it must NOT become:

```text
black background
+
bright neon everything
```

Use layered surfaces.

Example hierarchy:

```text
Background
#0A0A0A

Surface
#111111

Elevated Surface
#171717

Border
subtle neutral

Primary Text
high contrast

Secondary Text
muted
```

Do not use pure black for every surface.

Do not use pure white for every text element.

Create depth primarily through:

```text
spacing
surface contrast
borders
typography
```

rather than heavy shadows and glow.

---

# 6. LIGHT MODE

Light mode must use the SAME design system.

Do NOT create a completely different visual language.

Only change:

```text
surface colors
text colors
borders
shadows
```

Layout, typography, spacing, component structure, and interaction behavior should remain consistent.

---

# 7. TYPOGRAPHY

Use one primary UI font family.

Prefer a modern neutral sans-serif such as:

```text
Inter
Geist
System UI
```

Do not use many font families.

Recommended hierarchy:

```text
Display
↓
Page Title
↓
Section Title
↓
Body
↓
Secondary
↓
Metadata
```

Use typography to create hierarchy instead of increasing font size excessively.

Avoid:

```text
huge headings everywhere
ultra-thin body text
all-caps paragraphs
decorative fonts
```

Numbers used in attendance dashboards should be highly legible and use tabular numerals where appropriate.

---

# 8. SPACING SYSTEM

Use a fixed spacing scale.

Example:

```text
4
8
12
16
24
32
48
64
```

Do not randomly use:

```text
17px
23px
29px
37px
```

unless required for a specific component.

Prefer consistent spacing between:

```text
icon → text
label → input
card → card
section → section
page → page
```

A consistent spacing system is more important than squeezing every pixel.

---

# 9. GRID

Use a predictable responsive grid.

Desktop:

```text
Sidebar
+
Main Content
```

Tablet:

```text
Compact Sidebar
+
Main Content
```

Mobile:

```text
Top Bar
+
Content
+
Bottom Navigation where appropriate
```

Do not redesign the entire application independently for each breakpoint.

Use the same component system with responsive composition.

---

# 10. RESPONSIVE RULE

Every desktop component must have a defined mobile behavior.

Examples:

```text
Table
→ Compact list / horizontally scrollable table

Sidebar
→ Drawer / bottom navigation

Multi-column dashboard
→ Stacked sections

Large card row
→ Horizontal scroll or stacked cards

Desktop modal
→ Full-screen mobile sheet
```

Never allow the layout to simply become cramped.

---

# 11. COMPONENT SYSTEM

Build reusable components FIRST.

Examples:

```text
Button
Input
Select
Badge
Avatar
Card
Stat
Table
DataList
Dialog
Sheet
Toast
Tooltip
Tabs
Dropdown
Skeleton
EmptyState
ErrorState
StatusIndicator
Progress
Stepper
```

Pages should mostly compose these components.

Avoid building page-specific versions of the same component.

Bad:

```text
TeacherButton
StudentButton
AttendanceButton
DashboardButton
```

Good:

```text
Button variant="primary"
Button variant="secondary"
Button variant="danger"
```

---

# 12. COMPONENT VARIANTS

Every reusable component should have a small controlled set of variants.

Example:

```text
Button:
primary
secondary
ghost
destructive
```

Not:

```text
purpleButton
blueButton
glassButton
gradientButton
neonButton
specialBlueButton
```

Avoid component explosion.

---

# 13. CARDS

Cards should have a purpose.

Use cards to group related information.

Do NOT place every piece of information inside a floating card.

Avoid:

```text
Card
  Card
    Card
      Card
```

Prefer clear sections separated by:

```text
spacing
subtle borders
typography
```

Use elevation sparingly.

---

# 14. BORDERS

Prefer subtle borders over heavy containers.

Borders should establish structure, not dominate the page.

Avoid:

```text
thick borders
bright borders
glowing borders
multiple nested outlines
```

---

# 15. CORNER RADIUS

Use a small set of consistent radii.

Example:

```text
Small
6px

Medium
10px

Large
14px
```

Do not mix:

```text
4px
7px
11px
17px
22px
31px
```

randomly.

Avoid excessive pill-shaped UI.

Use pills primarily for:

```text
status
filters
tags
small controls
```

---

# 16. GLASSMORPHISM

Glass effects are OPTIONAL.

Do not make the entire application glassmorphic.

Use transparency only when it improves hierarchy.

Avoid:

```text
blurred background everywhere
transparent cards everywhere
glass buttons
glass inputs
glass sidebar
glass modal
```

At most, use subtle translucency for specific overlays or navigation surfaces.

The interface must remain readable with effects disabled.

---

# 17. GRADIENTS

Gradients are accents, not foundations.

Use them only for:

```text
Hero accents
Brand moments
Selected visual highlights
Subtle background decoration
```

Do NOT use gradients for every:

```text
button
card
heading
badge
background
```

---

# 18. SHADOWS

Use shadows only to establish elevation.

Preferred:

```text
subtle
soft
consistent
```

Avoid:

```text
large glowing shadows
colored shadows
strong drop shadows
```

Depth should primarily come from hierarchy and spacing.

---

# 19. ICONS

Use ONE icon family.

Prefer:

```text
Lucide
```

or another consistent SVG icon set.

Do not mix:

```text
Lucide
Font Awesome
emoji
random SVGs
Material Icons
```

inside the same interface.

Icons should support meaning.

Do not use an icon merely because there is empty space.

---

# 20. ICON + TEXT RULE

Important actions should usually have text.

Prefer:

```text
＋ Start Attendance
```

over:

```text
＋
```

Do not force users to learn what unexplained icons mean.

Tooltips may supplement icons but should not replace necessary labels.

---

# 21. MOTION

Motion should explain state changes.

Use motion for:

```text
Page transitions
Panel expansion
Verification progress
Success feedback
Loading
Selection
Navigation
```

Do NOT animate everything.

Avoid:

```text
constant floating
parallax everywhere
large entrance animations
bouncing buttons
rotating decorative elements
```

Motion should feel:

```text
fast
subtle
intentional
```

Prefer approximately:

```text
120–200ms
```

for small interactions.

Longer animations should be reserved for meaningful transitions.

---

# 22. LOADING STATES

Every asynchronous component must have a designed loading state.

Do not replace the entire interface with:

```text
Loading...
```

Prefer skeletons that preserve the final layout.

Skeleton dimensions should closely match the content they replace to avoid layout shifting. This follows the same principle Vercel emphasizes in its interface guidelines.

---

# 23. EMPTY STATES

Every list/table/dashboard must have an empty state.

Example:

```text
No attendance sessions yet

Start a session to begin tracking attendance.

[ Start Session ]
```

An empty screen must always explain:

```text
What happened?
What can I do?
What should I do next?
```

Never show an unexplained blank page.

---

# 24. ERROR STATES

Every important operation must have a designed error state.

Never rely on:

```text
red toast: "Error"
```

Instead explain:

```text
What happened
Why it happened when useful
What the user can do next
```

Example:

```text
Camera access is blocked

Allow camera access in your browser settings,
then try verification again.

[ Try Again ]
```

Do not expose internal error codes to normal users.

---

# 25. NO DEAD ENDS

Every screen should have an obvious next action or recovery path.

Examples:

```text
Empty
→ Create / Start

Error
→ Retry / Fix

Completed
→ View result / Continue

Expired
→ Return to dashboard

Unauthorized
→ Sign in / Go back
```

Do not leave users stranded on screens with no useful action. This is also explicitly called out in Vercel's interface guidelines.

---

# 26. ATTENDANCE VERIFICATION UI

The verification screen should be extremely focused.

Do NOT show the entire dashboard while the student is verifying.

Use:

```text
┌─────────────────────────┐
│ Attendance              │
│                         │
│ Data Structures         │
│                         │
│       ◉                 │
│                         │
│ Checking proximity...   │
│                         │
│ Classroom detected ✓   │
│                         │
│ Continue                 │
└─────────────────────────┘
```

Then transition into:

```text
Face verification
```

Then:

```text
Verified ✓
Attendance marked
```

One task at a time.

---

# 27. VERIFICATION PROGRESS

Use a simple progress indicator:

```text
Proximity
   ✓

Face
   ●

Liveness
   ○

Complete
   ○
```

Do not use five simultaneous animated loaders.

The user should always know:

```text
Where am I?
What is happening?
What happens next?
```

---

# 28. SUCCESS STATES

Success should be obvious but restrained.

Prefer:

```text
✓
Attendance marked
09:42 AM
```

Avoid:

```text
Confetti explosion
Full-screen fireworks
Huge animated gradients
```

A successful attendance event should feel trustworthy, not like winning a slot machine.

---

# 29. STATUS DESIGN

Never rely on color alone.

Use:

```text
✓ Present
! Needs attention
× Rejected
○ Pending
```

Combine:

```text
color
+
icon
+
text
```

This improves accessibility and clarity. Vercel's current interface guidance specifically recommends redundant status cues rather than color alone.

---

# 30. DASHBOARD DENSITY

The teacher dashboard can be information-dense.

Use patterns similar to productivity/developer tools:

```text
Sidebar
Header
Stats
Filters
Table
Details
```

But preserve hierarchy.

Not everything should have equal visual weight.

The primary information should dominate.

---



