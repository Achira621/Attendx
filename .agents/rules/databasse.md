---
trigger: always_on
---

# PERSISTENT DATA ARCHITECTURE RULES

## Primary Database

Use a managed PostgreSQL database.

Preferred initial provider:

```text
Neon PostgreSQL
```

Do NOT require PostgreSQL, Redis, MongoDB, or any database server to be installed on the developer's laptop.

Local development must connect to the managed development database through environment variables.

---

## ORM

Use:

```text
Prisma
```

All application database access must go through a dedicated data-access layer.

Do not scatter raw SQL/database calls throughout React components or API handlers.

---

## Environment Separation

Maintain separate database environments:

```text
development
staging
production
```

Never use production data for local experimentation.

Use database branching or an equivalent isolated development database where practical.

---

## Data Durability

The primary database is NOT the only copy of important data.

Maintain an independent backup system:

```text
Primary:
Neon PostgreSQL

Backup:
Cloudflare R2
```

The backup provider must be independent of the primary database provider.

---

## Automated Backups

Implement scheduled backups.

Minimum policy:

```text
Daily backup:
30 days retention

Monthly backup:
12 months retention
```

Backup process:

```text
PostgreSQL
↓
Logical dump
↓
Compression
↓
Encryption
↓
Upload to R2
↓
Verify upload
```

A backup job must report success or failure.

A failed backup must NOT silently go unnoticed.

---

## Backup Verification

Periodically test restoration.

A backup is not considered valid merely because a file exists.

The system should periodically verify that a backup can actually be restored.

---

## Database Constraints

Use database constraints to protect critical business rules.

Attendance must contain:

```text
UNIQUE(session_id, student_id)
```

Other important relationships must use:

```text
Foreign keys
Unique constraints
Not-null constraints
Check constraints
```

Never rely only on frontend validation.

---

## Transactions

Critical operations must use database transactions.

For example:

```text
BEGIN

Create attendance record
Create verification record
Create audit event

COMMIT
```

If a critical transaction fails:

```text
ROLLBACK
```

Do not allow partially committed attendance state.

---

## Connection Reliability

Use:

```text
Connection pooling
Connection timeouts
Retry with exponential backoff
Graceful reconnection
Health checks
```

Do not create uncontrolled database connections for every request.

The application must recover gracefully from temporary database connection failures.

---

## Idempotency

All attendance submission operations must be idempotent.

Every attendance attempt should have a unique:

```text
attemptId
idempotencyKey
```

Repeated requests must not create duplicate attendance.

Example:

```text
Request A → ACCEPTED
Request A repeated → return existing result
```

---

## Data Access Layer

Create a dedicated layer:

```text
repositories/
services/
```

Example:

```text
StudentRepository
SessionRepository
AttendanceRepository
VerificationRepository
DeviceRepository
```

Application code should not depend directly on provider-specific database APIs.

This allows the database provider to be changed later without rewriting the application.

---

## Critical Data Classification

Treat these as authoritative data:

```text
Student identity
Class enrollment
Attendance sessions
Attendance records
Verification results
Audit records
```

These must always be stored durably.

Treat these as temporary/cache data:

```text
Presence state
WebSocket state
Temporary challenges
Rate-limit counters
Sessions that can be reconstructed
```

Temporary data must never be the only source of truth.

---

## Biometric Data

Do NOT store raw attendance-session camera footage.

Do NOT store unnecessary face images.

Store the minimum biometric representation required by the verification architecture.

Separate biometric data from normal student data.

---

## Offline Behavior

Temporary Internet loss must not corrupt attendance state.

When technically possible:

```text
Local verification evidence
↓
Signed pending record
↓
Encrypted local queue
↓
Internet restored
↓
Backend validation
↓
Database commit
```

Never automatically mark attendance as accepted merely because the device is offline.

---

## Failure Recovery

Database failure must produce:

```text
SYSTEM_ERROR
```

not:

```text
FACE_MISMATCH
```

and not:

```text
PROXIMITY_REJECTED
```

Never confuse infrastructure failure with student verification failure.

---

## Provider Independence

Never expose provider-specific database APIs directly to the product logic.

The architecture must make it possible to migrate:

```text
Neon
→ another PostgreSQL provider
```

without rewriting:

```text
AttendanceEngine
StudentService
SessionService
VerificationEngine
```

Only the data-access/infrastructure layer should need significant modification.

---

## Development Rule

Do NOT create an SQLite/local-file database as the permanent source of truth.

Local databases may be used temporarily for isolated tests, but production and shared development data must live in the managed database.

---

## Final Data Principle

The system should be designed around:

```text
ONE AUTHORITATIVE PRIMARY DATABASE
+
INDEPENDENT BACKUPS
+
DATABASE CONSTRAINTS
+
TRANSACTIONS
+
IDEMPOTENCY
+
CONNECTION RETRIES
+
RECOVERY TESTING
```

The objective is not merely:

"store the data."

The objective is:

```text
Store it
Protect it
Recover it
Prevent corruption
Prevent duplication
Survive connection failures
Allow migration
```
