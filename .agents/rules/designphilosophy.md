---
trigger: always_on
---

# UI / UX DESIGN PHILOSOPHY

The current interface is functional, but I want to evolve it into a product that has a **distinct visual personality, strong hierarchy, emotional clarity, and long-term design consistency**.

Do not simply make the UI "cleaner".

Do not merely add gradients, glassmorphism, animations, shadows, or futuristic decoration.

The goal is to create an interface that **feels designed**, not assembled.

---

# 1. CORE FEEL

The product should feel:

```text
Precise
Calm
Intelligent
Confident
Modern
Technical
Human
Fast
Trustworthy
```

The desired feeling is:

> "This product knows exactly what it is doing."

It should feel closer to a carefully designed operating environment than a generic SaaS dashboard.

Take inspiration from the design discipline of products such as:

* Linear
* Vercel
* Raycast
* Apple
* Stripe
* Notion

Do NOT imitate their visual identity.

Study the principles behind them:

* hierarchy
* restraint
* consistency
* spatial rhythm
* predictable interaction
* information density
* progressive disclosure
* strong typography
* clear states
* quiet secondary UI
* deliberate motion

Linear's recent design work is particularly relevant: they describe their goal as making the interface calmer, more consistent, easier to scan, and less visually competitive with the main task.

---

# 2. DESIGN FOR FEELING, NOT COMPONENTS

Do not start with:

```text
"What cards should we use?"
"What gradient should we use?"
"What animation should we use?"
```

Start with:

```text
"What should the user feel here?"
"What deserves attention?"
"What should disappear?"
"What is the primary action?"
"What is the emotional state of this screen?"
```

Every screen should have a deliberate visual hierarchy.

---

# 3. ONE VISUAL HERO

Every screen must have one dominant focal point.

Examples:

### Student attendance screen

The focal point is:

```text
MARK ATTENDANCE
```

Then:

```text
verification status
session information
supporting information
```

### Teacher dashboard

The focal point is:

```text
CURRENT SESSION / ATTENDANCE STATE
```

Then:

```text
student list
verification state
secondary analytics
```

Do NOT give equal visual weight to everything.

If everything is prominent, nothing is prominent.

---

# 4. VISUAL ATTENTION BUDGET

Treat attention as a limited resource.

Only a few elements should demand attention at once.

Use hierarchy:

```text
PRIMARY
↓
SECONDARY
↓
SUPPORTING
↓
BACKGROUND
```

Navigation, metadata, timestamps, labels, and secondary controls should visually recede.

The user should naturally look at the correct thing without being told where to look.

---

# 5. QUIET UI, STRONG CONTENT

Do not make the interface visually impressive by itself.

The interface should create a quiet stage for the information.

Use:

```text
Typography
Spacing
Alignment
Contrast
Scale
Grouping
```

before using:

```text
Gradient
Glow
Blur
Shadow
Animation
Decoration
```

Visual effects are seasoning, not the meal.

---

# 6. NO "AI-GENERATED UI" LOOK

Avoid the visual patterns that make interfaces feel machine-generated:

```text
Huge gradient hero
+
Rounded cards everywhere
+
Purple/blue gradient buttons
+
Glassmorphism
+
Random floating blobs
+
Excessive icons
+
Every section inside a card
+
Huge numbers
+
Too much whitespace
+
Generic dashboard layout
```

Do not create a design that looks like a template assembled from a UI library.

Use the component library as the **infrastructure**, not the visual identity.

---

# 7. INFORMATION DENSITY WITH BREATHING ROOM

Do not choose between:

```text
Dense
```

and:

```text
Minimal
```

Aim for:

> **Calm density.**

The user should be able to scan a lot of useful information without feeling crowded.

Use strong grouping and alignment to achieve density.

Do not solve density by making text tiny.

Do not solve minimalism by creating enormous empty spaces.

---

# 8. SPATIAL RHYTHM

Spacing should create rhythm.

Use recurring spatial relationships:

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

But do not mechanically apply the scale.

Use space to communicate hierarchy.

For example:

```text
Title
      ↓ small gap
Context
      ↓ medium gap
Primary action
      ↓ large gap
Supporting information
```

Spacing should tell the user what belongs together.

---

# 9. ALIGNMENT IS INVISIBLE DESIGN

Be extremely strict about alignment.

Text, buttons, tables, tabs, icons, numbers, and controls should feel like they belong to the same invisible grid.

Misalignment is often more damaging than color choice.

Before adding decoration, fix:

```text
alignment
spacing
baseline
grouping
width
```

---

# 10. VISUAL GROUPING WITHOUT BOXES

Do not put every group inside a card.

Use multiple grouping techniques:

```text
Spacing
Typography
Alignment
Subtle borders
Background changes
Dividers
Indentation
```

A section does not need a rounded rectangle around it to be a section.

Cards should be used when elevation or containment actually helps.

---

# 11. SURFACE ECONOMY

Every surface should justify its existence.

Use fewer:

```text
cards
containers
panels
outlines
```

Prefer:

```text
one strong surface
+
internal hierarchy
```

rather than:

```text
card
  inside card
    inside card
      inside card
```

Avoid the "everything is a rounded rectangle" aesthetic.

---

# 12. CONTRAST HIERARCHY

Do not use maximum contrast everywhere.

Use a hierarchy such as:

```text
Primary content → strongest
Secondary content → moderate
Metadata → subtle
Navigation → quiet
Background → quietest
```

This is especially important for dark mode.

Do not make every piece of text bright white.

Do not make every border visible.

Dark interfaces should have layers, not just black and white.

---

# 13. COLOR HAS MEANING

Use color deliberately.

