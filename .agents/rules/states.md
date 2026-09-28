---
trigger: always_on
---

# VERIFICATION FAILURE STATES

Use explicit verification states for every attendance attempt.

## 1. Verification State Model

The overall attendance attempt should move through:

```text
INITIATED
    ↓
SESSION_VALIDATING
    ↓
PROXIMITY_VERIFYING
    ↓
FACE_VERIFYING
    ↓
LIVENESS_VERIFYING
    ↓
FINAL_VALIDATION
    ↓
ATTENDANCE_ACCEPTED
```

Any stage can terminate in a specific failure state.

---

# 2. Session Failure States

### SESSION_NOT_FOUND

The attendance session does not exist.

### SESSION_EXPIRED

The session existed but is no longer active.

### SESSION_NOT_OPEN

The teacher has not started attendance.

### STUDENT_NOT_ENROLLED

The student is not enrolled in the class/session.

### SESSION_ALREADY_COMPLETED

The session has already been closed.

### ATTENDANCE_ALREADY_RECORDED

The student already has successful attendance for this session.

---

# 3. Proximity Failure States

### PROXIMITY_UNAVAILABLE

The browser/device cannot perform the required proximity check.

Examples:

* Required API unavailable
* Required hardware unavailable

### PROXIMITY_PERMISSION_DENIED

The user denied microphone/location/Bluetooth or another permission required by the selected proximity method.

### PROXIMITY_TIMEOUT

The system waited for a valid proximity proof but did not receive one within the allowed time.

### PROXIMITY_SIGNAL_NOT_DETECTED

No valid classroom proximity signal was detected.

### PROXIMITY_SIGNAL_INVALID

A signal was detected, but it was not a valid signal generated for the current session.

### PROXIMITY_CHALLENGE_EXPIRED

The received challenge is valid in structure but too old to be accepted.

### PROXIMITY_CHALLENGE_REPLAYED

The challenge was already used or appears to be a replay of an earlier proof.

### PROXIMITY_VERIFICATION_FAILED

The proximity evidence could not be verified.

### PROXIMITY_CONFLICT

Different proximity signals provide contradictory information.

Example:

```text
Acoustic proximity = PASS
GPS = clearly outside allowed area
```

The system should not automatically accept attendance when required signals conflict.

---

# 4. Camera Failure States

### CAMERA_UNAVAILABLE

The device has no usable camera.

### CAMERA_PERMISSION_DENIED

The student denied camera permission.

### CAMERA_PERMISSION_BLOCKED

The browser or operating system has permanently blocked access.

### CAMERA_INITIALIZATION_FAILED

The camera exists but could not be initialized.

### CAMERA_INTERRUPTED

Camera access was lost during verification.

### CAMERA_TIMEOUT

A usable camera frame was not obtained within the allowed time.

---

# 5. Face Detection Failure States

### FACE_NOT_DETECTED

No face was detected.

### MULTIPLE_FACES_DETECTED

More than one face is visible.

This should normally fail verification because the system cannot safely determine which person is being verified.

### FACE_TOO_SMALL

The detected face is too far from the camera for reliable verification.

### FACE_OUT_OF_FRAME

The face is not sufficiently visible.

### FACE_POOR_QUALITY

Image quality is insufficient.

Examples:

* Excessive blur
* Extreme darkness
* Excessive brightness
* Severe compression

### FACE_POOR_POSE

The face angle is outside the supported verification range.

### FACE_OCCLUDED

Important facial regions are obstructed.

Examples:

* Mask
* Hand
* Object covering the face

Do not automatically treat every accessory such as glasses as a failure unless the selected recognition model requires it.

---

# 6. Face Identity Failure States

### FACE_NOT_ENROLLED

No enrolled face profile exists for the student.

### FACE_MISMATCH

The detected face does not sufficiently match the enrolled student.

### FACE_CONFIDENCE_INSUFFICIENT

A face was detected and compared, but confidence did not reach the configured threshold.

### FACE_VERIFICATION_ERROR

The face-verification engine failed unexpectedly.

This is different from a genuine mismatch.

---

# 7. Liveness Failure States

### LIVENESS_UNAVAILABLE

The selected liveness mechanism cannot operate on the device.

### LIVENESS_TIMEOUT

The student did not complete the liveness process within the allowed period.

### LIVENESS_FAILED

The system could not establish that the camera contains a live person.

### POSSIBLE_PRESENTATION_ATTACK

The system detected behavior consistent with:

* Photograph
* Screen replay
* Recorded video
* Other presentation attack

Do not expose detailed detection signals to the student if doing so would make bypassing the system easier.

---

# 8. Device / Authentication Failure States

### STUDENT_NOT_AUTHENTICATED

The student is not logged in.

### DEVICE_NOT_REGISTERED

The device is not associated with the student's account when device registration is required.

### DEVICE_IDENTITY_MISMATCH

The current device identity conflicts with the expected student/device relationship.

### AUTHENTICATION_EXPIRED

The student's authentication session has expired.

### AUTHORIZATION_FAILED

The authenticated student does not have permission to attend the selected session.

---

# 9. Security Failure States

### INVALID_REQUEST

The request structure or required fields are invalid.

### INVALID_SIGNATURE

A cryptographic proof or signed request is invalid.

