import { ArrowLeft, BookOpen, Calculator, CheckCircle2, Server, ShieldCheck } from 'lucide-react';
import { getSeedDataForLevel } from '../data/seedData';
import type { ClassLevel } from '../types/math';
import { CLASS_LEVEL_META, CLASS_LEVELS, getChaptersForLevel } from '../utils/mathPlatform';

interface ClassSelectViewProps {
  activeLevel: ClassLevel;
  onSelectLevel: (level: ClassLevel) => void;
  onOpenAdminEntry: () => void;
  isAdmin: boolean;
}

export function ClassSelectView({
  activeLevel,
  onSelectLevel,
  onOpenAdminEntry,
  isAdmin,
}: ClassSelectViewProps) {
  return (
    <div className="wrap space-y-5">
      <section className="hero4">
        <div className="tx">
          <span className="sg">التعليم المتوسط — المنهاج الجزائري (1AM · 2AM · 3AM · 4AM)</span>
          <h1>اختر قسمك الدراسي — أكاديمية الرياضيات</h1>
          <p>
            لكل سنة دراسية خادم بيانات مستقل خاص بدروسها، تمارينها الهندسية والجبرية، مواعيدها
            ولوحة شرف تلاميذها بنفس التصميم والوظائف الكاملة.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-base font-bold text-[#22163F]">الأقسام المتوفرة</h2>
          <p className="m-0 text-xs text-[#6E6390]">
            اضغط على قسمك للدخول مباشرة إلى منصته المستقلة.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAdminEntry}
          data-testid="classes-admin-btn"
          className="btn btn-gold !py-2 !px-3.5 !text-xs"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{isAdmin ? 'لوحة الإدارة' : 'دخول الادارة'}</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CLASS_LEVELS.map((level) => {
          const meta = CLASS_LEVEL_META[level];
          const bundle = getSeedDataForLevel(level);
          const chapters = getChaptersForLevel(level);
          const isCurrent = activeLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              data-testid={`class-card-${level}`}
              className={`notebook-card-interactive flex flex-col justify-between gap-3 p-4 text-right ${
                isCurrent ? 'border-2 border-[#6D28D9] ring-2 ring-[#EFE8FE]' : ''
              }`}
            >
              <div className="space-y-3 w-full">
                <div
                  className="tile sk !min-h-[112px] !w-full"
                  style={{ ['--c' as string]: meta.accentC, ['--d' as string]: meta.accentD }}
                >
                  <span className="tbg" aria-hidden="true">
                    <i>{meta.sym}</i>
                  </span>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="ic !mb-2 !h-10 !w-10 !text-base font-display font-extrabold">
                      {level}
                    </span>
                    <span className="relative inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
                      <Server className="h-3 w-3" />
                      <span>{meta.badge}</span>
                    </span>
                  </div>
                  <h3>{meta.title}</h3>
                  <p>{meta.subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6390]">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <BookOpen className="h-3.5 w-3.5 text-[#6D28D9]" />
                    {chapters.length} محاور دراسية
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Calculator className="h-3.5 w-3.5 text-[#059669]" />
                    {bundle.courses.length} دروس · {bundle.exercises.length} تمارين
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#E6DEF8] pt-3 w-full">
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>القسم النشط حالياً</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#6E6390]">
                    الدخول إلى منصة {meta.shortLabel}
                  </span>
                )}
                <span className="btn btn-main !py-1.5 !px-3 !text-xs">
                  <span>دخول {level}</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
