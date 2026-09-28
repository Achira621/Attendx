<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ATTENDEX AGENT WORKFLOW & INSTRUCTIONS

## 1. Branching & Git Protocol
This repository enforces a strict branch promotion rule:
- **`testing` branch**: Active development and testing branch.
  - When a user or collaborator says **`push`**, you MUST commit your changes and push to the **`testing`** branch.
  - Never push unapproved work directly to `main`.
- **`main` branch**: Production branch.
  - When the user or lead explicitly says **`push approved`**, you MUST merge the verified changes from `testing` into `main` and push to `main`.

## 2. Core Architecture Rules
- Dual presence condition: `VALID SESSION` + `VALID STUDENT` + `PROXIMITY VERIFIED` + `FACE VERIFIED` + `LIVENESS VERIFIED` + `NOT ALREADY RECORDED` = `ATTENDANCE_ACCEPTED`.
- The backend `AttendanceEngine` is authoritative. Never trust client-side claims (`proximity=true`).
- Idempotency is required: Database constraint `UNIQUE(session_id, student_id)`.
- Use the Transactional Outbox pattern (`OutboxEvent`) committed within the same database transaction as the attendance record.
- Biometric Privacy: Never store raw attendance camera video or pixels. Only store quantized vector hashes or one-way biometric assertions.

## 3. Design System & UI Consistency
- Color tokens, borders, and dark-mode layers are defined in `src/app/globals.css`.
- Reuse atomic components in `src/components/ui/` (`Button`, `Card`, `Badge`, `StatusIndicator`).
- Status indicators must always provide **redundant cues** (Symbol + Text + Color), never color alone.
- Design for mobile-first for students (one-handed, large touch targets, single-task verification flow).
- Keep teacher consoles information-dense with tabular numerals for counts and timers.
- Always verify changes compile with `npm run lint` and `npm run build` before pushing.
