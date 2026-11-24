# Firestore Security Specification — أكاديمية الأستاذ دقيش علي (3AM Math)

## 1. Data Invariants
1. **Admin Authority**: Only verified admins (`request.auth.token.email == 'akakabdelmalek@gmail.com' && request.auth.token.email_verified == true` or active `/admins/$(request.auth.uid)` doc) can create, edit, or delete `courses`, `exercises`, `events`, `settings`, or `admins`, and read/delete arbitrary student records.
2. **Self-Assigned Role Prevention**: On `/users/{userId}`, users can only create their own profile (`userId == request.auth.uid`) with `role == 'student'`, and cannot escalate `role` to `'admin'` during updates.
3. **PII Protection**: `/users/{userId}` (which may hold `email`) is readable ONLY by the document owner (`isOwner(userId)`) or `isAdmin()`. Public leaderboard/scores NEVER store `email`, `phone`, or `address`.
4. **Student Progress Ownership**: `/studentProgress/{userId}` can only be read, created, and updated by `isOwner(userId)` or `isAdmin()`.
5. **Score Integrity**: `/scores/{scoreId}` requires an authenticated user (`isSignedIn()`), `studentUid == request.auth.uid`, valid bounded math scores (`score >= 0 && score <= total`, `total > 0 && total <= 500`, `outOf20 >= 0 && outOf20 <= 20`, `percentage >= 0 && percentage <= 100`), server timestamp (`createdAt == request.time`), and immutability after creation (except `isAdmin()` delete).
6. **Published Content Enforcement**: `allow list` on `courses`, `exercises`, and `events` strictly checks `resource.data.published == true || isAdmin()`, preventing scraping of unpublished drafts.
7. **Timestamp & ID Hardening**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), all strings have explicit `.size()` bounds, and `createdAt`/`updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Role Escalation on Registration**: Student creates `/users/{uid}` with `{ uid, displayName: "Ali", role: "admin", createdAt, updatedAt }`.
2. **Role Escalation on Update**: Student updates `/users/{uid}` changing `role` from `"student"` to `"admin"`.
3. **Cross-User PII Read**: Signed-in student attempts `get(/users/otherStudentUid)` to read another user's email.
4. **Unauthenticated Course Write**: Anonymous/unauthenticated user attempts `create` on `/courses/c1`.
5. **Student Modifying Exercise Answers**: Signed-in student attempts `update` on `/exercises/ex1` to alter `questions[0].answer`.
6. **Student Publishing Draft Event**: Signed-in student attempts `create` on `/events/ev1`.
7. **Score Identity Spoofing**: Student A attempts `create` on `/scores/s1` with `studentUid: "studentB"`.
8. **Score Ghost Field ("Shadow Write")**: Student creates `/scores/s1` with extra field `verifiedByAdmin: true`.
9. **Score Out-of-Bounds Injection**: Student creates `/scores/s1` with `score: 999, total: 10, outOf20: 500`.
10. **Forged Timestamp**: Client submits `/scores/s1` with backdated `createdAt: Timestamp(2020-01-01)`.
11. **ID Poisoning (1.5KB Document ID)**: Client attempts `create` at `/scores/${"a".repeat(500)}`.
12. **Unpublished Draft Scraping**: Student runs `list` on `/exercises` without filtering `published == true`.
