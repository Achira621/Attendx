---
trigger: always_on
---

31. TEACHER DASHBOARD

Recommended hierarchy:

Top:
Current Session

↓
Large attendance statistic

↓
Present / Pending / Absent

↓
Student table

↓
Verification details

Example:

Data Structures
Active • 08:58–09:15

42 / 52 Present

✓ Present     42
◌ Processing   3
○ Not Marked   7

--------------------------------
Student      Status
Varad        ✓ Present
Rahul        ✓ Present
Aditi        ◌ Processing
Sneha        ○ Not Marked

Do not overload the first screen with analytics.

32. ANALYTICS

Analytics should be secondary.

Use charts only when they answer a question.

Examples:

Attendance trend
Attendance by subject
Late arrivals
Class participation

Do not add charts simply because dashboards "look better" with charts.

Prefer clear data and hierarchy over decoration.

33. TABLES

Tables should be designed for scanning.

Use:

Student
Status
Time
Verification

Keep columns concise.

Use tabular numerals for times/numbers.

On mobile, do not squeeze ten columns into a tiny screen.

Convert to:

Student row
↓
Status
↓
Time
↓
Details

or allow controlled horizontal scrolling.

34. NAVIGATION

Keep navigation stable.

Teacher navigation might be:

Overview
Sessions
Classes
Students
Reports
Settings

Student navigation might be:

Home
Attendance
History
Profile

Do not create navigation items for every feature.

Group related features.

35. SIDEBAR RULE

Desktop:

Fixed / collapsible sidebar

Mobile:

Drawer
or
Bottom navigation

Do not force a full desktop sidebar onto mobile.

The current Vercel dashboard redesign also uses a sidebar that can be hidden when unnecessary, which is a useful model for dense desktop applications.

36. MOBILE-FIRST ATTENDANCE

The student experience is primarily mobile.

Design the student flow for:

One hand
One primary action
Minimal typing
Minimal navigation
Large touch targets
Fast transitions

The teacher experience can be more desktop-oriented.

Do not force both roles into the exact same layout.

37. TOUCH TARGETS

Interactive controls must be comfortable on mobile.

Avoid:

tiny buttons
tiny icon-only controls
closely packed actions

Primary actions should be visually and physically easy to tap.

38. FORMS

Keep forms short.

Group related fields.

Use inline validation.

Do not make users submit a large form only to learn one field was invalid.

Prefer:

Label
Input
Inline feedback

over:

Placeholder used as the label
39. MODALS

Use modals only for focused tasks.

Good:

Confirm session end
Delete class
Review verification

Bad:

Entire dashboard inside modal
Multiple nested modals
Long configuration flows inside modal

For complex mobile tasks, prefer a full-screen sheet/page rather than a tiny centered modal. Apple similarly recommends keeping modal tasks simple and using full-screen presentation for complex tasks.

40. DATA VISUAL HIERARCHY

Every screen must answer:

What is the most important thing here?

That element gets:

largest emphasis
strongest contrast
most space

Secondary information gets less emphasis.

Do not make:

every heading bold
every card colorful
every number huge
every section elevated

If everything screams, nothing communicates.

41. DESIGN CONSISTENCY RULE

Once a component pattern is established, reuse it.

Example:

If the application establishes:

Status badge

then every status should use that same component.

Do not later create:

Status badge
Status pill
Status chip
Status bubble
Status label

for essentially the same purpose.

42. PAGE TEMPLATE SYSTEM

Create a small number of page templates:

DashboardPage
ListPage
DetailPage
SettingsPage
VerificationPage
EmptyPage
ErrorPage

New modules must use an existing template whenever possible.

This prevents UI quality from degrading as the application grows.

43. DESIGN TOKENS IN CODE

All visual constants should live in the design system.

Example:

--background
--surface
--surface-elevated
--border
--foreground
--muted
--primary
--success
--warning
--error

--radius-sm
--radius-md
--radius-lg

--space-1
--space-2
--space-3
--space-4
...

Components must consume tokens instead of inventing local values.

44. SHADCN / COMPONENT RULE

Use a mature component foundation such as:

shadcn/ui
Radix
Tailwind

where appropriate.

Customize the system through tokens and variants.

Do NOT heavily rewrite every component individually.

A design system should make adding the 20th screen easier than adding the 1st.

Vercel specifically recommends tokens and reusable component blocks as the foundation for consistent AI-assisted UI generation.

