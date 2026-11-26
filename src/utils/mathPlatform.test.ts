import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASS_LEVELS,
  computeLeaderboardRankings,
  computeStudentMetrics,
  computeTopicMastery,
  daysUntilTarget,
  filterCourses,
  filterExercises,
  getChaptersForLevel,
  gradeExercise,
  normalizeTextAnswer,
  parseAcceptedAnswersList,
  parseClassLevel,
  parseNumericInput,
  sanitizeDocId,
  verifyAdminAccessCode,
} from './mathPlatform.ts';
import type { Course, Exercise, Question, ScoreRecord } from '../types/math.ts';

test('class level helpers support 1AM, 2AM, 3AM, and 4AM with distinct chapters', () => {
  assert.deepEqual(CLASS_LEVELS, ['1AM', '2AM', '3AM', '4AM']);
  assert.equal(parseClassLevel('1am'), '1AM');
  assert.equal(parseClassLevel(' 4AM '), '4AM');
  assert.equal(parseClassLevel('5AM'), null);
  assert.equal(parseClassLevel(''), null);

  for (const lvl of CLASS_LEVELS) {
    const ch = getChaptersForLevel(lvl);
    assert.equal(ch.length, 6);
  }
  assert.notDeepEqual(getChaptersForLevel('1AM'), getChaptersForLevel('4AM'));
});

test('parseNumericInput supports Arabic commas, Arabic/Persian digits, decimals, and fractions', () => {
  assert.equal(parseNumericInput('12,5'), 12.5);
  assert.equal(parseNumericInput('12،5'), 12.5);
  assert.equal(parseNumericInput('3/4'), 0.75);
  assert.equal(parseNumericInput(' -7.2 '), -7.2);
  assert.equal(parseNumericInput('١٢'), 12);
  assert.equal(parseNumericInput('٣/٤'), 0.75);
  assert.equal(parseNumericInput('-٥،٥'), -5.5);
  assert.equal(parseNumericInput('۱۲٫۵'), 12.5);
  assert.equal(parseNumericInput('۱۲.۵'), 12.5);
  assert.equal(parseNumericInput('5/0'), null);
  assert.equal(parseNumericInput(''), null);
});

test('gradeExercise accurately scores mixed MCQ and numeric questions out of 20', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      type: 'choice',
      prompt: 'احسب (-3) × (-4)',
      choices: ['-12', '12', '-7', '7'],
      correctChoiceIndex: 1,
      points: 4,
    },
    {
      id: 'q2',
      type: 'number',
      prompt: 'احسب قيمة 2^3',
      correctNumber: 8,
      points: 6,
    },
    {
      id: 'q3',
      type: 'number',
      prompt: 'احسب نصف قطر دائرة محيطها 31.4 تقريبا (اقسم على 3.14 ثم 2)',
      correctNumber: 5,
      acceptedNumbers: [5.0],
      points: 10,
    },
  ];

  const perfect = gradeExercise(questions, { q1: 1, q2: '8', q3: '5,0' });
  assert.equal(perfect.earnedPoints, 20);
  assert.equal(perfect.totalPoints, 20);
  assert.equal(perfect.outOf20, 20);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.correctCount, 3);

  const partial = gradeExercise(questions, { q1: 1, q2: '9', q3: '5' });
  assert.equal(partial.earnedPoints, 14);
  assert.equal(partial.outOf20, 14);
  assert.equal(partial.percentage, 70);
  assert.equal(partial.correctCount, 2);
});

