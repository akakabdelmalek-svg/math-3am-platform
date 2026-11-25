import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, signOut } from './firebase';
import {
  DEFAULT_SETTINGS,
  SEED_COURSES,
  SEED_EVENTS,
  SEED_EXERCISES,
} from './data/seedData';
import {
  checkAdminAccess,
  deleteCourse,
  deleteEvent,
  deleteExercise,
  deleteScoreRecord,
  ensureStudentProgress,
  ensureUserProfile,
  saveAcademySettings,
  saveCourse,
  saveEvent,
  saveExercise,
  saveTeacherScoreCorrection,
  seedCurriculumIfEmpty,
  submitExerciseScore,
  subscribeAllScoresAdmin,
  subscribeCourses,
  subscribeEvents,
  subscribeExercises,
  subscribePublicScores,
  subscribeSettings,
  subscribeStudentProgress,
  subscribeStudentScores,
  toggleCourseCompletion,
} from './services/academyService';
import type {
  AcademySettings,
  AppView,
  Course,
  EventItem,
  Exercise,
  ExerciseCategory,
  GeometryShape,
  GradeResult,
  ScoreRecord,
  StudentProgress,
  UserProfile,
} from './types/math';
import { computeStudentMetrics } from './utils/mathPlatform';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CoursesView } from './components/CoursesView';
import { ExercisesView } from './components/ExercisesView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { EventsView } from './components/EventsView';
import { ScoresLeaderboardView } from './components/ScoresLeaderboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal, type AuthModalMode } from './components/AuthModal';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [authModalMode, setAuthModalMode] = useState<AuthModalMode | null>(null);

  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [publicScores, setPublicScores] = useState<ScoreRecord[]>([]);
  const [studentScores, setStudentScores] = useState<ScoreRecord[]>([]);
  const [adminScores, setAdminScores] = useState<ScoreRecord[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [settings, setSettings] = useState<AcademySettings>(DEFAULT_SETTINGS);
  const [settingsExistsInDb, setSettingsExistsInDb] = useState(false);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<'exercises' | 'courses' | 'events' | 'scores' | 'settings'>('exercises');
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const seededOnceRef = useRef(false);
  const authFlowActiveRef = useRef(false);

  function showToast(text: string, kind: 'ok' | 'err' = 'ok') {
    setToast({ text, kind });
    window.setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  }

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setStudentScores([]);
        setStudentProgress(null);
        setAdminScores([]);
        return;
      }

      if (authFlowActiveRef.current) {
        return;
      }

      try {
        const adminFlag = await checkAdminAccess(user);
        setIsAdmin(adminFlag);
        const profile = await ensureUserProfile(user, {
          role: adminFlag ? 'admin' : 'student',
        });
        setUserProfile(profile);

        if (!adminFlag) {
          await ensureStudentProgress(user, profile.displayName);
        } else if (!seededOnceRef.current) {
          seededOnceRef.current = true;
          await seedCurriculumIfEmpty(user.uid);
        }
      } catch {
        showToast('تعذر تحميل ملف المستخدم من قاعدة البيانات.', 'err');
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to public/admin Firestore collections
  useEffect(() => {
    const handleSubErr = () => {
      showToast('تعذر مزامنة البيانات مع قاعدة البيانات.', 'err');
    };
    const unsubs = [
      subscribeCourses(isAdmin, setDbCourses, handleSubErr),
      subscribeExercises(isAdmin, setDbExercises, handleSubErr),
      subscribeEvents(isAdmin, setDbEvents, handleSubErr),
      subscribePublicScores(setPublicScores, handleSubErr),
      subscribeSettings((nextSettings, existsInDb) => {
        setSettings(nextSettings);
        setSettingsExistsInDb(existsInDb);
      }, handleSubErr),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  // Subscribe to user-specific scores & progress or admin all-scores
  useEffect(() => {
    if (!firebaseUser) return;
    const handleSubErr = () => {
      showToast('تعذر تحميل سجلات النقاط من قاعدة البيانات.', 'err');
    };
    if (isAdmin) {
      const unsub = subscribeAllScoresAdmin(setAdminScores, handleSubErr);
      return () => unsub();
    }
    const unsubScores = subscribeStudentScores(firebaseUser.uid, setStudentScores, handleSubErr);
    const unsubProg = subscribeStudentProgress(firebaseUser.uid, setStudentProgress, handleSubErr);
    return () => {
      unsubScores();
      unsubProg();
    };
  }, [firebaseUser, isAdmin]);

  // Display Firestore records once initialized; otherwise fallback to starter 3AM catalog
  const courses = useMemo<Course[]>(() => {
    if (dbCourses.length > 0 || settingsExistsInDb) return dbCourses;
    return SEED_COURSES.map((c) => ({ ...c, createdBy: 'curriculum' }));
  }, [dbCourses, settingsExistsInDb]);

  const exercises = useMemo<Exercise[]>(() => {
    if (settingsExistsInDb || dbExercises.length > 0) return dbExercises;
    return SEED_EXERCISES.map((ex) => ({ ...ex, createdBy: 'curriculum' }));
  }, [dbExercises, settingsExistsInDb]);

  const events = useMemo<EventItem[]>(() => {
    if (dbEvents.length > 0 || settingsExistsInDb) return dbEvents;
    return SEED_EVENTS.map((ev) => ({ ...ev, createdBy: 'curriculum' }));
  }, [dbEvents, settingsExistsInDb]);

  const completedCourseIds = studentProgress?.completedCourseIds || [];
  const completedExerciseIds = studentProgress?.completedExerciseIds || [];

  const metrics = useMemo(
    () =>
      computeStudentMetrics(
        studentScores,
        completedCourseIds,
        completedExerciseIds,
        courses.length,
        exercises.length
      ),
    [studentScores, completedCourseIds, completedExerciseIds, courses.length, exercises.length]
  );

  function handleNavigate(
    nextView: AppView,
    opts?: { exerciseCategory?: ExerciseCategory | 'all' }
  ) {
    if (nextView === 'admin' && !isAdmin) {
      setAuthModalMode('admin');
      return;
    }
    if (nextView === 'exercises') {
      setExerciseCategoryFilter(opts?.exerciseCategory ?? 'all');
      setActiveExercise(null);
    } else {
      setActiveExercise(null);
    }
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    if (view === 'exercises' && activeExercise) {
      setActiveExercise(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenAdminEntry() {
    if (isAdmin && firebaseUser) {
      setView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAuthModalMode('admin');
    }
  }

  async function handleLogout() {
    await signOut(auth);
    if (view === 'admin') setView('home');
    showToast('تم تسجيل الخروج بنجاح.');
  }

  async function handleSaveScore(
    exercise: Exercise,
    result: GradeResult,
    durationSeconds: number,
    studentDrawing?: GeometryShape[]
  ) {
    if (!firebaseUser) {
      setAuthModalMode('student');
      return;
    }
    try {
      await submitExerciseScore({
        user: firebaseUser,
        studentName: userProfile?.displayName || firebaseUser.displayName || 'تلميذ 3 متوسط',
        studentClass: userProfile?.classGroup,
        exercise,
        earnedPoints: result.earnedPoints,
        totalPoints: result.totalPoints,
        outOf20: result.outOf20,
        percentage: result.percentage,
        durationSeconds,
        isPublic: true,
        studentDrawing,
      });
      showToast(`تم حفظ نتيجتك (${result.outOf20}/20) في قاعدة البيانات ولوحتك!`);
    } catch (err) {
      showToast('تعذر حفظ النتيجة في قاعدة البيانات.', 'err');
      throw err;
    }
  }

  async function handleToggleCourseComplete(courseId: string) {
    if (!firebaseUser) {
      setAuthModalMode('student');
      return;
    }
    try {
      const added = await toggleCourseCompletion(
        firebaseUser,
        userProfile?.displayName || 'تلميذ 3 متوسط',
        courseId
      );
      showToast(added ? 'تم تسجيل إتمام الدرس في تقدّمك.' : 'تمت إزالة علامة الإتمام.');
    } catch {
      showToast('تعذر تحديث حالة الدرس.', 'err');
    }
  }

  const canGoBack = view !== 'home' || Boolean(activeExercise);

  return (
    <div className="min-h-screen">
      <Navbar
        currentView={view}
        canGoBack={canGoBack}
        onBack={handleBack}
        onNavigate={(v) => handleNavigate(v)}
        userProfile={userProfile}
        isAdmin={isAdmin}
        onOpenStudentAuth={() => setAuthModalMode('student')}
        onOpenAdminEntry={handleOpenAdminEntry}
        onLogout={handleLogout}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#22163F] px-4 py-2.5 text-xs font-bold text-white shadow-lg">
          {toast.kind === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <main>
        {view === 'home' && (
          <HomeView
            settings={settings}
            courses={courses}
            exercises={exercises}
            events={events}
            userProfile={userProfile}
            isAdmin={isAdmin}
            metrics={metrics}
            onNavigate={handleNavigate}
            onOpenAdminEntry={handleOpenAdminEntry}
            onOpenStudentAuth={() => setAuthModalMode('student')}
            onStartExercise={(ex) => {
              setActiveExercise(ex);
              setView('exercises');
            }}
          />
        )}

        {view === 'courses' && (
          <CoursesView
            courses={courses}
            exercises={exercises}
            completedCourseIds={completedCourseIds}
            isSignedIn={Boolean(firebaseUser)}
            isAdmin={isAdmin}
            onToggleCourseComplete={handleToggleCourseComplete}
            onOpenStudentAuth={() => setAuthModalMode('student')}
            onStartExercise={(ex) => {
              setActiveExercise(ex);
              setView('exercises');
            }}
            onOpenAdminCourses={() => {
              setAdminInitialTab('courses');
              setView('admin');
            }}
            onDeleteCourse={async (courseId) => {
              try {
                await deleteCourse(courseId);
                showToast('تم حذف الدرس من المنصة.');
              } catch (err) {
                showToast('تعذر حذف الدرس من قاعدة البيانات.', 'err');
                throw err;
              }
            }}
            initialCourseId={selectedCourseId}
          />
        )}

        {view === 'exercises' && (
          <ExercisesView
            exercises={exercises}
            completedExerciseIds={completedExerciseIds}
            activeExercise={activeExercise}
            initialCategory={exerciseCategoryFilter}
            isSignedIn={Boolean(firebaseUser)}
            isAdmin={isAdmin}
            onSelectExercise={setActiveExercise}
            onSaveScore={handleSaveScore}
            onOpenStudentAuth={() => setAuthModalMode('student')}
            onOpenAdminExercises={() => {
              setAdminInitialTab('exercises');
              setView('admin');
            }}
            onDeleteExercise={async (exerciseId) => {
              try {
                await deleteExercise(exerciseId);
                showToast('تم حذف التمرين من المنصة.');
              } catch (err) {
                showToast('تعذر حذف التمرين من قاعدة البيانات.', 'err');
                throw err;
              }
            }}
          />
        )}

        {view === 'dashboard' && (
          <StudentDashboardView
            userProfile={userProfile}
            scores={studentScores}
            courses={courses}
            exercises={exercises}
            completedCourseIds={completedCourseIds}
            completedExerciseIds={completedExerciseIds}
            metrics={metrics}
            onOpenStudentAuth={() => setAuthModalMode('student')}
            onOpenCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setView('courses');
            }}
            onStartExercise={(ex) => {
              setActiveExercise(ex);
              setView('exercises');
            }}
            onNavigate={(v) => handleNavigate(v)}
          />
        )}

        {view === 'events' && (
          <EventsView
            events={events}
            isAdmin={isAdmin}
            onOpenAdminEvents={() => {
              setAdminInitialTab('events');
              setView('admin');
            }}
            onDeleteEvent={async (eventId) => {
              try {
                await deleteEvent(eventId);
                showToast('تم حذف الحدث من المنصة.');
              } catch (err) {
                showToast('تعذر حذف الحدث من قاعدة البيانات.', 'err');
                throw err;
              }
            }}
          />
        )}

        {view === 'scores' && (
          <ScoresLeaderboardView
            scores={publicScores}
            currentUserUid={firebaseUser?.uid}
          />
        )}

        {view === 'admin' && isAdmin && firebaseUser && (
          <AdminDashboardView
            adminUid={firebaseUser.uid}
            adminEmail={firebaseUser.email || ''}
            courses={dbCourses}
            exercises={dbExercises}
            events={dbEvents}
            scores={adminScores}
            settings={settings}
            initialTab={adminInitialTab}
            onSaveCourse={async (c) => {
              await saveCourse(firebaseUser.uid, c);
            }}
            onDeleteCourse={deleteCourse}
            onSaveExercise={async (ex) => {
              await saveExercise(firebaseUser.uid, ex);
            }}
            onDeleteExercise={deleteExercise}
            onSaveEvent={async (ev) => {
              await saveEvent(firebaseUser.uid, ev);
            }}
            onDeleteEvent={deleteEvent}
            onDeleteScore={deleteScoreRecord}
            onSaveTeacherScoreCorrection={saveTeacherScoreCorrection}
            onSaveSettings={async (s) => {
              await saveAcademySettings(firebaseUser.uid, s);
            }}
            onSeedCurriculum={async () => {
              await seedCurriculumIfEmpty(firebaseUser.uid, true);
            }}
          />
        )}
      </main>

      {authModalMode && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSwitchMode={setAuthModalMode}
          onAuthFlowChange={(active) => {
            authFlowActiveRef.current = active;
          }}
          onSuccess={async (role) => {
            setAuthModalMode(null);
            const current = auth.currentUser;
            if (role === 'admin') {
              if (current) {
                const adminOk = await checkAdminAccess(current);
                setIsAdmin(adminOk);
                const profile = await ensureUserProfile(current, { role: 'admin' });
                setUserProfile(profile);
                if (adminOk && !seededOnceRef.current) {
                  seededOnceRef.current = true;
                  await seedCurriculumIfEmpty(current.uid);
                }
              }
              setView('admin');
              showToast('مرحباً أستاذ! تم فتح لوحة الإدارة.');
            } else {
              if (current) {
                const adminOk = await checkAdminAccess(current);
                setIsAdmin(adminOk);
                const profile = await ensureUserProfile(current, {
                  role: adminOk ? 'admin' : 'student',
                });
                setUserProfile(profile);
                if (!adminOk) {
                  await ensureStudentProgress(current, profile.displayName);
                }
              }
              showToast('مرحباً بك! تم تسجيل الدخول لحفظ تقدمك ونتائجك.');
            }
          }}
        />
      )}
    </div>
  );
}
