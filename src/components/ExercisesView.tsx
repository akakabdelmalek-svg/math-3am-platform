import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  Plus,
  RotateCcw,
  Search,
  Timer,
  Trash2,
  XCircle,
} from 'lucide-react';
import type {
  AnswerMap,
  ClassLevel,
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
  GeometryShape,
  GradeResult,
} from '../types/math';
import { isGeometryExercise } from '../utils/geometryGenerator';
import { filterExercises, getChaptersForLevel, gradeExercise } from '../utils/mathPlatform';
import { GeometryCanvas } from './GeometryCanvas';
import { MathText } from './MathText';

interface ExercisesViewProps {
  activeLevel: ClassLevel;
  exercises: Exercise[];
  completedExerciseIds: string[];
  activeExercise: Exercise | null;
  initialCategory?: ExerciseCategory | 'all';
  isSignedIn: boolean;
  isAdmin?: boolean;
  onSelectExercise: (ex: Exercise | null) => void;
  onSaveScore: (
    exercise: Exercise,
    result: GradeResult,
    durationSeconds: number,
    studentDrawing?: GeometryShape[]
  ) => Promise<void>;
  onOpenStudentAuth: () => void;
  onOpenAdminExercises?: () => void;
  onDeleteExercise?: (exerciseId: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  geometry: 'تمرين تفاعلي هندسة',
  interactive: 'تمرين تفاعلي',
  daily: 'تمرين يومي',
  devoir: 'فرض محروس',
  exam: 'اختبار فصلي',
};

const CATEGORY_COLORS: Record<ExerciseCategory, { c: string; d: string; sym: string }> = {
  geometry: { c: '#059669', d: '#047857', sym: '△' },
  interactive: { c: '#7c3aed', d: '#5b21b6', sym: '√x' },
  daily: { c: '#0284c7', d: '#0369a1', sym: 'x²' },
  devoir: { c: '#d97706', d: '#b45309', sym: 'Σ' },
  exam: { c: '#db2777', d: '#9d174d', sym: '★' },
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'متقدم',
};

export function ExercisesView({
  activeLevel,
  exercises,
  completedExerciseIds,
  activeExercise,
  initialCategory = 'all',
  isSignedIn,
  isAdmin,
  onSelectExercise,
  onSaveScore,
  onOpenStudentAuth,
  onOpenAdminExercises,
  onDeleteExercise,
}: ExercisesViewProps) {
  const levelChapters = useMemo(() => getChaptersForLevel(activeLevel), [activeLevel]);
  const [search, setSearch] = useState('');
  const [chapter, setChapter] = useState('all');
  const [category, setCategory] = useState<ExerciseCategory | 'all'>(initialCategory);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'all'>('all');

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [studentDrawing, setStudentDrawing] = useState<GeometryShape[]>([]);
  const [showTeacherCorrection, setShowTeacherCorrection] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setChapter('all');
    setSearch('');
  }, [activeLevel]);

  const completedSet = useMemo(() => new Set(completedExerciseIds), [completedExerciseIds]);

  const filtered = useMemo(
    () => filterExercises(exercises, { search, chapter, category, difficulty }),
    [exercises, search, chapter, category, difficulty]
  );

  useEffect(() => {
    if (!activeExercise) return;
    setAnswers({});
    setStudentDrawing([]);
    setShowTeacherCorrection(false);
    setResult(null);
    setSecondsElapsed(0);
    setScoreSaved(false);
  }, [activeExercise]);

  useEffect(() => {
    if (!activeExercise || result) return;
    const timer = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeExercise, result]);

  async function handleSubmitQuiz() {
    if (!activeExercise) return;
    const graded = gradeExercise(activeExercise.questions, answers);
    setResult(graded);
    if (isGeometryExercise(activeExercise)) {
      setShowTeacherCorrection(true);
    }
    if (isSignedIn) {
      setSavingScore(true);
      try {
        await onSaveScore(
          activeExercise,
          graded,
          secondsElapsed,
          studentDrawing.length > 0 ? studentDrawing : undefined
        );
        setScoreSaved(true);
      } catch {
        setScoreSaved(false);
      } finally {
        setSavingScore(false);
      }
    }
  }

  async function handleSavePendingScore() {
    if (!activeExercise || !result) return;
    if (!isSignedIn) {
      onOpenStudentAuth();
      return;
    }
    setSavingScore(true);
    try {
      await onSaveScore(
        activeExercise,
        result,
        secondsElapsed,
        studentDrawing.length > 0 ? studentDrawing : undefined
      );
      setScoreSaved(true);
    } catch {
      setScoreSaved(false);
    } finally {
      setSavingScore(false);
    }
  }

  if (activeExercise) {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    const timeFormatted = `${mins}:${String(secs).padStart(2, '0')}`;
    const isGeom = isGeometryExercise(activeExercise);
    const geomData = activeExercise.geometryData;

    return (
      <div className="wrap space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectExercise(null)}
            className="btn btn-line !py-2 !px-3.5 !text-xs"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة لقائمة التمارين</span>
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && onDeleteExercise && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onDeleteExercise(activeExercise.id);
                    onSelectExercise(null);
                  } catch {
                    // parent shows error toast
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>حذف التمرين</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded-xl bg-[#EFE8FE] px-3 py-2 text-xs font-bold text-[#3E1591] tabular-nums">
              <Timer className="h-4 w-4" />
              <span>الوقت: {timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Quiz Header */}
        <section className="notebook-violet rounded-2xl p-4 text-white sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#FFE8B3]">
            <span>{activeExercise.chapter}</span>
            <span>·</span>
            <span>{CATEGORY_LABELS[activeExercise.category] || 'تمرين'}</span>
            <span>·</span>
            <span>{activeExercise.questions.length} أسئلة</span>
          </div>
          <h1 className="mt-1.5 mb-1 text-lg font-bold text-white sm:text-xl">
            <MathText text={activeExercise.title} />
          </h1>
          {activeExercise.description && (
            <div className="text-sm leading-relaxed text-white/90">
              <MathText text={activeExercise.description} />
            </div>
          )}
          {activeExercise.attachmentUrl && (
            <a
              href={activeExercise.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
            >
              <span>عرض ورقة التمرين المرفقة</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </section>

        {/* Interactive Geometry Canvas */}
        {isGeom && geomData && (
          <section className="notebook-card space-y-3 p-4" data-testid="geometry-exercise-board">
            <div className="ix-note">
              <strong className="block mb-1 text-[#3E1591]">المطلوب رسمه على الشكل:</strong>
              <MathText text={geomData.drawPrompt} />
            </div>

            <GeometryCanvas
              width={geomData.canvasWidth || 480}
              height={geomData.canvasHeight || 320}
              baseShapes={geomData.baseShapes || []}
              shapes={studentDrawing}
              onChange={result ? undefined : setStudentDrawing}
              readOnly={Boolean(result)}
              teacherCorrectionShapes={geomData.teacherCorrectionShapes || []}
              showTeacherCorrection={showTeacherCorrection}
              onToggleTeacherCorrection={
                result ? () => setShowTeacherCorrection((prev) => !prev) : undefined
              }
              testId="geometry-canvas"
            />
          </section>
        )}

        {/* Graded Result Summary */}
        {result && (
          <section
            data-testid="quiz-result-card"
            className={`result-hero space-y-3 ${result.outOf20 >= 10 ? 'pass' : 'fail'}`}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-[#FFE8B3]">
              <Award className="h-4 w-4" />
              <span>نتيجة التمرين الإلكتروني</span>
            </div>
            <div className="font-display tabular-nums text-4xl font-bold">
              {result.outOf20} <span className="text-lg opacity-85">/ 20</span>
            </div>
            <p className="m-0 text-sm text-white/95">
              أجبت إجابة صحيحة على {result.correctCount} من {result.totalQuestions} أسئلة (
              {result.percentage}%)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {scoreSaved ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تم حفظ النتيجة ورسمك في Firebase</span>
                </div>
              ) : isSignedIn ? (
                <button
                  type="button"
                  disabled={savingScore}
                  onClick={handleSavePendingScore}
                  className="btn btn-gold !py-2 !px-4 !text-xs"
                >
                  {savingScore ? 'جارٍ الحفظ...' : 'حفظ النتيجة في Firebase'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePendingScore}
                  className="btn btn-gold !py-2 !px-4 !text-xs"
                >
                  سجّل دخول التلميذ لحفظ النتيجة
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setStudentDrawing([]);
                  setShowTeacherCorrection(false);
                  setResult(null);
                  setSecondsElapsed(0);
                  setScoreSaved(false);
                }}
                className="btn !bg-white !text-[#22163F] !py-2 !px-4 !text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          </section>
        )}

        {/* Teacher's Model Correction after submission */}
        {result && isGeom && geomData && (geomData.teacherCorrectionText || geomData.teacherCorrectionImageUrl) && (
          <section className="ix-model space-y-2.5" data-testid="teacher-model-correction">
            <h4>تصحيح الأستاذ النموذجي</h4>
            {geomData.teacherCorrectionText && (
              <div className="whitespace-pre-line text-sm leading-relaxed text-[#14532D]">
                <MathText text={geomData.teacherCorrectionText} />
              </div>
            )}
            {geomData.teacherCorrectionImageUrl && (
              <img
                src={geomData.teacherCorrectionImageUrl}
                alt="تصحيح الأستاذ المصور"
                referrerPolicy="no-referrer"
                className="max-h-72 rounded-xl border border-emerald-200 object-contain"
              />
            )}
          </section>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {activeExercise.questions.map((q, qIdx) => {
            const qRes = result?.results.find((r) => r.questionId === q.id);
            const currentAns = answers[q.id];

            return (
              <div key={q.id} className="notebook-card p-4">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-[#EFE8FE] px-2.5 py-1 text-xs font-bold text-[#3E1591]">
                    السؤال {qIdx + 1}
                  </span>
                  <span className="tabular-nums text-xs font-bold text-[#6E6390]">
                    {q.points} نقاط
                  </span>
                </div>

                <div className="mb-3 text-base font-bold leading-relaxed text-[#22163F]">
                  <MathText text={q.prompt} />
                </div>

                {q.type === 'choice' ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(q.choices || []).map((choice, cIdx) => {
                      const letter = ['أ', 'ب', 'ج', 'د'][cIdx] || String(cIdx + 1);
                      const isChosen = currentAns === cIdx;
                      const isCorrectChoice = q.correctChoiceIndex === cIdx;

                      let btnCls = 'border-[#E6DEF8] bg-white hover:border-[#6D28D9]';
                      if (result) {
                        if (isCorrectChoice) {
                          btnCls = 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900';
                        } else if (isChosen && !isCorrectChoice) {
                          btnCls = 'border-rose-400 bg-rose-50 text-rose-900';
                        } else {
                          btnCls = 'border-[#E6DEF8] bg-white/70 opacity-65';
                        }
                      } else if (isChosen) {
                        btnCls = 'border-[#6D28D9] bg-[#F5F0FE] font-bold';
                      }

                      return (
                        <button
                          key={cIdx}
                          type="button"
                          disabled={Boolean(result)}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: cIdx }))}
                          className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-right text-sm transition ${btnCls}`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFE8FE] font-display text-xs font-bold text-[#3E1591]">
                            {letter}
                          </span>
                          <span className="flex-1">
                            <MathText text={choice} />
                          </span>
                          {result && isCorrectChoice && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          )}
                          {result && isChosen && !isCorrectChoice && (
                            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      dir={q.type === 'text' ? 'auto' : 'ltr'}
                      disabled={Boolean(result)}
                      value={typeof currentAns === 'string' ? currentAns : ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={q.type === 'text' ? 'اكتب الإجابة الصحيحة...' : 'اكتب النتيجة...'}
                      className={`${
                        q.type === 'text' ? 'min-w-[220px] flex-1 max-w-md' : 'w-48'
                      } rounded-xl border-2 border-[#D6C9F3] bg-[#FAF8FF] px-3 py-2 text-center font-display text-base font-bold text-[#22163F] focus:border-[#6D28D9] focus:outline-none`}
                    />
                    {q.unit && (
                      <span dir="ltr" className="text-sm font-bold text-[#6E6390]">
                        {q.unit}
                      </span>
                    )}
                    {result && qRes && (
                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          qRes.isCorrect
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {qRes.isCorrect
                          ? 'إجابة صحيحة'
                          : `الإجابة الصحيحة: ${qRes.expectedLabel}`}
                      </span>
                    )}
                  </div>
                )}

                {result && q.explanation && (
                  <div className="mt-3 rounded-xl border border-[#D6C9F3] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#22163F]">
                    <strong className="text-[#3E1591]">التوضيح: </strong>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!result && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitQuiz}
              data-testid="submit-quiz-btn"
              className="btn btn-main"
            >
              تصحيح التمرين وحفظ النتيجة /20
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wrap space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="m-0 text-xl font-bold text-[#22163F]">التمارين التفاعلية والفروض</h1>
          <p className="m-0 text-xs text-[#6E6390]">
            اختر تمريناً جبرياً أو هندسياً، ارسم وأجب عن الأسئلة واحصل على تصحيح فوري /20.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && onOpenAdminExercises && (
            <button
              type="button"
              onClick={onOpenAdminExercises}
              className="btn btn-main !py-1.5 !px-3 !text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة / إدارة التمارين</span>
            </button>
          )}
          <span className="rounded-xl bg-[#EFE8FE] px-3 py-1.5 text-xs font-bold text-[#3E1591]">
            المنجزة: {completedExerciseIds.length} / {exercises.length}
          </span>
        </div>
      </div>

      {/* Category Quick Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'الكل' },
            { id: 'geometry', label: '📐 تمرين تفاعلي هندسة' },
            { id: 'interactive', label: 'تفاعلي' },
            { id: 'daily', label: 'يومي' },
            { id: 'devoir', label: 'فرض محروس' },
            { id: 'exam', label: 'اختبار فصلي' },
          ] as const
        ).map((tab) => {
          const active = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              data-testid={`filter-cat-${tab.id}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'border border-[#E6DEF8] bg-white text-[#22163F] hover:border-[#D6C9F3]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Chapter/Difficulty Filters */}
      <div className="notebook-card grid gap-2.5 p-3 sm:grid-cols-12">
        <div className="relative sm:col-span-5">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن تمرين..."
            className="w-full rounded-xl border border-[#E6DEF8] bg-white py-2 pr-9 pl-3 text-sm focus:border-[#6D28D9] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full rounded-xl border border-[#E6DEF8] bg-white px-3 py-2 text-xs font-semibold text-[#22163F] focus:border-[#6D28D9] focus:outline-none"
          >
            <option value="all">كل المحاور</option>
            {levelChapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | 'all')}
            className="w-full rounded-xl border border-[#E6DEF8] bg-white px-3 py-2 text-xs font-semibold text-[#22163F] focus:border-[#6D28D9] focus:outline-none"
          >
            <option value="all">كل المستويات</option>
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">متقدم</option>
          </select>
        </div>
      </div>

      {/* Exercise Cards (.qzg / .qzc) */}
      {filtered.length === 0 ? (
        <div className="notebook-card p-8 text-center text-sm text-[#6E6390]">
          {exercises.length === 0 ? 'لا توجد تمارين مضافة حالياً.' : 'لا توجد تمارين مطابقة للبحث.'}
        </div>
      ) : (
        <div className="qzg">
          {filtered.map((ex, idx) => {
            const palette = CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.daily;
            const done = completedSet.has(ex.id);
            const ringPct = done ? '100%' : '0%';
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectExercise(ex)}
                data-testid={`exercise-card-${ex.id}`}
                className={`qzc ${done ? 'done' : ''}`}
                style={{
                  ['--c' as string]: palette.c,
                  ['--d' as string]: palette.d,
                  ['--p' as string]: ringPct,
                }}
              >
                <span className="qzc-sym" aria-hidden="true">
                  {palette.sym}
                </span>
                <div className="qzc-ring">
                  <span>{done ? '✓' : idx + 1}</span>
                </div>
                <div className="qzc-k">
                  {CATEGORY_LABELS[ex.category] || 'تمرين'} · {DIFFICULTY_LABELS[ex.difficulty]}
                </div>
                <h3>
                  <MathText text={ex.title} />
                </h3>
                <div className="qzc-b">
                  {done ? 'منجز ✓ — إعادة' : `${ex.questions.length} أسئلة · ابدأ ←`}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
