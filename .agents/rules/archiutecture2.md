---
trigger: always_on
---

Duplicate request
→ return existing result

Modified duplicate
→ reject

This protects against:

Network retries
Browser retries
Double taps
Worker retries
Offline synchronization
22. Retry Architecture

Use bounded retries with exponential backoff.

Retry:

temporary network errors
temporary service errors
temporary queue failures
temporary database connection failures

Do NOT endlessly retry:

FACE_MISMATCH
PROXIMITY_REJECTED
REPLAY_DETECTED
SESSION_EXPIRED

Distinguish:

Technical failure

from:

Security failure
23. Fault Isolation

Each subsystem must fail independently.

Example:

Notification Service DOWN
        ↓
Attendance continues
        ↓
Students can open application manually
Analytics Service DOWN
        ↓
Attendance continues
WebSocket Service DOWN
        ↓
Attendance continues
        ↓
Teacher dashboard refreshes/reconnects later
Acoustic Provider DOWN
        ↓
Try another configured proximity provider
Redis DOWN
        ↓
Critical attendance writes still use PostgreSQL
One API instance DOWN
        ↓
Load balancer routes requests to another instance
24. Verification Provider Failover

Use:

Verification Orchestrator

rather than calling providers directly from the frontend.

Example:

                    Verification Orchestrator
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
          Acoustic          Local LAN          GPS
          Provider          Provider         Provider

The orchestrator evaluates available evidence.

A provider failure means:

Provider unavailable

not:

Student absent

The configured assurance policy determines whether another provider can satisfy the proximity requirement.

25. API Scalability

All application servers should be stateless.

Do NOT store critical state in:

server memory

Instead use:

PostgreSQL
Redis
Event Stream
Object Storage

Then:

                    Load Balancer
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       API #1          API #2          API #N
          │              │              │
          └──────────────┼──────────────┘
                         │
                 Shared Data Layer

Any API instance can handle any request.

26. Horizontal Scaling

The system must scale horizontally.

When student traffic increases:

API instances ↑
WebSocket instances ↑
Verification workers ↑
Notification workers ↑

Use queue depth, request rate, latency, CPU, memory, and other relevant metrics for autoscaling.

Kubernetes Horizontal Pod Autoscaler can automatically adjust workload replicas based on resource or custom metrics.

Do not make Kubernetes mandatory for the MVP.

Design the application so it can be containerized and horizontally scaled when required.

27. Verification Worker Scaling

Face-related cloud processing, if ever used, must run in separate workers.

Example:

Verification Queue
        │
        ├── Worker 1
        ├── Worker 2
        ├── Worker 3
        └── Worker N

Never make the main API wait indefinitely for expensive processing.

Whenever processing can happen locally on the student device, prefer local processing.

28. Classroom Isolation

Each classroom/session should have independent:

sessionId
edgeId
proximity namespace
ephemeral challenge key
event stream namespace

A failure in Classroom A must not affect Classroom B.

Example:

Classroom A Edge
       ↓
Session A

Classroom B Edge
       ↓
Session B

Do not use one global classroom session state.

29. Session State Machine

Use an explicit state machine:

CREATED
   ↓
ACTIVE
   ↓
GRACE_PERIOD
   ↓
CLOSED
   ↓
ARCHIVED

Invalid transitions must be rejected.

For example:

ARCHIVED → ACTIVE

must never happen through a normal API request.

30. Observability

Every important action must be observable.

Use:

Metrics
Structured Logs
Distributed Tracing
Health Checks
Audit Logs
Alerts

Track:

Attendance success rate
Proximity success rate
Face verification success rate
Liveness failure rate
Acoustic false-negative rate
Provider failure rate
Average verification latency
Queue depth
API latency
Database latency
WebSocket connections
Offline synchronization backlog

Use correlation IDs:

requestId
sessionId
attemptId
studentId
deviceId

Never log sensitive biometric information.

31. Health Checks

Every service should expose:

/health/live
/health/ready

Separate:

Liveness

from:

Readiness

A service can be running but not ready to receive production traffic.

32. Graceful Degradation

The system should degrade like this:

FULL MODE

Acoustic
+
Local Network
+
GPS
+
Face
+
Liveness
+
Cloud


       ↓ provider failure


REDUCED MODE

Available Proximity Provider
+
Face
+
Liveness
+
Cloud


       ↓ internet failure


EDGE/OFFLINE MODE

Local Session Proof
+
Local Proximity
+
Local Face
+
Local Liveness
+
Encrypted Pending Sync


       ↓ recovery


FULL MODE

At no point should the system silently remove the required identity or proximity condition.

33. Disaster Recovery

Attendance is authoritative data.

Use:

Automated database backups
Point-in-time recovery
Database replication
Recovery testing
Event replay

The event stream should make it possible to reconstruct asynchronous processing after worker failure.

Do not rely exclusively on cache data.

34. Security Boundaries

Treat these as separate trust zones:

Student Browser
      ↓
Public API
      ↓
Verification Layer
      ↓
Attendance Engine
      ↓
Database

Never allow:

Student Browser
      ↓
Database

The client must never directly control attendance records.

35. Recommended Deployment Evolution
Phase 1: MVP
Next.js
Node.js
PostgreSQL
Prisma
Redis
WebSocket
PWA

Deploy as a small modular application.

Phase 2: Production College Deployment

Add:

Load Balancer
Multiple API instances
Redis HA
PostgreSQL HA
Background Workers
Event Stream
Monitoring
Classroom Edge Relays
Phase 3: Large Deployment

If deployed across many colleges:

                    Global Load Balancer
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Region A                    Region B
              │                           │
       API / Workers                 API / Workers
              │                           │
          Database                    Database
              │                           │
           Events                     Events

Use tenant isolation:

College
  ↓
Department
  ↓
Class
  ↓
Course
  ↓
Session

The architecture must support multiple colleges without creating separate codebases.

36. Most Important Architectural Rule

Do not build a monolithic chain like:

Student
 ↓
Acoustic API
 ↓
Face API
 ↓
Backend
 ↓
Database

where one failure destroys the entire pipeline.

Instead build:

                    ATTENDANCE ORCHESTRATOR
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
      Proximity            Identity            Liveness
      Evidence             Evidence            Evidence
          │                   │                   │
    ┌─────┼─────┐             │             ┌────┼────┐
    │     │     │             │             │    │    │
 Acoustic LAN   GPS         Face         Local Cloud Other
    │     │     │             │             │    │    │
    └─────┴─────┘             │             └────┴────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                     POLICY ENGINE
                              │
                              ▼
                      ATTENDANCE ENGINE
                              │
                              ▼
                         PostgreSQL
                              │
                         Event Stream
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
          Dashboard       Notifications     Analytics
37. Final Architecture Principle

The system must be:

MODULAR
HORIZONTALLY SCALABLE
FAULT ISOLATED
OFFLINE-TOLERANT
EVENT-DRIVEN
SECURE
OBSERVABLE
REPLACEABLE

The most important rule is:

No single technology should be a single point of failure.

But:

No failure should cause the system to weaken
the identity + proximity security requirement.

The architecture should therefore prefer:

FAIL CLOSED FOR SECURITY
+
DEGRADE GRACEFULLY FOR AVAILABILITY
+
RECOVER AUTOMATICALLY
+
SYNC EVENTUALLY
+
REMAIN IDEMPOTENT

Build the MVP as a modular monolith with these boundaries from day one. Do not prematurely split everything into microservices. The architecture must be capable of becoming distributed without requiring a complete rewrite.