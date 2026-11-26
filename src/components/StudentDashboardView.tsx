import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Eye,
  LogIn,
  MessageSquare,
  Target,
  TrendingUp,
} from 'lucide-react';
import type {
  AppView,
  ClassLevel,
  Course,
  Exercise,
  ScoreRecord,
  StudentMetrics,
  UserProfile,
} from '../types/math';
import { CLASS_LEVEL_META, computeTopicMastery, getChaptersForLevel } from '../utils/mathPlatform';
import { GeometryCanvas } from './GeometryCanvas';

interface StudentDashboardViewProps {
  activeLevel: ClassLevel;
  userProfile: UserProfile | null;
  scores: ScoreRecord[];
  courses: Course[];
  exercises: Exercise[];
  completedCourseIds: string[];
  completedExerciseIds: string[];
  metrics: StudentMetrics;
  onOpenStudentAuth: () => void;
  onOpenCourse: (courseId: string) => void;
  onStartExercise: (exercise: Exercise) => void;
  onNavigate: (view: AppView) => void;
}

export function StudentDashboardView({
  activeLevel,
  userProfile,
  scores,
  courses,
  exercises,
  completedCourseIds,
  completedExerciseIds,
  metrics,
  onOpenStudentAuth,
  onOpenCourse,
  onStartExercise,
  onNavigate,
}: StudentDashboardViewProps) {
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);
  const levelMeta = CLASS_LEVEL_META[activeLevel];

  if (!userProfile) {
    return (
      <div className="wrap">
        <div className="notebook-card p-6 text-center sm:p-8">
          <div className="notebook-violet mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="m-0 text-xl font-bold text-[#22163F]">لوحة متابعة التلميذ الشخصية</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6E6390]">
            سجّل دخولك بحساب التلميذ لحفظ علاماتك ورسوماتك الهندسية، تتبع الدروس المكتملة، والحصول
            على توصيات مخصصة للمراجعة.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button type="button" onClick={onOpenStudentAuth} className="btn btn-main">
              <LogIn className="h-4 w-4" />
              <span>دخول التلميذ / إنشاء حساب</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exercises')}
              className="btn btn-line"
            >
              تصفح التمارين أولاً
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { mastery, recommendations } = computeTopicMastery(
    scores,
    exercises,
    courses,
    completedCourseIds,
    completedExerciseIds,
    getChaptersForLevel(activeLevel)
  );

  return (
    <div className="wrap space-y-4">
      {/* Student Profile Summary (.me-card) */}
      <section className="me-card">
        <div className="me-top">
          <div className="me-av">{userProfile.displayName.charAt(0)}</div>
          <div className="me-nm">
            <h2>{userProfile.displayName}</h2>
            <p>
              القسم: {userProfile.classGroup || levelMeta.shortLabel} · التقييم: {metrics.levelLabel}
            </p>
          </div>
        </div>

        <div className="me-stats">
          <div>
            <b className="tabular-nums">{metrics.overallAverageOutOf20}/20</b>
            <span>المعدل العام</span>
          </div>
          <div>
            <b className="tabular-nums">{metrics.bestOutOf20}/20</b>
            <span>أعلى نقطة</span>
          </div>
          <div>
            <b className="tabular-nums">
              {metrics.completedExercisesCount}/{metrics.totalExercisesCount}
            </b>
            <span>التمارين</span>
          </div>
        </div>

        <div className="me-pl">
          <span>
            الدروس المدروسة: {metrics.completedCoursesCount}/{metrics.totalCoursesCount}
          </span>
          <b className="tabular-nums">{metrics.completionRatePct}%</b>
        </div>
        <div className="me-bar">
          <i style={{ width: `${Math.max(4, metrics.completionRatePct)}%` }} />
        </div>
      </section>

      {/* Study Recommendations */}
      <section className="space-y-2.5">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#22163F]">
          <Compass className="h-4 w-4 text-[#E7A33E]" />
          <span>توصيات ذكية للدراسة والمراجعة</span>
        </h2>

        {recommendations.length === 0 ? (
          <div className="notebook-card p-5 text-center text-sm text-emerald-700">
            أداء ممتاز! أتممت جميع المحاور المتاحة بنتائج متفوقة.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recommendations.map((rec) => {
              const badgeCls =
                rec.priority === 'high'
                  ? 'bg-rose-50 text-rose-700'
                  : rec.priority === 'medium'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-[#EFE8FE] text-[#3E1591]';
              const badgeText =
                rec.priority === 'high'
                  ? 'أولوية المراجعة'
                  : rec.priority === 'medium'
                    ? 'تحسين المستوى'
                    : 'الخطوة التالية';

              const linkedExercise = exercises.find((e) => e.id === rec.suggestedExerciseId);

              return (
                <div key={rec.chapter} className="notebook-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="m-0 text-sm font-bold text-[#22163F]">{rec.chapter}</h3>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold ${badgeCls}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="mt-1 mb-0 text-xs leading-relaxed text-[#6E6390]">{rec.reason}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {rec.suggestedCourseId && (
                      <button
                        type="button"
                        onClick={() => onOpenCourse(rec.suggestedCourseId!)}
                        className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>مراجعة الدرس: {rec.suggestedCourseTitle}</span>
                      </button>
                    )}
                    {linkedExercise && (
                      <button
                        type="button"
                        onClick={() => onStartExercise(linkedExercise)}
                        className="btn btn-main !py-1.5 !px-3 !text-xs"
                      >
                        حل تمرين: {linkedExercise.title}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Mastery Matrix */}
      <section className="space-y-2.5">
        <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#22163F]">
          <Target className="h-4 w-4 text-[#6D28D9]" />
          <span>تحليل المستوى حسب المحور</span>
        </h2>

        <div className="notebook-card space-y-3.5 p-4">
          {mastery.map((m) => {
            const pct = m.attempts > 0 ? Math.round((m.averageOutOf20 / 20) * 100) : 0;
            const barCls =
              m.status === 'mastered'
                ? 'bg-emerald-600'
                : m.status === 'developing'
                  ? 'bg-[#6D28D9]'
                  : m.status === 'needs_review'
                    ? 'bg-rose-500'
                    : 'bg-slate-300';

            return (
              <div key={m.chapter} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#22163F]">{m.chapter}</span>
                  <span className="tabular-nums font-bold text-[#3E1591]">
                    {m.attempts > 0 ? `${m.averageOutOf20}/20` : 'لم يُقيّم بعد'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFE8FE]">
                  <div
                    className={`h-full rounded-full transition-all ${barCls}`}
                    style={{ width: `${Math.max(pct, m.attempts > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#6E6390]">
                  <span>
                    الدروس: {m.completedCourses}/{m.totalCourses}
                  </span>
                  <span>
                    التمارين: {m.completedExercises}/{m.totalExercises} · المحاولات: {m.attempts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Score History + Geometry/Teacher Review */}
      <section className="space-y-2.5">
        <h2 className="m-0 text-base font-bold text-[#22163F]">
          سجل نقاطي وتصحيحات الأستاذ ({scores.length})
        </h2>
        {scores.length === 0 ? (
          <div className="notebook-card p-6 text-center text-sm text-[#6E6390]">
            لم تحفظ أي نتيجة بعد. انتقل إلى قسم التمارين وأنجز أول اختبار لتظهر نتيجتك هنا!
          </div>
        ) : (
          <div className="space-y-2.5">
            {scores.map((sc) => {
              const hasDrawing = Boolean(sc.studentDrawing && sc.studentDrawing.length > 0);
              const isReviewed = sc.gradedStatus === 'reviewed' || Boolean(sc.teacherNote);
              const matchedEx = exercises.find((e) => e.id === sc.exerciseId);
              const isOpen = expandedScoreId === sc.id;

              return (
                <div key={sc.id} className="notebook-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="m-0 text-sm font-bold text-[#22163F]">{sc.exerciseTitle}</h3>
                        {isReviewed && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            تم تصحيحه من الأستاذ
                          </span>
                        )}
                      </div>
                      <p className="m-0 text-xs text-[#6E6390]">
                        {sc.chapter} · {sc.score}/{sc.total} نقطة
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(hasDrawing || isReviewed) && (
                        <button
                          type="button"
                          onClick={() => setExpandedScoreId(isOpen ? null : sc.id)}
                          className="btn btn-ghost !py-1.5 !px-2.5 !text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{isOpen ? 'إخفاء التفاصيل' : 'عرض التصحيح والرسم'}</span>
                        </button>
                      )}
                      <div
                        className={`font-display tabular-nums shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold ${
                          sc.outOf20 >= 14
                            ? 'bg-emerald-50 text-emerald-700'
                            : sc.outOf20 >= 10
                              ? 'bg-[#EFE8FE] text-[#3E1591]'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {sc.outOf20}/20
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-3 border-t border-[#E6DEF8] pt-3">
                      {sc.teacherNote && (
                        <div className="ix-model">
                          <h4 className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            ملاحظة وتصحيح الأستاذ
                          </h4>
                          <p className="m-0 whitespace-pre-line text-xs leading-relaxed text-[#14532D]">
                            {sc.teacherNote}
                          </p>
                        </div>
                      )}

                      {(hasDrawing || (sc.teacherCorrectionShapes && sc.teacherCorrectionShapes.length > 0)) && (
                        <GeometryCanvas
                          baseShapes={matchedEx?.geometryData?.baseShapes || []}
                          shapes={sc.studentDrawing || []}
                          teacherCorrectionShapes={
                            sc.teacherCorrectionShapes && sc.teacherCorrectionShapes.length > 0
                              ? sc.teacherCorrectionShapes
                              : matchedEx?.geometryData?.teacherCorrectionShapes || []
                          }
                          showTeacherCorrection={true}
                          readOnly={true}
                          accentLabel="رسمك المرسل مع تصحيح الأستاذ بالأخضر"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
