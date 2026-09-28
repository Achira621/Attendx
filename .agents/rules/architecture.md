---
trigger: always_on
---

# FAULT-TOLERANT AND SCALABLE ARCHITECTURE

## 1. Architectural Goal

Build the attendance platform so that:

```text
A single device failure
A single browser failure
A single verification-provider failure
A single backend-instance failure
Temporary internet loss
Temporary database/read-service failure
Temporary notification failure
```

must NOT bring down the entire attendance system.

However:

```text
Verification unavailable
≠
Automatically accept attendance
```

Security must never be weakened merely to achieve availability.

The system should degrade gracefully while preserving attendance integrity.

---

# 2. Core Architecture Principle

Use an:

```text
EDGE-FIRST
+
CLOUD-BACKED
+
EVENT-DRIVEN
+
MODULAR VERIFICATION
architecture
```

The architecture has two layers:

```text
                ┌────────────────────────┐
                │       CLOUD            │
                │                        │
                │ API / Auth / DB        │
                │ Session / Events       │
                │ Analytics / Workers    │
                └───────────┬────────────┘
                            │
                      Internet
                            │
                ┌───────────▼────────────┐
                │   CLASSROOM EDGE       │
                │                        │
                │ Teacher Device         │
                │ Session Relay          │
                │ Proximity Beacon       │
                │ Local Event Buffer     │
                └───────────┬────────────┘
                            │
                     Classroom vicinity
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
          Student        Student        Student
           Phone          Phone          Laptop
```

---

# 3. Student Device Architecture

The student device runs the PWA.

```text
Student PWA
│
├── Session Manager
├── Camera Manager
├── Microphone Manager
├── Face Verification
├── Liveness Verification
├── Proximity Engine
├── Device Identity
├── Local Verification Store
├── Offline Queue
└── Sync Manager
```

The application must continue working through temporary network interruptions where technically possible.

Use Service Workers, local persistent storage, and synchronization mechanisms for resilient offline behavior. Service workers can intercept requests and support offline experiences, while Background Sync can retry work when connectivity returns.

---

# 4. Classroom Edge Layer

Each classroom/session may optionally have an Edge Relay.

The edge relay can run on:

```text
Teacher Laptop
OR
Dedicated Raspberry Pi / Mini PC
OR
College Local Server
```

Responsibilities:

```text
Session Beacon
Proximity Beacon
Local Verification Coordination
Temporary Event Buffer
Local Health Monitoring
Cloud Synchronization
```

The edge layer MUST NOT become a permanent dependency of the cloud backend.

If the edge device fails and the Internet is available, students should fall back to supported cloud verification providers.

If the Internet fails but the classroom edge remains available, the system should continue collecting locally verifiable attendance evidence and synchronize later.

---

# 5. Proximity Architecture

Never hard-code one proximity technology.

Create:

```text
ProximityProvider
```

with a common interface:

```text
verifyPresence(context): ProximityProof
```

Implement providers independently:

```text
AcousticProvider
LocalNetworkProvider
BluetoothProvider
GPSProvider
UWBProvider
NativeProximityProvider
```

Not every platform must support every provider.

The system should dynamically select the strongest available supported provider.

---

# 6. Proximity Assurance Levels

Every provider must produce:

```text
proof
provider
timestamp
nonce
confidence
assuranceLevel
deviceId
sessionId
```

Use assurance levels:

```text
TIER_A
High-confidence physical proximity

TIER_B
Moderate-confidence proximity

TIER_C
Weak supporting evidence
```

Examples:

```text
Cryptographic acoustic challenge
→ potentially TIER_A

UWB / strong short-range distance proof
→ potentially TIER_A

Authenticated local network + additional evidence
→ TIER_B

GPS/geofence alone
→ TIER_C
```

Do not assign a tier simply because a provider exists.

The tier must be determined after testing and security analysis.

---

# 7. Proximity Policy Engine

Create:

```text
ProximityPolicyEngine
```

It decides whether the collected proximity evidence is sufficient.

Example policy:

```text
TIER_A
    → sufficient by itself

TIER_B + independent TIER_B
    → sufficient

TIER_C alone
    → insufficient

Conflicting high-confidence evidence
    → reject or require fresh verification
```

The policy MUST be configurable.

This allows future proximity technologies to be added without changing the attendance engine.

---

# 8. Acoustic Proximity

The initial provider should be:

```text
AcousticProvider
```

Use a rotating cryptographically signed challenge.

Architecture:

```text
Teacher / Edge
      │
      ▼
Ephemeral Session Key
      │
      ▼
Signed Challenge
      │
      ▼
Acoustic Encoding
      │
      ▼
Classroom Speaker
      │
      ▼
Student Microphone
      │
      ▼
Acoustic Decoder
      │
      ▼
Signature Verification
      │
      ▼
Proximity Proof
```

The student device should be able to validate the acoustic proof locally using the public verification key.

Do not require the backend to be online merely to determine whether the acoustic signal is cryptographically valid.

This makes the proximity layer resilient to temporary Internet loss.

---

# 9. Face Verification Architecture

Create a replaceable:

```text
FaceVerificationProvider
```

The first implementation should use browser-compatible computer vision.

Preferred flow:

```text
Camera
 ↓
Face Detection
 ↓
Image Quality
 ↓
Face Embedding
 ↓
Identity Comparison
 ↓
Liveness
 ↓
Verification Result
```

The teacher never receives the student's camera stream.

The student device performs the verification.

Where technically practical:

```text
Camera data
      ↓
Local processing
      ↓
Verification result
```

rather than:

```text
Camera
      ↓
Cloud
      ↓
Face processing
```

