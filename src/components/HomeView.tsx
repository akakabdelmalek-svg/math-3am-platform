import {
  BookOpen,
  Calculator,
  Calendar,
  Compass,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import type {
  AcademySettings,
  AppView,
  Course,
  EventItem,
  Exercise,
  ExerciseCategory,
  StudentMetrics,
  UserProfile,
} from '../types/math';
import { daysUntilTarget } from '../utils/mathPlatform';
import { MathText } from './MathText';

interface HomeViewProps {
  settings: AcademySettings;
  courses: Course[];
  exercises: Exercise[];
  events: EventItem[];
  userProfile: UserProfile | null;
  isAdmin: boolean;
  metrics: StudentMetrics;
  onNavigate: (view: AppView, opts?: { exerciseCategory?: ExerciseCategory | 'all' }) => void;
  onOpenAdminEntry: () => void;
  onOpenStudentAuth: () => void;
  onStartExercise: (exercise: Exercise) => void;
}

export function HomeView({
  settings,
  courses,
  exercises,
  events,
  userProfile,
  isAdmin,
  metrics,
  onNavigate,
  onOpenAdminEntry,
  onOpenStudentAuth,
  onStartExercise,
}: HomeViewProps) {
  const daysLeft = daysUntilTarget(settings.targetDate);
  const geometryCount = exercises.filter(
    (e) => e.category === 'geometry' || Boolean(e.geometryData)
  ).length;
  const featuredExercises = exercises.slice(0, 3);

  const tiles = [
    {
      key: 'geometry',
      title: 'تمرين تفاعلي هندسة',
      sub: `${geometryCount} تمارين رسم وتصحيح`,
      sym: '△',
      c: '#059669',
      d: '#047857',
      icon: Compass,
      onClick: () => onNavigate('exercises', { exerciseCategory: 'geometry' }),
    },
    {
      key: 'courses',
      title: 'دروس 3 متوسط',
      sub: `${courses.length} دروس وقوانين`,
      sym: 'π',
      c: '#7c3aed',
      d: '#5b21b6',
      icon: BookOpen,
      onClick: () => onNavigate('courses'),
    },
    {
      key: 'exercises',
      title: 'التمارين والاختبارات',
      sub: `${exercises.length} تمارين بتصحيح /20`,
      sym: '√x',
      c: '#0284c7',
      d: '#0369a1',
      icon: Calculator,
      onClick: () => onNavigate('exercises', { exerciseCategory: 'all' }),
    },
    {
      key: 'dashboard',
      title: 'لوحتي وتقدّمي',
      sub: 'تحليل المستوى والتوصيات',
      sym: 'Σ',
      c: '#db2777',
      d: '#9d174d',
      icon: LayoutDashboard,
      onClick: () => onNavigate('dashboard'),
    },
    {
      key: 'events',
      title: 'الأحداث والمواعيد',
      sub: `${events.length} مواعيد وفروض`,
      sym: 'Δ',
      c: '#d97706',
      d: '#b45309',
      icon: Calendar,
      onClick: () => onNavigate('events'),
    },
    {
      key: 'scores',
      title: 'النتائج والترتيب',
      sub: 'لوحة شرف التلاميذ',
      sym: '★',
      c: '#4f46e5',
      d: '#3730a3',
      icon: Trophy,
      onClick: () => onNavigate('scores'),
    },
  ];

  return (
    <div className="wrap">
      {/* Student summary card when signed in as student, otherwise hero banner */}
      {userProfile && !isAdmin ? (
        <section className="me-card">
          <div className="me-top">
            <div className="me-av">{userProfile.displayName.charAt(0)}</div>
            <div className="me-nm">
              <h2>
                مرحباً {userProfile.displayName} ({userProfile.classGroup || '3AM'})
              </h2>
              <p>مستواك الحالي: {metrics.levelLabel}</p>
            </div>
          </div>

          <div className="me-stats">
            <div>
              <b className="tabular-nums">{metrics.overallAverageOutOf20}/20</b>
              <span>المعدل العام</span>
            </div>
            <div>
              <b className="tabular-nums">
                {metrics.completedExercisesCount}/{metrics.totalExercisesCount}
              </b>
              <span>التمارين</span>
            </div>
            <div>
              <b className="tabular-nums">
                {metrics.completedCoursesCount}/{metrics.totalCoursesCount}
              </b>
              <span>الدروس</span>
            </div>
          </div>

          <div className="me-pl">
            <span>نسبة التقدم في البرنامج</span>
            <b className="tabular-nums">{metrics.completionRatePct}%</b>
          </div>
          <div className="me-bar">
            <i style={{ width: `${Math.max(4, metrics.completionRatePct)}%` }} />
          </div>
        </section>
      ) : (
        <section className="hero4">
          <div className="tx">
            <span className="sg">السنة الثالثة متوسط — المنهاج الجزائري</span>
            <h1>كرّاس الرياضيات التفاعلي — الأستاذ دقيش علي</h1>
            <p>
              دروس منظمة بالقوانين الرياضية، تمارين جبر وهندسة تفاعلية بالرسم والتصحيح الفوري /20.
            </p>
          </div>
        </section>
      )}

      {/* Primary entry actions (including explicit "دخول الادارة") */}
      <div className="entry4">
        <button
          type="button"
          className="main"
          onClick={() => onNavigate('exercises', { exerciseCategory: 'geometry' })}
          data-testid="home-geometry-cta"
        >
          <span className="ei">📐</span>
          <span>
            <b>تمرين تفاعلي هندسة</b>
            <small>ارسم على الشبكة وقارن مع تصحيح الأستاذ</small>
          </span>
        </button>

        <button
          type="button"
          className="gold"
          onClick={onOpenAdminEntry}
          data-testid="home-admin-btn"
        >
          <span className="ei">
            <ShieldCheck className="h-5 w-5 text-[#92610A]" />
          </span>
          <span>
            <b>{isAdmin ? 'لوحة الإدارة (مفتوحة)' : 'دخول الادارة'}</b>
            <small>إضافة التمارين، الهندسة، الدروس والأحداث</small>
          </span>
        </button>
      </div>

      {!userProfile && (
        <div className="mb-3.5 flex items-center justify-between gap-3 rounded-2xl border border-[#E6DEF8] bg-white px-4 py-3 shadow-xs">
          <span className="text-xs font-semibold text-[#6E6390]">
            سجّل دخول التلميذ لحفظ علاماتك ورسوماتك الهندسية ومتابعة تقدمك.
          </span>
          <button
            type="button"
            onClick={onOpenStudentAuth}
            className="btn btn-ghost shrink-0 !py-2 !px-3.5 !text-xs"
          >
            دخول التلميذ
          </button>
        </div>
      )}

      {/* Teacher Announcement */}
      <div className="pend">
        <div className="pend-h">
          <Megaphone className="h-4 w-4 text-[#B45309]" />
          <b>إعلان الأستاذ</b>
        </div>
        <p className="m-0 text-sm text-[#22163F]">{settings.announcement}</p>
      </div>

      {/* Target Countdown Banner */}
      <button type="button" className="bem-banner" onClick={() => onNavigate('events')}>
        <div className="bb-days">
          <b className="tabular-nums">{daysLeft ?? '—'}</b>
          <span>يوم</span>
        </div>
        <div className="bb-txt">
          <h3>{settings.targetLabel}</h3>
          <p>اضغط لمتابعة الحصص المباشرة ومواعيد الفروض والاختبارات</p>
        </div>
      </button>

      {/* Colored Subject Grid Tiles */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="m-0 text-base font-bold text-[#22163F]">أقسام المنصة</h2>
        <span className="text-xs font-semibold text-[#6E6390]">3 متوسط</span>
      </div>

      <div className="sk-grid">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={t.onClick}
              data-testid={`home-tile-${t.key}`}
              className="tile sk"
              style={{ ['--c' as string]: t.c, ['--d' as string]: t.d }}
            >
              <span className="tbg" aria-hidden="true">
                <i>{t.sym}</i>
              </span>
              <span className="ic">
                <Icon className="h-5 w-5" />
              </span>
              <h3>{t.title}</h3>
              <p>{t.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Latest Interactive Exercises */}
      <section className="mt-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-base font-bold text-[#22163F]">أحدث التمارين المقترحة</h2>
          <button
            type="button"
            onClick={() => onNavigate('exercises', { exerciseCategory: 'all' })}
            className="border-0 bg-transparent text-xs font-bold text-[#6D28D9] cursor-pointer"
          >
            عرض الكل ({exercises.length}) ←
          </button>
        </div>

        <div className="space-y-2.5">
          {featuredExercises.map((ex, idx) => (
            <div
              key={ex.id}
              className="notebook-card-interactive flex items-center justify-between gap-3 p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFE8FE] font-display text-sm font-bold text-[#3E1591]">
                  {ex.category === 'geometry' ? '📐' : idx + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-sm font-bold text-[#22163F]">
                    <MathText text={ex.title} />
                  </h3>
                  <p className="m-0 text-xs text-[#6E6390]">
                    {ex.chapter} · {ex.questions.length} أسئلة · {ex.durationMinutes} د
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onStartExercise(ex)}
                className="btn btn-main shrink-0 !py-2 !px-3.5 !text-xs"
              >
                ابدأ
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
