import { useMemo, useState } from 'react';
import { Award, Crown, ListOrdered, Medal, Sparkles, Trophy } from 'lucide-react';
import type { ScoreRecord } from '../types/math';
import { CHAPTERS_3AM, computeLeaderboardRankings } from '../utils/mathPlatform';

interface ScoresLeaderboardViewProps {
  scores: ScoreRecord[];
  currentUserUid?: string;
}

type LeaderboardMode = 'ranking' | 'attempts';

export function ScoresLeaderboardView({ scores, currentUserUid }: ScoresLeaderboardViewProps) {
  const [chapterFilter, setChapterFilter] = useState('all');
  const [mode, setMode] = useState<LeaderboardMode>('ranking');

  const scopedScores = useMemo(
    () => (chapterFilter === 'all' ? scores : scores.filter((s) => s.chapter === chapterFilter)),
    [scores, chapterFilter]
  );

  const rankings = useMemo(() => computeLeaderboardRankings(scopedScores), [scopedScores]);

  const sortedAttempts = useMemo(
    () =>
      [...scopedScores].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.outOf20 !== a.outOf20) return b.outOf20 - a.outOf20;
        return (a.durationSeconds || 0) - (b.durationSeconds || 0);
      }),
    [scopedScores]
  );

  const topThree = rankings.slice(0, 3);

  return (
    <div className="wrap space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-[#22163F]">
            <Trophy className="h-5 w-5 text-[#E7A33E]" />
            <span>نتائج التلاميذ ولوحة الشرف</span>
          </h1>
          <p className="m-0 text-xs text-[#6E6390]">
            الترتيب العام لتلاميذ 3 متوسط حسب مجموع النقاط المكتسبة في التمارين.
          </p>
        </div>

        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          aria-label="تصفية الترتيب حسب المحور"
          className="rounded-xl border border-[#E6DEF8] bg-white px-3 py-2 text-xs font-bold text-[#22163F] focus:border-[#6D28D9] focus:outline-none"
        >
          <option value="all">كل المحاور ({scores.length})</option>
          {CHAPTERS_3AM.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Switch: Points Classement vs Recent Attempts */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('ranking')}
          data-testid="leaderboard-mode-ranking"
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            mode === 'ranking'
              ? 'bg-[#3E1591] text-white shadow-xs'
              : 'border border-[#E6DEF8] bg-white text-[#22163F] hover:border-[#D6C9F3]'
          }`}
        >
          <Crown className="h-4 w-4 text-[#E7A33E]" />
          <span>الترتيب بالنقاط ({rankings.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('attempts')}
          data-testid="leaderboard-mode-attempts"
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            mode === 'attempts'
              ? 'bg-[#3E1591] text-white shadow-xs'
              : 'border border-[#E6DEF8] bg-white text-[#22163F] hover:border-[#D6C9F3]'
          }`}
        >
          <ListOrdered className="h-4 w-4" />
          <span>سجل المحاولات ({sortedAttempts.length})</span>
        </button>
      </div>

      {scopedScores.length === 0 ? (
        <div className="notebook-card p-8 text-center text-sm text-[#6E6390]">
          لا توجد نتائج مسجلة بعد في هذا المحور. كن أول من يحل التمرين ويجمع النقاط!
        </div>
      ) : mode === 'ranking' ? (
        <div className="space-y-4">
          {/* Top 3 Points Podium */}
          {topThree.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3" data-testid="points-podium">
              {topThree.map((entry, idx) => {
                const badgeStyle =
                  idx === 0
                    ? 'border-[#E7A33E] bg-gradient-to-b from-[#FFF9EB] to-white'
                    : idx === 1
                      ? 'border-slate-300 bg-gradient-to-b from-slate-50 to-white'
                      : 'border-amber-300 bg-gradient-to-b from-amber-50/60 to-white';
                const medalLabel =
                  idx === 0 ? 'المركز الأول 🥇' : idx === 1 ? 'المركز الثاني 🥈' : 'المركز الثالث 🥉';
                return (
                  <div
                    key={entry.studentUid || entry.studentName}
                    className={`notebook-card border-2 p-4 text-center space-y-1.5 ${badgeStyle}`}
                  >
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#EFE8FE] px-2.5 py-0.5 text-[11px] font-bold text-[#3E1591]">
                      <Sparkles className="h-3 w-3 text-[#E7A33E]" />
                      <span>{medalLabel}</span>
                    </div>
                    <div className="font-display text-base font-bold text-[#22163F]">
                      {entry.studentName}
                    </div>
                    {entry.studentClass && (
                      <div className="text-[11px] font-bold text-[#6E6390]">{entry.studentClass}</div>
                    )}
                    <div className="font-display tabular-nums text-2xl font-bold text-[#3E1591]">
                      {entry.totalPoints} <span className="text-xs font-bold">نقطة</span>
                    </div>
                    <div className="text-[11px] text-[#6E6390]">
                      {entry.exercisesCount} تمرين · المعدل {entry.averageOutOf20}/20
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Points Classement List */}
          <div className="space-y-2.5" data-testid="points-ranking-list">
            {rankings.map((entry) => {
              const isMine = Boolean(currentUserUid && entry.studentUid === currentUserUid);
              const rankCls =
                entry.rank === 1
                  ? 'bg-[#E7A33E] text-[#2A0E6B]'
                  : entry.rank === 2
                    ? 'bg-slate-400 text-white'
                    : entry.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-[#EFE8FE] text-[#3E1591]';

              return (
                <div
                  key={entry.studentUid || entry.studentName}
                  className={`notebook-card flex flex-wrap items-center justify-between gap-3 p-3.5 ${
                    isMine ? 'border-2 border-[#E7A33E] bg-[#FFFDF5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-display tabular-nums flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${rankCls}`}
                    >
                      {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : `#${entry.rank}`}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-display text-sm font-bold text-[#22163F]">
                          {entry.studentName}
                        </span>
                        {entry.studentClass && (
                          <span className="rounded bg-[#EFE8FE] px-2 py-0.5 text-[10px] font-bold text-[#3E1591]">
                            {entry.studentClass}
                          </span>
                        )}
                        {isMine && (
                          <span className="rounded bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-bold text-[#92610A]">
                            ترتيبك
                          </span>
                        )}
                      </div>
                      <p className="m-0 text-xs text-[#6E6390]">
                        {entry.exercisesCount} تمارين منجزة · {entry.attemptsCount} محاولة · المعدل{' '}
                        {entry.averageOutOf20}/20
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-left">
                      <div className="font-display tabular-nums text-base font-bold text-[#3E1591]">
                        {entry.totalPoints} نقطة
                      </div>
                      <div className="tabular-nums text-[11px] text-[#6E6390]">
                        أعلى علامة: {entry.bestOutOf20}/20
                      </div>
                    </div>
                    <Award className="h-5 w-5 text-[#E7A33E]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedAttempts.map((sc, idx) => {
            const isMine = Boolean(currentUserUid && sc.studentUid === currentUserUid);
            return (
              <div
                key={sc.id}
                className={`notebook-card flex flex-wrap items-center justify-between gap-3 p-3.5 ${
                  isMine ? 'border-2 border-[#E7A33E] bg-[#FFFDF5]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display tabular-nums flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFE8FE] text-sm font-bold text-[#3E1591]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display text-sm font-bold text-[#22163F]">
                        {sc.studentName}
                      </span>
                      {sc.studentClass && (
                        <span className="rounded bg-[#EFE8FE] px-2 py-0.5 text-[10px] font-bold text-[#3E1591]">
                          {sc.studentClass}
                        </span>
                      )}
                      {isMine && (
                        <span className="rounded bg-[#FFF1D6] px-2 py-0.5 text-[10px] font-bold text-[#92610A]">
                          نتيجتك
                        </span>
                      )}
                    </div>
                    <p className="m-0 text-xs text-[#6E6390]">
                      {sc.exerciseTitle} · {sc.chapter}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-left">
                    <div className="font-display tabular-nums text-base font-bold text-[#3E1591]">
                      {sc.score}/{sc.total} نقطة
                    </div>
                    <div className="tabular-nums text-[11px] text-[#6E6390]">
                      {sc.outOf20}/20 ({sc.percentage}%)
                    </div>
                  </div>
                  <Award className="h-5 w-5 text-[#E7A33E]" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
