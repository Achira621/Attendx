---
trigger: always_on
---

# FAILURE-TO-OUTCOME MAPPINGS

Every verification attempt MUST resolve to exactly one final outcome:

```text
ACCEPTED
RETRY_REQUIRED
REJECTED
BLOCKED
SYSTEM_ERROR
```

The backend is the final authority.

---

## 1. Outcome Definitions

### ACCEPTED

Attendance is successfully recorded.

Use only when:

```text
Session valid
AND
Student valid
AND
Proximity verified
AND
Face verified
AND
Liveness verified
AND
No security violation
AND
Attendance not already recorded
```

---

### RETRY_REQUIRED

The attempt failed because the verification input was insufficient or a recoverable condition occurred.

The student may start another verification attempt.

No attendance is recorded.

---

### REJECTED

A required verification condition genuinely failed.

The attempt is unsuccessful, but it is not necessarily treated as suspicious activity.

The student may be allowed another attempt according to the retry policy.

---

### BLOCKED

The system detected a security/policy condition that requires stopping the current attempt or temporarily preventing further attempts.

No attendance is recorded.

Further attempts require a new session, cooldown, teacher action, or backend decision depending on the specific failure.

---

### SYSTEM_ERROR

The system could not make a trustworthy verification decision because of an infrastructure or unexpected technical failure.

Do NOT classify a system failure as a student failure.

No attendance is recorded unless a later verification attempt succeeds.

---

# 2. Session Failures

| Failure                       | Outcome               | Retry |
| ----------------------------- | --------------------- | ----- |
| `SESSION_NOT_FOUND`           | `REJECTED`            | No    |
| `SESSION_EXPIRED`             | `REJECTED`            | No    |
| `SESSION_NOT_OPEN`            | `REJECTED`            | No    |
| `STUDENT_NOT_ENROLLED`        | `REJECTED`            | No    |
| `SESSION_ALREADY_COMPLETED`   | `REJECTED`            | No    |
| `ATTENDANCE_ALREADY_RECORDED` | No new attempt needed | No    |

`ATTENDANCE_ALREADY_RECORDED` should return the existing successful attendance state rather than treating it as an error.

---

# 3. Proximity Failures

| Failure                         | Outcome          | Retry                           |
| ------------------------------- | ---------------- | ------------------------------- |
| `PROXIMITY_UNAVAILABLE`         | `SYSTEM_ERROR`   | Yes after recovery              |
| `PROXIMITY_PERMISSION_DENIED`   | `RETRY_REQUIRED` | Yes                             |
| `PROXIMITY_TIMEOUT`             | `RETRY_REQUIRED` | Yes                             |
| `PROXIMITY_SIGNAL_NOT_DETECTED` | `RETRY_REQUIRED` | Yes                             |
| `PROXIMITY_SIGNAL_INVALID`      | `REJECTED`       | Yes, according to attempt limit |
| `PROXIMITY_CHALLENGE_EXPIRED`   | `RETRY_REQUIRED` | Yes                             |
| `PROXIMITY_CHALLENGE_REPLAYED`  | `BLOCKED`        | No immediate retry              |
| `PROXIMITY_VERIFICATION_FAILED` | `REJECTED`       | Yes, according to attempt limit |
| `PROXIMITY_CONFLICT`            | `REJECTED`       | Yes after a fresh verification  |

Important:

A proximity failure MUST NOT be converted into `ACCEPTED` merely because face verification succeeds.

---

# 4. Camera Failures

| Failure                        | Outcome          | Retry                                              |
| ------------------------------ | ---------------- | -------------------------------------------------- |
| `CAMERA_UNAVAILABLE`           | `SYSTEM_ERROR`   | Only if another supported camera becomes available |
| `CAMERA_PERMISSION_DENIED`     | `RETRY_REQUIRED` | Yes after permission is granted                    |
| `CAMERA_PERMISSION_BLOCKED`    | `REJECTED`       | Only after permissions are changed                 |
| `CAMERA_INITIALIZATION_FAILED` | `SYSTEM_ERROR`   | Yes                                                |
| `CAMERA_INTERRUPTED`           | `RETRY_REQUIRED` | Yes                                                |
| `CAMERA_TIMEOUT`               | `RETRY_REQUIRED` | Yes                                                |