test('computeTopicMastery prioritizes weak chapters for study recommendations', () => {
  const courses: Course[] = [
    {
      id: 'c1',
      title: 'ضرب وقسمة الأعداد النسبية',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      chapterOrder: 1,
      summary: 'ملخص',
      published: true,
      createdBy: 'admin1',
    },
    {
      id: 'c2',
      title: 'نظرية فيثاغورس',
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      chapterOrder: 5,
      summary: 'ملخص',
      published: true,
      createdBy: 'admin1',
    },
  ];

  const exercises: Exercise[] = [
    {
      id: 'ex1',
      title: 'تمرين الكسور',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      category: 'daily',
      difficulty: 'easy',
      durationMinutes: 10,
      questions: [{ id: 'q1', type: 'choice', prompt: 'س', choices: ['1', '2'], correctChoiceIndex: 0, points: 2 }],
      published: true,
      createdBy: 'admin1',
    },
    {
      id: 'ex2',
      title: 'تطبيق فيثاغورس',
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      category: 'devoir',
      difficulty: 'medium',
      durationMinutes: 15,
      questions: [{ id: 'q1', type: 'choice', prompt: 'س', choices: ['1', '2'], correctChoiceIndex: 0, points: 2 }],
      published: true,
      createdBy: 'admin1',
    },
  ];

  const scores: ScoreRecord[] = [
    {
      id: 's1',
      studentName: 'أمينة',
      studentUid: 'stu1',
      exerciseId: 'ex1',
      exerciseTitle: 'تمرين الكسور',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      score: 16,
      total: 20,
      outOf20: 16,
      percentage: 80,
      durationSeconds: 90,
      isPublic: true,
    },
    {
      id: 's2',
      studentName: 'أمينة',
      studentUid: 'stu1',
      exerciseId: 'ex2',
      exerciseTitle: 'تطبيق فيثاغورس',
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      score: 6,
      total: 20,
      outOf20: 6,
      percentage: 30,
      durationSeconds: 120,
      isPublic: true,
    },
  ];

  const { mastery, recommendations } = computeTopicMastery(scores, exercises, courses, ['c1'], ['ex1']);
  const pyth = mastery.find((m) => m.chapter === 'المثلث القائم والدائرة ونظرية فيثاغورس');
  assert.equal(pyth?.status, 'needs_review');
  assert.equal(recommendations[0]?.priority, 'high');
  assert.equal(recommendations[0]?.chapter, 'المثلث القائم والدائرة ونظرية فيثاغورس');
});

test('computeStudentMetrics aggregates averages, completion rates, and level labels', () => {
  const scores: ScoreRecord[] = [
    {
      id: 's1',
      studentName: 'ياسين',
      studentUid: 'u1',
      exerciseId: 'e1',
      exerciseTitle: 'ت1',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      score: 18,
      total: 20,
      outOf20: 18,
      percentage: 90,
      durationSeconds: 60,
      isPublic: true,
    },
  ];

  const metrics = computeStudentMetrics(scores, ['c1'], ['e1'], 2, 2);
  assert.equal(metrics.overallAverageOutOf20, 18);
  assert.equal(metrics.bestOutOf20, 18);
  assert.equal(metrics.completionRatePct, 50);
  assert.equal(metrics.levelLabel, 'متفوق');
});

test('sanitizeDocId, daysUntilTarget, and filters behave predictably', () => {
  assert.match(sanitizeDocId('ex 123/test!'), /^[a-zA-Z0-9_-]+$/);
  const now = new Date('2026-05-01T08:00:00').getTime();
  assert.equal(daysUntilTarget('2026-05-11', now), 10);
  assert.equal(daysUntilTarget('2026-04-01', now), 0);

  const exercises: Exercise[] = [
    {
      id: 'e1',
      title: 'قوى العدد 10',
      chapter: 'القوى ذات أسس نسبية صحيحة',
      category: 'daily',
      difficulty: 'easy',
      durationMinutes: 10,
      questions: [],
      published: true,
      createdBy: 'a',
    },
    {
      id: 'e2',
      title: 'فرض فيثاغورس',
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      category: 'devoir',
      difficulty: 'hard',
      durationMinutes: 25,
      questions: [],
      published: true,
      createdBy: 'a',
    },
  ];
  assert.equal(filterExercises(exercises, { difficulty: 'hard' }).length, 1);
  assert.equal(filterExercises(exercises, { search: 'فيثاغورس' })[0].id, 'e2');

  const courses: Course[] = [
    { id: 'c2', title: 'ب', chapter: 'ج', chapterOrder: 2, summary: 'ملخص', published: true, createdBy: 'a' },
    { id: 'c1', title: 'أ', chapter: 'ج', chapterOrder: 1, summary: 'ملخص', published: true, createdBy: 'a' },
  ];
  assert.deepEqual(
    filterCourses(courses, {}).map((c) => c.id),
    ['c1', 'c2']
  );
});