45. COMPONENT API RULE

Components should expose semantic props.

Good:

<Button variant="primary" size="md" />

Bad:

<Button
  bg="#121212"
  radius="11px"
  shadow="0 4px 21px..."
  customColor="..."
/>

Keep styling decisions inside the design system.

46. PREVENT UI DRIFT

Whenever a new module is created:

1. Check existing components.
2. Reuse existing patterns.
3. Check design tokens.
4. Do not introduce new visual primitives unless necessary.
5. Compare with existing modules.
6. Test desktop + mobile.

No module gets to invent its own visual language.

47. BEFORE ADDING A NEW COMPONENT

Ask:

Does an existing component already solve this?

If yes:

Reuse it.

If almost:

Add a controlled variant.

Only create a new component when the interaction or semantic purpose is genuinely different.

48. BEFORE ADDING A NEW COLOR

Ask:

Does this color represent an existing semantic state?

If yes:

Use the existing token.

If no:

Do not add it merely for visual variety.
49. BEFORE ADDING A NEW ANIMATION

Ask:

Does the animation communicate state,
hierarchy, or navigation?

If no:

Do not add it.
50. BEFORE ADDING A NEW CARD

Ask:

Does this information actually need grouping?

If no:

Use whitespace and typography instead.
51. ACCESSIBILITY

Design for accessibility from the beginning.

Requirements:

Keyboard navigation
Visible focus states
Readable contrast
Semantic HTML
Labels for controls
Alt text where appropriate
ARIA only when necessary
Reduced motion support

Never communicate meaning through color alone.

52. PERFORMANCE RULE

Visual quality must not depend on expensive effects.

Avoid excessive:

backdrop-filter
blur
large box shadows
continuous animation
particle effects
canvas decorations

The interface should remain fast on mid-range phones.

53. RESPONSIVE TEST RULE

Every significant UI component must be tested at:

360px
390px
768px
1024px
1280px
1440px+

The layout should not visibly break between these widths.

54. CONTENT RULE

Use realistic content while designing.

Do not design every screen with:

Lorem ipsum
Short fake names
Single-digit statistics

Test with:

Long names
Long course names
Large attendance numbers
Many students
Empty states
Error states
Very long text

This prevents later modules from breaking the layout.

55. STATE-COMPLETE DESIGN

Every important component must define:

Default
Hover
Focus
Active
Disabled
Loading
Success
Error
Empty
Overflow
Mobile
Dark
Light

Do not design only the "happy path."

Vercel's current guidance explicitly emphasizes designing empty, sparse, dense, and error states rather than treating them as afterthoughts.

56. VISUAL QA RULE

After implementing a module, compare it against the established design system.

Check:

Typography
Spacing
Colors
Radius
Borders
Buttons
Icons
Tables
Loading states
Error states
Mobile behavior

If the new module looks like it belongs to another application, refactor it before continuing.

57. ANTI-GAISH RULE

Never add an effect because:

"it looks cool"

Every visual element must have a reason.

Avoid:

unnecessary gradients
glow
excessive blur
random decorative shapes
giant empty hero sections
floating blobs
excessive glassmorphism
too many shadows
oversized typography
animated backgrounds

The product should feel expensive because of:

precision
spacing
hierarchy
consistency
clarity

not because of visual noise.

58. IMPLEMENTABILITY RULE

Every design must be practical to implement with:

React
Next.js
Tailwind
shadcn/ui
CSS
SVG

Prefer:

CSS
SVG
existing components
tokens
simple transitions

over:

custom WebGL
complex canvas effects
large animation libraries
custom rendering engines

unless a feature genuinely requires them.

59. AI GENERATION RULE

When generating a new page/module:

DO NOT invent a new design.

Instead:

Understand existing tokens
        ↓
Find nearest existing page pattern
        ↓
Reuse components
        ↓
Compose new information
        ↓
Add only necessary variants

AI-generated screens must inherit the existing design system.

60. FINAL DESIGN PRINCIPLE

The application should pass this test:

Open any screen at random.

Can the user immediately tell:

1. Where am I?
2. What am I looking at?
3. What is important?
4. What can I do?
5. What happened?
6. What should I do next?

If the answer is yes:

Keep it.

If the answer requires visual explanation:

Simplify it.

The goal is not to make every screen impressive.

The goal is to make the entire product feel like it was designed by one exceptionally disciplined design system.