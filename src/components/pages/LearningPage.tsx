import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Rocket,
  Calculator,
  Microscope,
  Globe,
  Landmark,
  Mountain,
  Type,
  ChevronDown,
  School,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getSubcategories } from '../../api';
import { SubcategoriesResponse, Subcategory } from '../../types/api';
import { ContentDetailPage } from './ContentDetailPage';

interface LearningPageProps {
  userData?: any;
  onNavigateToSubscription?: () => void;
  onNavigateToProfile?: () => void;
}

function displayBoard(userData: any): string {
  return userData?.subCategory?.name || '—';
}

function displayClass(userData: any): string {
  const raw = userData?.parentCategory?.name;
  if (!raw) return '—';
  return String(raw).replace(/^class\s*/i, '').trim() || String(raw);
}

type Theme = {
  /** Solid panel color — matches reference grid (Math, English, Science, Bengali, History, Geography) */
  panelClass: string;
  icon: LucideIcon;
  icon2?: LucideIcon;
};

/** Second-image palette: green, royal blue, bright blue, cyan, purple, dark teal */
const SUBJECT_THEMES: Theme[] = [
  { panelClass: 'bg-emerald-500', icon: Calculator, icon2: BookOpen },
  { panelClass: 'bg-blue-700', icon: BookOpen, icon2: Type },
  { panelClass: 'bg-sky-500', icon: Microscope },
  { panelClass: 'bg-cyan-500', icon: Globe },
  { panelClass: 'bg-purple-600', icon: Landmark },
  { panelClass: 'bg-teal-800', icon: Mountain },
];

const BADGE_PRESETS = ['80 Questions', '45 Questions', '30 Questions', '30 Questions', 'Chapters', 'Topics'];

function badgeForSubcategory(sub: Subcategory, index: number): string {
  const t = (sub.type || '').trim();
  if (t && t.toLowerCase() !== 'content') return t;
  return BADGE_PRESETS[index % BADGE_PRESETS.length];
}

