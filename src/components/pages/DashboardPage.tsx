import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  GraduationCap,
  BarChart3,
  Microscope,
  ClipboardList,
  Bot,
  TrendingDown,
  Calculator,
  Type,
  ChevronDown,
  School,
} from 'lucide-react';
import { getHeroBanners } from '../../api';

interface DashboardPageProps {
  user: any;
  userData: any;
  onNavigateToLearning?: () => void;
  onNavigateToSubscription?: () => void;
  onNavigateToQuiz?: () => void;
  onNavigateToChat?: () => void;
  /** Board/class selectors open profile where these are set */
  onNavigateToProfile?: () => void;
}

const PRIMARY = '#2B7FD9';
const CARD_SHADOW = '0 4px 14px rgba(43, 127, 217, 0.12)';

function readLearningHistory(): any[] {
  try {
    return JSON.parse(localStorage.getItem('learningHistory') || '[]');
  } catch {
    return [];
  }
}

function averageQuizPercent(): number {
  try {
    const raw = localStorage.getItem('quizHistory');
    if (!raw) return 78;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return 78;
    const pcts: number[] = [];
    for (const r of arr) {
      const t = r?.totalQuestions;
      const s = r?.score;
      if (typeof t === 'number' && t > 0 && typeof s === 'number') {
        pcts.push(Math.round((s / t) * 100));
      }
    }
    if (pcts.length === 0) return 78;
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  } catch {
    return 78;
  }
}

function examCountdownText(userData: any): string {
  const end = userData?.subscription?.endDate;
  if (end) {
    const d = new Date(end);
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days > 0) return `${days} days left`;
    if (days === 0) return 'Today';
  }
  return '90 days left';
}

function displayBoard(userData: any): string {
  return userData?.subCategory?.name || '—';
}

