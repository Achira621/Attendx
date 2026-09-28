# Attendex — Scalable, Fault-Tolerant College Attendance Platform

> **Core Product Thesis:** A student can mark attendance only when the platform can independently verify **BOTH**:
> 1. **Physical Classroom Proximity:** The student is physically present inside the designated classroom venue.
> 2. **Enrolled Identity Verification:** The person marking attendance is the enrolled student (one-time on-device biometric match + liveness).
>
> **Privacy Guarantee:** The student uses their own device and camera. The teacher does **not** scan students. The camera is evaluated locally in browser memory for a one-time check—**no continuous streaming and no raw facial video is ever sent to the cloud or teacher**.

---

## 📌 Branching & Push Workflow Protocol

To maintain production stability across human contributors and AI agents, this repository enforces a strict two-stage push workflow:

```text
       Feature / Fix Work
               │
               ▼
   Trigger: "push"
               │
               ▼
       [ testing ] branch  <── Staging, integration testing, multi-device verification
               │
               ▼
   Review & Approval
               │
               ▼
   Trigger: "push approved"
               │
               ▼
       [  main   ] branch  <── Production-ready, verified authoritative code
```

### Protocol Rules:
1. **When any contributor or AI agent is asked to `push`:**
   - Commit the verified changes with a structured message.
   - Push to the **`testing`** branch:
     ```bash
     git checkout testing
     git add .
     git commit -m "feat/fix: description"
     git push origin testing
     ```
2. **When the project lead or user explicitly says `push approved`:**
   - Merge the approved changes from `testing` into `main`.
   - Push directly to **`main`**:
     ```bash
     git checkout main
     git merge testing
     git push origin main
     ```

---

## 🏗️ Architecture & Core Principles

Attendex is designed as an **Edge-First + Cloud-Backed + Event-Driven + Modular Verification** platform.

```text
               ┌────────────────────────────────────────────────────────┐
               │                     CLOUD BACKEND                      │
               │  ┌────────────────┐ ┌───────────────┐ ┌─────────────┐  │
               │  │  Next.js / API │ │ Auth / RBAC   │ │  Session    │  │
               │  └───────┬────────┘ └───────┬───────┘ └──────┬──────┘  │
               │          │                  │                │         │
               │  ┌───────▼──────────────────▼────────────────▼──────┐  │
               │  │             Attendance Engine & Outbox           │  │
               │  └───────┬───────────────────────────────────┬──────┘  │
               │          │                                   │         │
               │  ┌───────▼───────┐                   ┌───────▼──────┐  │
               │  │ PostgreSQL HA │                   │ Redis Streams│  │
               │  └───────────────┘                   └───────┬──────┘  │
               └──────────────────────────────────────────────┼─────────┘
                                                              │ WebSocket
                                                     ┌────────▼─────────┐
                                                     │ Realtime Gateway │
                                                     └────────┬─────────┘
                                                              │
         ┌────────────────────────────────────────────────────┼────────────────────────────────────────────────────┐
         │                                                    │                                                    │
┌────────▼──────────────────────────────────────┐             │             ┌──────────────────────────────────────▼───────┐
│           CLASSROOM EDGE / TEACHER            │             │             │                 STUDENT PWA                  │
│                                               │             │             │                                              │
│ - Teacher Device (Laptop / Tablet)            │   Acoustic  │             │ - Responsive PWA (Mobile/Desktop)            │
│ - Rotating Acoustic Beacon Generator          ├─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ─ ─► - Acoustic FFT / Peak Frequency Decoder      │
│ - Realtime Dashboard via WebSocket            │  Ultrasonic │             │ - On-Device Face Mesh & Bounding Box Check   │
│ - Local Event Buffer & Beacon Relay           │  or 15 kHz  │             │ - Passive Micro-Motion Liveness Assessor     │
│ - Ephemeral Session Key Seeds                 │             │             │ - Offline Encrypted IndexedDB Sync Queue     │
└───────────────────────────────────────────────┘             │             └──────────────────────────────────────────────┘
                                                              │
                                            ┌─────────────────▼─────────────────┐
                                            │      FALLBACK PROXIMITY TIERS     │
                                            │ Local LAN • BLE • GPS Geofence    │
                                            └───────────────────────────────────┘
```

### 1. Verification Orchestrator & State Machine
Every verification attempt moves through an immutable, observable state sequence:
$$\text{INITIATED} \longrightarrow \text{SESSION\_VALIDATING} \longrightarrow \text{PROXIMITY\_VERIFYING} \longrightarrow \text{FACE\_VERIFYING} \longrightarrow \text{LIVENESS\_VERIFYING} \longrightarrow \text{FINAL\_VALIDATION} \longrightarrow \text{ATTENDANCE\_ACCEPTED}$$

Every attempt resolves to exactly one final outcome:
- **`ACCEPTED`**: All security, proximity, identity, and freshness conditions passed.
- **`RETRY_REQUIRED`**: Insufficient input (e.g. face misaligned, dim lighting, acoustic timeout). Student can safely retry.
- **`REJECTED`**: Definite condition failure (e.g. face mismatch, session closed).
- **`BLOCKED`**: Security violation detected (e.g. replayed challenge, static presentation attack).
- **`SYSTEM_ERROR`**: Technical/infrastructure error (e.g. database disconnect). **Never blamed on the student.**

