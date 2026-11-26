import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, signOut } from './firebase';
import { getSeedDataForLevel } from './data/seedData';
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
  ClassLevel,
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
import {
  CLASS_LEVEL_META,
  computeStudentMetrics,
  parseClassLevel,
} from './utils/mathPlatform';
import { Navbar } from './components/Navbar';
import { ClassSelectView } from './components/ClassSelectView';
import { HomeView } from './components/HomeView';
import { CoursesView } from './components/CoursesView';
import { ExercisesView } from './components/ExercisesView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { EventsView } from './components/EventsView';
import { ScoresLeaderboardView } from './components/ScoresLeaderboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal, type AuthModalMode } from './components/AuthModal';

const CLASS_STORAGE_KEY = 'math_academy_class';

function getInitialClassConfig(): { level: ClassLevel; initialView: AppView } {
  if (typeof window === 'undefined') {
    return { level: '3AM', initialView: 'classes' };
  }
  const params = new URLSearchParams(window.location.search);
  const urlLevel = parseClassLevel(params.get('class'));
  if (urlLevel) {
    return { level: urlLevel, initialView: 'home' };
  }
  const storedLevel = parseClassLevel(window.localStorage.getItem(CLASS_STORAGE_KEY));
  return { level: storedLevel || '3AM', initialView: 'classes' };
}

