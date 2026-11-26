import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
  PRIMARY_ADMIN_EMAIL,
} from '../firebase';
import { getSeedDataForLevel } from '../data/seedData';
import type {
  AcademySettings,
  ClassLevel,
  Course,
  CourseAttachmentMeta,
  CourseAttachmentRecord,
  EventItem,
  Exercise,
  GeometryShape,
  Question,
  ScoreRecord,
  StudentProgress,
  UserProfile,
} from '../types/math';
import { splitDataUrlChunks } from '../utils/lessonFileImport';
import {
  CLASS_LEVEL_META,
  sanitizeDocId,
  verifyAdminAccessCode,
} from '../utils/mathPlatform';

function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toMillis' in val &&
    typeof (val as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function levelCollectionPath(level: ClassLevel, colName: string): string {
  return level === '3AM' ? colName : `levels/${level}/${colName}`;
}

export function levelDocPath(level: ClassLevel, colName: string, id: string): string {
  return level === '3AM' ? `${colName}/${id}` : `levels/${level}/${colName}/${id}`;
}

function levelCollectionRef(
  level: ClassLevel,
  colName: string
): CollectionReference<DocumentData> {
  return level === '3AM'
    ? collection(db, colName)
    : collection(db, 'levels', level, colName);
}

function levelDocRef(
  level: ClassLevel,
  colName: string,
  id: string
): DocumentReference<DocumentData> {
  return level === '3AM'
    ? doc(db, colName, id)
    : doc(db, 'levels', level, colName, id);
}

export async function checkAdminAccess(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (
    user.email &&
    user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() &&
    user.emailVerified
  ) {
    return true;
  }
  try {
    const adminRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminRef);
    return snap.exists() && snap.data()?.active === true;
  } catch {
    return false;
  }
}