---

# 5. Face Detection Failures

These indicate insufficient capture quality rather than identity failure.

| Failure                   | Outcome          | Retry |
| ------------------------- | ---------------- | ----- |
| `FACE_NOT_DETECTED`       | `RETRY_REQUIRED` | Yes   |
| `MULTIPLE_FACES_DETECTED` | `RETRY_REQUIRED` | Yes   |
| `FACE_TOO_SMALL`          | `RETRY_REQUIRED` | Yes   |
| `FACE_OUT_OF_FRAME`       | `RETRY_REQUIRED` | Yes   |
| `FACE_POOR_QUALITY`       | `RETRY_REQUIRED` | Yes   |
| `FACE_POOR_POSE`          | `RETRY_REQUIRED` | Yes   |
| `FACE_OCCLUDED`           | `RETRY_REQUIRED` | Yes   |

Recommended UX:

```text
"Make sure only you are visible and move your face
into the camera frame."
```

Do not mark these as fraud.

---

# 6. Face Identity Failures

These indicate that the camera captured a usable face but identity verification did not succeed.

| Failure                        | Outcome          | Retry                           |
| ------------------------------ | ---------------- | ------------------------------- |
| `FACE_NOT_ENROLLED`            | `REJECTED`       | No until enrollment exists      |
| `FACE_MISMATCH`                | `REJECTED`       | Yes, according to attempt limit |
| `FACE_CONFIDENCE_INSUFFICIENT` | `RETRY_REQUIRED` | Yes                             |
| `FACE_VERIFICATION_ERROR`      | `SYSTEM_ERROR`   | Yes                             |

Important distinction:

```text
FACE_MISMATCH
≠
FACE_VERIFICATION_ERROR
```

A mismatch means the student identity was not verified.

A verification error means the system failed to perform the verification reliably.

---

# 7. Liveness Failures

| Failure                        | Outcome          | Retry                                |
| ------------------------------ | ---------------- | ------------------------------------ |
| `LIVENESS_UNAVAILABLE`         | `SYSTEM_ERROR`   | Yes if the service becomes available |
| `LIVENESS_TIMEOUT`             | `RETRY_REQUIRED` | Yes                                  |
| `LIVENESS_FAILED`              | `REJECTED`       | Yes, according to attempt limit      |
| `POSSIBLE_PRESENTATION_ATTACK` | `BLOCKED`        | No immediate retry                   |

A normal liveness failure should not automatically accuse the student of fraud.

A detected presentation attack should trigger the stronger security outcome.

---

# 8. Authentication / Device Failures

| Failure                     | Outcome          | Retry                                          |
| --------------------------- | ---------------- | ---------------------------------------------- |
| `STUDENT_NOT_AUTHENTICATED` | `REJECTED`       | Yes after login                                |
| `AUTHENTICATION_EXPIRED`    | `RETRY_REQUIRED` | Yes after re-authentication                    |
| `DEVICE_NOT_REGISTERED`     | `REJECTED`       | Only after device registration                 |
| `DEVICE_IDENTITY_MISMATCH`  | `BLOCKED`        | Requires re-authentication/device verification |
| `AUTHORIZATION_FAILED`      | `REJECTED`       | No unless authorization changes                |

---

# 9. Security Failures

| Failure               | Outcome          | Retry                             |
| --------------------- | ---------------- | --------------------------------- |
| `INVALID_REQUEST`     | `REJECTED`       | Yes after correction              |
| `INVALID_SIGNATURE`   | `BLOCKED`        | No immediate retry                |
| `NONCE_INVALID`       | `REJECTED`       | Yes with a fresh challenge        |
| `TIMESTAMP_INVALID`   | `RETRY_REQUIRED` | Yes with a fresh request          |
| `REPLAY_DETECTED`     | `BLOCKED`        | No immediate retry                |
| `RATE_LIMITED`        | `BLOCKED`        | Yes after cooldown                |
| `SUSPICIOUS_ACTIVITY` | `BLOCKED`        | Requires security policy decision |

