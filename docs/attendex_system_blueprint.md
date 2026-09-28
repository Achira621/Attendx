# Attendex — Systems Architecture & Design System Specification

**Version:** 1.0.0-PROPOSAL  
**Author:** Lead Product Engineer, UI/UX Designer & Systems Architect  
**Core Thesis:** Dual-factor presence verification (Physical Classroom Proximity + Live Face Biometrics) executed on student personal devices with zero continuous streaming and zero single points of failure.

---

## Table of Contents
1. [A. Product Architecture](#a-product-architecture)
2. [B. Information Architecture](#b-information-architecture)
3. [C. Screen Inventory](#c-screen-inventory)
4. [D. Design System Foundation](#d-design-system-foundation)
5. [E. Component Hierarchy](#e-component-hierarchy)
6. [F. Verification Architecture](#f-verification-architecture)
7. [G. Fault-Tolerance Strategy](#g-fault-tolerance-strategy)
8. [H. Scalability Strategy](#h-scalability-strategy)
9. [I. Recommended Project Structure](#i-recommended-project-structure)
10. [J. Implementation Order](#j-implementation-order)
11. [K. Highest-Risk Technical Assumptions](#k-highest-risk-technical-assumptions)
12. [L. Prototype Verification Plan](#l-prototype-verification-plan)

---

## A. Product Architecture

### 1. High-Level Topology
Attendex follows an **Edge-First + Cloud-Backed + Event-Driven + Modular Verification** architecture.

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
│ - Teacher Device (Laptop / Tablet)            │             │             │ - Responsive PWA (Mobile/Desktop)            │
│ - Ephemeral Session Key Pair (Ed25519)        │             │             │ - Local Device Keystore (Web Crypto)         │
│ - Rotating Acoustic Beacon Generator          │   Acoustic  │             │ - Acoustic FFT / Signal Capture Decoder      │
│ - Realtime Dashboard via WebSocket            ├─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ─ ─► - Local Face Detection / Verification Engine   │
│ - Local Event Buffer & Beacon Relay           │  Ultrasonic │             │ - Passive/Active Liveness Provider           │
│                                               │  or Audible │             │ - Offline Encrypted Sync Queue               │
└───────────────────────────────────────────────┘             │             └──────────────────────────────────────────────┘
                                                              │
                                            ┌─────────────────▼─────────────────┐
                                            │      FALLBACK PROXIMITY TIERS     │
                                            │ Local LAN • BLE • GPS Geofence    │
                                            └───────────────────────────────────┘
```

### 2. Teacher Experience & Session Lifecycle
1. **Authentication & Session Initiation:**
   - Teacher signs in (SSO / institutional credentials).
   - Selects Course, Group, and Classroom venue.
   - Triggers `Start Attendance Session`.
2. **Session Key & Beacon Generation:**
   - Server allocates `sessionId` and generates an ephemeral cryptographic seed or teacher client creates an Ed25519 ephemeral keypair.
   - The teacher's device begins emitting an acoustic proximity challenge: a short-lived token (15–30s rotation) encoded in near-ultrasound (18.5 kHz–20 kHz) or audible chirps.
3. **Live Monitoring:**
   - Real-time WebSocket connection receives student verification events (`PRESENT`, `PROCESSING`, `FAILED`).
   - Teacher monitors live attendance velocity, tally counters, and student list with filter tabs.
4. **Session Termination & Grace Period:**
   - Teacher stops session or auto-timer expires. A configurable 60-second grace period accommodates in-flight submissions and network reconnects.
   - Session transitions: `CREATED` $\to$ `ACTIVE` $\to$ `GRACE_PERIOD` $\to$ `CLOSED` $\to$ `ARCHIVED`.

### 3. Student Experience & Verification Lifecycle
1. **Session Discovery:**
   - Student opens Attendex PWA.
   - Service worker detects network status. The active course session is auto-discovered via proximity signal or listed on dashboard.
2. **One-Time Verification Attempt:**
   - Student taps `Mark Attendance`.
   - **Stage 1 (Proximity):** Student microphone samples audio for 3–5 seconds, detects classroom beacon, decodes signed challenge token.
   - **Stage 2 (Face Alignment):** Student camera activates locally. Oval guide checks: single face, bounds, lighting, pose.
   - **Stage 3 (Biometric Match & Liveness):** Face mesh/embedding is computed on-device and compared against student's enrolled template. Liveness check confirms genuine presence.
   - **Stage 4 (Proof Assembly):** Device signs an attendance payload: `{ sessionId, studentId, deviceId, proximityProof, faceProof, livenessProof, nonce, timestamp }`.
3. **Submission & Authoritative Acceptance:**
   - Payload posted to backend API.
   - Backend `AttendanceEngine` runs deterministic validations.
   - Immediate response: `ACCEPTED`, `RETRY_REQUIRED`, `REJECTED`, or `BLOCKED`.
   - Camera & microphone immediately release resources.

### 4. Backend Lifecycle & Event Bus
- **Transactional Ingestion:** Database writes use PostgreSQL serializable/repeatable read transactions with strict `UNIQUE(session_id, student_id)`.
- **Transactional Outbox:** Each state change writes an event to the `outbox_events` table within the same DB transaction.
- **Message Dispatch:** Background worker drains outbox to Redis Streams.
- **Stateless WebSockets:** WebSocket gateways subscribe to Redis Stream groups and route updates to connected teacher and student clients.

---

## B. Information Architecture

```text
ATTENDEX INFORMATION ARCHITECTURE
│
├── PUBLIC / AUTHENTICATION
│   ├── /login                     (Email / Institutional SSO)
│   ├── /register-device           (WebAuthn / Device Fingerprint Binding)
│   └── /offline                   (PWA Service Worker Offline Fallback)
│
├── TEACHER CONSOLE (/teacher)
│   ├── Overview                   (Active classes, quick metrics, upcoming schedule)
│   ├── Sessions
│   │   ├── /sessions/new          (Class, classroom, duration, proximity config)
│   │   ├── /sessions/[id]/live    (Live radar, student feed, tally metrics, beacon audio player)
│   │   └── /sessions/[id]/summary (Report export, manual overrides, audit logs)
│   ├── Classes & Roster           (Enrolled students, biometric enrollment status, device health)
│   ├── Analytics & History        (Trends, attendance rate by subject, chronic absenteeism)
│   └── Settings                   (Proximity tiers, grace duration, export formats)
│
└── STUDENT APP (/student)
    ├── Home                       (Active session banner, schedule, overall attendance rate)
    ├── Attendance Flow
    │   ├── /attend/[sessionId]    (Focused step modal/screen: Proximity → Face → Confirmation)
    │   └── /attend/sync           (Offline queue visualizer & manual sync trigger)
    ├── History & Records          (Past logs, verified timestamps, dispute status)
    ├── Biometric Enrollment       (Initial 3D face mesh capture & device registration)
    └── Device & Profile           (Registered hardware info, security keys, permissions check)
```

---

## C. Screen Inventory

| Screen ID | Target Role | Primary Viewport | Key Components | Empty / Error / Edge States |
|---|---|---|---|---|
| `SCR-T-01` Overview | Teacher | Desktop / Tablet | Metric cards, active session ribbon, timetable | Empty schedule state, offline banner |
| `SCR-T-02` Session Launcher | Teacher | Desktop / Tablet | Class picker, proximity policy selector, start CTA | Permission denied (mic/audio), no enrolled students |
| `SCR-T-03` Live Session Console | Teacher | Desktop / Tablet | Audio beacon controller, live tally, student status table, search/filters | Audio hardware error, WebSocket reconnecting, zero attendance at start |
| `SCR-T-04` Session Summary | Teacher | Desktop / Tablet | Final count, anomaly flags, CSV/PDF export, manual override dialog | Session archived, network timeout on export |
| `SCR-T-05` Student Roster | Teacher | Desktop / Tablet | Data table, enrollment badges, search, filter | No students found, student unlinked |
| `SCR-S-01` Student Home | Student | Mobile First | Active class card, attendance dial, recent logs | No active session, offline mode, enrollment required |
| `SCR-S-02` Proximity Scanning | Student | Mobile First | Acoustic wave listener visualizer, tier indicator, status pill | Mic permission denied, acoustic signal timeout, fallback tier prompt |
| `SCR-S-03` Face & Liveness Scan | Student | Mobile First | Camera feed with SVG oval guide, guidance banner, micro-stepper | Camera blocked, multi-face warning, poor lighting, liveness timeout |
| `SCR-S-04` Verification Result | Student | Mobile First | Restrained success badge, timestamp, session metadata, home CTA | Failure card with precise user-safe guidance & retry CTA |
| `SCR-S-05` Biometric Enrollment | Student | Mobile First | 3-angle face capture wizard, quality threshold meter, device key generation | Enrollment rejected (low quality), device already bound |
| `SCR-S-06` Offline Sync Queue | Student | Mobile First | List of pending signed tokens, connectivity status, retry sync CTA | Queue empty, sync conflict resolution |

---

## D. Design System Foundation

### 1. Visual Philosophy
- **Modern, Calm, Trustworthy, Restrained:** Inspired by the precision and craftsmanship of Linear, Vercel, and Apple System UI.
- **Zero Gaudy Elements:** No saturated rainbow gradients, no full-screen glowing backdrops, no playful confetti animations. Attendance is institutional compliance and identity verification.
- **Functional Depth:** Surfaces, subtle hairline borders (`1px`), and structured spacing convey hierarchy rather than heavy drop shadows.

### 2. Design Tokens (CSS Variables)

#### Color Tokens
```css
:root {
  /* Surfaces - Dark Default */
  --bg-canvas: #09090b;
  --bg-surface: #121215;
  --bg-surface-elevated: #18181c;
  --bg-surface-hover: #222227;
  
  /* Borders & Dividers */
  --border-subtle: #27272a;
  --border-strong: #3f3f46;
  --border-accent: #52525b;

  /* Typography */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-inverse: #09090b;

  /* Semantic Brand & Accents */
  --accent-primary: #3b82f6;       /* Restrained Technical Blue */
  --accent-primary-hover: #2563eb;
  --accent-subtle: rgba(59, 130, 246, 0.1);

  /* Status Tokens */
  --status-success: #10b981;
  --status-success-bg: rgba(16, 185, 129, 0.1);
  --status-warning: #f59e0b;
  --status-warning-bg: rgba(245, 158, 11, 0.1);
  --status-error: #ef4444;
  --status-error-bg: rgba(239, 68, 68, 0.1);
  --status-info: #06b6d4;
  --status-info-bg: rgba(6, 182, 212, 0.1);

  /* Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Spacing Scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

#### Typography Scale
- **Font Family:** `Geist Sans`, `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Numbers & Counters:** `font-variant-numeric: tabular-nums;` for attendance statistics and session timers.
- **Scale:**
  - `Display`: 28px (Bold, tracking -0.02em)
  - `Page Title`: 22px (Semi-bold, tracking -0.015em)
  - `Section Title`: 16px (Medium, tracking -0.01em)
  - `Body`: 14px (Regular, line-height 1.5)
  - `Body Medium`: 14px (Medium, line-height 1.5)
  - `Secondary / Caption`: 12px (Regular, line-height 1.4)
  - `Metadata / Code`: 11px (Mono, line-height 1.3)

#### Breakpoints
- `Mobile`: `< 640px` (One-handed navigation, full-bleed modals)
- `Tablet`: `640px – 1023px` (Collapsible side rail, 2-column grids)
- `Desktop`: `≥ 1024px` (Permanent sidebar, information-dense 12-column layout)

---

## E. Component Hierarchy & Atomic Primitives

```text
COMPONENTS
├── Primitives (Atoms)
│   ├── Button (variants: primary, secondary, ghost, destructive, outline | sizes: sm, md, lg)
│   ├── Input (text, search, numeric | with leading/trailing icon slots)
│   ├── Badge (variants: neutral, success, warning, error, info)
│   ├── StatusIndicator (dot + label: PRESENT, PROCESSING, NOT_MARKED, BLOCKED)
│   ├── Avatar (with fallback initials & enrollment state ring)
│   ├── Skeleton (matches table row, card, and metric dimensions)
│   └── TabularNumber (optimized layout-shift-free numeric counter)
│
├── Layout & Surfaces (Molecules)
│   ├── Card (header, content, footer | surface border, 0px or 8px radius)
│   ├── StatWidget (title, large tabular metric, subtle trend/context label)
│   ├── SectionHeader (title, subtitle, right-aligned action slot)
│   ├── ResponsiveContainer (desktop sidebar layout vs mobile topbar/bottom navigation)
│   └── OfflineBanner (persistent non-intrusive network indicator)
│
├── Data Display & Lists (Organisms)
│   ├── DataTable (desktop: sortable, virtualized, filterable | mobile: responsive row cards)
│   ├── VerificationStepper (Proximity → Face → Liveness → Outcome)
│   ├── LiveRadarFeed (realtime incoming stream of student marks)
│   └── AudioWaveform (visual feedback for acoustic emitter/decoder activity)
│
└── Overlays & Feedback (Templates)
    ├── ModalDialog (desktop centered modal | mobile bottom sheet)
    ├── Toast / AlertBanner (system notices with strict user-safe copy)
    └── EmptyState / ErrorState (illustration-free, actionable recovery steps)
```

---

## F. Verification Architecture

```text
                                 VERIFICATION ORCHESTRATOR
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
       PROXIMITY ENGINE               IDENTITY ENGINE                 LIVENESS ENGINE
              │                               │                               │
     ┌────────┴────────┐                      │                      ┌────────┴────────┐
     │ Provider Router │                      │                      │ Provider Router │
     └────────┬────────┘                      │                      └────────┬────────┘
              │                               │                               │
    ┌─────────┼─────────┐            ┌────────▼────────┐             ┌────────┼────────┐
    ▼         ▼         ▼            ▼                 ▼             ▼        ▼        ▼
Acoustic    Local LAN  GPS      Local Mesh       Cloud Matcher    Passive  Challenge Local
Provider    Provider Provider   (TF.js / MediaPipe) (Worker Fallback) Blink   Head-Turn Micro-tex
 [TIER A]   [TIER B]  [TIER C]
    │         │         │            │                 │             │        │        │
    └─────────┼─────────┘            └────────┬────────┘             └────────┼────────┘
              ▼                               ▼                               ▼
       ProximityProof                    IdentityProof                  LivenessProof
              │                               │                               │
              └───────────────────────────────┼───────────────────────────────┘
                                              ▼
                                    PROXIMITY POLICY ENGINE
                                              │
                                              ▼
                                      ATTENDANCE ENGINE
                                 (State Machine & Outbox)
```

### 1. Abstraction Specifications

#### `ProximityProvider` Interface
```typescript
export interface ProximityProof {
  providerId: 'acoustic' | 'lan' | 'ble' | 'gps';
  tier: 'TIER_A' | 'TIER_B' | 'TIER_C';
  timestamp: number;
  nonce: string;
  confidence: number; // 0.0 - 1.0
  payload: string;    // Decoded cryptographic signature or MAC
  rawMetrics?: Record<string, unknown>;
}

export interface ProximityProvider {
  id: string;
  tier: 'TIER_A' | 'TIER_B' | 'TIER_C';
  isSupported(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  generateChallenge?(sessionId: string): Promise<string>;
  verifyPresence(context: { sessionId: string; challengeToken?: string; timeoutMs: number }): Promise<ProximityProof>;
}
```

#### `FaceVerificationProvider` Interface
```typescript
export interface FaceProof {
  providerId: string;
  matched: boolean;
  confidence: number; // 0.0 - 1.0
  faceBoundingBox?: { x: number; y: number; width: number; height: number };
  featureVectorHash?: string; // One-way hash of embedding, NEVER raw pixels
}

export interface FaceVerificationProvider {
  id: string;
  initialize(): Promise<void>;
  detectFace(videoFrame: HTMLVideoElement | ImageBitmap): Promise<{ detected: boolean; count: number; qualityScore: number }>;
  verifyStudent(videoFrame: HTMLVideoElement | ImageBitmap, enrolledTemplateHash: string): Promise<FaceProof>;
  dispose(): void;
}
```

#### `LivenessProvider` Interface
```typescript
export interface LivenessProof {
  passed: boolean;
  method: 'passive_micro_motion' | 'interactive_challenge';
  confidence: number;
  attackDetected?: boolean;
}

export interface LivenessProvider {
  id: string;
  assessLiveness(stream: MediaStream, onPrompt?: (prompt: string) => void): Promise<LivenessProof>;
}
```

### 2. Verification State Machine & Outcome Table
Every verification attempt moves through immutable states:
`INITIATED` $\to$ `SESSION_VALIDATING` $\to$ `PROXIMITY_VERIFYING` $\to$ `FACE_VERIFYING` $\to$ `LIVENESS_VERIFYING` $\to$ `FINAL_VALIDATION` $\to$ `ATTENDANCE_ACCEPTED`

#### Authoritative Outcome Mapping
| Stage Failure | Internal Code | Category | Outcome | Retry Policy | User-Facing Guidance |
|---|---|---|---|---|---|
| Session Inactive | `SESSION_EXPIRED` | SESSION | `REJECTED` | No | "This attendance session has ended." |
| Acoustic Missing | `PROXIMITY_TIMEOUT` | PROXIMITY | `RETRY_REQUIRED` | Auto 3x | "Classroom signal not detected. Ensure you are inside the room." |
| Replayed Audio | `PROXIMITY_CHALLENGE_REPLAYED` | PROXIMITY | `BLOCKED` | Cooldown | "Verification could not be validated. Contact teacher." |
| Low Face Light | `FACE_POOR_QUALITY` | FACE_DETECT | `RETRY_REQUIRED` | Yes | "Move to a brighter spot and hold device steady." |
| Dual Faces | `MULTIPLE_FACES_DETECTED` | FACE_DETECT | `RETRY_REQUIRED` | Yes | "Ensure only your face is visible in the frame." |
| Mismatched Face | `FACE_MISMATCH` | FACE_ID | `REJECTED` | Max 3 | "Face does not match enrolled profile." |
| Screen Spoof | `POSSIBLE_PRESENTATION_ATTACK` | LIVENESS | `BLOCKED` | No | "Verification failed security policy." |
| DB Disconnect | `DATABASE_ERROR` | SYSTEM | `SYSTEM_ERROR` | Auto | "Service temporarily busy. Syncing in background..." |

---

## G. Fault-Tolerance Strategy

| Failure Event | Impact on Attendance | Graceful Degradation / Recovery Mechanism |
|---|---|---|
| **Temporary Internet Loss (Student)** | None (Queued) | Service Worker buffers signed `AttendancePayload` in IndexedDB (`PENDING_SYNC`). Background Sync worker submits payload when connection restores. Validated with session challenge timestamp. |
| **Temporary Internet Loss (Classroom)** | None (Edge Buffer) | If Teacher Edge Relay is deployed, students connect to classroom edge over local Wi-Fi. Relay buffers cryptographically signed records and synchronizes with cloud upon link recovery. |
| **Acoustic Hardware Failure (Speaker/Mic)** | High | Orchestrator fails over to configured secondary tier: Authenticated local Wi-Fi BSSID verification (`TIER_B`) or GPS classroom geofence (`TIER_C`). Dual `TIER_B` or `TIER_C`+Teacher confirmation can fulfill policy. |
| **WebSocket Disconnect** | Low | Teacher UI continues receiving local beacon status; dashboard initiates exponential backoff reconnect (`1s, 2s, 4s, 8s... max 30s`). Replay of missed events from Redis Stream offset on reconnect. |
| **Primary Database Failover** | Low (Temporary latency) | PostgreSQL automated standby failover (Patroni / AWS RDS Multi-AZ). Read operations route to read-replica pool. Write requests queue with bounded retries. |
| **Push Notification Service Down** | Zero | Notifications are auxiliary only. Students discover active sessions directly upon opening the PWA. |

---

## H. Scalability Strategy

1. **Modular Monolith First:**
   - Single Next.js + Node.js application codebase with strict domain boundaries: `/modules/session`, `/modules/attendance`, `/modules/verification`, `/modules/identity`.
   - Ready for zero-rewrite extraction into containerized microservices if college load exceeds single cluster capacity.
2. **Database Concurrency & Idempotency:**
   - Zero row-level lock contention on sessions. Every student write is an `INSERT` into an immutable `attendance_records` table with a composite unique index:
     ```sql
     CREATE UNIQUE INDEX idx_unique_session_student ON attendance_records (session_id, student_id);
     ```
   - Duplicate submissions trigger PostgreSQL `ON CONFLICT DO NOTHING` and return the existing verified receipt.
3. **Stateless WebSockets with Redis Streams:**
   - Node.js WebSocket gateways maintain only client sockets.
   - All state transitions publish to Redis Stream `stream:session:{sessionId}`. Gateways use consumer groups to fan out updates to connected teachers with $<50\text{ms}$ latency.
4. **Client-Side Biometric Compute Offloading:**
   - 1,000 students in an auditorium run face detection and embedding calculations simultaneously on their *own* phone GPUs/CPUs (via WebAssembly / WebGL).
   - Zero cloud GPU costs; zero video bandwidth consumption; near-zero server processing spikes during the 5-minute attendance window.

---

## I. Recommended Project Structure

```text
attendex/
├── .agents/                        # Architectural rules & guidance
├── packages/
│   ├── core/                       # Shared Domain Logic & Types
│   │   ├── src/
│   │   │   ├── domain/             # Session, Attendance, Student, Class models
│   │   │   ├── verification/       # Orchestrator, Policy Engine, State machine
│   │   │   ├── providers/          # Interfaces: Proximity, Face, Liveness
│   │   │   └── crypto/             # Ed25519 signing, Nonce validation, Token hashing
│   │   └── tsconfig.json
│   │
│   ├── proximity-acoustic/         # Acoustic Proximity Provider
│   │   ├── src/
│   │   │   ├── encoder/            # Near-ultrasound FSK/OFDM modulator (Web Audio API)
│   │   │   ├── decoder/            # Web Audio Goertzel/FFT demodulator & CRC parser
│   │   │   └── protocol/           # Packet framing: [Prefix, SessionHash, Nonce, Sig, CRC]
│   │   └── tsconfig.json
│   │
│   ├── vision-face/                # On-Device Face & Liveness Provider
│   │   ├── src/
│   │   │   ├── detector/           # MediaPipe / TF.js FaceMesh abstraction
│   │   │   ├── liveness/           # Passive micro-expression & head-pose checker
│   │   │   └── embedding/          # Cosine similarity vector matcher
│   │   └── tsconfig.json
│   │
│   └── database/                   # Prisma Schema & Migrations
│       ├── prisma/
│       │   ├── schema.prisma       # Sessions, Students, AttendanceRecords, OutboxEvents
│       │   └── migrations/
│       └── src/
│
├── apps/
│   ├── web/                        # Next.js App Router (PWA + SSR + API)
│   │   ├── public/                 # Manifest, icons, service worker (Workbox)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/         # Login, device registration
│   │   │   │   ├── (teacher)/      # Dashboard, Live Session, Class Management
│   │   │   │   ├── (student)/      # PWA Home, Attend flow, History, Enrollment
│   │   │   │   └── api/            # REST & Event endpoints (/api/v1/sessions, /attend)
│   │   │   ├── components/         # Design System: atoms, molecules, organisms
│   │   │   │   ├── ui/             # Reusable primitives (shadcn-compatible)
│   │   │   │   ├── verification/   # Camera frame, Oval guide, Soundwave
│   │   │   │   └── dashboard/      # Stat cards, Live table, Session controls
│   │   │   ├── hooks/              # useProximity, useFaceScan, useWebSocket, useSyncQueue
│   │   │   └── lib/                # Config, token constants, API client
│   │   └── next.config.mjs
│   │
│   └── websocket-gateway/          # Lightweight Node.js / ws realtime server
│       └── src/
│           ├── index.ts            # Redis Stream subscriber & socket router
│           └── auth.ts             # JWT token socket handshakes
│
└── package.json
```

---

## J. Implementation Order

```text
PHASE 1: Core Foundation & Isolated Proof-of-Concepts (POCs)
├── 1.1 Acoustic Signal Transmission & Detection POC (Web Audio API)
├── 1.2 On-Device Face Mesh & Liveness Evaluation POC (MediaPipe / Browser)
└── 1.3 Design System Tokens, CSS Architecture & Base UI Primitives

PHASE 2: Domain Logic & Verification Orchestrator
├── 2.1 Core Domain Models, Cryptographic Nonce/Proof Signatures
├── 2.2 Proximity & Face Provider Pluggable Architecture
├── 2.3 Verification State Machine & Outcome Mapper with strict test suite
└── 2.4 Prisma Schema & Transactional Outbox Engine

PHASE 3: Application Assembly (Next.js PWA)
├── 3.1 Student Mobile-First Attendance Flow (Step-by-step focused UX)
├── 3.2 Teacher Live Session Console (Audio beacon emitter + Real-time socket feed)
├── 3.3 PWA Service Worker, IndexedDB Offline Storage & Sync Queue
└── 3.4 Biometric Enrollment & Device Key Registration Flow

PHASE 4: Hardening, Fault-Tolerance & Production Readiness
├── 4.1 Redis Stream Event Bus & Multi-Instance WebSocket Gateway
├── 4.2 Replay Protection, Cooldown Rate-Limiters & Security Audit
└── 4.3 Multi-Device Hardware Testing (iOS Safari, Android Chrome, Windows, Mac)
```

---

## K. Highest-Risk Technical Assumptions

| Assumption | Root Risk | Potential Impact | Mitigation Strategy |
|---|---|---|---|
| **1. Mobile Browser Ultrasonic Acoustic Transmission** | Mobile microphones (especially iOS Safari) apply aggressive hardware-level noise cancellation and band-pass filtering (attenuating frequencies $>18\text{ kHz}$). | High: Acoustic beacon fails to detect on iPhones in quiet or noisy rooms. | **Prototype immediately.** Test 18.5–20 kHz versus modulated audible chirps (14–16 kHz or acoustic data bursts). Provide multi-tier fallback (Local LAN / BLE / GPS). |
| **2. Client-Side Face Biometrics Consistency Across Low-End Phones** | Low-tier Android devices may lag or run out of memory when loading MediaPipe/TF.js models inside the browser tab. | Moderate: Latency $>5\text{s}$ or browser tab crash during scan. | Quantize models; use lightweight WebAssembly delegates; lazy-load weights; implement server-side fallback worker for certified low-spec hardware. |
| **3. Mobile Camera Permission Denials & OS Interruption** | User denies camera/mic, or an incoming phone call suspends the WebRTC/MediaStream context. | Low/Moderate: UX deadlock or uninformative failure. | Explicit pre-permission check screens explaining exact utility; comprehensive event listeners for `visibilitychange` and stream `ended` events. |
| **4. Time Drift on Device Proofs** | Student phone clock set manually or drifting by $>60\text{ seconds}$ fails challenge timestamp validation. | Low: Legitimate student rejected for `TIMESTAMP_INVALID`. | Server embeds its authoritative timestamp inside the challenge beacon; client signs server timestamp without trusting device clock. |

---

## L. Prototype Verification Plan

Before building out pages, schemas, or full application flows, we must execute two self-contained browser prototypes:

1. **Acoustic Proximity Laboratory (`/prototypes/acoustic-test`):**
   - Transmit: Emit continuous and pulsed FSK/Chirp tokens at 18 kHz, 18.5 kHz, 19 kHz, and 19.5 kHz.
   - Receive: Evaluate FFT peak detection, SNR, and packet decoding across:
     - iPhone (Safari iOS 16, 17, 18)
     - Android (Chrome on budget & flagship devices)
     - Laptop speakers & microphones
   - Metric to beat: $>95\%$ successful detection within 3 meters in a room with background chatter.
2. **On-Device Face Alignment & Liveness Probe (`/prototypes/face-liveness-test`):**
   - Load quantized FaceMesh; verify frame rate $>20\text{ fps}$ on budget devices.
   - Evaluate passive micro-blinking / head-orientation checks versus printed photo and screen replay.
   - Measure memory consumption and camera startup-to-release latency.