export const LearningPage: React.FC<LearningPageProps> = ({
  userData,
  onNavigateToSubscription,
  onNavigateToProfile,
}) => {
  const [subcategories, setSubcategories] = useState<SubcategoriesResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(null);
  const [continueLearningItem, setContinueLearningItem] = useState<any>(null);

  useEffect(() => {
    const continueItem = localStorage.getItem('continueLearningItem');
    if (continueItem) {
      try {
        const parsedItem = JSON.parse(continueItem);
        setContinueLearningItem(parsedItem);
        localStorage.removeItem('continueLearningItem');
      } catch (e) {
        console.error('Error parsing continue learning item:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!userData?.subCategory?.id) {
        setError('No subcategory ID available');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getSubcategories(userData.subCategory.id);
        setSubcategories(data);

        if (continueLearningItem && continueLearningItem.subcategoryId === userData.subCategory.id) {
          const foundContent = data.find((category) =>
            category.subcategories?.some((sub) => sub._id === continueLearningItem.contentId)
          );

          if (foundContent) {
            const subcategory = foundContent.subcategories?.find((sub) => sub._id === continueLearningItem.contentId);
            if (subcategory) {
              handleStartLearning(subcategory._id, subcategory.name);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setError('Failed to load subcategories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [userData, continueLearningItem]);

  const flatSubs = useMemo(() => {
    return subcategories.flatMap((d) => d.subcategories ?? []);
  }, [subcategories]);

  const getClassName = (path: string[]) => {
    return path[path.length - 1] || 'Unknown Class';
  };

  const handleStartLearningClick = () => {
    if (flatSubs.length > 0) {
      const first = flatSubs[0];
      handleStartLearning(first._id, first.name);
    }
  };

  const handleStartLearning = (subcategoryId: string, subcategoryName: string) => {
    setSelectedSubcategory({ id: subcategoryId, name: subcategoryName });
  };

  const handleBack = () => {
    setSelectedSubcategory(null);
  };

  if (selectedSubcategory) {
    return (
      <ContentDetailPage
        subcategoryId={selectedSubcategory.id}
        subcategoryName={selectedSubcategory.name}
        onBack={handleBack}
        userData={userData}
        onNavigateToSubscription={onNavigateToSubscription || (() => {})}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#eef2f7] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 lg:px-0 pb-8 max-w-lg lg:max-w-3xl mx-auto">
      {/* Board + Class — mock: white pills, shadow, chevrons */}
      <section className="flex gap-2.5 mb-4">
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
      </section>

      {/* Available classes strip */}
      <section
        className="bg-white rounded-2xl p-4 mb-4 shadow-md border-t-[5px] border-[#1a3a6e]"
        style={{ boxShadow: '0 4px 18px rgba(26, 58, 110, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3
              className="text-lg sm:text-xl font-bold text-[#1a3a6e]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              🌟 Available Classes
            </h3>
            <p className="text-sm text-[#1a3a6e] mt-0.5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Click on any class to start learning!
            </p>
          </div>
          <p className="text-xs sm:text-sm text-[#1a3a6e]/80 sm:text-right whitespace-nowrap">
            ✨ Fun Learning Ahead!
          </p>
        </div>
      </section>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center bg-white rounded-2xl p-8 shadow-md border border-gray-100">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-[#1a3a6e] rounded-full animate-spin" />
              <Rocket className="h-7 w-7 text-[#1a3a6e] absolute inset-0 m-auto" />
            </div>
            <p className="text-[#1a3a6e] font-medium">Loading classes…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {!loading && !error && flatSubs.length > 0 && (
        <div
          className="grid grid-cols-2 gap-[10px] sm:gap-3.5 max-w-[420px] sm:max-w-none mx-auto"
          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
        >
          {flatSubs.map((sub, index) => {
            const theme = SUBJECT_THEMES[index % SUBJECT_THEMES.length];
            const MainIcon = theme.icon;
            const ExtraIcon = theme.icon2;
            const title = getClassName(sub.path);
            const badge = badgeForSubcategory(sub, index);

            return (
              <button
                key={sub._id}
                type="button"
                onClick={() => handleStartLearning(sub._id, sub.name)}
                className="text-left rounded-[14px] overflow-hidden bg-white flex flex-col min-h-[10.5rem] sm:min-h-[11.5rem] active:scale-[0.98] transition-transform border border-black/[0.06]"
                style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Top: colorful panel ~half height — reference image 2 */}
                <div
                  className={`relative flex-[1.15] min-h-[5.75rem] sm:min-h-[6.25rem] ${theme.panelClass} flex items-center justify-center px-2 pt-3 pb-2`}
                >
                  <div className="relative flex items-center justify-center gap-1">
                    {ExtraIcon ? (
                      <>
                        <MainIcon className="w-[2.1rem] h-[2.1rem] sm:w-10 sm:h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                        <ExtraIcon className="w-[1.85rem] h-[1.85rem] sm:w-9 sm:h-9 text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                      </>
                    ) : (
                      <MainIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                    )}
                  </div>
                </div>

                {/* Bottom: white, navy sans title + lavender pill */}
                <div className="flex-1 flex flex-col justify-center items-center px-2.5 py-2.5 sm:py-3 bg-white">
                  <h4 className="text-[13px] sm:text-[15px] font-bold text-[#1A237E] text-center leading-tight line-clamp-2 w-full">
                    {title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#3949ab]/80 text-center mt-0.5 line-clamp-1 w-full font-medium">
                    {sub.name}
                  </p>
                  <div className="mt-1.5 flex justify-center w-full">
                    <span
                      className="inline-block text-[10px] sm:text-[11px] font-medium text-[#3949ab] px-2.5 py-1 rounded-full max-w-full truncate"
                      style={{ backgroundColor: '#F0F0F8' }}
                    >
                      {badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {flatSubs.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#1a3a6e] mb-2">No Study Materials Available</h3>
          <p className="text-gray-500 text-sm mb-6 px-4">Explore again when content is added for your class.</p>
          <button
            type="button"
            onClick={handleStartLearningClick}
            className="px-6 py-2.5 rounded-xl bg-[#1a3a6e] text-amber-200 font-semibold text-sm hover:bg-[#152a52] transition-colors"
          >
            Start Learning 🌍
          </button>
        </div>
      )}

    </div>
  );
};
