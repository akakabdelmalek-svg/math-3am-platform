import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle2,
  Compass,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FileSpreadsheet,
  FileText,
  Plus,
  Presentation,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import type {
  AcademySettings,
  ClassLevel,
  Course,
  CourseAttachmentKind,
  CourseAttachmentMeta,
  DifficultyLevel,
  EventItem,
  EventType,
  Exercise,
  ExerciseCategory,
  GeometryExerciseData,
  GeometryShape,
  GeometryTemplateKey,
  Question,
  QuestionType,
  ScoreRecord,
} from '../types/math';
import {
  createBlankGeometryData,
  GEOMETRY_TEMPLATES,
  generateGeometryExercise,
} from '../utils/geometryGenerator';
import {
  formatFileSizeArabic,
  processLessonImportFile,
  type PendingLessonAttachment,
} from '../utils/lessonFileImport';
import {
  CLASS_LEVEL_META,
  getChaptersForLevel,
  parseAcceptedAnswersList,
  parseNumericInput,
} from '../utils/mathPlatform';
import { GeometryCanvas } from './GeometryCanvas';
import { MathText } from './MathText';

interface AdminDashboardViewProps {
  activeLevel: ClassLevel;
  adminUid: string;
  adminEmail: string;
  courses: Course[];
  exercises: Exercise[];
  events: EventItem[];
  scores: ScoreRecord[];
  settings: AcademySettings;
  onSaveCourse: (
    course: Omit<Course, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
  onSaveExercise: (
    exercise: Omit<Exercise, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  onSaveEvent: (
    event: Omit<EventItem, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onDeleteScore: (id: string) => Promise<void>;
  onSaveTeacherScoreCorrection: (
    scoreId: string,
    params: {
      teacherNote: string;
      teacherCorrectionShapes: GeometryShape[];
      total: number;
      outOf20?: number;
    }
  ) => Promise<void>;
  onSaveSettings: (settings: AcademySettings) => Promise<void>;
  onSeedCurriculum: () => Promise<void>;
}

type AdminTab = 'exercises' | 'courses' | 'events' | 'scores' | 'settings';

interface AdminDashboardViewPropsExtended extends AdminDashboardViewProps {
  initialTab?: AdminTab;
  onSaveCourse: (
    course: Omit<Course, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      pendingAttachments?: PendingLessonAttachment[];
      removedAttachmentIds?: string[];
    }
  ) => Promise<void>;
}

function createBlankQuestion(idx: number): Question {
  return {
    id: `q_${Date.now()}_${idx}`,
    type: 'choice',
    prompt: '',
    choices: ['', '', '', ''],
    correctChoiceIndex: 0,
    correctText: '',
    acceptedAnswers: [],
    points: 5,
    explanation: '',
  };
}

const FILE_KIND_LABELS: Record<CourseAttachmentKind, string> = {
  image: 'صورة JPG',
  pdf: 'ملف PDF',
  word: 'مستند Word',
  powerpoint: 'عرض PowerPoint',
  other: 'ملف مرفق',
};

export function AdminDashboardView({
  activeLevel,
  adminEmail,
  courses,
  exercises,
  events,
  scores,
  settings,
  initialTab,
  onSaveCourse,
  onDeleteCourse,
  onSaveExercise,
  onDeleteExercise,
  onSaveEvent,
  onDeleteEvent,
  onDeleteScore,
  onSaveTeacherScoreCorrection,
  onSaveSettings,
  onSeedCurriculum,
}: AdminDashboardViewPropsExtended) {
  const levelMeta = CLASS_LEVEL_META[activeLevel];
  const levelChapters = useMemo(() => getChaptersForLevel(activeLevel), [activeLevel]);
  const [tab, setTab] = useState<AdminTab>(initialTab || 'exercises');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Exercise builder state
  const [exId, setExId] = useState<string | undefined>(undefined);
  const [exTitle, setExTitle] = useState('');
  const [exChapter, setExChapter] = useState<string>(levelChapters[0]);
  const [exCategory, setExCategory] = useState<ExerciseCategory>('daily');
  const [exDifficulty, setExDifficulty] = useState<DifficultyLevel>('medium');
  const [exDuration, setExDuration] = useState(15);
  const [exDesc, setExDesc] = useState('');
  const [exAttachmentUrl, setExAttachmentUrl] = useState('');
  const [exPublished, setExPublished] = useState(true);
  const [exQuestions, setExQuestions] = useState<Question[]>([createBlankQuestion(1)]);
  const [numberDrafts, setNumberDrafts] = useState<Record<string, string>>({});

  // Geometry builder state
  const [geomTemplate, setGeomTemplate] =
    useState<Exclude<GeometryTemplateKey, 'custom'>>('pythagoras');
  const [exGeometryData, setExGeometryData] = useState<GeometryExerciseData | null>(null);
  const [geomEditLayer, setGeomEditLayer] = useState<'base' | 'correction'>('base');

  // Course editor state
  const [cId, setCId] = useState<string | undefined>(undefined);
  const [cTitle, setCTitle] = useState('');
  const [cChapter, setCChapter] = useState<string>(levelChapters[0]);
  const [cOrder, setCOrder] = useState(1);
  const [cDuration, setCDuration] = useState(25);
  const [cSummary, setCSummary] = useState('');
  const [cKeyRules, setCKeyRules] = useState('');
  const [cVideoUrl, setCVideoUrl] = useState('');
  const [cPdfUrl, setCPdfUrl] = useState('');
  const [cAttachments, setCAttachments] = useState<CourseAttachmentMeta[]>([]);
  const [cPendingAttachments, setCPendingAttachments] = useState<PendingLessonAttachment[]>([]);
  const [cRemovedAttachmentIds, setCRemovedAttachmentIds] = useState<string[]>([]);
  const [importingFiles, setImportingFiles] = useState(false);
  const [cPublished, setCPublished] = useState(true);

  // Event editor state
  const [evId, setEvId] = useState<string | undefined>(undefined);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState<EventType>('live');
  const [evDate, setEvDate] = useState('2026-12-10');
  const [evTime, setEvTime] = useState('18:00');
  const [evDesc, setEvDesc] = useState('');
  const [evLink, setEvLink] = useState('');
  const [evPublished, setEvPublished] = useState(true);

  // Settings editor state
  const [setAnnouncement, setSetAnnouncement] = useState(settings.announcement);
  const [setTargetDate, setSetTargetDate] = useState(settings.targetDate);
  const [setTargetLabel, setSetTargetLabel] = useState(settings.targetLabel);

  useEffect(() => {
    setSetAnnouncement(settings.announcement);
    setSetTargetDate(settings.targetDate);
    setSetTargetLabel(settings.targetLabel);
  }, [settings]);

  // Scores & Teacher Correction review state
  const [scoreSearch, setScoreSearch] = useState('');
  const [reviewingScoreId, setReviewingScoreId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewOutOf20, setReviewOutOf20] = useState<string>('');
  const [reviewShapes, setReviewShapes] = useState<GeometryShape[]>([]);

  useEffect(() => {
    setExId(undefined);
    setExChapter(levelChapters[0]);
    setCId(undefined);
    setCChapter(levelChapters[0]);
    setEvId(undefined);
    setReviewingScoreId(null);
    setStatusMsg(null);
    setErrorMsg(null);
  }, [activeLevel, levelChapters]);

  function resetExerciseForm() {
    setExId(undefined);
    setExTitle('');
    setExChapter(levelChapters[0]);
    setExCategory('daily');
    setExDifficulty('medium');
    setExDuration(15);
    setExDesc('');
    setExAttachmentUrl('');
    setExPublished(true);
    setExQuestions([createBlankQuestion(1)]);
    setNumberDrafts({});
    setExGeometryData(null);
    setGeomEditLayer('base');
  }

  function loadExerciseForEdit(ex: Exercise) {
    setExId(ex.id);
    setExTitle(ex.title);
    setExChapter(ex.chapter);
    setExCategory(ex.category);
    setExDifficulty(ex.difficulty);
    setExDuration(ex.durationMinutes);
    setExDesc(ex.description || '');
    setExAttachmentUrl(ex.attachmentUrl || '');
    setExPublished(ex.published);
    setExQuestions(ex.questions.length > 0 ? ex.questions : [createBlankQuestion(1)]);
    setNumberDrafts({});
    setExGeometryData(
      ex.geometryData
        ? ex.geometryData
        : ex.category === 'geometry'
          ? createBlankGeometryData()
          : null
    );
    setGeomEditLayer('base');
    setTab('exercises');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleGenerateGeometry() {
    const generated = generateGeometryExercise(geomTemplate, Date.now());
    setExId(undefined);
    setExTitle(generated.title);
    setExChapter(generated.chapter);
    setExCategory('geometry');
    setExDifficulty(generated.difficulty);
    setExDuration(generated.durationMinutes);
    setExDesc(generated.description);
    setExGeometryData(generated.geometryData);
    setExQuestions(generated.questions);
    setNumberDrafts({});
    setGeomEditLayer('correction');
    setStatusMsg('تم توليد تمرين هندسة تفاعلي مع شكل المعطيات والتصحيح النموذجي — يمكنك تعديله أو حفظه مباشرة.');
  }

  function resetCourseForm() {
    setCId(undefined);
    setCTitle('');
    setCChapter(levelChapters[0]);
    setCOrder(courses.length + 1);
    setCDuration(25);
    setCSummary('');
    setCKeyRules('');
    setCVideoUrl('');
    setCPdfUrl('');
    setCAttachments([]);
    setCPendingAttachments([]);
    setCRemovedAttachmentIds([]);
    setCPublished(true);
  }

  function loadCourseForEdit(c: Course) {
    setCId(c.id);
    setCTitle(c.title);
    setCChapter(c.chapter);
    setCOrder(c.chapterOrder || 1);
    setCDuration(c.durationMin || 25);
    setCSummary(c.summary);
    setCKeyRules(c.keyRules || '');
    setCVideoUrl(c.videoUrl || '');
    setCPdfUrl(c.pdfUrl || '');
    setCAttachments(c.attachments || []);
    setCPendingAttachments([]);
    setCRemovedAttachmentIds([]);
    setCPublished(c.published);
    setTab('courses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetEventForm() {
    setEvId(undefined);
    setEvTitle('');
    setEvType('live');
    setEvDate('2026-12-10');
    setEvTime('18:00');
    setEvDesc('');
    setEvLink('');
    setEvPublished(true);
  }

  function loadEventForEdit(ev: EventItem) {
    setEvId(ev.id);
    setEvTitle(ev.title);
    setEvType(ev.eventType);
    setEvDate(ev.eventDate);
    setEvTime(ev.eventTime);
    setEvDesc(ev.description);
    setEvLink(ev.link || '');
    setEvPublished(ev.published);
    setTab('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveExercise(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (exTitle.trim().length < 2) {
      setErrorMsg('يرجى إدخال عنوان التمرين (حرفان على الأقل).');
      return;
    }
    const cleanQuestions = exQuestions.filter((q) => q.prompt.trim().length > 0);
    if (cleanQuestions.length === 0) {
      setErrorMsg('أضف سؤالاً واحداً على الأقل واكتب نص السؤال.');
      return;
    }

    const validatedQuestions: Question[] = [];
    for (let i = 0; i < cleanQuestions.length; i++) {
      const q = cleanQuestions[i];
      if (q.type === 'text' && !(q.correctText || '').trim()) {
        setErrorMsg(`يرجى كتابة الإجابة الصحيحة للسؤال ${i + 1} حتى تتمكن المنصة من تصحيحه.`);
        return;
      }
      if (q.type === 'choice') {
        const chosenText = (q.choices || [])[q.correctChoiceIndex ?? 0] || '';
        if (!chosenText.trim()) {
          setErrorMsg(`يرجى كتابة نص الإجابة الصحيحة في اختيارات السؤال ${i + 1}.`);
          return;
        }
        validatedQuestions.push(q);
      } else if (q.type === 'number') {
        const draftRaw = numberDrafts[q.id];
        const resolvedNum =
          draftRaw !== undefined
            ? parseNumericInput(draftRaw)
            : typeof q.correctNumber === 'number' && Number.isFinite(q.correctNumber)
              ? q.correctNumber
              : null;
        if (resolvedNum === null) {
          setErrorMsg(`يرجى كتابة إجابة عددية صحيحة للسؤال ${i + 1} (مثال: 12 أو 3/4 أو -5.5).`);
          return;
        }
        validatedQuestions.push({ ...q, correctNumber: resolvedNum });
      } else {
        validatedQuestions.push(q);
      }
    }

    setBusy(true);
    try {
      await onSaveExercise({
        id: exId,
        title: exTitle,
        chapter: exChapter,
        category: exCategory,
        difficulty: exDifficulty,
        durationMinutes: exDuration,
        description: exDesc,
        attachmentUrl: exAttachmentUrl,
        geometryData:
          exCategory === 'geometry' ? exGeometryData || createBlankGeometryData() : undefined,
        questions: validatedQuestions,
        published: exPublished,
      });
      setStatusMsg('تم حفظ التمرين وإجاباته الصحيحة في Firebase Firestore بنجاح.');
      resetExerciseForm();
    } catch {
      setErrorMsg('حدث خطأ أثناء حفظ التمرين في قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImportExerciseJson(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Exercise>;
      if (parsed.title) setExTitle(parsed.title);
      if (parsed.chapter) setExChapter(parsed.chapter);
      if (parsed.description) setExDesc(parsed.description);
      if (parsed.category) setExCategory(parsed.category);
      if (parsed.geometryData) setExGeometryData(parsed.geometryData);
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        setExQuestions(
          parsed.questions.map((q, i) => ({
            id: q.id || `q_${Date.now()}_${i}`,
            type: q.type === 'number' || q.type === 'text' ? q.type : 'choice',
            prompt: String(q.prompt || ''),
            choices: Array.isArray(q.choices) ? q.choices.map(String) : ['', '', '', ''],
            correctChoiceIndex: typeof q.correctChoiceIndex === 'number' ? q.correctChoiceIndex : 0,
            correctNumber: typeof q.correctNumber === 'number' ? q.correctNumber : 0,
            correctText: typeof q.correctText === 'string' ? q.correctText : '',
            acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(String) : [],
            unit: q.unit || '',
            points: Number(q.points) || 5,
            explanation: q.explanation || '',
          }))
        );
      }
      setStatusMsg('تم استيراد ملف التمرين في المحرر — راجعه ثم اضغط حفظ.');
    } catch {
      setErrorMsg('تعذر قراءة ملف JSON، تأكد من صحة البنية.');
    }
  }

  async function handleImportLessonFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setImportingFiles(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const addedMetas: CourseAttachmentMeta[] = [];
      const addedPayloads: PendingLessonAttachment[] = [];
      const extractedBlocks: string[] = [];
      const warnings: string[] = [];

      for (const file of files) {
        if (cAttachments.length + addedMetas.length >= 10) {
          warnings.push('الحد الأقصى هو 10 مرفقات للدرس الواحد.');
          break;
        }
        const res = await processLessonImportFile(file);
        if (res.attachment) {
          addedMetas.push(res.attachment.meta);
          addedPayloads.push(res.attachment);
        }
        if (res.extractedText) {
          extractedBlocks.push(res.extractedText);
        }
        if (res.warning) {
          warnings.push(res.warning);
        }
      }

      if (addedMetas.length > 0) {
        setCAttachments((prev) => [...prev, ...addedMetas].slice(0, 10));
        setCPendingAttachments((prev) => [...prev, ...addedPayloads].slice(0, 10));
      }
      if (!cTitle.trim() && files[0]) {
        const cleanTitle = files[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        if (cleanTitle.length >= 2) setCTitle(cleanTitle.slice(0, 160));
      }
      if (extractedBlocks.length > 0) {
        const merged = extractedBlocks.join('\n\n');
        setCSummary((prev) => (prev.trim() ? `${prev.trim()}\n\n${merged}` : merged).slice(0, 4000));
      }

      if (warnings.length > 0) {
        setErrorMsg(warnings.join(' | '));
      }
      if (addedMetas.length > 0 || extractedBlocks.length > 0) {
        setStatusMsg(
          `تم استيراد ${addedMetas.length} ملف(ات) للدرس${extractedBlocks.length > 0 ? ' واستخراج المحتوى النصي إلى الملخص' : ''}. اضغط «حفظ الدرس» لتثبيتها.`
        );
      }
    } catch {
      setErrorMsg('تعذر استيراد أحد الملفات، يرجى المحاولة مرة أخرى.');
    } finally {
      setImportingFiles(false);
    }
  }

  function handleRemoveLessonAttachment(attId: string) {
    setCAttachments((prev) => prev.filter((a) => a.id !== attId));
    setCPendingAttachments((prev) => prev.filter((p) => p.meta.id !== attId));
    setCRemovedAttachmentIds((prev) => (prev.includes(attId) ? prev : [...prev, attId]));
  }

  async function handleSaveCourse(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (cTitle.trim().length < 2) {
      setErrorMsg('يرجى إدخال عنوان الدرس (حرفان على الأقل).');
      return;
    }
    const effectiveSummary =
      cSummary.trim() ||
      (cAttachments.length > 0
        ? `درس مرفق بـ ${cAttachments.map((a) => a.fileName).join('، ')}`
        : '');
    if (!effectiveSummary) {
      setErrorMsg('يرجى كتابة ملخص الدرس أو استيراد ملف للدرس.');
      return;
    }
    setBusy(true);
    try {
      await onSaveCourse({
        id: cId,
        title: cTitle,
        chapter: cChapter,
        chapterOrder: cOrder,
        durationMin: cDuration,
        summary: effectiveSummary,
        keyRules: cKeyRules,
        videoUrl: cVideoUrl,
        pdfUrl: cPdfUrl,
        attachments: cAttachments,
        pendingAttachments: cPendingAttachments,
        removedAttachmentIds: cRemovedAttachmentIds,
        published: cPublished,
      });
      setStatusMsg('تم حفظ الدرس وملفاته في Firebase Firestore بنجاح.');
      resetCourseForm();
    } catch {
      setErrorMsg('تعذر حفظ الدرس في قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCourseWithFeedback(course: Course) {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onDeleteCourse(course.id);
      if (cId === course.id) resetCourseForm();
      setStatusMsg(`تم حذف الدرس «${course.title}» من المنصة.`);
    } catch {
      setErrorMsg('تعذر حذف الدرس، يرجى المحاولة مجدداً.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteExerciseWithFeedback(ex: Exercise) {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onDeleteExercise(ex.id);
      if (exId === ex.id) resetExerciseForm();
      setStatusMsg(`تم حذف التمرين «${ex.title}».`);
    } catch {
      setErrorMsg('تعذر حذف التمرين.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteEventWithFeedback(evt: EventItem) {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onDeleteEvent(evt.id);
      if (evId === evt.id) resetEventForm();
      setStatusMsg(`تم حذف الحدث «${evt.title}».`);
    } catch {
      setErrorMsg('تعذر حذف الحدث.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteScoreWithFeedback(sc: ScoreRecord) {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onDeleteScore(sc.id);
      if (reviewingScoreId === sc.id) setReviewingScoreId(null);
      setStatusMsg(`تم حذف نتيجة التلميذ ${sc.studentName}.`);
    } catch {
      setErrorMsg('تعذر حذف النتيجة.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEvent(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (evTitle.trim().length < 2 || !evDesc.trim()) {
      setErrorMsg('يرجى إدخال عنوان الحدث (حرفان على الأقل) وتفاصيله.');
      return;
    }
    if (evDate.trim().length < 4 || evTime.trim().length < 2) {
      setErrorMsg('يرجى تحديد تاريخ وتوقيت صالحين للحدث.');
      return;
    }
    setBusy(true);
    try {
      await onSaveEvent({
        id: evId,
        title: evTitle,
        eventType: evType,
        eventDate: evDate,
        eventTime: evTime,
        description: evDesc,
        link: evLink,
        published: evPublished,
      });
      setStatusMsg('تم حفظ الحدث في Firebase Firestore بنجاح.');
      resetEventForm();
    } catch {
      setErrorMsg('تعذر حفظ الحدث في قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSettingsSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await onSaveSettings({
        announcement: setAnnouncement,
        targetDate: setTargetDate,
        targetLabel: setTargetLabel,
      });
      setStatusMsg('تم تحديث إعدادات المنصة في Firebase.');
    } catch {
      setErrorMsg('تعذر حفظ الإعدادات في قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  }

  function openScoreReview(sc: ScoreRecord) {
    if (reviewingScoreId === sc.id) {
      setReviewingScoreId(null);
      return;
    }
    const matchedEx = exercises.find((ex) => ex.id === sc.exerciseId);
    setReviewingScoreId(sc.id);
    setReviewNote(sc.teacherNote || matchedEx?.geometryData?.teacherCorrectionText || '');
    setReviewOutOf20(String(sc.outOf20));
    setReviewShapes(
      sc.teacherCorrectionShapes && sc.teacherCorrectionShapes.length > 0
        ? sc.teacherCorrectionShapes
        : matchedEx?.geometryData?.teacherCorrectionShapes || []
    );
  }

  async function handleSaveScoreReview(sc: ScoreRecord) {
    setBusy(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const parsedGrade = Number(reviewOutOf20);
      await onSaveTeacherScoreCorrection(sc.id, {
        teacherNote: reviewNote,
        teacherCorrectionShapes: reviewShapes,
        total: sc.total,
        outOf20: Number.isFinite(parsedGrade) ? parsedGrade : undefined,
      });
      setStatusMsg(`تم حفظ تصحيح الأستاذ لعمل التلميذ ${sc.studentName}.`);
      setReviewingScoreId(null);
    } catch {
      setErrorMsg('تعذر حفظ التصحيح، يرجى المحاولة مرة أخرى.');
    } finally {
      setBusy(false);
    }
  }

  const filteredScores = scores.filter((s) => {
    const q = scoreSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.exerciseTitle.toLowerCase().includes(q) ||
      s.chapter.toLowerCase().includes(q)
    );
  });

  const classAverage =
    scores.length > 0
      ? Math.round((scores.reduce((acc, s) => acc + s.outOf20, 0) / scores.length) * 10) / 10
      : 0;

  const isGeomMode = exCategory === 'geometry' || exGeometryData !== null;
  const activeGeomData = exGeometryData || createBlankGeometryData();

  return (
    <div className="wrap-wide space-y-5">
      {/* Admin Header */}
      <section className="notebook-violet flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7A33E] text-[#2A0E6B]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="m-0 text-lg font-bold text-white sm:text-xl">
              لوحة الإدارة — {levelMeta.title} ({activeLevel})
            </h1>
            <p className="m-0 text-xs text-[#FFE8B3]">
              خادم {activeLevel} المستقل · مسجل بصلاحية الإدارة:{' '}
              <span dir="ltr">{adminEmail}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErrorMsg(null);
            setStatusMsg(null);
            try {
              await onSeedCurriculum();
              setStatusMsg('تم التحقق من المنهاج الافتراضي ومزامنته مع Firestore.');
            } catch {
              setErrorMsg('تعذر مزامنة المنهاج الافتراضي مع قاعدة البيانات.');
            } finally {
              setBusy(false);
            }
          }}
          className="btn !bg-white/15 !text-white !py-2 !px-3.5 !text-xs hover:!bg-white/25"
        >
          <Database className="h-4 w-4" />
          <span>تهيئة منهاج {levelMeta.shortLabel}</span>
        </button>
      </section>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'exercises' as const, label: `التمارين والهندسة (${exercises.length})`, icon: Calculator },
          { id: 'courses' as const, label: `الدروس (${courses.length})`, icon: BookOpen },
          { id: 'events' as const, label: `الأحداث (${events.length})`, icon: Calendar },
          { id: 'scores' as const, label: `النتائج والتصحيح (${scores.length})`, icon: Trophy },
          { id: 'settings' as const, label: 'الإعدادات', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'bg-[#3E1591] text-white shadow-xs'
                  : 'border border-[#E6DEF8] bg-white text-[#22163F] hover:border-[#D6C9F3]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXERCISES & INTERACTIVE GEOMETRY GENERATOR */}
      {tab === 'exercises' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            onSubmit={handleSaveExercise}
            className="notebook-card space-y-4 p-5 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DEF8] pb-3">
              <h2 className="m-0 text-base font-bold text-[#3E1591]">
                {exId ? 'تعديل التمرين التفاعلي' : 'إضافة تمرين / اختبار جديد'}
              </h2>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#EFE8FE] px-3 py-1.5 text-xs font-bold text-[#3E1591] hover:bg-[#e1d4fc]">
                  <Upload className="h-3.5 w-3.5" />
                  <span>استيراد JSON</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportExerciseJson}
                    className="hidden"
                  />
                </label>
                {exId && (
                  <button
                    type="button"
                    onClick={resetExerciseForm}
                    className="rounded-lg border border-[#D6C9F3] px-3 py-1.5 text-xs font-bold text-[#6E6390]"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </div>

            {/* Automatic Geometry Exercise Generator Box */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <span>توليد «تمرين تفاعلي هندسة» تلقائياً (بالشكل والتصحيح)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={geomTemplate}
                  onChange={(e) =>
                    setGeomTemplate(e.target.value as Exclude<GeometryTemplateKey, 'custom'>)
                  }
                  className="flex-1 min-w-[200px] rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-[#22163F]"
                >
                  {GEOMETRY_TEMPLATES.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleGenerateGeometry}
                  data-testid="generate-geometry-btn"
                  className="btn !bg-emerald-700 !text-white !py-2 !px-4 !text-xs hover:!bg-emerald-800"
                >
                  <Compass className="h-4 w-4" />
                  <span>توليد تمرين هندسة</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">عنوان التمرين</label>
                <input
                  type="text"
                  value={exTitle}
                  onChange={(e) => setExTitle(e.target.value)}
                  placeholder="مثال: تمرين تفاعلي هندسة — نظرية فيثاغورس"
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm focus:border-[#6D28D9] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">المحور (الموضوع)</label>
                <select
                  value={exChapter}
                  onChange={(e) => setExChapter(e.target.value)}
                  className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm focus:border-[#6D28D9] focus:outline-none"
                >
                  {levelChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">النوع</label>
                <select
                  value={exCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as ExerciseCategory;
                    setExCategory(nextCat);
                    if (nextCat === 'geometry' && !exGeometryData) {
                      setExGeometryData(createBlankGeometryData());
                    }
                  }}
                  className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                >
                  <option value="geometry">تمرين تفاعلي هندسة 📐</option>
                  <option value="interactive">تمرين تفاعلي</option>
                  <option value="daily">تمرين يومي</option>
                  <option value="devoir">فرض محروس</option>
                  <option value="exam">اختبار فصلي</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">مستوى الصعوبة</label>
                <select
                  value={exDifficulty}
                  onChange={(e) => setExDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                >
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">متقدم</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">المدة المقترحة (دقيقة)</label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={exDuration}
                  onChange={(e) => setExDuration(Number(e.target.value) || 15)}
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">رابط PDF/صورة (اختياري)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={exAttachmentUrl}
                  onChange={(e) => setExAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-left text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">نص ومعطيات التمرين</label>
                <textarea
                  rows={2}
                  value={exDesc}
                  onChange={(e) => setExDesc(e.target.value)}
                  placeholder="نص التمرين والمعطيات (يدعم LaTeX)..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Interactive Geometry Canvas & Teacher Correction Builder */}
            {isGeomMode && (
              <div className="space-y-3 rounded-2xl border border-[#D6C9F3] bg-[#FAF8FF] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 flex items-center gap-1.5 text-sm font-bold text-[#3E1591]">
                    <Compass className="h-4 w-4" />
                    <span>لوحة الرسم الهندسي وتصحيح الأستاذ</span>
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGeomEditLayer('base')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        geomEditLayer === 'base'
                          ? 'bg-[#3E1591] text-white'
                          : 'border border-[#D6C9F3] bg-white text-[#22163F]'
                      }`}
                    >
                      رسم شكل السؤال (المعطيات)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeomEditLayer('correction')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        geomEditLayer === 'correction'
                          ? 'bg-emerald-700 text-white'
                          : 'border border-emerald-300 bg-white text-emerald-800'
                      }`}
                    >
                      رسم التصحيح النموذجي (أخضر)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold">
                    المطلوب رسمه من التلميذ على الشكل
                  </label>
                  <input
                    type="text"
                    value={activeGeomData.drawPrompt}
                    onChange={(e) =>
                      setExGeometryData({
                        ...activeGeomData,
                        drawPrompt: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                  />
                </div>

                <GeometryCanvas
                  baseShapes={geomEditLayer === 'base' ? [] : activeGeomData.baseShapes}
                  shapes={
                    geomEditLayer === 'base'
                      ? activeGeomData.baseShapes
                      : activeGeomData.teacherCorrectionShapes
                  }
                  onChange={(nextShapes) => {
                    if (geomEditLayer === 'base') {
                      setExGeometryData({ ...activeGeomData, baseShapes: nextShapes });
                    } else {
                      setExGeometryData({
                        ...activeGeomData,
                        teacherCorrectionShapes: nextShapes,
                      });
                    }
                  }}
                  teacherCorrectionShapes={
                    geomEditLayer === 'base' ? activeGeomData.teacherCorrectionShapes : []
                  }
                  showTeacherCorrection={geomEditLayer === 'base'}
                  drawColor={geomEditLayer === 'base' ? '#3E1591' : '#059669'}
                  testId="admin-geometry-canvas"
                />

                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-900">
                    التصحيح الكتابي / البرهان النموذجي للأستاذ (يدعم LaTeX)
                  </label>
                  <textarea
                    rows={3}
                    value={activeGeomData.teacherCorrectionText}
                    onChange={(e) =>
                      setExGeometryData({
                        ...activeGeomData,
                        teacherCorrectionText: e.target.value,
                      })
                    }
                    placeholder="اكتب خطوات البرهان والحساب التي تظهر للتلميذ بعد الحل..."
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm"
                  />
                  {activeGeomData.teacherCorrectionText && (
                    <div className="mt-2 rounded-xl border border-emerald-200 bg-white p-2.5 text-xs text-emerald-900">
                      <MathText text={activeGeomData.teacherCorrectionText} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold">
                    رابط صورة التصحيح (اختياري)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={activeGeomData.teacherCorrectionImageUrl || ''}
                    onChange={(e) =>
                      setExGeometryData({
                        ...activeGeomData,
                        teacherCorrectionImageUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-left text-sm"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Question Builder */}
            <div className="space-y-3 border-t border-[#E6DEF8] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-sm font-bold text-[#22163F]">
                  بنية الأسئلة ({exQuestions.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setExQuestions((prev) => [...prev, createBlankQuestion(prev.length + 1)])
                  }
                  className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة سؤال</span>
                </button>
              </div>

              {exQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="space-y-2.5 rounded-xl border border-[#E6DEF8] bg-[#FAF8FF] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#3E1591]">السؤال {qIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const nextType = e.target.value as QuestionType;
                          setExQuestions((prev) =>
                            prev.map((item, idx) =>
                              idx === qIdx
                                ? {
                                    ...item,
                                    type: nextType,
                                    choices: item.choices || ['', '', '', ''],
                                    correctChoiceIndex: item.correctChoiceIndex ?? 0,
                                    correctNumber: item.correctNumber ?? 0,
                                    correctText: item.correctText ?? '',
                                    acceptedAnswers: item.acceptedAnswers ?? [],
                                  }
                                : item
                            )
                          );
                        }}
                        aria-label={`نوع السؤال ${qIdx + 1}`}
                        className="rounded-lg border border-[#D6C9F3] bg-white px-2 py-1 text-xs font-bold"
                      >
                        <option value="choice">اختيار من متعدد</option>
                        <option value="text">إجابة مكتوبة (تكتب الجواب الصحيح)</option>
                        <option value="number">إجابة عددية</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={q.points}
                        onChange={(e) =>
                          setExQuestions((prev) =>
                            prev.map((item, idx) =>
                              idx === qIdx ? { ...item, points: Number(e.target.value) || 1 } : item
                            )
                          )
                        }
                        aria-label="النقاط"
                        className="w-16 rounded-lg border border-[#D6C9F3] bg-white px-2 py-1 text-center text-xs font-bold"
                      />
                      <span className="text-xs text-[#6E6390]">نقاط</span>
                      {exQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))
                          }
                          className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                          title="حذف السؤال"
                          aria-label={`حذف السؤال ${qIdx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.prompt}
                    onChange={(e) =>
                      setExQuestions((prev) =>
                        prev.map((item, idx) =>
                          idx === qIdx ? { ...item, prompt: e.target.value } : item
                        )
                      )
                    }
                    placeholder="نص السؤال (يدعم صيغة LaTeX مثل $\frac{3}{4}$)"
                    className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                  />
                  {q.prompt && (
                    <div className="rounded-lg bg-white px-3 py-1.5 text-xs text-[#3E1591]">
                      معاينة: <MathText text={q.prompt} />
                    </div>
                  )}

                  {q.type === 'choice' ? (
                    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-emerald-900">
                        <span>اكتب الخيارات وحدد الإجابة الصحيحة لتعتمدها المنصة في التصحيح:</span>
                        <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-white">
                          الإجابة الصحيحة:{' '}
                          {(q.choices || [])[q.correctChoiceIndex ?? 0]?.trim() ||
                            `الاختيار ${(q.correctChoiceIndex ?? 0) + 1}`}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(q.choices || ['', '', '', '']).map((ch, cIdx) => {
                          const isTrueChoice = (q.correctChoiceIndex ?? 0) === cIdx;
                          return (
                            <div
                              key={cIdx}
                              className={`flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 transition ${
                                isTrueChoice
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-[#E6DEF8] bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={isTrueChoice}
                                aria-label={`تعيين الاختيار ${cIdx + 1} كإجابة صحيحة`}
                                onChange={() =>
                                  setExQuestions((prev) =>
                                    prev.map((item, idx) =>
                                      idx === qIdx ? { ...item, correctChoiceIndex: cIdx } : item
                                    )
                                  )
                                }
                                className="accent-emerald-600"
                              />
                              <input
                                type="text"
                                value={ch}
                                onChange={(e) =>
                                  setExQuestions((prev) =>
                                    prev.map((item, idx) => {
                                      if (idx !== qIdx) return item;
                                      const nextChoices = [...(item.choices || ['', '', '', ''])];
                                      nextChoices[cIdx] = e.target.value;
                                      return { ...item, choices: nextChoices };
                                    })
                                  )
                                }
                                placeholder={
                                  isTrueChoice
                                    ? `اكتب الإجابة الصحيحة هنا (الاختيار ${cIdx + 1})`
                                    : `الاختيار ${cIdx + 1}`
                                }
                                className="min-w-0 flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setExQuestions((prev) =>
                                    prev.map((item, idx) =>
                                      idx === qIdx ? { ...item, correctChoiceIndex: cIdx } : item
                                    )
                                  )
                                }
                                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  isTrueChoice
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#EFE8FE] text-[#3E1591] hover:bg-[#e1d4fc]'
                                }`}
                              >
                                {isTrueChoice ? 'صحيحة ✓' : 'تعيين كصحيحة'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : q.type === 'text' ? (
                    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold text-emerald-900">
                            اكتب الإجابة الصحيحة (تعتمدها المنصة للتصحيح التلقائي) *
                          </label>
                          <input
                            type="text"
                            dir="auto"
                            value={q.correctText || ''}
                            onChange={(e) =>
                              setExQuestions((prev) =>
                                prev.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctText: e.target.value } : item
                                )
                              )
                            }
                            placeholder="مثال: 2x + 6 أو 3/4 أو مثلث قائم"
                            data-testid={`question-correct-text-${qIdx}`}
                            className="w-full rounded-lg border-2 border-emerald-400 bg-white px-3 py-2 text-sm font-bold text-[#14532D] focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#22163F]">
                            الوحدة (اختياري)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            value={q.unit || ''}
                            onChange={(e) =>
                              setExQuestions((prev) =>
                                prev.map((item, idx) =>
                                  idx === qIdx ? { ...item, unit: e.target.value } : item
                                )
                              )
                            }
                            placeholder="cm"
                            className="w-full rounded-lg border border-[#D6C9F3] bg-white px-3 py-2 text-center text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold text-[#6E6390]">
                          إجابات بديلة مقبولة (اختياري — افصل بينها بـ | مثل: 6+2x | 2x+6)
                        </label>
                        <input
                          type="text"
                          dir="auto"
                          value={(q.acceptedAnswers || []).join(' | ')}
                          onChange={(e) =>
                            setExQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === qIdx
                                  ? { ...item, acceptedAnswers: parseAcceptedAnswersList(e.target.value) }
                                  : item
                              )
                            )
                          }
                          placeholder="مثال: 6 + 2x | 0.75"
                          className="w-full rounded-lg border border-[#D6C9F3] bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                      <div className="flex-1 min-w-[180px]">
                        <label className="mb-1 block text-xs font-bold text-emerald-900">
                          اكتب الإجابة الصحيحة (رقم أو كسر) *
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={
                            numberDrafts[q.id] !== undefined
                              ? numberDrafts[q.id]
                              : q.correctNumber !== undefined
                                ? String(q.correctNumber)
                                : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            setNumberDrafts((prev) => ({ ...prev, [q.id]: raw }));
                            const parsed = parseNumericInput(raw);
                            if (parsed !== null) {
                              setExQuestions((prev) =>
                                prev.map((item, idx) =>
                                  idx === qIdx ? { ...item, correctNumber: parsed } : item
                                )
                              );
                            }
                          }}
                          placeholder="مثال: 12 أو 3/4 أو -5.5"
                          data-testid={`question-correct-number-${qIdx}`}
                          className="w-full rounded-lg border-2 border-emerald-400 bg-white px-3 py-1.5 text-center text-sm font-bold text-[#14532D]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold">الوحدة (اختياري)</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={q.unit || ''}
                          onChange={(e) =>
                            setExQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === qIdx ? { ...item, unit: e.target.value } : item
                              )
                            )
                          }
                          placeholder="cm"
                          className="w-24 rounded-lg border border-[#D6C9F3] bg-white px-3 py-1.5 text-center text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) =>
                      setExQuestions((prev) =>
                        prev.map((item, idx) =>
                          idx === qIdx ? { ...item, explanation: e.target.value } : item
                        )
                      )
                    }
                    placeholder="التفسير / خطوات الحل النموذجي"
                    className="w-full rounded-lg border border-[#D6C9F3] bg-white px-3 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#E6DEF8] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={exPublished}
                  onChange={(e) => setExPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#6D28D9]"
                />
                <span>منشور ومرئي للتلاميذ</span>
              </label>

              <button type="submit" disabled={busy} className="btn btn-main !py-2.5 !px-5 !text-xs">
                <Save className="h-4 w-4" />
                <span>{exId ? 'تحديث التمرين' : 'حفظ ونشر التمرين'}</span>
              </button>
            </div>
          </form>

          {/* Existing Exercises List */}
          <div className="space-y-2.5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-bold text-[#22163F]">
                التمارين المخزنة ({exercises.length})
              </h2>
              <button
                type="button"
                onClick={resetExerciseForm}
                className="btn btn-ghost !py-1.5 !px-3 !text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>تمرين جديد</span>
              </button>
            </div>
            {exercises.length === 0 ? (
              <div className="notebook-card p-6 text-center text-xs text-[#6E6390]">
                لا توجد تمارين مخزنة حالياً.
              </div>
            ) : (
              exercises.map((ex) => (
                <div key={ex.id} className="notebook-card p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ex.category === 'geometry' && <span className="text-xs">📐</span>}
                        <span className="text-sm font-bold text-[#22163F]">{ex.title}</span>
                        {ex.published ? (
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-[#6E6390]" />
                        )}
                      </div>
                      <p className="m-0 text-xs text-[#6E6390]">
                        {ex.chapter} · {ex.questions.length} أسئلة
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => loadExerciseForEdit(ex)}
                        className="rounded-lg p-1.5 text-[#3E1591] hover:bg-[#EFE8FE]"
                        title="تعديل التمرين"
                        aria-label={`تعديل تمرين ${ex.title}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteExerciseWithFeedback(ex)}
                        className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        title="حذف التمرين"
                        aria-label={`حذف تمرين ${ex.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COURSES (ADD, DELETE & IMPORT JPG/DOCX/PDF/POWERPOINT) */}
      {tab === 'courses' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            onSubmit={handleSaveCourse}
            className="notebook-card space-y-4 p-5 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DEF8] pb-3">
              <h2 className="m-0 text-base font-bold text-[#3E1591]">
                {cId ? 'تعديل الدرس' : 'إضافة درس جديد'}
              </h2>
              {cId && (
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="rounded-lg border border-[#D6C9F3] px-3 py-1 text-xs font-bold text-[#6E6390]"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {/* Import JPG / DOCX / PDF / PowerPoint Local Files Box */}
            <div className="rounded-2xl border-2 border-dashed border-[#C4B5FD] bg-[#FAF8FF] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-[#3E1591]">
                    استيراد ملفات محلية من جهازك (JPG / Word DOCX / PDF / PowerPoint)
                  </div>
                  <p className="m-0 text-[11px] text-[#6E6390]">
                    اختر ملفات من حاسوبك أو هاتفك (حتى 6.2 MB للملف): تُضغط الصور تلقائياً ويُستخرج نص Word و PowerPoint إلى الملخص مع إتاحة المعاينة والتحميل للتلاميذ.
                  </p>
                </div>
                <label className="btn btn-main cursor-pointer !py-2 !px-3.5 !text-xs">
                  <Upload className="h-4 w-4" />
                  <span>{importingFiles ? 'جارٍ الاستيراد...' : 'استيراد ملف محلي'}</span>
                  <input
                    type="file"
                    multiple
                    disabled={importingFiles}
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                    onChange={handleImportLessonFiles}
                    data-testid="lesson-file-import-input"
                    className="hidden"
                  />
                </label>
              </div>

              {cAttachments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {cAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#E6DEF8] bg-white px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {att.fileKind === 'image' && <FileImage className="h-4 w-4 shrink-0 text-emerald-600" />}
                        {att.fileKind === 'pdf' && <FileText className="h-4 w-4 shrink-0 text-rose-600" />}
                        {att.fileKind === 'word' && <FileSpreadsheet className="h-4 w-4 shrink-0 text-sky-600" />}
                        {att.fileKind === 'powerpoint' && <Presentation className="h-4 w-4 shrink-0 text-amber-600" />}
                        <span className="truncate font-bold text-[#22163F]">{att.fileName}</span>
                        <span className="shrink-0 rounded-md bg-[#EFE8FE] px-1.5 py-0.5 text-[10px] font-bold text-[#3E1591]">
                          {FILE_KIND_LABELS[att.fileKind]} · {formatFileSizeArabic(att.sizeBytes)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLessonAttachment(att.id)}
                        aria-label={`إزالة ${att.fileName}`}
                        className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">عنوان الدرس</label>
                <input
                  type="text"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="مثال: خاصية مستقيم المنتصفين في مثلث"
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">المحور</label>
                <select
                  value={cChapter}
                  onChange={(e) => setCChapter(e.target.value)}
                  className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                >
                  {levelChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">ترتيب الدرس</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cOrder}
                  onChange={(e) => setCOrder(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">مدة المراجعة (دقيقة)</label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={cDuration}
                  onChange={(e) => setCDuration(Number(e.target.value) || 25)}
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">ملخص الدرس</label>
                <textarea
                  rows={4}
                  value={cSummary}
                  onChange={(e) => setCSummary(e.target.value)}
                  placeholder="شرح مبسط لأفكار الدرس (يُعبّأ تلقائياً عند استيراد ملف Word أو PowerPoint)..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">
                  القوانين والخواص (يدعم صيغة LaTeX)
                </label>
                <textarea
                  rows={3}
                  value={cKeyRules}
                  onChange={(e) => setCKeyRules(e.target.value)}
                  placeholder="اكتب القوانين الرياضية..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">رابط فيديو يوتيوب (اختياري)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={cVideoUrl}
                  onChange={(e) => setCVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-left text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">رابط PDF / Drive (اختياري)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={cPdfUrl}
                  onChange={(e) => setCPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-left text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E6DEF8] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={cPublished}
                  onChange={(e) => setCPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#6D28D9]"
                />
                <span>منشور للتلاميذ</span>
              </label>

              <button type="submit" disabled={busy || importingFiles} className="btn btn-main !py-2.5 !px-5 !text-xs">
                <Save className="h-4 w-4" />
                <span>{cId ? 'تحديث الدرس' : 'حفظ الدرس'}</span>
              </button>
            </div>
          </form>

          <div className="space-y-2.5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-bold text-[#22163F]">
                الدروس المخزنة ({courses.length})
              </h2>
              <button
                type="button"
                onClick={resetCourseForm}
                className="btn btn-ghost !py-1.5 !px-3 !text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>درس جديد</span>
              </button>
            </div>
            {courses.length === 0 ? (
              <div className="notebook-card p-6 text-center text-xs text-[#6E6390]">
                لا توجد دروس مخزنة حالياً. أضف درساً جديداً من النموذج أو اضغط «تهيئة منهاج{' '}
                {levelMeta.shortLabel}».
              </div>
            ) : (
              courses.map((c) => (
                <div key={c.id} className="notebook-card flex items-start justify-between gap-2 p-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="m-0 text-sm font-bold text-[#22163F]">{c.title}</h3>
                      {c.attachments && c.attachments.length > 0 && (
                        <span className="rounded-md bg-[#EFE8FE] px-1.5 py-0.5 text-[10px] font-bold text-[#3E1591]">
                          {c.attachments.length} مرفق
                        </span>
                      )}
                    </div>
                    <p className="m-0 text-xs text-[#6E6390]">
                      الترتيب {c.chapterOrder} · {c.chapter}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadCourseForEdit(c)}
                      title="تعديل الدرس"
                      aria-label={`تعديل درس ${c.title}`}
                      className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#3E1591] hover:bg-[#EFE8FE]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteCourseWithFeedback(c)}
                      title="حذف الدرس"
                      aria-label={`حذف درس ${c.title}`}
                      className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS */}
      {tab === 'events' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            onSubmit={handleSaveEvent}
            className="notebook-card space-y-4 p-5 lg:col-span-6"
          >
            <div className="flex items-center justify-between border-b border-[#E6DEF8] pb-3">
              <h2 className="m-0 text-base font-bold text-[#3E1591]">
                {evId ? 'تعديل الحدث' : 'إضافة حدث / موعد جديد'}
              </h2>
              {evId && (
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="rounded-lg border border-[#D6C9F3] px-3 py-1 text-xs font-bold text-[#6E6390]"
                >
                  إلغاء
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">عنوان الحدث</label>
                <input
                  type="text"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="مثال: حصة مباشرة لحل موضوع اختبار الفصل الأول"
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">نوع الحدث</label>
                <select
                  value={evType}
                  onChange={(e) => setEvType(e.target.value as EventType)}
                  className="w-full rounded-xl border border-[#D6C9F3] bg-white px-3 py-2 text-sm"
                >
                  <option value="live">حصة مباشرة (Zoom)</option>
                  <option value="devoir">فرض محروس</option>
                  <option value="exam">اختبار</option>
                  <option value="announcement">إعلان</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">التاريخ</label>
                <input
                  type="date"
                  dir="ltr"
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">التوقيت</label>
                <input
                  type="text"
                  dir="ltr"
                  value={evTime}
                  onChange={(e) => setEvTime(e.target.value)}
                  placeholder="18:30"
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">رابط (اختياري)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={evLink}
                  onChange={(e) => setEvLink(e.target.value)}
                  placeholder="https://zoom.us/..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-left text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold">التفاصيل</label>
                <textarea
                  rows={3}
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  placeholder="تفاصيل الموعد والمحاور المشمولة..."
                  className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E6DEF8] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={evPublished}
                  onChange={(e) => setEvPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#6D28D9]"
                />
                <span>منشور للتلاميذ</span>
              </label>
              <button type="submit" disabled={busy} className="btn btn-main !py-2.5 !px-5 !text-xs">
                <Save className="h-4 w-4" />
                <span>{evId ? 'تحديث الحدث' : 'حفظ الحدث'}</span>
              </button>
            </div>
          </form>

          <div className="space-y-2.5 lg:col-span-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-base font-bold text-[#22163F]">
                الأحداث المسجلة ({events.length})
              </h2>
              <button
                type="button"
                onClick={resetEventForm}
                className="btn btn-ghost !py-1.5 !px-3 !text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>حدث جديد</span>
              </button>
            </div>
            {events.length === 0 ? (
              <div className="notebook-card p-6 text-center text-xs text-[#6E6390]">
                لا توجد أحداث مسجلة حالياً.
              </div>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="notebook-card flex items-start justify-between gap-2 p-3.5">
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-sm font-bold text-[#22163F]">{evt.title}</h3>
                    <p className="m-0 text-xs text-[#6E6390]">
                      {evt.eventDate} · {evt.eventTime} · {evt.eventType}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadEventForEdit(evt)}
                      title="تعديل الحدث"
                      aria-label={`تعديل حدث ${evt.title}`}
                      className="rounded-lg p-1.5 text-[#3E1591] hover:bg-[#EFE8FE]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteEventWithFeedback(evt)}
                      title="حذف الحدث"
                      aria-label={`حذف حدث ${evt.title}`}
                      className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT SCORES & GEOMETRY CORRECTION REVIEW */}
      {tab === 'scores' && (
        <div className="space-y-4">
          <div className="notebook-card flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-[#6E6390]">إجمالي المحاولات</div>
                <div className="font-display tabular-nums text-xl font-bold text-[#3E1591]">
                  {scores.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6E6390]">المعدل العام</div>
                <div className="font-display tabular-nums text-xl font-bold text-[#22163F]">
                  {classAverage}/20
                </div>
              </div>
            </div>
            <input
              type="text"
              value={scoreSearch}
              onChange={(e) => setScoreSearch(e.target.value)}
              placeholder="بحث باسم التلميذ أو التمرين..."
              className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm sm:w-72"
            />
          </div>

          <div className="space-y-2.5">
            {filteredScores.map((sc) => {
              const isReviewing = reviewingScoreId === sc.id;
              const matchedEx = exercises.find((e) => e.id === sc.exerciseId);
              const hasDrawing = Boolean(sc.studentDrawing && sc.studentDrawing.length > 0);
              return (
                <div key={sc.id} className="notebook-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#22163F]">
                          {sc.studentName} {sc.studentClass ? `(${sc.studentClass})` : ''}
                        </span>
                        {hasDrawing && (
                          <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            رسم هندسي مرفق
                          </span>
                        )}
                        {sc.gradedStatus === 'reviewed' && (
                          <span className="rounded-lg bg-[#EFE8FE] px-2 py-0.5 text-[11px] font-bold text-[#3E1591]">
                            تم التصحيح ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6E6390]">
                        {sc.exerciseTitle} · {sc.chapter}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-display tabular-nums rounded-xl bg-[#EFE8FE] px-3 py-1.5 text-sm font-bold text-[#3E1591]">
                        {sc.outOf20}/20 ({sc.percentage}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => openScoreReview(sc)}
                        className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isReviewing ? 'إغلاق' : 'تصحيح / ملاحظة'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteScoreWithFeedback(sc)}
                        className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        title="حذف النتيجة"
                        aria-label={`حذف نتيجة ${sc.studentName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>

                  {isReviewing && (
                    <div className="mt-4 space-y-3 border-t border-[#E6DEF8] pt-4">
                      <GeometryCanvas
                        baseShapes={[
                          ...(matchedEx?.geometryData?.baseShapes || []),
                          ...(sc.studentDrawing || []),
                        ]}
                        shapes={reviewShapes}
                        onChange={setReviewShapes}
                        drawColor="#059669"
                        accentLabel="ارسم التصحيح بالأخضر فوق عمل التلميذ"
                      />

                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-xs font-bold">
                            ملاحظة / تصحيح الأستاذ للتلميذ
                          </label>
                          <textarea
                            rows={2}
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="أحسن! أو صحّح نقطة كذا..."
                            className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold">تعديل العلامة /20</label>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step="0.5"
                            dir="ltr"
                            value={reviewOutOf20}
                            onChange={(e) => setReviewOutOf20(e.target.value)}
                            className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSaveScoreReview(sc)}
                          className="btn btn-main !py-2 !px-4 !text-xs"
                        >
                          <Save className="h-4 w-4" />
                          <span>حفظ تصحيح الأستاذ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {tab === 'settings' && (
        <form
          onSubmit={handleSaveSettingsSubmit}
          className="notebook-card max-w-2xl space-y-4 p-5"
        >
          <h2 className="m-0 text-base font-bold text-[#3E1591]">
            إعدادات الصفحة الرئيسية والإعلان العام
          </h2>
          <div>
            <label className="mb-1 block text-xs font-bold">نص إعلان الأستاذ</label>
            <textarea
              rows={3}
              value={setAnnouncement}
              onChange={(e) => setSetAnnouncement(e.target.value)}
              className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">عنوان العد التنازلي</label>
              <input
                type="text"
                value={setTargetLabel}
                onChange={(e) => setSetTargetLabel(e.target.value)}
                className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">تاريخ العد التنازلي</label>
              <input
                type="date"
                dir="ltr"
                value={setTargetDate}
                onChange={(e) => setSetTargetDate(e.target.value)}
                className="w-full rounded-xl border border-[#D6C9F3] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn btn-main !py-2.5 !px-5 !text-xs">
            <Save className="h-4 w-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </form>
      )}
    </div>
  );
}