export async function activateAdminWithCode(user: User, rawCode: string): Promise<boolean> {
  if (!verifyAdminAccessCode(rawCode)) {
    return false;
  }
  const alreadyAdmin = await checkAdminAccess(user);
  if (alreadyAdmin) {
    return true;
  }
  if (!user.email) {
    return false;
  }

  const normalizedEmail = user.email.trim().toLowerCase().slice(0, 160);
  const path = `admins/${user.uid}`;
  const adminRef = doc(db, 'admins', user.uid);
  try {
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      await updateDoc(adminRef, {
        email: normalizedEmail,
        active: true,
        accessCode: 'منصة الرياضيات',
      });
    } else {
      await setDoc(adminRef, {
        email: normalizedEmail,
        active: true,
        accessCode: 'منصة الرياضيات',
        createdAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function ensureUserProfile(
  user: User,
  overrides?: { displayName?: string; classGroup?: string; role?: 'student' | 'admin' },
  level: ClassLevel = '3AM'
): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const isAdmin = await checkAdminAccess(user);
  const defaultStudentName = `تلميذ ${CLASS_LEVEL_META[level]?.shortLabel || '3 متوسط'}`;

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const resolvedRole = isAdmin ? 'admin' : data.role || 'student';
      if (
        overrides?.displayName ||
        overrides?.classGroup ||
        (isAdmin && data.role !== 'admin')
      ) {
        await updateDoc(ref, {
          displayName: (
            overrides?.displayName ||
            data.displayName ||
            user.displayName ||
            defaultStudentName
          ).slice(0, 80),
          classGroup: (overrides?.classGroup || data.classGroup || level).slice(0, 30),
          role: resolvedRole,
          updatedAt: serverTimestamp(),
        });
      }
      return {
        ...data,
        role: resolvedRole,
      };
    }

    const fallbackName =
      overrides?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email?.split('@')[0] ||
      defaultStudentName;
    const role = isAdmin ? 'admin' : 'student';

    const payload: Record<string, unknown> = {
      uid: user.uid,
      displayName: fallbackName.slice(0, 80),
      classGroup: (overrides?.classGroup || level).slice(0, 30),
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (user.email) {
      payload.email = user.email.slice(0, 160);
    }

    await setDoc(ref, payload);
    return {
      uid: user.uid,
      displayName: payload.displayName as string,
      email: user.email || undefined,
      classGroup: payload.classGroup as string,
      role,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function ensureStudentProgress(
  user: User,
  studentName: string,
  level: ClassLevel = '3AM'
): Promise<StudentProgress> {
  const path = levelDocPath(level, 'studentProgress', user.uid);
  const ref = levelDocRef(level, 'studentProgress', user.uid);
  const defaultStudentName = `تلميذ ${CLASS_LEVEL_META[level]?.shortLabel || '3 متوسط'}`;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as StudentProgress;
    }
    const initial: StudentProgress = {
      userId: user.uid,
      studentName: (studentName || defaultStudentName).slice(0, 80),
      completedCourseIds: [],
      completedExerciseIds: [],
      totalAttempts: 0,
      bestOutOf20: 0,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return initial;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function forwardSnapshotError(
  error: unknown,
  op: OperationType,
  path: string,
  onError?: (err: Error) => void
) {
  try {
    handleFirestoreError(error, op, path);
  } catch (err) {
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
}

export function subscribeCourses(
  isAdmin: boolean,
  onData: (items: Course[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'courses');
  const col = levelCollectionRef(level, 'courses');
  const q = isAdmin ? query(col) : query(col, where('published', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ ...(d.data() as Omit<Course, 'id'>), id: d.id }))
        .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribeExercises(
  isAdmin: boolean,
  onData: (items: Exercise[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'exercises');
  const col = levelCollectionRef(level, 'exercises');
  const q = isAdmin ? query(col) : query(col, where('published', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ ...(d.data() as Omit<Exercise, 'id'>), id: d.id }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribeEvents(
  isAdmin: boolean,
  onData: (items: EventItem[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'events');
  const col = levelCollectionRef(level, 'events');
  const q = isAdmin ? query(col) : query(col, where('published', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ ...(d.data() as Omit<EventItem, 'id'>), id: d.id }))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribePublicScores(
  onData: (items: ScoreRecord[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'scores');
  const q = query(levelCollectionRef(level, 'scores'), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => {
          const data = d.data() as Omit<ScoreRecord, 'id'>;
          return { ...data, id: d.id, createdAtMs: toMillis(data.createdAt) };
        })
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribeStudentScores(
  uid: string,
  onData: (items: ScoreRecord[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'scores');
  const q = query(levelCollectionRef(level, 'scores'), where('studentUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => {
          const data = d.data() as Omit<ScoreRecord, 'id'>;
          return { ...data, id: d.id, createdAtMs: toMillis(data.createdAt) };
        })
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribeAllScoresAdmin(
  onData: (items: ScoreRecord[]) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelCollectionPath(level, 'scores');
  return onSnapshot(
    levelCollectionRef(level, 'scores'),
    (snap) => {
      const list = snap.docs
        .map((d) => {
          const data = d.data() as Omit<ScoreRecord, 'id'>;
          return { ...data, id: d.id, createdAtMs: toMillis(data.createdAt) };
        })
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => forwardSnapshotError(error, OperationType.LIST, path, onError)
  );
}

export function subscribeStudentProgress(
  uid: string,
  onData: (progress: StudentProgress | null) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelDocPath(level, 'studentProgress', uid);
  return onSnapshot(
    levelDocRef(level, 'studentProgress', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as StudentProgress) : null);
    },
    (error) => forwardSnapshotError(error, OperationType.GET, path, onError)
  );
}

export function subscribeSettings(
  onData: (settings: AcademySettings, existsInDb: boolean) => void,
  onError?: (err: Error) => void,
  level: ClassLevel = '3AM'
): Unsubscribe {
  const path = levelDocPath(level, 'settings', 'main');
  const fallbackSettings = getSeedDataForLevel(level).settings;
  return onSnapshot(
    levelDocRef(level, 'settings', 'main'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as AcademySettings, true);
      } else {
        onData(fallbackSettings, false);
      }
    },
    (error) => forwardSnapshotError(error, OperationType.GET, path, onError)
  );
}

export async function submitExerciseScore(
  params: {
    user: User;
    studentName: string;
    studentClass?: string;
    exercise: Exercise;
    earnedPoints: number;
    totalPoints: number;
    outOf20: number;
    percentage: number;
    durationSeconds: number;
    isPublic?: boolean;
    studentDrawing?: GeometryShape[];
  },
  level: ClassLevel = '3AM'
): Promise<void> {
  const scoreId = sanitizeDocId(`sc_${params.user.uid.slice(0, 8)}_${Date.now()}`);
  const scorePath = levelDocPath(level, 'scores', scoreId);
  const defaultStudentName = `تلميذ ${CLASS_LEVEL_META[level]?.shortLabel || '3 متوسط'}`;

  try {
    const scorePayload: Record<string, unknown> = {
      studentName: params.studentName.trim().slice(0, 80) || defaultStudentName,
      studentUid: params.user.uid,
      exerciseId: sanitizeDocId(params.exercise.id),
      exerciseTitle: params.exercise.title.slice(0, 160),
      chapter: params.exercise.chapter.slice(0, 100),
      score: Math.max(0, Math.min(params.earnedPoints, params.totalPoints)),
      total: Math.max(1, params.totalPoints),
      outOf20: Math.max(0, Math.min(20, params.outOf20)),
      percentage: Math.max(0, Math.min(100, params.percentage)),
      durationSeconds: Math.max(0, Math.round(params.durationSeconds)),
      isPublic: params.isPublic !== false,
      gradedStatus: 'auto',
      createdAt: serverTimestamp(),
    };
    if (params.studentClass) {
      scorePayload.studentClass = params.studentClass.trim().slice(0, 30);
    }
    if (params.studentDrawing && params.studentDrawing.length > 0) {
      scorePayload.studentDrawing = params.studentDrawing.slice(0, 80);
    }

    await setDoc(levelDocRef(level, 'scores', scoreId), scorePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, scorePath);
  }

  const progPath = levelDocPath(level, 'studentProgress', params.user.uid);
  const progRef = levelDocRef(level, 'studentProgress', params.user.uid);
  try {
    const snap = await getDoc(progRef);
    const safeExId = sanitizeDocId(params.exercise.id);
    if (!snap.exists()) {
      await setDoc(progRef, {
        userId: params.user.uid,
        studentName: params.studentName.trim().slice(0, 80) || defaultStudentName,
        completedCourseIds: [],
        completedExerciseIds: [safeExId],
        totalAttempts: 1,
        bestOutOf20: Math.max(0, Math.min(20, params.outOf20)),
        updatedAt: serverTimestamp(),
      });
    } else {
      const cur = snap.data() as StudentProgress;
      const completedEx = Array.from(
        new Set([...(cur.completedExerciseIds || []), safeExId])
      ).slice(0, 200);
      await updateDoc(progRef, {
        studentName: params.studentName.trim().slice(0, 80) || cur.studentName,
        completedExerciseIds: completedEx,
        totalAttempts: (cur.totalAttempts || 0) + 1,
        bestOutOf20: Math.max(cur.bestOutOf20 || 0, Math.min(20, params.outOf20)),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, progPath);
  }
}

export async function toggleCourseCompletion(
  user: User,
  studentName: string,
  courseId: string,
  level: ClassLevel = '3AM'
): Promise<boolean> {
  const progPath = levelDocPath(level, 'studentProgress', user.uid);
  const progRef = levelDocRef(level, 'studentProgress', user.uid);
  const safeId = sanitizeDocId(courseId);
  const defaultStudentName = `تلميذ ${CLASS_LEVEL_META[level]?.shortLabel || '3 متوسط'}`;

  try {
    const snap = await getDoc(progRef);
    if (!snap.exists()) {
      await setDoc(progRef, {
        userId: user.uid,
        studentName: studentName.trim().slice(0, 80) || defaultStudentName,
        completedCourseIds: [safeId],
        completedExerciseIds: [],
        totalAttempts: 0,
        bestOutOf20: 0,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    const cur = snap.data() as StudentProgress;
    const exists = (cur.completedCourseIds || []).includes(safeId);
    const next = exists
      ? (cur.completedCourseIds || []).filter((id) => id !== safeId)
      : Array.from(new Set([...(cur.completedCourseIds || []), safeId])).slice(0, 100);

    await updateDoc(progRef, {
      completedCourseIds: next,
      updatedAt: serverTimestamp(),
    });
    return !exists;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, progPath);
  }
}

export async function getCourseAttachment(
  attachmentId: string,
  level: ClassLevel = '3AM'
): Promise<CourseAttachmentRecord | null> {
  const safeId = sanitizeDocId(attachmentId);
  const path = levelDocPath(level, 'courseAttachments', safeId);
  try {
    const snap = await getDoc(levelDocRef(level, 'courseAttachments', safeId));
    if (!snap.exists()) return null;
    const record = {
      ...(snap.data() as Omit<CourseAttachmentRecord, 'id'>),
      id: snap.id,
    };
    if ((record.chunkCount || 1) > 1) {
      const chunksSnap = await getDocs(
        query(
          levelCollectionRef(level, 'courseAttachmentChunks'),
          where('attachmentId', '==', safeId)
        )
      );
      const sorted = chunksSnap.docs
        .map((d) => d.data() as { chunkIndex: number; dataChunk: string })
        .sort((a, b) => a.chunkIndex - b.chunkIndex);
      record.dataUrl = `${record.dataUrl}${sorted.map((c) => c.dataChunk).join('')}`;
    }
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCourse(
  adminUid: string,
  course: Omit<Course, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    pendingAttachments?: { meta: CourseAttachmentMeta; dataUrl: string }[];
    removedAttachmentIds?: string[];
  },
  level: ClassLevel = '3AM'
): Promise<string> {
  const id = course.id ? sanitizeDocId(course.id) : sanitizeDocId(`course_${Date.now()}`);
  const path = levelDocPath(level, 'courses', id);
  const ref = levelDocRef(level, 'courses', id);
  try {
    const snap = await getDoc(ref);
    const cleanAttachments: CourseAttachmentMeta[] = (course.attachments || [])
      .slice(0, 10)
      .map((a) => ({
        id: sanitizeDocId(a.id),
        fileName: String(a.fileName || 'file').slice(0, 200),
        fileKind: a.fileKind || 'other',
        mimeType: String(a.mimeType || 'application/octet-stream').slice(0, 160),
        sizeBytes: Math.max(1, Number(a.sizeBytes) || 1),
      }));

    const mutableFields: Record<string, unknown> = {
      title: course.title.trim().slice(0, 160),
      chapter: course.chapter.trim().slice(0, 100),
      chapterOrder: Number(course.chapterOrder) || 1,
      summary: course.summary.trim().slice(0, 4000),
      keyRules: (course.keyRules || '').trim().slice(0, 4000),
      videoUrl: (course.videoUrl || '').trim().slice(0, 500),
      pdfUrl: (course.pdfUrl || '').trim().slice(0, 500),
      attachments: cleanAttachments,
      durationMin: Math.max(1, Math.min(600, Number(course.durationMin) || 20)),
      published: Boolean(course.published),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, mutableFields);
    } else {
      await setDoc(ref, {
        ...mutableFields,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
      });
    }

    if (course.removedAttachmentIds && course.removedAttachmentIds.length > 0) {
      for (const remId of course.removedAttachmentIds) {
        const safeAttId = sanitizeDocId(remId);
        const chunkSnap = await getDocs(
          query(
            levelCollectionRef(level, 'courseAttachmentChunks'),
            where('attachmentId', '==', safeAttId)
          )
        ).catch(() => null);
        if (chunkSnap && !chunkSnap.empty) {
          for (const d of chunkSnap.docs) {
            await deleteDoc(levelDocRef(level, 'courseAttachmentChunks', d.id)).catch(
              () => undefined
            );
          }
        }
        await deleteDoc(levelDocRef(level, 'courseAttachments', safeAttId)).catch(
          () => undefined
        );
      }
    }

    if (course.pendingAttachments && course.pendingAttachments.length > 0) {
      for (const item of course.pendingAttachments.slice(0, 10)) {
        const safeAttId = sanitizeDocId(item.meta.id);
        const chunks = splitDataUrlChunks(String(item.dataUrl));
        const firstChunk = chunks[0] || '';
        await setDoc(levelDocRef(level, 'courseAttachments', safeAttId), {
          courseId: id,
          fileName: String(item.meta.fileName || 'file').slice(0, 200),
          fileKind: item.meta.fileKind || 'other',
          mimeType: String(item.meta.mimeType || 'application/octet-stream').slice(0, 160),
          sizeBytes: Math.max(1, Math.min(6500000, Number(item.meta.sizeBytes) || 1)),
          dataUrl: firstChunk.slice(0, 980000),
          chunkCount: chunks.length,
          published: Boolean(course.published),
          createdBy: adminUid,
          createdAt: serverTimestamp(),
        });

        for (let ci = 1; ci < chunks.length && ci <= 14; ci++) {
          const chunkId = sanitizeDocId(`${safeAttId}_c_${ci}`);
          await setDoc(levelDocRef(level, 'courseAttachmentChunks', chunkId), {
            attachmentId: safeAttId,
            courseId: id,
            chunkIndex: ci,
            dataChunk: chunks[ci].slice(0, 750000),
            published: Boolean(course.published),
            createdBy: adminUid,
            createdAt: serverTimestamp(),
          });
        }
      }
    }

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCourse(
  courseId: string,
  level: ClassLevel = '3AM'
): Promise<void> {
  const safeCourseId = sanitizeDocId(courseId);
  const path = levelDocPath(level, 'courses', safeCourseId);
  try {
    const chunkSnap = await getDocs(
      query(
        levelCollectionRef(level, 'courseAttachmentChunks'),
        where('courseId', '==', safeCourseId)
      )
    ).catch(() => null);
    if (chunkSnap && !chunkSnap.empty) {
      for (const d of chunkSnap.docs) {
        await deleteDoc(levelDocRef(level, 'courseAttachmentChunks', d.id)).catch(
          () => undefined
        );
      }
    }
    const attSnap = await getDocs(
      query(
        levelCollectionRef(level, 'courseAttachments'),
        where('courseId', '==', safeCourseId)
      )
    ).catch(() => null);
    if (attSnap && !attSnap.empty) {
      for (const d of attSnap.docs) {
        await deleteDoc(levelDocRef(level, 'courseAttachments', d.id)).catch(() => undefined);
      }
    }
    await deleteDoc(levelDocRef(level, 'courses', safeCourseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function sanitizeQuestionsForFirestore(questions: Question[]): Record<string, unknown>[] {
  return questions.slice(0, 30).map((q, idx) => {
    const base: Record<string, unknown> = {
      id: sanitizeDocId(q.id || `q_${Date.now()}_${idx}`),
      type: q.type === 'number' || q.type === 'text' ? q.type : 'choice',
      prompt: String(q.prompt || '').trim().slice(0, 1000),
      points: Math.max(1, Math.min(20, Number(q.points) || 1)),
    };
    if (q.explanation && q.explanation.trim()) {
      base.explanation = q.explanation.trim().slice(0, 1000);
    }
    if (q.unit && q.unit.trim()) {
      base.unit = q.unit.trim().slice(0, 30);
    }
    if (base.type === 'choice') {
      base.choices = (q.choices || ['', '', '', ''])
        .slice(0, 6)
        .map((c) => String(c || '').slice(0, 300));
      base.correctChoiceIndex =
        typeof q.correctChoiceIndex === 'number' ? q.correctChoiceIndex : 0;
    } else if (base.type === 'number') {
      base.correctNumber = Number.isFinite(Number(q.correctNumber)) ? Number(q.correctNumber) : 0;
      if (Array.isArray(q.acceptedNumbers) && q.acceptedNumbers.length > 0) {
        base.acceptedNumbers = q.acceptedNumbers.filter((n) => Number.isFinite(n)).slice(0, 10);
      }
    } else {
      base.correctText = String(q.correctText || '').trim().slice(0, 400);
      if (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0) {
        base.acceptedAnswers = q.acceptedAnswers
          .map((a) => String(a || '').trim().slice(0, 400))
          .filter(Boolean)
          .slice(0, 10);
      }
    }
    return base;
  });
}

export async function saveExercise(
  adminUid: string,
  exercise: Omit<Exercise, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string },
  level: ClassLevel = '3AM'
): Promise<string> {
  const id = exercise.id ? sanitizeDocId(exercise.id) : sanitizeDocId(`ex_${Date.now()}`);
  const path = levelDocPath(level, 'exercises', id);
  const ref = levelDocRef(level, 'exercises', id);
  try {
    const snap = await getDoc(ref);
    const mutableFields: Record<string, unknown> = {
      title: exercise.title.trim().slice(0, 160),
      chapter: exercise.chapter.trim().slice(0, 100),
      category: exercise.category,
      difficulty: exercise.difficulty,
      durationMinutes: Math.max(1, Math.min(240, Number(exercise.durationMinutes) || 15)),
      description: (exercise.description || '').trim().slice(0, 2000),
      attachmentUrl: (exercise.attachmentUrl || '').trim().slice(0, 500),
      questions: sanitizeQuestionsForFirestore(exercise.questions),
      published: Boolean(exercise.published),
      updatedAt: serverTimestamp(),
    };
    if (exercise.geometryData) {
      const gd = exercise.geometryData;
      const sanitizedGeometry: Record<string, unknown> = {
        templateKey: gd.templateKey || 'custom',
        canvasWidth: Math.max(200, Math.min(1200, Number(gd.canvasWidth) || 480)),
        canvasHeight: Math.max(150, Math.min(1000, Number(gd.canvasHeight) || 320)),
        baseShapes: (gd.baseShapes || []).slice(0, 50),
        drawPrompt: (gd.drawPrompt || '').trim().slice(0, 1000),
        teacherCorrectionText: (gd.teacherCorrectionText || '').trim().slice(0, 4000),
        teacherCorrectionShapes: (gd.teacherCorrectionShapes || []).slice(0, 80),
      };
      if (gd.teacherCorrectionImageUrl && gd.teacherCorrectionImageUrl.trim()) {
        sanitizedGeometry.teacherCorrectionImageUrl = gd.teacherCorrectionImageUrl
          .trim()
          .slice(0, 500);
      }
      mutableFields.geometryData = sanitizedGeometry;
    }
    if (snap.exists()) {
      await updateDoc(ref, mutableFields);
    } else {
      await setDoc(ref, {
        ...mutableFields,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
      });
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExercise(
  exerciseId: string,
  level: ClassLevel = '3AM'
): Promise<void> {
  const path = levelDocPath(level, 'exercises', exerciseId);
  try {
    await deleteDoc(levelDocRef(level, 'exercises', exerciseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEvent(
  adminUid: string,
  event: Omit<EventItem, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string },
  level: ClassLevel = '3AM'
): Promise<string> {
  const id = event.id ? sanitizeDocId(event.id) : sanitizeDocId(`evt_${Date.now()}`);
  const path = levelDocPath(level, 'events', id);
  const ref = levelDocRef(level, 'events', id);
  try {
    const snap = await getDoc(ref);
    const mutableFields: Record<string, unknown> = {
      title: event.title.trim().slice(0, 160),
      eventType: event.eventType,
      eventDate: event.eventDate.trim().slice(0, 20),
      eventTime: event.eventTime.trim().slice(0, 20),
      description: event.description.trim().slice(0, 1500),
      link: (event.link || '').trim().slice(0, 500),
      published: Boolean(event.published),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, mutableFields);
    } else {
      await setDoc(ref, {
        ...mutableFields,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
      });
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEvent(
  eventId: string,
  level: ClassLevel = '3AM'
): Promise<void> {
  const path = levelDocPath(level, 'events', eventId);
  try {
    await deleteDoc(levelDocRef(level, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteScoreRecord(
  scoreId: string,
  level: ClassLevel = '3AM'
): Promise<void> {
  const path = levelDocPath(level, 'scores', scoreId);
  try {
    await deleteDoc(levelDocRef(level, 'scores', scoreId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTeacherScoreCorrection(
  scoreId: string,
  params: {
    teacherNote: string;
    teacherCorrectionShapes: GeometryShape[];
    total: number;
    outOf20?: number;
  },
  level: ClassLevel = '3AM'
): Promise<void> {
  const path = levelDocPath(level, 'scores', scoreId);
  try {
    const updates: Record<string, unknown> = {
      teacherNote: params.teacherNote.trim().slice(0, 2000),
      teacherCorrectionShapes: params.teacherCorrectionShapes.slice(0, 80),
      gradedStatus: 'reviewed',
    };
    if (typeof params.outOf20 === 'number' && Number.isFinite(params.outOf20)) {
      const clamped20 = Math.max(0, Math.min(20, Math.round(params.outOf20 * 10) / 10));
      updates.outOf20 = clamped20;
      updates.percentage = Math.round((clamped20 / 20) * 100);
      updates.score = Math.round((clamped20 / 20) * Math.max(1, params.total) * 10) / 10;
    }
    await updateDoc(levelDocRef(level, 'scores', scoreId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveAcademySettings(
  adminUid: string,
  settings: AcademySettings,
  level: ClassLevel = '3AM'
): Promise<void> {
  const path = levelDocPath(level, 'settings', 'main');
  const ref = levelDocRef(level, 'settings', 'main');
  try {
    const snap = await getDoc(ref);
    const payload = {
      announcement: settings.announcement.trim().slice(0, 600),
      targetDate: settings.targetDate.trim().slice(0, 20),
      targetLabel: settings.targetLabel.trim().slice(0, 120),
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedCurriculumIfEmpty(
  adminUid: string,
  force = false,
  level: ClassLevel = '3AM'
): Promise<{ seeded: number }> {
  let seeded = 0;
  const bundle = getSeedDataForLevel(level);

  try {
    const settingsSnap = await getDoc(levelDocRef(level, 'settings', 'main'));
    const isInitialized = settingsSnap.exists();
    if (!isInitialized || force) {
      const coursesSnap = await getDocs(levelCollectionRef(level, 'courses'));
      if (coursesSnap.empty) {
        for (const course of bundle.courses) {
          await saveCourse(adminUid, course, level);
          seeded += 1;
        }
      }

      const exercisesSnap = await getDocs(levelCollectionRef(level, 'exercises'));
      if (exercisesSnap.empty) {
        for (const ex of bundle.exercises) {
          await saveExercise(adminUid, ex, level);
          seeded += 1;
        }
      } else {
        const hasGeometryInDb = exercisesSnap.docs.some((d) => {
          const data = d.data();
          return data.category === 'geometry' || Boolean(data.geometryData);
        });
        if (!hasGeometryInDb) {
          for (const ex of bundle.exercises.filter((e) => e.category === 'geometry')) {
            await saveExercise(adminUid, ex, level);
            seeded += 1;
          }
        }
      }

      const eventsSnap = await getDocs(levelCollectionRef(level, 'events'));
      if (eventsSnap.empty) {
        for (const evt of bundle.events) {
          await saveEvent(adminUid, evt, level);
          seeded += 1;
        }
      }

      if (!isInitialized) {
        await saveAcademySettings(adminUid, bundle.settings, level);
        seeded += 1;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `seedCurriculum/${level}`);
  }

  return { seeded };
}