test('verifyAdminAccessCode validates the Arabic admin code منصة الرياضيات', () => {
  assert.equal(verifyAdminAccessCode('منصة الرياضيات'), true);
  assert.equal(verifyAdminAccessCode('  منصة   الرياضيات '), true);
  assert.equal(verifyAdminAccessCode('123456'), false);
  assert.equal(verifyAdminAccessCode(''), false);
});

test('gradeExercise grades written text answers with normalization, Arabic digits, and alternatives', () => {
  assert.equal(normalizeTextAnswer(' 2X + 6 '), '2x+6');
  assert.equal(normalizeTextAnswer('١٢،٥'), '12.5');
  assert.deepEqual(parseAcceptedAnswersList('2x+6 | 6+2x'), ['2x+6', '6+2x']);

  const textQuestions: Question[] = [
    {
      id: 'qt1',
      type: 'text',
      prompt: 'انشر وبسّط: 2(x + 3)',
      correctText: '2x + 6',
      acceptedAnswers: ['6 + 2x'],
      points: 10,
    },
    {
      id: 'qt2',
      type: 'text',
      prompt: 'احسب 3 ÷ 4',
      correctText: '3/4',
      points: 10,
    },
  ];

  const res = gradeExercise(textQuestions, { qt1: '6+2X', qt2: '0.75' });
  assert.equal(res.correctCount, 2);
  assert.equal(res.outOf20, 20);
});

test('computeLeaderboardRankings ranks students by accumulated best points per exercise', () => {
  const records: ScoreRecord[] = [
    {
      id: '1',
      studentUid: 'u1',
      studentName: 'أمينة',
      exerciseId: 'ex1',
      exerciseTitle: 'تمرين 1',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      score: 10,
      total: 10,
      outOf20: 20,
      percentage: 100,
      durationSeconds: 45,
      isPublic: true,
    },
    {
      id: '2',
      studentUid: 'u1',
      studentName: 'أمينة',
      exerciseId: 'ex2',
      exerciseTitle: 'تمرين 2',
      chapter: 'المثلث القائم والدائرة ونظرية فيثاغورس',
      score: 15,
      total: 20,
      outOf20: 15,
      percentage: 75,
      durationSeconds: 60,
      isPublic: true,
    },
    {
      id: '3',
      studentUid: 'u2',
      studentName: 'ياسين',
      exerciseId: 'ex1',
      exerciseTitle: 'تمرين 1',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      score: 8,
      total: 10,
      outOf20: 16,
      percentage: 80,
      durationSeconds: 30,
      isPublic: true,
    },
    {
      id: '4',
      studentUid: 'u2',
      studentName: 'ياسين',
      exerciseId: 'ex1',
      exerciseTitle: 'تمرين 1',
      chapter: 'الأعداد النسبية والكسور والأعداد الناطقة',
      score: 9,
      total: 10,
      outOf20: 18,
      percentage: 90,
      durationSeconds: 25,
      isPublic: true,
    },
  ];

  const rankings = computeLeaderboardRankings(records);
  assert.equal(rankings.length, 2);
  assert.equal(rankings[0].studentUid, 'u1');
  assert.equal(rankings[0].rank, 1);
  assert.equal(rankings[0].totalPoints, 25);
  assert.equal(rankings[0].exercisesCount, 2);
  assert.equal(rankings[1].studentUid, 'u2');
  assert.equal(rankings[1].rank, 2);
  assert.equal(rankings[1].totalPoints, 9);
  assert.equal(rankings[1].attemptsCount, 2);
});