Brand/accent color:

```text
focus
selection
primary action
identity
```

Status colors:

```text
success
warning
error
information
```

Do not use color simply to make empty areas "more interesting".

A color should communicate something.

---

# 14. BRAND CHARACTER

The product should have a recognizable visual fingerprint.

This does NOT mean adding unusual decoration.

Instead define a few subtle signatures:

```text
Typography personality
Specific spacing rhythm
Distinctive status indicators
One recognizable accent
Unique empty states
Unique verification feedback
Consistent icon treatment
```

The interface should be identifiable even without seeing the logo.

---

# 15. TYPOGRAPHY AS THE PRIMARY VISUAL TOOL

Typography should carry much of the visual identity.

Use:

```text
Weight
Size
Tracking
Line-height
Numerals
Hierarchy
```

rather than decorative elements.

Numbers are especially important for this product.

Attendance percentages, present counts, session times, and verification states should feel precise and legible.

Use tabular numerals where appropriate.

---

# 16. NUMBERS SHOULD FEEL ALIVE

For dashboards, numbers are not decoration.

For example:

```text
42 / 52
Present
```

should communicate a live state immediately.

Use subtle transitions when values change.

Do not make every statistic huge.

Use size to establish importance, not spectacle.

---

# 17. MOTION PHILOSOPHY

Motion should communicate:

```text
cause
effect
progress
change
confirmation
```

Never animate just because something can move.

Use:

```text
120–200ms
```

for small interface transitions where appropriate.

Use longer transitions only when the user's mental model benefits from them.

Motion should feel:

```text
quiet
physical
intentional
```

not:

```text
playful
bouncy
flashy
```

---

# 18. STATE TRANSITIONS ARE PART OF THE DESIGN

Design the transition between states, not just the states themselves.

Example:

```text
Idle
↓
Checking proximity
↓
Proximity verified
↓
Face verification
↓
Liveness
↓
Success
```

The interface should feel like one continuous experience.

Avoid abrupt jumps between unrelated screens.

---

# 19. VERIFICATION SHOULD FEEL TRUSTWORTHY

This is a security product.

The verification interface should create confidence.

Avoid:

```text
Cybersecurity clichés
Scanning lines
HUD graphics
Neon circles
"AI FACE SCANNER" language
```

Instead use:

```text
clear status
quiet progress
precise feedback
simple instructions
obvious completion
```

Example:

```text
Checking classroom presence

✓ Classroom detected

Now verify your identity

Look at the camera

✓ Identity confirmed

Attendance recorded
```

The system should feel competent, not theatrical.

---

# 20. ERROR STATES SHOULD FEEL LIKE GUIDANCE

Never make the interface say:

```text
ERROR
```

and stop.

Instead:

```text
What happened?
Why?
What should I do?
```

Example:

```text
We couldn't verify your face.

Move into better lighting
and make sure only you are visible.

[ Try again ]
```

Errors should feel like the product is helping the user recover.

---

# 21. SUCCESS SHOULD BE RESTRAINED

Do not celebrate every successful operation with huge animation.

Attendance success should feel:

```text
certain
finished
quiet
```

Example:

```text
✓
Attendance marked

Data Structures
9:42 AM
```

A strong confirmation does not need fireworks.

---

# 22. PROGRESSIVE DISCLOSURE

Do not show technical complexity until the user needs it.

Student:

```text
"Checking classroom presence..."
```

not:

```text
AcousticProvider
HMAC validation
Nonce validation
Signal confidence: 0.93
```

Teacher:

```text
34 students verified
```

rather than exposing unnecessary backend mechanics.

Technical details may be available in an advanced diagnostic view.

---

# 23. INFORMATION ARCHITECTURE BEFORE VISUAL DESIGN

Before designing a page:

```text
Define the user's goal
↓
Define the information needed
↓
Define the primary action
↓
Define supporting actions
↓
Define states
↓
Then design the visual hierarchy
```

Never begin with decoration.

---

# 24. CONTEXTUAL UI

Controls should appear where they make sense.

For example:

```text
Session active
→ End session

Session inactive
→ Start session
```

Do not display every possible action simultaneously.

Reduce visual noise by making actions contextual.

---

# 25. STICKY ELEMENTS SHOULD EARN THEIR PLACE

Use sticky elements only when they help the task.

Examples:

```text
Teacher:
Session status / controls

Student:
Primary verification action
```

Do not make every toolbar sticky.

---

# 26. MOBILE PHILOSOPHY

The student experience is mobile-first.

Design for:

```text
one hand
large touch targets
minimal typing
short attention window
camera use
microphone use
unstable network
bright/dark environments
```

The main action should almost always be reachable immediately.

Avoid forcing students through a complex navigation structure to mark attendance.

---

# 27. DESKTOP PHILOSOPHY

The teacher dashboard can be information-dense.

Use desktop space for:

```text
live attendance
student status
verification events
filters
session controls
analytics
```

But maintain the same design language as the student interface.

Same product.

Different density.

---

# 28. RESPONSIVE COMPOSITION

Do not merely shrink desktop UI.

At smaller widths:

```text
remove secondary information
collapse navigation
stack sections
prioritize primary action
simplify tables
```

At larger widths:

```text
increase information density
show supporting context
use additional columns
show secondary navigation
```

Responsive behavior should feel intentional.

---

# 29. DESIGN FOR GROWTH

Assume this product will eventually contain:

```text
Attendance
Classes
Students
Subjects
Sessions
Reports
Analytics
Devices
Verification
Settings
```

The visual system must handle that growth.

Do not make the first dashboard beautiful by using a layout that will collapse once five more modules are added.

Create a visual grammar that scales.

---