function displayClass(userData: any): string {
  const raw = userData?.parentCategory?.name;
  if (!raw) return '—';
  return String(raw).replace(/^class\s*/i, '').trim() || String(raw);
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  userData,
  onNavigateToLearning,
  onNavigateToSubscription: _onNavigateToSubscription,
  onNavigateToQuiz,
  onNavigateToChat,
  onNavigateToProfile,
}) => {
  void _onNavigateToSubscription;
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    getHeroBanners().catch((err) => console.error('Error fetching hero banners:', err));
  }, []);

  useEffect(() => {
    const bump = () => setRefresh((n) => n + 1);
    const onVis = () => {
      if (document.visibilityState === 'visible') bump();
    };
    window.addEventListener('storage', bump);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', bump);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const history = useMemo(() => {
    return readLearningHistory().sort(
      (a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    );
  }, [refresh, userData, user]);

  const latest = history[0];

  const stats = useMemo(() => {
    const total = history.length;
    const completed = history.filter((h) => h.completed).length;
    const avgProgress =
      total > 0
        ? Math.round(
            history.reduce((s: number, h: any) => s + (h.progress || 0), 0) / total
          )
        : 0;
    return { total, completed, avgProgress };
  }, [history]);

  const avgTestScore = useMemo(() => averageQuizPercent(), [refresh]);

  const subjectRows = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    for (const h of history) {
      const key = (h.mainCategory || h.subcategoryName || 'General').trim();
      if (!map.has(key)) map.set(key, { sum: 0, n: 0 });
      const e = map.get(key)!;
      e.sum += h.progress || 0;
      e.n += 1;
    }
    const palette = [
      { bar: 'bg-emerald-500', icon: BarChart3, iconClass: 'text-emerald-600' },
      { bar: 'bg-[#2B7FD9]', icon: GraduationCap, iconClass: 'text-[#2B7FD9]' },
      { bar: 'bg-orange-500', icon: Microscope, iconClass: 'text-orange-500' },
    ];
    const keys = Array.from(map.keys()).slice(0, 3);
    if (keys.length === 0) {
      return [
        { name: 'Mathematics', pct: 70, ...palette[0] },
        { name: 'English', pct: 55, ...palette[1] },
        { name: 'Science', pct: 40, ...palette[2] },
      ];
    }
    return keys.map((name, i) => {
      const { sum, n } = map.get(name)!;
      const pct = Math.min(100, Math.round(sum / n));
      const p = palette[i % palette.length];
      return { name, pct, ...p };
    });
  }, [history]);

  const continueTitle = latest
    ? `${latest.mainCategory || 'Subject'} — ${latest.contentName || latest.subcategoryName || 'Lesson'}`
    : 'English — Chapter 2: The Happy Prince';

  const continueProgress = latest ? Math.min(100, Math.round(latest.progress || 0)) : 40;

  const handleContinue = useCallback(() => {
    if (!latest) {
      onNavigateToLearning?.();
      return;
    }
    localStorage.setItem(
      'continueLearningItem',
      JSON.stringify({
        subcategoryId: latest.subcategoryId,
        subcategoryName: latest.subcategoryName,
        contentId: latest.contentId,
        contentName: latest.contentName,
      })
    );
    window.location.href = '/dashboard?tab=learning&continue=true';
  }, [latest, onNavigateToLearning]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 lg:px-0 pb-4 max-w-lg lg:max-w-3xl mx-auto">
      {/* Greeting */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100/80">
        <h2 className="text-lg font-bold text-[#1a3a5c]">
          Hello, {user?.name || 'Student'}{' '}
          <span aria-hidden>👋</span>
        </h2>
        <div className="flex gap-2.5 mt-3">
          <button
            type="button"
            onClick={() => onNavigateToProfile?.()}
            title="Board — change in profile"
            className="flex-1 flex items-center gap-2 min-w-0 rounded-xl bg-white px-2.5 py-2.5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
          >
            <span className="w-7 h-7 rounded-full bg-orange-500 shrink-0 shadow-sm" aria-hidden />
            <span className="flex-1 text-left text-[13px] sm:text-sm font-semibold text-[#1a2b4b] truncate">
              Board: {displayBoard(userData)}
            </span>
            <ChevronDown className="w-4 h-4 text-[#1a2b4b] shrink-0 opacity-70" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onNavigateToProfile?.()}
            title="Class — change in profile"
            className="flex-1 flex items-center gap-2 min-w-0 rounded-xl bg-white px-2.5 py-2.5 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-transform"
          >
            <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[#2B7FD9]">
              <School className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="flex-1 text-left text-[13px] sm:text-sm font-semibold text-[#1a2b4b] truncate">
              Class {displayClass(userData)}
            </span>
            <ChevronDown className="w-4 h-4 text-[#1a2b4b] shrink-0 opacity-70" aria-hidden />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Next Exam: <span className="font-semibold text-slate-600">{examCountdownText(userData)}</span>
        </p>
      </section>

      {/* Continue Learning */}
      <section
        className="rounded-2xl overflow-hidden bg-white mb-4 border border-gray-100/80"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5 text-white text-sm font-semibold"
          style={{ backgroundColor: PRIMARY }}
        >
          <GraduationCap className="w-5 h-5 shrink-0" />
          Continue Learning
        </div>
        <div className="p-3 flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a3a5c] leading-snug line-clamp-2">
              {continueTitle}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Progress: {continueProgress}%</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="shrink-0 px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </section>

      {/* Your Progress */}
      <section
        className="rounded-2xl overflow-hidden bg-white mb-4 border border-gray-100/80"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 bg-sky-50 border-b border-sky-100">
          <BarChart3 className="w-5 h-5 text-[#2B7FD9]" />
          <span className="text-sm font-semibold text-[#1a3a5c]">Your Progress</span>
        </div>
        <div className="p-4 space-y-2 text-sm text-[#1a3a5c]">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIMARY }} />
            <span>Chapters Completed: {stats.completed}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIMARY }} />
            <span>Average Test Score: {avgTestScore}%</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIMARY }} />
            <span>10 min Quick Revision</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToLearning?.()}
            className="w-full mt-3 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Start Study
          </button>
        </div>
      </section>

      {/* Subjects — list */}
      <section className="mb-4">
        <h3 className="text-base font-bold text-[#1a3a5c] mb-3">Subjects</h3>
        <div className="space-y-3">
          {subjectRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.name}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
              >
                <div className={`p-2 rounded-lg bg-slate-50 ${row.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a3a5c]">{row.name}</p>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.bar}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600 tabular-nums">{row.pct}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subjects — grid */}
      <section className="mb-4">
        <h3 className="text-base font-bold text-[#1a3a5c] mb-3">Subjects</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {[
            {
              name: 'Mathematics',
              gradient: 'from-emerald-500 to-teal-600',
              icon: <Calculator className="w-8 h-8 text-white/90" />,
            },
            {
              name: 'English',
              gradient: 'from-blue-500 to-indigo-600',
              icon: <Type className="w-8 h-8 text-white/90" />,
            },
            {
              name: 'Science',
              gradient: 'from-orange-400 to-amber-600',
              icon: <Microscope className="w-8 h-8 text-white/90" />,
            },
            {
              name: 'Bengali',
              gradient: 'from-violet-500 to-purple-700',
              icon: <span className="text-xl font-bold text-white">অ</span>,
            },
          ].map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => onNavigateToLearning?.()}
              className={`snap-start shrink-0 w-[7.25rem] h-[6.5rem] rounded-2xl bg-gradient-to-br ${s.gradient} p-3 text-left shadow-md active:scale-[0.98] transition-transform`}
            >
              <p className="text-xs font-bold text-white leading-tight mb-2">{s.name}</p>
              <div className="flex justify-end opacity-90">{s.icon}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-3 gap-2 mb-2">
        <button
          type="button"
          onClick={() => onNavigateToQuiz?.()}
          className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow transition-shadow"
        >
          <ClipboardList className="w-7 h-7 text-[#2B7FD9] mb-1" />
          <span className="text-[11px] font-medium text-[#1a3a5c] text-center leading-tight">Mock Test</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateToLearning?.()}
          className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow transition-shadow"
        >
          <div className="flex items-center gap-0.5 mb-1">
            <span className="text-lg leading-none">😟</span>
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[11px] font-medium text-[#1a3a5c] text-center leading-tight">Weak Topics</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateToChat?.()}
          className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow transition-shadow"
        >
          <Bot className="w-7 h-7 text-[#2B7FD9] mb-1" />
          <span className="text-[11px] font-medium text-[#1a3a5c] text-center leading-tight">Ask AI</span>
        </button>
      </section>
    </div>
  );
};