export default function App() {
  const initialConfig = useMemo(() => getInitialClassConfig(), []);
  const [activeLevel, setActiveLevel] = useState<ClassLevel>(initialConfig.level);
  const [view, setView] = useState<AppView>(initialConfig.initialView);

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
  const [settings, setSettings] = useState<AcademySettings>(
    () => getSeedDataForLevel(initialConfig.level).settings
  );
  const [settingsExistsInDb, setSettingsExistsInDb] = useState(false);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<ExerciseCategory | 'all'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<'exercises' | 'courses' | 'events' | 'scores' | 'settings'>('exercises');
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null);
  const seededLevelsRef = useRef<Set<ClassLevel>>(new Set());
  const authFlowActiveRef = useRef(false);
  const activeLevelRef = useRef<ClassLevel>(activeLevel);

  useEffect(() => {
    activeLevelRef.current = activeLevel;
  }, [activeLevel]);

  function showToast(text: string, kind: 'ok' | 'err' = 'ok') {
    setToast({ text, kind });
    window.setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  }

  function handleSelectLevel(nextLevel: ClassLevel) {
    try {
      window.localStorage.setItem(CLASS_STORAGE_KEY, nextLevel);
      const url = new URL(window.location.href);
      url.searchParams.set('class', nextLevel);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore storage/history error in restricted contexts
    }

    if (nextLevel !== activeLevel) {
      setDbCourses([]);
      setDbExercises([]);
      setDbEvents([]);
      setPublicScores([]);
      setStudentScores([]);
      setAdminScores([]);
      setStudentProgress(null);
      setSettingsExistsInDb(false);
      setSettings(getSeedDataForLevel(nextLevel).settings);
      setActiveExercise(null);
      setSelectedCourseId(null);
      setExerciseCategoryFilter('all');
      setActiveLevel(nextLevel);
    }

    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      const curLevel = activeLevelRef.current;
      try {
        const adminFlag = await checkAdminAccess(user);
        setIsAdmin(adminFlag);
        const profile = await ensureUserProfile(
          user,
          { role: adminFlag ? 'admin' : 'student' },
          curLevel
        );
        setUserProfile(profile);

        if (!adminFlag) {
          await ensureStudentProgress(user, profile.displayName, curLevel);
        } else if (!seededLevelsRef.current.has(curLevel)) {
          seededLevelsRef.current.add(curLevel);
          await seedCurriculumIfEmpty(user.uid, false, curLevel);
        }
      } catch {
        showToast('تعذر تحميل ملف المستخدم من قاعدة البيانات.', 'err');
      }
    });
    return () => unsub();
  }, []);

  // Ensure student progress / admin seed for newly switched activeLevel
  useEffect(() => {
    if (!firebaseUser || !userProfile || authFlowActiveRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        if (!isAdmin) {
          await ensureStudentProgress(firebaseUser, userProfile.displayName, activeLevel);
        } else if (!seededLevelsRef.current.has(activeLevel)) {
          seededLevelsRef.current.add(activeLevel);
          await seedCurriculumIfEmpty(firebaseUser.uid, false, activeLevel);
        }
      } catch {
        if (!cancelled) {
          showToast('تعذر تهيئة بيانات القسم الدراسي.', 'err');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, userProfile, isAdmin, activeLevel]);

  // Subscribe to level-scoped public/admin Firestore collections
  useEffect(() => {
    const handleSubErr = () => {
      showToast('تعذر مزامنة البيانات مع قاعدة البيانات.', 'err');
    };
    const unsubs = [
      subscribeCourses(isAdmin, setDbCourses, handleSubErr, activeLevel),
      subscribeExercises(isAdmin, setDbExercises, handleSubErr, activeLevel),
      subscribeEvents(isAdmin, setDbEvents, handleSubErr, activeLevel),
      subscribePublicScores(setPublicScores, handleSubErr, activeLevel),
      subscribeSettings(
        (nextSettings, existsInDb) => {
          setSettings(nextSettings);
          setSettingsExistsInDb(existsInDb);
        },
        handleSubErr,
        activeLevel
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isAdmin, activeLevel]);

  // Subscribe to user-specific scores & progress or admin all-scores for activeLevel
  useEffect(() => {
    if (!firebaseUser) return;
    const handleSubErr = () => {
      showToast('تعذر تحميل سجلات النقاط من قاعدة البيانات.', 'err');
    };
    if (isAdmin) {
      const unsub = subscribeAllScoresAdmin(setAdminScores, handleSubErr, activeLevel);
      return () => unsub();
    }
    const unsubScores = subscribeStudentScores(
      firebaseUser.uid,
      setStudentScores,
      handleSubErr,
      activeLevel
    );
    const unsubProg = subscribeStudentProgress(
      firebaseUser.uid,
      setStudentProgress,
      handleSubErr,
      activeLevel
    );
    return () => {
      unsubScores();
      unsubProg();
    };
  }, [firebaseUser, isAdmin, activeLevel]);

  const levelSeed = useMemo(() => getSeedDataForLevel(activeLevel), [activeLevel]);
  const levelMeta = CLASS_LEVEL_META[activeLevel];

  // Display Firestore records once initialized; otherwise fallback to level-specific starter catalog
  const courses = useMemo<Course[]>(() => {
    if (dbCourses.length > 0 || settingsExistsInDb) return dbCourses;
    return levelSeed.courses.map((c) => ({ ...c, createdBy: 'curriculum' }));
  }, [dbCourses, settingsExistsInDb, levelSeed]);

  const exercises = useMemo<Exercise[]>(() => {
    if (settingsExistsInDb || dbExercises.length > 0) return dbExercises;
    return levelSeed.exercises.map((ex) => ({ ...ex, createdBy: 'curriculum' }));
  }, [dbExercises, settingsExistsInDb, levelSeed]);

  const events = useMemo<EventItem[]>(() => {
    if (dbEvents.length > 0 || settingsExistsInDb) return dbEvents;
    return levelSeed.events.map((ev) => ({ ...ev, createdBy: 'curriculum' }));
  }, [dbEvents, settingsExistsInDb, levelSeed]);

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
      await submitExerciseScore(
        {
          user: firebaseUser,
          studentName:
            userProfile?.displayName ||
            firebaseUser.displayName ||
            `تلميذ ${levelMeta.shortLabel}`,
          studentClass: userProfile?.classGroup || activeLevel,
          exercise,
          earnedPoints: result.earnedPoints,
          totalPoints: result.totalPoints,
          outOf20: result.outOf20,
          percentage: result.percentage,
          durationSeconds,
          isPublic: true,
          studentDrawing,
        },
        activeLevel
      );
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
        userProfile?.displayName || `تلميذ ${levelMeta.shortLabel}`,
        courseId,
        activeLevel
      );
      showToast(added ? 'تم تسجيل إتمام الدرس في تقدّمك.' : 'تمت إزالة علامة الإتمام.');
    } catch {
      showToast('تعذر تحديث حالة الدرس.', 'err');
    }
  }

  const canGoBack = view !== 'classes' && (view !== 'home' || Boolean(activeExercise));

  return (
    <div className="min-h-screen">
      <Navbar
        activeLevel={activeLevel}
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
        {view === 'classes' && (
          <ClassSelectView
            activeLevel={activeLevel}
            onSelectLevel={handleSelectLevel}
            onOpenAdminEntry={handleOpenAdminEntry}
            isAdmin={isAdmin}
          />
        )}

        {view === 'home' && (
          <HomeView
            activeLevel={activeLevel}
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
            activeLevel={activeLevel}
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
                await deleteCourse(courseId, activeLevel);
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
            activeLevel={activeLevel}
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
                await deleteExercise(exerciseId, activeLevel);
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
            activeLevel={activeLevel}
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
                await deleteEvent(eventId, activeLevel);
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
            activeLevel={activeLevel}
            scores={publicScores}
            currentUserUid={firebaseUser?.uid}
          />
        )}

        {view === 'admin' && isAdmin && firebaseUser && (
          <AdminDashboardView
            activeLevel={activeLevel}
            adminUid={firebaseUser.uid}
            adminEmail={firebaseUser.email || ''}
            courses={dbCourses}
            exercises={dbExercises}
            events={dbEvents}
            scores={adminScores}
            settings={settings}
            initialTab={adminInitialTab}
            onSaveCourse={async (c) => {
              await saveCourse(firebaseUser.uid, c, activeLevel);
            }}
            onDeleteCourse={(id) => deleteCourse(id, activeLevel)}
            onSaveExercise={async (ex) => {
              await saveExercise(firebaseUser.uid, ex, activeLevel);
            }}
            onDeleteExercise={(id) => deleteExercise(id, activeLevel)}
            onSaveEvent={async (ev) => {
              await saveEvent(firebaseUser.uid, ev, activeLevel);
            }}
            onDeleteEvent={(id) => deleteEvent(id, activeLevel)}
            onDeleteScore={(id) => deleteScoreRecord(id, activeLevel)}
            onSaveTeacherScoreCorrection={(scoreId, params) =>
              saveTeacherScoreCorrection(scoreId, params, activeLevel)
            }
            onSaveSettings={async (s) => {
              await saveAcademySettings(firebaseUser.uid, s, activeLevel);
            }}
            onSeedCurriculum={async () => {
              await seedCurriculumIfEmpty(firebaseUser.uid, true, activeLevel);
            }}
          />
        )}
      </main>

      {authModalMode && (
        <AuthModal
          activeLevel={activeLevel}
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSwitchMode={setAuthModalMode}
          onAuthFlowChange={(active) => {
            authFlowActiveRef.current = active;
          }}
          onSuccess={async (role) => {
            setAuthModalMode(null);
            const current = auth.currentUser;
            const curLevel = activeLevelRef.current;
            if (role === 'admin') {
              if (current) {
                const adminOk = await checkAdminAccess(current);
                setIsAdmin(adminOk);
                const profile = await ensureUserProfile(
                  current,
                  { role: 'admin' },
                  curLevel
                );
                setUserProfile(profile);
                if (adminOk && !seededLevelsRef.current.has(curLevel)) {
                  seededLevelsRef.current.add(curLevel);
                  await seedCurriculumIfEmpty(current.uid, false, curLevel);
                }
              }
              setView('admin');
              showToast('مرحباً أستاذ! تم فتح لوحة الإدارة.');
            } else {
              if (current) {
                const adminOk = await checkAdminAccess(current);
                setIsAdmin(adminOk);
                const profile = await ensureUserProfile(
                  current,
                  { role: adminOk ? 'admin' : 'student' },
                  curLevel
                );
                setUserProfile(profile);
                if (!adminOk) {
                  await ensureStudentProgress(current, profile.displayName, curLevel);
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