This reduces bandwidth, latency, privacy exposure, and cloud dependency.

---

# 10. Enrolled Face Data

Separate:

```text
Identity Data
```

from:

```text
Biometric Data
```

Do not store raw attendance-session camera footage.

Prefer storing the minimum required face representation.

If local verification is used, securely provision the student's verification material to the device using authenticated enrollment.

The server remains the authoritative source for enrollment changes.

---

# 11. Attendance Engine

Create a dedicated:

```text
AttendanceEngine
```

It must be independent of:

```text
UI
Proximity implementation
Face implementation
Notification system
WebSocket system
```

The engine receives verified evidence:

```text
SessionProof
StudentProof
ProximityProof
FaceProof
LivenessProof
SecurityProof
```

and makes the final decision.

Decision:

```text
VALID SESSION
+
VALID STUDENT
+
SUFFICIENT PROXIMITY
+
FACE MATCH
+
LIVENESS PASS
+
SECURITY PASS
+
NOT ALREADY PRESENT
=
ATTENDANCE ACCEPTED
```

---

# 12. Event-Driven Backend

Do not make every operation synchronous.

Use:

```text
API
 ↓
Command
 ↓
Transactional Database Write
 ↓
Event / Outbox
 ↓
Message Stream
 ↓
Workers
```

Recommended components:

```text
API Gateway
Auth Service
Session Service
Attendance Service
Verification Service
Notification Service
Sync Service
Analytics Service
```

These may initially be deployed as a modular monolith.

Design the boundaries so they can later become independent services.

Do NOT create unnecessary microservices on day one.

---

# 13. Database Architecture

Use PostgreSQL as the authoritative transactional database.

Recommended:

```text
Primary
  │
  ├── Read Replicas
  │
  └── Automated Failover / HA
```

PostgreSQL supports high-availability and replication configurations where a standby can take over after primary failure, and read replicas can serve read workloads.

Critical records must be written transactionally.

The attendance record must have a unique constraint such as:

```text
UNIQUE(session_id, student_id)
```

This makes duplicate attendance impossible even if the same request is received multiple times.

---

# 14. Redis Architecture

Use Redis only for:

```text
Cache
Rate Limiting
Short-lived Session State
Presence State
Real-time Coordination
Temporary Locks
```

Do NOT make Redis the permanent source of attendance truth.

For durable asynchronous processing, use:

```text
Redis Streams
```

or another durable event system.

Redis Streams support ordered event streams, consumer groups, acknowledgements, replay, and recovery of unprocessed messages.

---

# 15. Event Processing

Important events:

```text
SESSION_STARTED
SESSION_STOPPED
STUDENT_JOINED_SESSION
PROXIMITY_VERIFIED
FACE_VERIFIED
LIVENESS_VERIFIED
VERIFICATION_FAILED
ATTENDANCE_ACCEPTED
ATTENDANCE_REJECTED
ATTENDANCE_SYNC_REQUIRED
NOTIFICATION_SENT
NOTIFICATION_FAILED
```

Every event should have:

```text
eventId
eventType
sessionId
studentId
deviceId
timestamp
payload
schemaVersion
```

Consumers must be idempotent.

Processing an event twice must not create duplicate attendance.

---

# 16. Outbox Pattern

When attendance is accepted:

```text
BEGIN TRANSACTION

Insert AttendanceRecord
Insert OutboxEvent

COMMIT
```

Only after the transaction succeeds should a worker publish:

```text
ATTENDANCE_ACCEPTED
```

This prevents the dangerous situation where:

```text
Database says present
but
notification/event system never knows
```

or:

```text
Event says present
but
database transaction failed
```

---

# 17. Real-Time Teacher Dashboard

The teacher dashboard should receive live updates through WebSockets.

Architecture:

```text
Attendance DB
      ↓
Attendance Event
      ↓
Event Stream
      ↓
Realtime Gateway
      ↓
WebSocket
      ↓
Teacher Dashboard
```

WebSocket servers should be stateless.

Any WebSocket instance must be able to serve any teacher.

Use a shared event/backplane rather than storing attendance state only in one WebSocket server.

---

# 18. Notification Architecture

Push notifications are an auxiliary mechanism.

Never make attendance dependent on notification delivery.

If push fails:

```text
Student opens application
        ↓
Active session discovered
```

If notification succeeds:

```text
Push
 ↓
Student opens session
```

The notification service can therefore fail without stopping attendance.

---

# 19. Offline Architecture

The student PWA should maintain a local queue:

```text
VerificationAttempt
        ↓
Local encrypted storage
        ↓
Pending Sync
        ↓
Internet available
        ↓
Backend
```

The queued object should contain signed verification evidence, not merely:

```text
"Mark Varad Present"
```

The backend must still independently validate the proof before committing attendance.

Service-worker-based offline capabilities can allow web applications to continue operating through intermittent connectivity and synchronize work later.

---

# 20. Offline Acceptance Rule

Never do this:

```text
Internet unavailable
→ automatically mark PRESENT
```

Instead:

```text
Internet unavailable
+
local proximity proof valid
+
local face verification valid
+
local liveness valid
+
valid signed session
=
PENDING_VERIFICATION
```

Then:

```text
Internet returns
        ↓
Backend validates evidence
        ↓
ATTENDANCE_ACCEPTED
```

This preserves security while providing availability.

---

# 21. Idempotency

Every attendance attempt requires:

```text
idempotencyKey
```

Example:

```text
attendanceAttemptId =
sessionId + studentId + randomNonce
```

Backend behavior:

```text
First request
→ process

Duplicate request
→ return existing result

Modified duplicate
→ reject
