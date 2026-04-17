import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';
import { getUserProfile } from '../../api';
import { UserProfile } from '../../types/api';

interface ProfilePageProps {
  user: any;
  userData?: any;
  onLogout: () => void;
}

function displayBoard(ud: any): string {
  return ud?.subCategory?.name || '—';
}

function displayClass(ud: any): string {
  const raw = ud?.parentCategory?.name;
  if (!raw) return '—';
  return String(raw).replace(/^class\s*/i, '').trim() || String(raw);
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, userData, onLogout }) => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getUserProfile();
        setProfileData(response.user);
      } catch (err) {
        console.error(err);
        setError('Could not refresh profile from server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const name = profileData?.name ?? user?.name ?? 'Student';
  const email = profileData?.email ?? user?.email ?? '';
  const phone = profileData?.phone ?? '';
  const studentId = profileData?.id ?? user?.id ?? '—';
  const board = displayBoard(userData);
  const grade = displayClass(userData);
  const classLine =
    grade !== '—' && board !== '—'
      ? `Class ${grade} · ${board}`
      : grade !== '—'
        ? `Class ${grade}`
        : board !== '—'
          ? board
          : 'Add class & board in account settings';

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '');
    if (d.length >= 12 && d.startsWith('91')) return `+${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}`;
    if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
    return p || '—';
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 pb-28 max-w-lg lg:max-w-xl mx-auto pt-2">
      {isLoading && (
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
          <div className="h-14 bg-[#2563eb]/80" />
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Blue header */}
          <header className="bg-[#2563eb] px-4 py-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold shrink-0"
              aria-hidden
            >
              {initials(name)}
            </div>
            <h1 className="flex-1 text-center text-base font-bold text-white truncate px-1">{name}</h1>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
          </header>

          {error && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
              {error}. Showing saved account details.
            </div>
          )}

          {/* Identity block */}
          <div className="px-4 pt-5 pb-4 flex gap-4 border-b border-slate-100">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563eb] to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md border-4 border-white shadow-slate-200/80"
              aria-hidden
            >
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-[#1e293b] leading-snug">{classLine}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono break-all leading-snug">
                ID: {String(studentId)}
              </p>
              <p className="text-xs text-slate-500 mt-1 break-all">{email || '—'}</p>
            </div>
          </div>

          {/* Contact card */}
          <div className="px-4 py-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
              <div className="flex items-start gap-3 px-3 py-3 border-b border-slate-100/80">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#2563eb]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1e293b]">Email / Mobile</span>
                    <span className="text-xs font-medium text-[#1e293b] tabular-nums shrink-0">
                      {phone ? formatPhone(phone) : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 break-all">{email || 'Add email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#2563eb]" />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1e293b]">Student / Batch ID</span>
                  <span className="text-xs text-slate-600 font-mono truncate max-w-[45%]" title={String(studentId)}>
                    {String(studentId)}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription quick line (compact) */}
            {profileData?.subscription && (
              <div className="rounded-xl border border-slate-100 px-3 py-2.5 flex items-center gap-2 bg-white">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-[#1e293b]">
                    {profileData.subscription.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {' · '}
                  {profileData.subscription.plan} plan
                </p>
              </div>
            )}

            {/* Notifications */}
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl border border-slate-100 bg-white shadow-sm text-left hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#1e293b]">Notifications</span>
              <ChevronRight
                className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${notificationsOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {notificationsOpen && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 space-y-3">
                {[
                  { title: 'Email updates', desc: 'Tips and reminders by email', key: 'email' },
                  { title: 'Study reminders', desc: 'Nudges for learning sessions', key: 'study' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#1e293b]">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" defaultChecked={item.key === 'email'} />
                      <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#2563eb] peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl border border-red-100 bg-red-50/50 text-left hover:bg-red-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="flex-1 text-sm font-semibold text-red-700">Logout</span>
              <ChevronRight className="w-5 h-5 text-red-300 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