### NONCE_INVALID

The request contains an invalid or unexpected nonce.

### TIMESTAMP_INVALID

The request timestamp is outside the permitted verification window.

### REPLAY_DETECTED

The request appears to be a replay of previously accepted or observed evidence.

### RATE_LIMITED

Too many verification attempts were made within the allowed period.

### SUSPICIOUS_ACTIVITY

The system detected behavior requiring security review but cannot confidently classify the reason.

Do not automatically mark attendance as failed solely because of a generic security anomaly unless your security policy explicitly requires it.

---

# 10. Network / System Failure States

### NETWORK_UNAVAILABLE

The student's device cannot communicate with the backend.

### SERVER_UNAVAILABLE

The verification service is unavailable.

### VERIFICATION_SERVICE_ERROR

A required verification service failed unexpectedly.

### DATABASE_ERROR

The attendance record could not be read or written correctly.

### INTERNAL_ERROR

An unexpected server-side error occurred.

Never convert an internal error into:

```text
FACE_MISMATCH
```

or

```text
PROXIMITY_FAILED
```

unless that was actually the cause.

---

# 11. Final Decision States

The backend should normalize all verification results into a small set of final outcomes.

### ACCEPTED

```text
Session ✓
Student ✓
Proximity ✓
Face ✓
Liveness ✓
Security ✓

→ ATTENDANCE_ACCEPTED
```

### REJECTED

A required verification condition genuinely failed.

Example:

```text
Proximity failed
→ ATTENDANCE_REJECTED
```

### RETRY_REQUIRED

The attempt failed because the verification input was insufficient but there is no evidence of fraud.

Examples:

```text
FACE_TOO_SMALL
FACE_POOR_QUALITY
PROXIMITY_TIMEOUT
CAMERA_TIMEOUT
```

The student may retry after a short delay.

### BLOCKED

The system should stop further attempts for the current session/device because of a security or policy condition.

Examples:

```text
REPLAY_DETECTED
RATE_LIMITED
POSSIBLE_PRESENTATION_ATTACK
```

### SYSTEM_ERROR

The verification could not be completed because of a system problem rather than the student's failure.

Examples:

```text
SERVER_UNAVAILABLE
DATABASE_ERROR
VERIFICATION_SERVICE_ERROR
```

This should allow the student to try again later without incorrectly accusing them of failing verification.

---

# 12. Recommended State Categories

For implementation, organize every failure into one of these categories:

```text
SESSION
PROXIMITY
CAMERA
FACE_DETECTION
FACE_IDENTITY
LIVENESS
AUTHENTICATION
SECURITY
SYSTEM
```

Each state should contain:

```text
code
category
userMessage
retryable
securitySensitive
severity
```

Example:

```json
{
  "code": "FACE_POOR_QUALITY",
  "category": "FACE_DETECTION",
  "userMessage": "Move to a brighter area and hold your phone steady.",
  "retryable": true,
  "securitySensitive": false,
  "severity": "LOW"
}
```

For a security-sensitive failure:

```json
{
  "code": "REPLAY_DETECTED",
  "category": "SECURITY",
  "userMessage": "Verification could not be completed.",
  "retryable": false,
  "securitySensitive": true,
  "severity": "HIGH"
}
```

Do not reveal the exact security-detection reason to the student when doing so could help bypass the system.

---

# 13. Student-Facing Messages

Do not expose raw internal codes.

Use simple messages such as:

```text
"Attendance session has ended."
"Classroom proximity could not be verified."
"Please allow microphone access."
"Please allow camera access."
"No face detected. Look directly at the camera."
"Multiple faces detected. Make sure only you are visible."
"Face verification failed."
"Please improve lighting and try again."
"Liveness verification failed. Please try again."
"Attendance has already been recorded."
"Verification is temporarily unavailable. Please try again."
```

The internal system should retain the precise failure code.

---

# 14. Important Rule for Retry Logic

Not every failure should behave the same way.

### Automatically retryable

```text
PROXIMITY_TIMEOUT
CAMERA_TIMEOUT
FACE_NOT_DETECTED
FACE_TOO_SMALL
FACE_OUT_OF_FRAME
FACE_POOR_QUALITY
FACE_POOR_POSE
LIVENESS_TIMEOUT
NETWORK_UNAVAILABLE
```

### User-correctable but require a new attempt

```text
CAMERA_PERMISSION_DENIED
PROXIMITY_PERMISSION_DENIED
FACE_MISMATCH
LIVENESS_FAILED
```

### Do not immediately retry

```text
REPLAY_DETECTED
RATE_LIMITED
POSSIBLE_PRESENTATION_ATTACK
SESSION_EXPIRED
ATTENDANCE_ALREADY_RECORDED
```

### System-side recovery

```text
SERVER_UNAVAILABLE
DATABASE_ERROR
VERIFICATION_SERVICE_ERROR
INTERNAL_ERROR
```

---

# 15. Core Rule

Never collapse every failure into:

```text
"Verification failed"
```

The backend should know exactly **which verification stage failed and why**, while the student should receive only the amount of information necessary to correct the problem.

This separation is required:

```text
INTERNAL FAILURE CODE
        ↓
Security / logging / analytics
        ↓
USER-SAFE MESSAGE
```
