import type {
  AnswerMap,
  ChapterMastery,
  ClassLevel,
  ClassLevelMeta,
  Course,
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
  GradeResult,
  GradedQuestionResult,
  Question,
  ScoreRecord,
  StudentMetrics,
  StudentRankingEntry,
  StudyRecommendation,
} from '../types/math.ts';

export const CLASS_LEVELS: readonly ClassLevel[] = ['1AM', '2AM', '3AM', '4AM'];

export const CLASS_LEVEL_META: Record<ClassLevel, ClassLevelMeta> = {
  '1AM': {
    id: '1AM',
    shortLabel: '1 متوسط',
    title: 'السنة الأولى متوسط',
    subtitle: 'الأعداد العشرية، الكسور، التناظر المحوري، المحيطات والمساحات',
    badge: '1AM · خادم مستقل',
    accentC: '#0284c7',
    accentD: '#0369a1',
    sym: '1',
  },
  '2AM': {
    id: '2AM',
    shortLabel: '2 متوسط',
    title: 'السنة الثانية متوسط',
    subtitle: 'الكسور، الأعداد النسبية، التناظر المركزي، المثلثات ومتوازي الأضلاع',
    badge: '2AM · خادم مستقل',
    accentC: '#059669',
    accentD: '#047857',
    sym: '2',
  },
  '3AM': {
    id: '3AM',
    shortLabel: '3 متوسط',
    title: 'السنة الثالثة متوسط',
    subtitle: 'القوى، الحساب الحرفي، نظرية فيثاغورس، تقايس المثلثات وجيب التمام',
    badge: '3AM · خادم مستقل',
    accentC: '#7c3aed',
    accentD: '#5b21b6',
    sym: '3',
  },
  '4AM': {
    id: '4AM',
    shortLabel: '4 متوسط (BEM)',
    title: 'السنة الرابعة متوسط',
    subtitle: 'الجذور، المتطابقات الشهيرة، طالس، النسب المثلثية، الدوال والأشعة',
    badge: '4AM · خادم مستقل',
    accentC: '#d97706',
    accentD: '#b45309',
    sym: '4',
  },
};

export const CHAPTERS_3AM: readonly string[] = [
  'الأعداد النسبية والكسور والأعداد الناطقة',
  'المثلثات وتقايس المثلثات ومستقيم المنتصفين',
  'القوى ذات أسس نسبية صحيحة',
  'الحساب الحرفي والمعادلات',
  'المثلث القائم والدائرة ونظرية فيثاغورس',
  'التناسبية وتنظيم المعطيات',
];

export const CHAPTERS_BY_LEVEL: Record<ClassLevel, readonly string[]> = {
  '1AM': [
    'الأعداد الطبيعية والأعداد العشرية',
    'الحساب على الأعداد العشرية والمدد',
    'القسمة الإقليدية والعشرية والكسور',
    'الأعداد النسبية والحساب الحرفي الأولي',
    'الإنشاءات الهندسية والزوايا والمضلعات',
    'التناظر المحوري، المحيطات والمساحات والتناسبية',
  ],
  '2AM': [
    'سلسلة العمليات على الأعداد الطبيعية والعشرية',
    'الكسور والعمليات عليها',
    'الأعداد النسبية: المقارنة والجمع والطرح',
    'المعادلات، التناسبية وتنظيم المعطيات',
    'التناظر المركزي والزوايا والتوازي',
    'المثلثات، متوازي الأضلاع والمجسمات',
  ],
  '3AM': CHAPTERS_3AM,
  '4AM': [
    'الأعداد الطبيعية والأعداد الناطقة والجذور التربيعية',
    'الحساب الحرفي والمتطابقات الشهيرة والتحليل',
    'المعادلات والمتراجحات من الدرجة الأولى',
    'جملة معادلتين والدوال الخطية والتآلفية',
    'خاصية طالس والنسب المثلثية في المثلث القائم',
    'الأشعة والانسحاب، المعالم والدوران',
  ],
};

