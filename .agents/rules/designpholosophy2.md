---
trigger: always_on
---

30. DESIGN GRAMMAR

Define a consistent language for:

Page headers
Section headers
Primary actions
Secondary actions
Filters
Status
Tables
Lists
Metadata
Progress
Verification
Errors
Success
Empty states

Once defined, reuse it everywhere.

Do not solve each page independently.

31. VISUAL RHYTHM ACROSS MODULES

When moving from:

Dashboard
→ Sessions
→ Students
→ Reports
→ Settings

the user should feel:

"I am still inside the same environment."

Not:

"Why did the design change?"

Keep:

header proportions
content width
spacing rhythm
button language
type scale
status treatment
navigation pattern

consistent.

32. EDITORIAL COMPOSITION

Not every page needs the same grid.

Use subtle variation in composition while preserving the design system.

For example:

Dashboard:

Overview → metrics → live table

Verification:

Centered task-focused composition

Settings:

Dense two-column form layout

Reports:

Wide analytical composition

The system stays consistent while each page gets the composition appropriate to its task.

33. REDUCE VISUAL ENTROPY

Whenever adding a component, ask:

Does this make the screen clearer?
or
Does this make the screen busier?

If two elements communicate the same thing:

remove one.

If three controls can become one contextual action:

combine them.

If a decorative element adds no meaning:

remove it.
34. DESIGN WITH RESTRAINT

Avoid the instinct to "finish" every blank space.

Empty space is allowed.

Quiet space is useful.

Do not fill empty space with:

illustrations
gradients
floating icons
decorative shapes
random statistics

Whitespace should create hierarchy.

35. NO GENERIC DASHBOARD FORMULA

Do NOT automatically produce:

Sidebar
+
4 statistic cards
+
large chart
+
recent activity
+
three cards

for every page.

Start from the user's task.

Only include elements that help accomplish it.

36. HUMAN, NOT ROBOTIC

Although the system is technical, the interface should not feel clinical.

Use microcopy that is:

clear
short
neutral
human

Avoid:

Verification protocol initiated.
Biometric subsystem executing.
Proximity handshake successful.

Prefer:

Checking classroom presence...
Identity verified.
Attendance marked.
37. DESIGN FOR CONFIDENCE

At every important moment, the user should know the system's state.

Especially during attendance verification:

Waiting
Checking
Verified
Failed
Retrying
Completed

Never leave the user staring at a spinner with no explanation.

38. VISUAL QUALITY TEST

After designing a screen, inspect it at:

100% zoom
50% zoom
mobile width
desktop width

At a glance, you should still understand the hierarchy.

If everything becomes the same visual weight:

Fix hierarchy.

If the page looks busy when zoomed out:

Reduce noise.
39. IMPLEMENTABILITY

Every design decision must remain realistic to implement with:

Next.js
React
TypeScript
Tailwind
shadcn/ui
CSS
SVG

Prefer:

tokens
CSS
layout
typography
components
simple transitions

over complex visual tricks.

Do not introduce WebGL, canvas effects, complex animation systems, or large dependencies simply to make a screen look impressive.

40. FINAL DESIGN TEST

Before accepting a design, ask:

Does it have a clear focal point?

Does it feel calm?

Does it feel distinctive?

Does it feel trustworthy?

Can the user understand it quickly?

Can it scale to additional modules?

Can it be implemented cleanly?

Will the same visual language still work one year from now?

Does it look intentionally designed rather than AI-generated?

If the answer to any of these is no:

Simplify.
Rebalance.
Refine.
FINAL PHILOSOPHY

Do not chase "beautiful UI."

Build:

A coherent visual environment where hierarchy, interaction, typography, space, motion, and product behavior all tell the same story.

The best interface is not the one with the most design.

It is the one where nothing feels accidental