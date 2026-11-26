export type UserRole = 'student' | 'admin';

export type QuestionType = 'choice' | 'number' | 'text';

export type ExerciseCategory = 'daily' | 'devoir' | 'exam' | 'interactive' | 'geometry';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type EventType = 'live' | 'exam' | 'devoir' | 'announcement';

export type GeometryTemplateKey =
  | 'pythagoras'
  | 'circumcircle'
  | 'midsegment'
  | 'cosine'
  | 'congruence'
  | 'custom';

export type GeometryShape =
  | {
      id: string;
      kind: 'segment';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color?: string;
      dashed?: boolean;
      label?: string;
    }
  | {
      id: string;
      kind: 'circle';
      cx: number;
      cy: number;
      r: number;
      color?: string;
      dashed?: boolean;
      label?: string;
    }
  | {
      id: string;
      kind: 'point';
      x: number;
      y: number;
      label?: string;
      color?: string;
    }
  | {
      id: string;
      kind: 'rightAngle';
      vx: number;
      vy: number;
      ux: number;
      uy: number;
      wx: number;
      wy: number;
      color?: string;
    }
  | {
      id: string;
      kind: 'freehand';
      points: { x: number; y: number }[];
      color?: string;
    }
  | {
      id: string;
      kind: 'text';
      x: number;
      y: number;
      text: string;
      color?: string;
    };

export interface GeometryExerciseData {
  templateKey: GeometryTemplateKey;
  canvasWidth: number;
  canvasHeight: number;
  baseShapes: GeometryShape[];
  drawPrompt: string;
  teacherCorrectionText: string;
  teacherCorrectionShapes: GeometryShape[];
  teacherCorrectionImageUrl?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  correctChoiceIndex?: number;
  correctNumber?: number;
  acceptedNumbers?: number[];
  correctText?: string;
  acceptedAnswers?: string[];
  unit?: string;
  points: number;
  explanation?: string;
}

export type CourseAttachmentKind = 'image' | 'pdf' | 'word' | 'powerpoint' | 'other';

export interface CourseAttachmentMeta {
  id: string;
  fileName: string;
  fileKind: CourseAttachmentKind;
  mimeType: string;
  sizeBytes: number;
}

export interface CourseAttachmentRecord extends CourseAttachmentMeta {
  courseId: string;
  dataUrl: string;
  chunkCount?: number;
  published: boolean;
  createdBy: string;
  createdAt?: unknown;
}

export interface Course {
  id: string;
  title: string;
  chapter: string;
  chapterOrder: number;
  summary: string;
  keyRules?: string;
  videoUrl?: string;
  pdfUrl?: string;
  attachments?: CourseAttachmentMeta[];
  durationMin?: number;
  published: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Exercise {
  id: string;
  title: string;
  chapter: string;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  description?: string;
  attachmentUrl?: string;
  geometryData?: GeometryExerciseData;
  questions: Question[];
  published: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EventItem {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  eventTime: string;
  description: string;
  link?: string;
  published: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ScoreRecord {
  id: string;
  studentName: string;
  studentClass?: string;
  studentUid: string;
  exerciseId: string;
  exerciseTitle: string;
  chapter: string;
  score: number;
  total: number;
  outOf20: number;
  percentage: number;
  durationSeconds: number;
  isPublic: boolean;
  studentDrawing?: GeometryShape[];
  teacherNote?: string;
  teacherCorrectionShapes?: GeometryShape[];
  gradedStatus?: 'auto' | 'reviewed';
  createdAtMs?: number;
  createdAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  classGroup?: string;
  role: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentProgress {
  userId: string;
  studentName: string;
  completedCourseIds: string[];
  completedExerciseIds: string[];
  totalAttempts: number;
  bestOutOf20: number;
  updatedAt?: unknown;
}

export interface AcademySettings {
  announcement: string;
  targetDate: string;
  targetLabel: string;
  updatedBy?: string;
  updatedAt?: unknown;
}

export type AnswerMap = Record<string, number | string | null>;

export interface GradedQuestionResult {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  studentAnswer: number | string | null;
  expectedLabel: string;
}

export interface GradeResult {
  earnedPoints: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  outOf20: number;
  percentage: number;
  results: GradedQuestionResult[];
}

export interface ChapterMastery {
  chapter: string;
  attempts: number;
  averageOutOf20: number;
  bestOutOf20: number;
  completedExercises: number;
  totalExercises: number;
  completedCourses: number;
  totalCourses: number;
  status: 'mastered' | 'developing' | 'needs_review' | 'unstarted';
}

export interface StudyRecommendation {
  chapter: string;
  priority: 'high' | 'medium' | 'next';
  reason: string;
  suggestedCourseId?: string;
  suggestedCourseTitle?: string;
  suggestedExerciseId?: string;
  suggestedExerciseTitle?: string;
}

export interface StudentMetrics {
  overallAverageOutOf20: number;
  bestOutOf20: number;
  totalAttempts: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  completedCoursesCount: number;
  totalCoursesCount: number;
  completionRatePct: number;
  levelLabel: string;
}

export interface StudentRankingEntry {
  rank: number;
  studentUid: string;
  studentName: string;
  studentClass?: string;
  totalPoints: number;
  maxPossiblePoints: number;
  exercisesCount: number;
  attemptsCount: number;
  averageOutOf20: number;
  bestOutOf20: number;
  totalDurationSeconds: number;
}

export type ClassLevel = '1AM' | '2AM' | '3AM' | '4AM';

export interface ClassLevelMeta {
  id: ClassLevel;
  shortLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  accentC: string;
  accentD: string;
  sym: string;
}

export type AppView =
  | 'classes'
  | 'home'
  | 'courses'
  | 'exercises'
  | 'dashboard'
  | 'events'
  | 'scores'
  | 'admin';