export function getChaptersForLevel(level: ClassLevel): readonly string[] {
  return CHAPTERS_BY_LEVEL[level] || CHAPTERS_3AM;
}

export function parseClassLevel(raw: string | null | undefined): ClassLevel | null {
  const upper = String(raw || '').trim().toUpperCase();
  if (upper === '1AM' || upper === '2AM' || upper === '3AM' || upper === '4AM') {
    return upper;
  }
  return null;
}

export function sanitizeDocId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

export function parseNumericInput(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/،/g, '.')
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
  if (!normalized) return null;
  if (/^-?\d+\/-?\d+$/.test(normalized)) {
    const [numStr, denStr] = normalized.split('/');
    const num = Number(numStr);
    const den = Number(denStr);
    if (den !== 0 && Number.isFinite(num) && Number.isFinite(den)) {
      return num / den;
    }
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeTextAnswer(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let str = String(raw).trim();
  str = str
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/،/g, '.')
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\s*([+\-=*/^()])\s*/g, '$1')
    .toLowerCase();
  return str.trim();
}

export function parseAcceptedAnswersList(raw: string): string[] {
  return String(raw || '')
    .split(/[|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function gradeExercise(questions: Question[], answers: AnswerMap): GradeResult {
  let earnedPoints = 0;
  let totalPoints = 0;
  let correctCount = 0;

  const results: GradedQuestionResult[] = questions.map((q) => {
    const maxPoints = Number(q.points) > 0 ? Number(q.points) : 1;
    totalPoints += maxPoints;
    const rawAns = answers[q.id] ?? null;

    let isCorrect = false;
    let expectedLabel = '';

    if (q.type === 'choice') {
      const idx = typeof q.correctChoiceIndex === 'number' ? q.correctChoiceIndex : 0;
      expectedLabel = (q.choices && q.choices[idx]) || '';
      const chosen = typeof rawAns === 'number' ? rawAns : Number(rawAns);
      isCorrect = rawAns !== null && rawAns !== '' && Number.isInteger(chosen) && chosen === idx;
    } else if (q.type === 'text') {
      const primaryText = (q.correctText || '').trim();
      const candidates = [primaryText, ...(q.acceptedAnswers || [])].filter(Boolean);
      expectedLabel = `${primaryText}${q.unit ? ` ${q.unit}` : ''}`.trim();

      const studentNorm = normalizeTextAnswer(rawAns);
      if (studentNorm && candidates.length > 0) {
        const studentNum = parseNumericInput(studentNorm);
        isCorrect = candidates.some((cand) => {
          const candNorm = normalizeTextAnswer(cand);
          if (!candNorm) return false;
          if (candNorm === studentNorm) return true;
          const candNum = parseNumericInput(candNorm);
          return studentNum !== null && candNum !== null && Math.abs(studentNum - candNum) <= 0.01;
        });
      }
    } else {
      const target = typeof q.correctNumber === 'number' ? q.correctNumber : 0;
      expectedLabel = `${target}${q.unit ? ` ${q.unit}` : ''}`;
      const val = parseNumericInput(rawAns);
      if (val !== null) {
        const candidates = [target, ...(q.acceptedNumbers || [])];
        isCorrect = candidates.some((c) => Math.abs(val - c) <= 0.01);
      }
    }

    if (isCorrect) {
      earnedPoints += maxPoints;
      correctCount += 1;
    }

    return {
      questionId: q.id,
      isCorrect,
      earnedPoints: isCorrect ? maxPoints : 0,
      maxPoints,
      studentAnswer: rawAns,
      expectedLabel,
    };
  });

  const safeTotal = totalPoints > 0 ? totalPoints : 1;
  const outOf20 = Math.round((earnedPoints / safeTotal) * 20 * 10) / 10;
  const percentage = Math.round((earnedPoints / safeTotal) * 100);

  return {
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    totalPoints: Math.round(safeTotal * 100) / 100,
    correctCount,
    totalQuestions: questions.length,
    outOf20,
    percentage,
    results,
  };
}

export function computeStudentMetrics(
  scores: ScoreRecord[],
  completedCourseIds: string[],
  completedExerciseIds: string[],
  totalCoursesCount: number,
  totalExercisesCount: number
): StudentMetrics {
  const totalAttempts = scores.length;
  const sumOutOf20 = scores.reduce((acc, s) => acc + (Number(s.outOf20) || 0), 0);
  const overallAverageOutOf20 =
    totalAttempts > 0 ? Math.round((sumOutOf20 / totalAttempts) * 10) / 10 : 0;
  const bestOutOf20 =
    totalAttempts > 0
      ? Math.round(Math.max(...scores.map((s) => Number(s.outOf20) || 0)) * 10) / 10
      : 0;

  const uniqueCompletedExercises = new Set(completedExerciseIds);
  scores.forEach((s) => {
    if (s.exerciseId) uniqueCompletedExercises.add(s.exerciseId);
  });
  const uniqueCompletedCourses = new Set(completedCourseIds);

  const totalItems = totalCoursesCount + totalExercisesCount;
  const doneItems = uniqueCompletedCourses.size + uniqueCompletedExercises.size;
  const completionRatePct = totalItems > 0 ? Math.min(100, Math.round((doneItems / totalItems) * 100)) : 0;

  let levelLabel = 'بداية مشجعة';
  if (totalAttempts === 0) levelLabel = 'جاهز للانطلاق';
  else if (overallAverageOutOf20 >= 16) levelLabel = 'متفوق';
  else if (overallAverageOutOf20 >= 13) levelLabel = 'جيد جداً';
  else if (overallAverageOutOf20 >= 10) levelLabel = 'مقبول — واصل التدريب';
  else levelLabel = 'يحتاج مراجعة مركزة';

  return {
    overallAverageOutOf20,
    bestOutOf20,
    totalAttempts,
    completedExercisesCount: uniqueCompletedExercises.size,
    totalExercisesCount,
    completedCoursesCount: uniqueCompletedCourses.size,
    totalCoursesCount,
    completionRatePct,
    levelLabel,
  };
}

export function computeTopicMastery(
  scores: ScoreRecord[],
  exercises: Exercise[],
  courses: Course[],
  completedCourseIds: string[],
  completedExerciseIds: string[],
  chapters: readonly string[] = CHAPTERS_3AM
): { mastery: ChapterMastery[]; recommendations: StudyRecommendation[] } {
  const chapterSet = new Set<string>(chapters);
  exercises.forEach((e) => chapterSet.add(e.chapter));
  courses.forEach((c) => chapterSet.add(c.chapter));
  scores.forEach((s) => chapterSet.add(s.chapter));

  const completedCourseSet = new Set(completedCourseIds);
  const completedExerciseSet = new Set(completedExerciseIds);
  scores.forEach((s) => {
    if (s.exerciseId) completedExerciseSet.add(s.exerciseId);
  });

  const mastery: ChapterMastery[] = [];
  const recommendations: StudyRecommendation[] = [];

  for (const chapter of chapterSet) {
    const chCourses = courses.filter((c) => c.chapter === chapter);
    const chExercises = exercises.filter((e) => e.chapter === chapter);
    const chScores = scores.filter((s) => s.chapter === chapter);

    if (chCourses.length === 0 && chExercises.length === 0 && chScores.length === 0) {
      continue;
    }

    const attempts = chScores.length;
    const averageOutOf20 =
      attempts > 0
        ? Math.round((chScores.reduce((acc, s) => acc + s.outOf20, 0) / attempts) * 10) / 10
        : 0;
    const bestOutOf20 =
      attempts > 0 ? Math.round(Math.max(...chScores.map((s) => s.outOf20)) * 10) / 10 : 0;

    const completedCourses = chCourses.filter((c) => completedCourseSet.has(c.id)).length;
    const completedExercises = chExercises.filter((e) => completedExerciseSet.has(e.id)).length;

    let status: ChapterMastery['status'] = 'unstarted';
    if (attempts > 0) {
      if (averageOutOf20 >= 14) status = 'mastered';
      else if (averageOutOf20 >= 10) status = 'developing';
      else status = 'needs_review';
    } else if (completedCourses > 0) {
      status = 'developing';
    }

    mastery.push({
      chapter,
      attempts,
      averageOutOf20,
      bestOutOf20,
      completedExercises,
      totalExercises: chExercises.length,
      completedCourses,
      totalCourses: chCourses.length,
      status,
    });

    const firstUnfinishedCourse =
      chCourses.find((c) => !completedCourseSet.has(c.id)) || chCourses[0];
    const firstUnfinishedExercise =
      chExercises.find((e) => !completedExerciseSet.has(e.id)) || chExercises[0];

    if (status === 'needs_review') {
      recommendations.push({
        chapter,
        priority: 'high',
        reason: `معدلك في هذا المحور ${averageOutOf20}/20 — يُنصح بمراجعة ملخص الدرس وإعادة التمارين الأساسية.`,
        suggestedCourseId: firstUnfinishedCourse?.id,
        suggestedCourseTitle: firstUnfinishedCourse?.title,
        suggestedExerciseId: firstUnfinishedExercise?.id,
        suggestedExerciseTitle: firstUnfinishedExercise?.title,
      });
    } else if (status === 'developing' && (averageOutOf20 < 14 || completedExercises < chExercises.length)) {
      recommendations.push({
        chapter,
        priority: 'medium',
        reason:
          attempts > 0
            ? `أداؤك متوسط (${averageOutOf20}/20) — حلّ تمريناً إضافياً سيرفع تمكّنك إلى الامتياز.`
            : 'أتممت الدرس، حان وقت تثبيت الفهم بحل تمرين تفاعلي.',
        suggestedCourseId: firstUnfinishedCourse?.id,
        suggestedCourseTitle: firstUnfinishedCourse?.title,
        suggestedExerciseId: firstUnfinishedExercise?.id,
        suggestedExerciseTitle: firstUnfinishedExercise?.title,
      });
    } else if (status === 'unstarted' && (chExercises.length > 0 || chCourses.length > 0)) {
      recommendations.push({
        chapter,
        priority: 'next',
        reason: 'محور لم تبدأه بعد — ابدأ بالدرس ثم اختبر مكتسباتك.',
        suggestedCourseId: firstUnfinishedCourse?.id,
        suggestedCourseTitle: firstUnfinishedCourse?.title,
        suggestedExerciseId: firstUnfinishedExercise?.id,
        suggestedExerciseTitle: firstUnfinishedExercise?.title,
      });
    }
  }

  const priorityRank = { high: 0, medium: 1, next: 2 };
  recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return { mastery, recommendations };
}

export function daysUntilTarget(targetDateStr: string, nowMs: number = Date.now()): number | null {
  if (!targetDateStr) return null;
  const target = new Date(`${targetDateStr}T08:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const diff = Math.ceil((target.getTime() - nowMs) / 86400000);
  return diff >= 0 ? diff : 0;
}

export function filterExercises(
  exercises: Exercise[],
  opts: {
    search?: string;
    chapter?: string;
    category?: ExerciseCategory | 'all';
    difficulty?: DifficultyLevel | 'all';
  }
): Exercise[] {
  const q = (opts.search || '').trim().toLowerCase();
  return exercises.filter((ex) => {
    if (opts.chapter && opts.chapter !== 'all' && ex.chapter !== opts.chapter) return false;
    if (opts.category && opts.category !== 'all' && ex.category !== opts.category) return false;
    if (opts.difficulty && opts.difficulty !== 'all' && ex.difficulty !== opts.difficulty) return false;
    if (q) {
      const hay = `${ex.title} ${ex.chapter} ${ex.description || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterCourses(
  courses: Course[],
  opts: { search?: string; chapter?: string }
): Course[] {
  const q = (opts.search || '').trim().toLowerCase();
  return courses
    .filter((c) => {
      if (opts.chapter && opts.chapter !== 'all' && c.chapter !== opts.chapter) return false;
      if (q) {
        const hay = `${c.title} ${c.chapter} ${c.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0));
}

export function verifyAdminAccessCode(raw: string): boolean {
  const normalized = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ');
  return normalized === 'منصة الرياضيات';
}

export function computeLeaderboardRankings(scores: ScoreRecord[]): StudentRankingEntry[] {
  interface Bucket {
    studentUid: string;
    studentName: string;
    studentClass?: string;
    attemptsCount: number;
    sumOutOf20: number;
    bestOutOf20: number;
    totalDurationSeconds: number;
    bestByExercise: Map<string, { points: number; total: number }>;
  }

  const buckets = new Map<string, Bucket>();

  for (const s of scores) {
    const key = (s.studentUid || s.studentName || s.id).trim();
    const existing = buckets.get(key);
    const earned = Number.isFinite(Number(s.score)) ? Number(s.score) : Number(s.outOf20) || 0;
    const maxPts = Number.isFinite(Number(s.total)) && Number(s.total) > 0 ? Number(s.total) : 20;
    const out20 = Number(s.outOf20) || 0;
    const exKey = s.exerciseId || s.exerciseTitle || s.id;

    if (!existing) {
      const bestByExercise = new Map<string, { points: number; total: number }>();
      bestByExercise.set(exKey, { points: earned, total: maxPts });
      buckets.set(key, {
        studentUid: s.studentUid,
        studentName: s.studentName,
        studentClass: s.studentClass,
        attemptsCount: 1,
        sumOutOf20: out20,
        bestOutOf20: out20,
        totalDurationSeconds: Number(s.durationSeconds) || 0,
        bestByExercise,
      });
    } else {
      existing.attemptsCount += 1;
      existing.sumOutOf20 += out20;
      existing.bestOutOf20 = Math.max(existing.bestOutOf20, out20);
      existing.totalDurationSeconds += Number(s.durationSeconds) || 0;
      if (!existing.studentClass && s.studentClass) {
        existing.studentClass = s.studentClass;
      }
      const prevEx = existing.bestByExercise.get(exKey);
      if (!prevEx || earned > prevEx.points) {
        existing.bestByExercise.set(exKey, { points: earned, total: maxPts });
      }
    }
  }

  const list: StudentRankingEntry[] = [];
  for (const b of buckets.values()) {
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    for (const ex of b.bestByExercise.values()) {
      totalPoints += ex.points;
      maxPossiblePoints += ex.total;
    }
    list.push({
      rank: 0,
      studentUid: b.studentUid,
      studentName: b.studentName,
      studentClass: b.studentClass,
      totalPoints: Math.round(totalPoints * 10) / 10,
      maxPossiblePoints: Math.round(maxPossiblePoints * 10) / 10,
      exercisesCount: b.bestByExercise.size,
      attemptsCount: b.attemptsCount,
      averageOutOf20:
        b.attemptsCount > 0 ? Math.round((b.sumOutOf20 / b.attemptsCount) * 10) / 10 : 0,
      bestOutOf20: Math.round(b.bestOutOf20 * 10) / 10,
      totalDurationSeconds: b.totalDurationSeconds,
    });
  }

  list.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.averageOutOf20 !== a.averageOutOf20) return b.averageOutOf20 - a.averageOutOf20;
    if (b.bestOutOf20 !== a.bestOutOf20) return b.bestOutOf20 - a.bestOutOf20;
    return a.totalDurationSeconds - b.totalDurationSeconds;
  });

  return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