Security-sensitive failures should use generic student-facing messages.

Example:

```text
Internal:
REPLAY_DETECTED

Student sees:
"Verification could not be completed."
```

Do not reveal details that make the protection easier to bypass.

---

# 10. Network / Infrastructure Failures

| Failure                      | Outcome        | Retry |
| ---------------------------- | -------------- | ----- |
| `NETWORK_UNAVAILABLE`        | `SYSTEM_ERROR` | Yes   |
| `SERVER_UNAVAILABLE`         | `SYSTEM_ERROR` | Yes   |
| `VERIFICATION_SERVICE_ERROR` | `SYSTEM_ERROR` | Yes   |
| `DATABASE_ERROR`             | `SYSTEM_ERROR` | Yes   |
| `INTERNAL_ERROR`             | `SYSTEM_ERROR` | Yes   |

Never classify infrastructure failures as:

```text
FACE_MISMATCH
```

or:

```text
PROXIMITY_FAILED
```

unless that specific verification actually failed.

---

# 11. Overall Priority Rules

If multiple failures occur during one attempt, resolve them according to this priority:

```text
1. BLOCKED
2. REJECTED
3. RETRY_REQUIRED
4. SYSTEM_ERROR
5. ACCEPTED
```

However, `SYSTEM_ERROR` should take precedence over a normal verification failure when the system cannot determine the verification result reliably.

Example:

```text
Face = MATCH
Proximity = UNKNOWN because proximity service crashed

→ SYSTEM_ERROR
```

Do NOT assume:

```text
UNKNOWN = FAIL
```

when the system itself failed to perform the check.

---

# 12. Final Acceptance Rule

The only path to `ACCEPTED` is:

```text
VALID SESSION
        ↓
VALID STUDENT
        ↓
PROXIMITY VERIFIED
        ↓
FACE VERIFIED
        ↓
LIVENESS VERIFIED
        ↓
SECURITY CHECK PASSED
        ↓
NOT ALREADY RECORDED
        ↓
ATTENDANCE_ACCEPTED
```

A missing, unknown, stale, or unverifiable security condition must never be treated as success.

---

# 13. Retry Rules

Each attendance session should define a maximum number of verification attempts.

Recommended initial policy:

```text
Normal recoverable failures:
3 attempts

Security failures:
0 immediate retries

System failures:
Retry when service becomes available

Session failures:
Do not retry unless the session state changes
```

Example:

```text
Attempt 1
FACE_POOR_QUALITY
→ RETRY_REQUIRED

Attempt 2
FACE_MISMATCH
→ REJECTED

Attempt 3
FACE_MATCH + LIVENESS_PASS + PROXIMITY_PASS
→ ACCEPTED
```

The exact retry limits should remain configurable.

---

# 14. State Transition Rule

An attempt must never jump directly from an intermediate state to attendance.

Invalid:

```text
PROXIMITY_VERIFYING
        ↓
ATTENDANCE_ACCEPTED
```

Valid:

```text
PROXIMITY_VERIFYING
        ↓
PROXIMITY_VERIFIED
        ↓
FACE_VERIFYING
        ↓
FACE_VERIFIED
        ↓
LIVENESS_VERIFYING
        ↓
LIVENESS_VERIFIED
        ↓
FINAL_VALIDATION
        ↓
ATTENDANCE_ACCEPTED
```

Any failure transitions into its mapped outcome.

---

# 15. Logging Rule

For every attempt, record:

```text
attempt_id
student_id
session_id
started_at
completed_at
verification_stage
failure_code
final_outcome
retry_number
device_id
```

Do not store unnecessary raw biometric information merely for logging.

Security-sensitive events should have additional audit logging.

---

# 16. Core Principle

The system must distinguish between:

```text
The student failed verification
```

and:

```text
The system failed to perform verification
```

Therefore:

```text
Student/verification failure
→ REJECTED or RETRY_REQUIRED

Security violation
→ BLOCKED

Technical failure
→ SYSTEM_ERROR
```

Never punish a student for an infrastructure failure.
