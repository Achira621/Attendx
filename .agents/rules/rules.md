---
trigger: always_on
---

# DEVELOPMENT RULES

## 1. Core Attendance Rule

Attendance is valid only when ALL required conditions pass:

```text
Valid Session
AND
Valid Student
AND
Proximity Verified
AND
Face Verified
AND
Liveness Verified
```

If any required condition fails, attendance must be rejected.

---

## 2. Proximity Rules

* Proximity means the student's device/person is physically within the classroom vicinity.
* Do NOT assume Wi-Fi/hotspot is mandatory.
* The proximity technology must be modular and replaceable.
* The first implementation should experiment with acoustic proximity.
* Keep the architecture open for GPS, Wi-Fi, Bluetooth, UWB, native APIs, or other suitable methods later.
* Do not hard-code attendance logic to one proximity technology.
* Never trust a frontend claim such as `proximity=true`.
* Proximity evidence must be validated by the backend.
* Use short-lived, session-specific, unpredictable proximity challenges.
* Never use a permanent/static proximity token.
* Protect against replay of previously captured proximity signals.
* Treat proximity as evidence of physical presence, not as absolute proof of location.
* Any proximity technology must be tested on real devices before being considered reliable.

---

## 3. Face Verification Rules

* The student's own device performs the face scan.
* The teacher must NOT scan students.
* Face verification occurs once per attendance attempt.
* Do NOT continuously scan or stream the student's camera.
* Face verification must compare the presented face against the enrolled student's identity.
* Use an established computer-vision solution. Do not invent a face-recognition algorithm from scratch.
* Prefer local/on-device processing where practical.
* Do not unnecessarily transmit or store raw camera images.
* Camera permission denial must be handled gracefully.
* Face verification must happen before attendance is accepted.

---

## 4. Liveness Rules

* Face matching alone is insufficient.
* Include a liveness/anti-spoofing check.
* A photograph, screenshot, or simple recorded video must not automatically pass.
* Liveness must produce a verifiable result.
* Do not claim production-grade anti-spoofing until it has been tested against realistic attacks.

---

## 5. Backend Rules

* Never trust the frontend for security decisions.
* The backend must make the final attendance decision.
* Validate session, student identity, proximity proof, face result, liveness result, timestamps, and challenge freshness.
* Prevent duplicate attendance for the same student and session.
* Reject expired sessions.
* Reject replayed challenges.
* Reject malformed or manipulated requests.
* Use secure authentication and authorization.
* Keep teacher and student permissions separate.
* Store secrets only in environment variables or a secure secret store.
* Never hard-code credentials, API keys, or secrets.

---

## 6. Architecture Rules

Keep these components independent:

```text
SessionManager
AttendanceEngine
ProximityProvider
FaceVerificationProvider
LivenessProvider
NotificationService
```

* The attendance engine must not depend directly on the acoustic implementation.
* Proximity providers must be replaceable without rewriting attendance logic.
* Face-verification providers must be replaceable without rewriting attendance logic.
* Keep business logic separate from UI components.
* Keep verification logic separate from presentation code.

---

## 7. Privacy Rules

* Collect the minimum biometric data necessary.
* Avoid storing raw face images unless absolutely necessary.
* Prefer face embeddings or equivalent minimal representations where appropriate.
* Clearly separate biometric data from normal user data.
* Do not expose biometric information to teachers or other students.
* Do not send continuous camera feeds to the teacher.
* Do not retain verification data longer than necessary.
* Design the system assuming biometric information is sensitive.

---

## 8. Browser Rules

* The application must work on modern mobile and desktop browsers where technically supported.
* Use HTTPS for camera and microphone access.
* Handle unsupported browser capabilities gracefully.
* Never assume microphone, camera, GPS, Bluetooth, or push support is universal.
* Provide clear fallback/error messages when a browser cannot support a required feature.
* Do not silently fail when permissions are denied.

---

## 9. UX Rules

Student attendance flow should remain simple:

```text
Open Attendance
↓
Mark Attendance
↓
Verify Proximity
↓
Verify Face
↓
Verify Liveness
↓
Attendance Result
```

* Do not make students repeatedly scan their face.
* Do not make students manually enter unnecessary codes if the system can perform verification automatically.
* Show clear progress states.
* Show clear success/failure reasons.
* Do not expose internal security details that would help bypass verification.

---

## 10. Anti-Proxy Rules

The system must handle these cases:

```text
Correct account + remote location
→ Reject

Wrong person + classroom
→ Reject

Correct person + classroom
→ Accept

Photo of student
→ Reject

Recorded video
→ Reject

Expired session
→ Reject

Replayed proximity proof
→ Reject

Duplicate attendance
→ Reject
```

Never allow a QR code, shared link, login credentials, or frontend manipulation alone to count as attendance.

---

## 11. Development Rules

* Do not build the entire system in one step.
* First create an implementation plan.
* Identify high-risk technical assumptions before full implementation.
* Build difficult components as isolated proof-of-concepts first.
* Test acoustic proximity independently before integrating it.
* Test face verification independently before integrating it.
* Test camera/microphone access on real phones and laptops.
* Test the complete attendance decision only after the individual systems work.

---

## 12. Testing Rules

Test on:

* Android phones
* iPhones
* Windows laptops
* macOS laptops
* Different browsers
* Different microphones
* Different cameras
* Noisy classrooms
* Multiple students simultaneously

Test both success and failure cases.

For every security-sensitive component, include tests for:

```text
Normal use
Replay
Spoofing
Tampering
Expired data
Duplicate requests
Permission denial
Unsupported device
Network failure
```

---

## 13. Code Quality Rules

* Use strict TypeScript.
* Prefer small, modular functions.
* Avoid duplicated logic.
* Validate all external inputs.
* Add proper error handling.
* Use meaningful names.
* Keep APIs documented.
* Keep security-sensitive code easy to audit.
* Add automated tests for attendance decision logic.
* Do not use temporary hacks as permanent architecture.

---

## 14. Critical Rule

When a technology is uncertain, do NOT pretend it works.

Instead:

```text
Identify assumption
↓
Build small prototype
↓
Test on real hardware
↓
Measure reliability
↓
Only then integrate into the main system
```

This rule is especially important for:

* Acoustic proximity
* Liveness detection
* Mobile browser camera access
* Mobile browser microphone access
* Any device-specific proximity mechanism

---

## 15. Final Principle

The system should answer two independent questions:

```text
1. Is this student physically present in the classroom?
2. Is the person marking attendance actually that student?
```

Only when both answers are verified should attendance be recorded.
