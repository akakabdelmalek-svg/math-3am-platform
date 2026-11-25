import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  PlayCircle,
  Plus,
  Presentation,
  Search,
  Trash2,
} from 'lucide-react';
import { getCourseAttachment } from '../services/academyService';
import type { Course, CourseAttachmentMeta, CourseAttachmentRecord, Exercise } from '../types/math';
import { dataUrlToObjectUrl, formatFileSizeArabic } from '../utils/lessonFileImport';
import { CHAPTERS_3AM, filterCourses } from '../utils/mathPlatform';
import { MathText } from './MathText';

interface CoursesViewProps {
  courses: Course[];
  exercises: Exercise[];
  completedCourseIds: string[];
  isSignedIn: boolean;
  isAdmin?: boolean;
  onToggleCourseComplete: (courseId: string) => void;
  onOpenStudentAuth: () => void;
  onStartExercise: (exercise: Exercise) => void;
  onOpenAdminCourses?: () => void;
  onDeleteCourse?: (courseId: string) => Promise<void>;
  initialCourseId?: string | null;
}

export function CoursesView({
  courses,
  exercises,
  completedCourseIds,
  isSignedIn,
  isAdmin,
  onToggleCourseComplete,
  onOpenStudentAuth,
  onStartExercise,
  onOpenAdminCourses,
  onDeleteCourse,
  initialCourseId,
}: CoursesViewProps) {
  const [search, setSearch] = useState('');
  const [chapter, setChapter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialCourseId || null);
  const [loadedAttachments, setLoadedAttachments] = useState<Record<string, CourseAttachmentRecord>>({});
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const [loadingAttId, setLoadingAttId] = useState<string | null>(null);
  const [previewPdfId, setPreviewPdfId] = useState<string | null>(null);
  const [attError, setAttError] = useState<string | null>(null);
  const attemptedAttIdsRef = useRef<Set<string>>(new Set());
  const objectUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);

  useEffect(() => {
    if (initialCourseId) setSelectedId(initialCourseId);
  }, [initialCourseId]);

  useEffect(() => {
    return () => {
      Object.values(objectUrlsRef.current).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const filtered = useMemo(
    () => filterCourses(courses, { search, chapter }),
    [courses, search, chapter]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedId) || filtered[0] || null,
    [courses, filtered, selectedId]
  );

  useEffect(() => {
    const atts = selectedCourse?.attachments || [];
    const imageAtts = atts.filter(
      (a) =>
        a.fileKind === 'image' &&
        !loadedAttachments[a.id] &&
        !attemptedAttIdsRef.current.has(a.id)
    );
    if (imageAtts.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const att of imageAtts) {
        attemptedAttIdsRef.current.add(att.id);
        try {
          const rec = await getCourseAttachment(att.id);
          if (rec && !cancelled) {
            setLoadedAttachments((prev) => ({ ...prev, [att.id]: rec }));
          }
        } catch {
          // ignore silent preload failure; user can still click download
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCourse, loadedAttachments]);

  async function ensureAttachmentLoaded(att: CourseAttachmentMeta): Promise<CourseAttachmentRecord | null> {
    setAttError(null);
    if (loadedAttachments[att.id]) return loadedAttachments[att.id];
    setLoadingAttId(att.id);
    try {
      const rec = await getCourseAttachment(att.id);
      if (rec) {
        setLoadedAttachments((prev) => ({ ...prev, [att.id]: rec }));
        if (rec.dataUrl && !objectUrls[att.id]) {
          const objUrl = dataUrlToObjectUrl(rec.dataUrl, rec.mimeType);
          if (objUrl) {
            setObjectUrls((prev) => ({ ...prev, [att.id]: objUrl }));
          }
        }
        return rec;
      }
      setAttError(`لم يتم العثور على الملف "${att.fileName}".`);
      return null;
    } catch {
      setAttError(`تعذر تحميل الملف "${att.fileName}" من قاعدة البيانات.`);
      return null;
    } finally {
      setLoadingAttId(null);
    }
  }

  async function handleDownloadAttachment(att: CourseAttachmentMeta) {
    const rec = await ensureAttachmentLoaded(att);
    if (!rec?.dataUrl) return;
    const objUrl = objectUrls[att.id] || dataUrlToObjectUrl(rec.dataUrl, rec.mimeType);
    const link = document.createElement('a');
    link.href = objUrl || rec.dataUrl;
    link.download = rec.fileName || 'lesson-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (objUrl && !objectUrls[att.id]) {
      setObjectUrls((prev) => ({ ...prev, [att.id]: objUrl }));
    }
  }

  const relatedExercises = useMemo(() => {
    if (!selectedCourse) return [];
    return exercises.filter((ex) => ex.chapter === selectedCourse.chapter);
  }, [exercises, selectedCourse]);

  const completedSet = useMemo(() => new Set(completedCourseIds), [completedCourseIds]);

  return (
    <div className="wrap space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="m-0 text-xl font-bold text-[#22163F]">دروس السنة 3 متوسط</h1>
          <p className="m-0 text-xs text-[#6E6390]">
            ملخصات مبسطة وقوانين رياضية وتمارين مرتبطة بكل محور.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && onOpenAdminCourses && (
            <button
              type="button"
              onClick={onOpenAdminCourses}
              className="btn btn-main !py-1.5 !px-3 !text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة / إدارة الدروس</span>
            </button>
          )}
          <span className="rounded-xl bg-[#EFE8FE] px-3 py-1.5 text-xs font-bold text-[#3E1591]">
            المنجزة: {completedCourseIds.length} / {courses.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="notebook-card grid gap-2.5 p-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن درس..."
            className="w-full rounded-xl border border-[#E6DEF8] bg-white py-2 pr-9 pl-3 text-sm focus:border-[#6D28D9] focus:outline-none"
          />
        </div>
        <select
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className="w-full rounded-xl border border-[#E6DEF8] bg-white px-3 py-2 text-sm font-semibold text-[#22163F] focus:border-[#6D28D9] focus:outline-none"
        >
          <option value="all">كل المحاور ({courses.length})</option>
          {CHAPTERS_3AM.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </div>

      {/* Lesson Selector List */}
      {filtered.length === 0 ? (
        <div className="notebook-card p-6 text-center text-sm text-[#6E6390]">
          {courses.length === 0 ? 'لا توجد دروس مضافة حالياً.' : 'لا توجد دروس مطابقة للبحث.'}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((course) => {
            const active = selectedCourse?.id === course.id;
            const done = completedSet.has(course.id);
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedId(course.id)}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-right transition ${
                  active
                    ? 'border-[#6D28D9] bg-[#F5F0FE] shadow-xs'
                    : 'border-[#E6DEF8] bg-white hover:border-[#D6C9F3]'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3E1591] font-display text-xs font-bold text-white">
                  {course.chapterOrder || 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-[#22163F]">{course.title}</div>
                  <div className="truncate text-[11px] text-[#6E6390]">{course.chapter}</div>
                </div>
                {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Course Reader with 3D Book Card */}
      {selectedCourse && (
        <article className="notebook-card space-y-4 p-4 sm:p-5">
          <div className="bk-cta">
            <div className="bk3d" aria-hidden="true">
              <div className="bk-pages" />
              <div className="bk-cover">
                <span className="bk-tag">3AM</span>
                <div className="bk-t">{selectedCourse.title}</div>
                <span className="bk-sym">π</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-block rounded-lg bg-[#EFE8FE] px-2.5 py-0.5 text-[11px] font-bold text-[#3E1591]">
                {selectedCourse.chapter}
              </span>
              <h2 className="m-0 text-base font-bold text-[#22163F] sm:text-lg">
                {selectedCourse.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6390]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedCourse.durationMin || 25} دقيقة
                </span>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => onToggleCourseComplete(selectedCourse.id)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
                      completedSet.has(selectedCourse.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#6D28D9] text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {completedSet.has(selectedCourse.id) ? 'تمت دراسة الدرس' : 'تحديد كمكتمل'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenStudentAuth}
                    className="btn btn-line !py-1.5 !px-3 !text-xs"
                  >
                    سجّل لحفظ التقدّم
                  </button>
                )}
                {isAdmin && onDeleteCourse && (
                  <button
                    type="button"
                    onClick={() => {
                      void onDeleteCourse(selectedCourse.id).catch(() => undefined);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف الدرس</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#3E1591]">
              <BookOpen className="h-4 w-4" />
              <span>ملخص الدرس</span>
            </h3>
            <div className="whitespace-pre-line rounded-xl bg-[#FAF8FF] p-3.5 text-sm leading-relaxed text-[#22163F]">
              <MathText text={selectedCourse.summary} />
            </div>
          </div>

          {selectedCourse.keyRules && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#3E1591]">القوانين والخواص الأساسية</h3>
              <div className="rounded-xl border border-[#E6DEF8] bg-[#FFFDF7] p-3.5 text-sm leading-loose text-[#22163F]">
                <MathText text={selectedCourse.keyRules} />
              </div>
            </div>
          )}

          {selectedCourse.attachments && selectedCourse.attachments.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#3E1591]">ملفات الدرس المرفقة</h3>
              {attError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  {attError}
                </div>
              )}
              <div className="space-y-2.5">
                {selectedCourse.attachments.map((att) => {
                  const loaded = loadedAttachments[att.id];
                  const isLoading = loadingAttId === att.id;
                  const pdfSrc = objectUrls[att.id] || loaded?.dataUrl;
                  return (
                    <div
                      key={att.id}
                      className="rounded-xl border border-[#E6DEF8] bg-[#FAF8FF] p-3 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {att.fileKind === 'image' && <FileImage className="h-4 w-4 shrink-0 text-emerald-600" />}
                          {att.fileKind === 'pdf' && <FileText className="h-4 w-4 shrink-0 text-rose-600" />}
                          {att.fileKind === 'word' && <FileSpreadsheet className="h-4 w-4 shrink-0 text-sky-600" />}
                          {att.fileKind === 'powerpoint' && <Presentation className="h-4 w-4 shrink-0 text-amber-600" />}
                          <span className="truncate text-xs font-bold text-[#22163F]">{att.fileName}</span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#6E6390]">
                            {formatFileSizeArabic(att.sizeBytes)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {att.fileKind === 'pdf' && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (previewPdfId === att.id) {
                                  setPreviewPdfId(null);
                                  return;
                                }
                                const rec = await ensureAttachmentLoaded(att);
                                if (rec) setPreviewPdfId(att.id);
                              }}
                              className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                            >
                              {previewPdfId === att.id ? 'إخفاء المعاينة' : 'معاينة PDF'}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleDownloadAttachment(att)}
                            className="btn btn-main !py-1.5 !px-3 !text-xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{isLoading ? 'جارٍ التحميل...' : 'تحميل الملف'}</span>
                          </button>
                        </div>
                      </div>

                      {att.fileKind === 'image' && loaded?.dataUrl && (
                        <img
                          src={loaded.dataUrl}
                          alt={att.fileName}
                          className="max-h-96 w-full rounded-lg border border-[#E6DEF8] bg-white object-contain"
                        />
                      )}

                      {att.fileKind === 'pdf' && previewPdfId === att.id && pdfSrc && (
                        <iframe
                          src={pdfSrc}
                          title={att.fileName}
                          className="h-96 w-full rounded-lg border border-[#E6DEF8] bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(selectedCourse.videoUrl || selectedCourse.pdfUrl) && (
            <div className="flex flex-wrap gap-2.5">
              {selectedCourse.videoUrl && (
                <a
                  href={selectedCourse.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-main !py-2 !px-3.5 !text-xs"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>مشاهدة الفيديو</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {selectedCourse.pdfUrl && (
                <a
                  href={selectedCourse.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-line !py-2 !px-3.5 !text-xs"
                >
                  <FileText className="h-4 w-4" />
                  <span>ملخص PDF</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          {relatedExercises.length > 0 && (
            <div className="space-y-2 border-t border-[#E6DEF8] pt-3">
              <h3 className="text-sm font-bold text-[#22163F]">تمارين تطبيقية لهذا المحور</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => onStartExercise(ex)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#E6DEF8] bg-[#FAF8FF] p-3 text-right transition hover:border-[#6D28D9]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[#22163F]">{ex.title}</div>
                      <div className="text-[11px] text-[#6E6390]">
                        {ex.questions.length} أسئلة · {ex.durationMinutes} د
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-lg bg-[#6D28D9] px-2.5 py-1 text-[11px] font-bold text-white">
                      حل الآن
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
