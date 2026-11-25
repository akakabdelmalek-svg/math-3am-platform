import {
  ArrowRight,
  BookOpen,
  Calculator,
  Home,
  LayoutDashboard,
  Trophy,
} from 'lucide-react';
import type { AppView, UserProfile } from '../types/math';

interface NavbarProps {
  currentView: AppView;
  canGoBack: boolean;
  onBack: () => void;
  onNavigate: (view: AppView) => void;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onOpenStudentAuth: () => void;
  onOpenAdminEntry: () => void;
  onLogout: () => void;
}

const TAB_ITEMS: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'courses', label: 'الدروس', icon: BookOpen },
  { id: 'exercises', label: 'التمارين', icon: Calculator },
  { id: 'dashboard', label: 'لوحتي', icon: LayoutDashboard },
  { id: 'scores', label: 'النتائج', icon: Trophy },
];

export function Navbar({
  currentView,
  canGoBack,
  onBack,
  onNavigate,
  userProfile,
  isAdmin,
  onOpenStudentAuth,
  onOpenAdminEntry,
  onLogout,
}: NavbarProps) {
  return (
    <>
      <header className="appbar">
        {canGoBack && (
          <button
            type="button"
            className="back"
            onClick={onBack}
            aria-label="رجوع"
            title="رجوع"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="ttl text-right bg-transparent border-0 text-white cursor-pointer p-0"
        >
          <h1>أكاديمية الرياضيات</h1>
          <p>رياضيات — السنة الثالثة متوسط (3AM)</p>
        </button>

        <button
          type="button"
          onClick={onOpenAdminEntry}
          data-testid="nav-admin-btn"
          className="adm-chip"
        >
          {isAdmin ? 'لوحة الإدارة' : 'دخول الادارة'}
        </button>

        {userProfile ? (
          <button
            type="button"
            onClick={onLogout}
            className="out"
            title="تسجيل الخروج"
          >
            خروج
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenStudentAuth}
            data-testid="nav-student-login-btn"
            className="out"
          >
            دخول التلميذ
          </button>
        )}
      </header>

      <nav className="tabbar" aria-label="التنقل الرئيسي">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={active ? 'on' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="tt">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