### 2. Proximity Hierarchy & Assurance Levels
- **`TIER_A` (Acoustic Proximity):** Teacher device emits a short-lived challenge pulse via Web Audio API. Student microphone captures ambient audio, runs a 2048-point FFT, and computes the Signal-to-Noise Ratio (SNR) around 18.75 kHz (near-ultrasound) or 15.00 kHz (audible fallback).
- **`TIER_B` (Local Network):** Authenticated classroom Wi-Fi BSSID / local gateway validation.
- **`TIER_C` (GPS Geofence):** Classroom coordinate boundary check (used as secondary supporting evidence).

### 3. Fail-Closed Security & Graceful Degradation
- **Fail closed for security:** Proximity or camera failure never automatically grants attendance.
- **Degrade gracefully for availability:** If acoustic speaker hardware fails, the orchestrator falls back to configured Tier B or Tier C policies without crashing the pipeline.
- **Idempotency & Database Integrity:** PostgreSQL enforces `UNIQUE(session_id, student_id)`. Duplicate submissions return the existing verified receipt.
- **Transactional Outbox Pattern:** Attendance records and `OutboxEvent` entries are committed atomically in the same database transaction.
- **Offline PWA Queue:** When offline, signed payloads are buffered in browser IndexedDB (`OfflineSyncQueue`) and submitted automatically via Background Sync once the network recovers.

---

## 📂 Project Structure

```text
attendex/
├── .agents/                        # Core system architectural rules
│   ├── rules/
│   │   ├── architecture.md         # Fault-tolerant & scalable topology
│   │   ├── databasse.md            # PostgreSQL, Prisma, Outbox & Transactions
│   │   ├── states.md               # Explicit verification failure states
│   │   ├── outcomemaping.md        # Authoritative failure-to-outcome mapping
│   │   ├── ui1.md & ui2.md         # Design system, UX restraint, and tokens
│   │   └── rules.md                # Anti-proxy and verification constraints
│
├── prisma/
│   └── schema.prisma               # Relational data model, indexes, and outbox
│
├── src/
│   ├── app/
│   │   ├── api/v1/attendance/submit/ # Authoritative backend attendance endpoint
│   │   ├── globals.css             # Theme tokens, dark mode layers, tabular numerals
│   │   ├── layout.tsx              # Root HTML shell with Geist typography
│   │   └── page.tsx                # Master interface switching between consoles
│   │
│   ├── components/
│   │   ├── ui/                     # Atomic primitives (Button, Card, Badge, StatusIndicator)
│   │   ├── dashboard/              # TeacherLiveSessionConsole (realtime radar, stats, roster)
│   │   └── verification/           # StudentAttendanceFlow, AcousticDiagnosticLab, FaceDiagnosticLab
│   │
│   ├── lib/
│   │   ├── db/prisma.ts            # Prisma client singleton with connection pooling
│   │   ├── offline/syncQueue.ts    # IndexedDB offline attendance queue & background flush
│   │   ├── utils.ts                # Tailwind class mergers and formatters
│   │   └── verification/
│   │       ├── acoustic/           # AcousticEmitter & AcousticReceiver (Web Audio + FFT)
│   │       ├── face/               # BrowserFaceVerificationEngine (bounding, light, liveness)
│   │       ├── failureRegistry.ts  # Authoritative failure code mapping & user-safe copy
│   │       └── orchestrator.ts     # VerificationOrchestrator pipeline controller
│   │
│   ├── repositories/
│   │   ├── AttendanceRepository.ts # Transactional writes, outbox insertion, idempotency
│   │   └── SessionRepository.ts    # Session lifecycle & state machine enforcement
│   │
│   ├── services/
│   │   └── AttendanceEngine.ts     # Server-side validation engine
│   │
│   └── types/
│       └── verification.ts         # Domain types, proofs, payloads, and failure interfaces
│
├── package.json
└── tsconfig.json
```

---

## 🤖 Context for AI Coding Agents & Collaborators

If you are an AI assistant or human developer working on this codebase, adhere strictly to these rules:

1. **Do not break the design system:**
   - Colors, spacing, radii, and fonts are tokenized in `src/app/globals.css`.
   - Use the established atomic primitives (`Button`, `Card`, `Badge`, `StatusIndicator`).
   - Do NOT introduce arbitrary colors, glowing borders, or heavy decorative gradients.
   - Status indicators must always provide **redundant cues** (Symbol + Text + Color), never color alone.
2. **Never trust the frontend for security:**
   - The backend `AttendanceEngine` is the sole authority on attendance validity.
   - Every verification requires valid session + valid enrolled student + proximity proof + face proof + liveness proof.
   - Maintain the `UNIQUE(session_id, student_id)` constraint on attendance records.
3. **Hardware Fallback Tolerance:**
   - Mobile and laptop hardware varies widely.
   - Keep acoustic frequency bands configurable (18.75 kHz near-ultrasound vs 15.00 kHz audible fallback).
   - Never assume universal camera or microphone support without graceful error states.
4. **Verification Testing:**
   - Always run `npm run lint` and `npm run build` before considering any task complete.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.18+ or v20+ (tested on v24)
- **npm:** v9+

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone <REPO_URL>
   cd attendex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/attendex?schema=public"
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Validate Production Bundle:**
   ```bash
   npm run build
   ```

---

## 📄 License
Internal Institutional Project — All rights reserved.
