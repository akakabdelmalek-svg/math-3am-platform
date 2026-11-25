import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import {
  auth,
  createUserWithEmailAndPassword,
  googleProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from '../firebase';
import { activateAdminWithCode, ensureUserProfile } from '../services/academyService';
import { verifyAdminAccessCode } from '../utils/mathPlatform';

export type AuthModalMode = 'student' | 'admin';

interface AuthModalProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSuccess: (role: 'student' | 'admin') => void | Promise<void>;
  onSwitchMode: (mode: AuthModalMode) => void;
  onAuthFlowChange?: (active: boolean) => void;
}

export function AuthModal({
  mode,
  onClose,
  onSuccess,
  onSwitchMode,
  onAuthFlowChange,
}: AuthModalProps) {
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeVerified, setAdminCodeVerified] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [classGroup, setClassGroup] = useState('3AM1');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const isAdminFlow = mode === 'admin';

  function mapAuthError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني. يمكنك اختيار «إنشاء حساب جديد».';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'هذا البريد مسجل مسبقاً. اختر تسجيل الدخول بدلاً من ذلك.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'كلمة المرور ضعيفة، يجب أن تحتوي على 6 أحرف على الأقل.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'تم إغلاق نافذة تسجيل الدخول بجوجل.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'صيغة البريد الإلكتروني غير صالحة.';
    }
    return 'تعذر إتمام تسجيل الدخول. تأكد من اتصالك والمعلومات المدخلة.';
  }

  function handleVerifyAdminCode(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!verifyAdminAccessCode(adminCode)) {
      setErrorMsg('رمز دخول الإدارة غير صحيح. تأكد من كتابة الرمز المطلوب.');
      return;
    }
    setAdminCodeVerified(true);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (isAdminFlow && !adminCodeVerified) {
      setErrorMsg('يرجى التحقق من رمز دخول الإدارة أولاً.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    if (!isAdminFlow && authAction === 'register' && displayName.trim().length < 2) {
      setErrorMsg('يرجى كتابة الاسم واللقب.');
      return;
    }

    setBusy(true);
    onAuthFlowChange?.(true);
    try {
      if (isAdminFlow) {
        const cred =
          authAction === 'register'
            ? await createUserWithEmailAndPassword(auth, email.trim(), password)
            : await signInWithEmailAndPassword(auth, email.trim(), password);

        if (authAction === 'register' && displayName.trim().length >= 2) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }

        const ok = await activateAdminWithCode(cred.user, adminCode);
        if (!ok) {
          await signOut(auth);
          setErrorMsg('تعذر تفعيل صلاحية الإدارة بهذا الرمز.');
          return;
        }
        await ensureUserProfile(cred.user, {
          displayName: displayName.trim() || undefined,
          role: 'admin',
        });
        await onSuccess('admin');
      } else if (authAction === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
        await ensureUserProfile(cred.user, {
          displayName: displayName.trim(),
          classGroup: classGroup.trim() || '3AM',
          role: 'student',
        });
        await onSuccess('student');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserProfile(cred.user, { role: 'student' });
        await onSuccess('student');
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      onAuthFlowChange?.(false);
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setErrorMsg(null);
    setInfoMsg(null);
    if (isAdminFlow && !adminCodeVerified) {
      setErrorMsg('يرجى التحقق من رمز دخول الإدارة أولاً.');
      return;
    }
    setBusy(true);
    onAuthFlowChange?.(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (isAdminFlow) {
        const ok = await activateAdminWithCode(cred.user, adminCode);
        if (!ok) {
          await signOut(auth);
          setErrorMsg('تعذر تفعيل صلاحية الإدارة لهذا الحساب.');
          return;
        }
        await ensureUserProfile(cred.user, { role: 'admin' });
        await onSuccess('admin');
      } else {
        await ensureUserProfile(cred.user, { role: 'student' });
        await onSuccess('student');
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      onAuthFlowChange?.(false);
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    setErrorMsg(null);
    setInfoMsg(null);
    if (!email.trim()) {
      setErrorMsg('اكتب بريدك الإلكتروني أولاً ثم اضغط استرجاع كلمة المرور.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#22163F]/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="notebook-card relative w-full max-w-md overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Top violet notebook banner */}
        <div className="notebook-violet flex items-center justify-between px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#3E1591]">
              {isAdminFlow ? <ShieldCheck className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
            </span>
            <div>
              <h2 id="auth-modal-title" className="font-display text-lg font-bold">
                {isAdminFlow ? 'دخول الإدارة (الأستاذ)' : 'بوابة التلميذ — 3 متوسط'}
              </h2>
              <p className="text-xs text-white/80">
                {isAdminFlow
                  ? 'إضافة الدروس، التمارين التفاعلية، الأحداث ومتابعة نتائج التلاميذ'
                  : 'احفظ نقاطك وتابع تقدمك في محاور الرياضيات'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Role switch tabs */}
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#EFE8FE] p-1">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setInfoMsg(null);
                setAdminCode('');
                setAdminCodeVerified(false);
                onSwitchMode('student');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                !isAdminFlow ? 'bg-white text-[#3E1591] shadow-xs' : 'text-[#6E6390]'
              }`}
            >
              حساب التلميذ
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setInfoMsg(null);
                onSwitchMode('admin');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                isAdminFlow ? 'bg-white text-[#3E1591] shadow-xs' : 'text-[#6E6390]'
              }`}
            >
              دخول الادارة (الأستاذ)
            </button>
          </div>

          {errorMsg && (
            <div
              data-testid="auth-error-msg"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              data-testid="auth-info-msg"
              className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Admin Access Code Gate */}
          {isAdminFlow && !adminCodeVerified ? (
            <form onSubmit={handleVerifyAdminCode} className="space-y-3" data-testid="admin-code-gate">
              <div className="rounded-xl border border-[#E7A33E]/50 bg-[#FFFBF2] p-3 text-xs leading-relaxed text-[#6B4A07]">
                للوصول إلى لوحة الإدارة بأي بريد إلكتروني، أدخل رمز دخول الإدارة السري أولاً.
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#22163F]">
                  رمز دخول الإدارة
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
                  <input
                    type="text"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    data-testid="admin-code-input"
                    placeholder="أدخل رمز دخول الإدارة..."
                    autoFocus
                    className="w-full rounded-xl border border-[#D6C9F3] py-2.5 pr-9 pl-3 text-sm font-bold text-[#22163F] focus:border-[#6D28D9] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                data-testid="verify-admin-code-btn"
                className="btn btn-main w-full"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>تحقق من الرمز وفتح الدخول</span>
              </button>
            </form>
          ) : (
            <div data-testid={isAdminFlow ? 'admin-auth-unlocked' : 'student-auth-form'}>
              {isAdminFlow && (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    تم التحقق من رمز الإدارة — أي بريد إلكتروني مقبول
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminCodeVerified(false);
                      setInfoMsg(null);
                    }}
                    className="text-[11px] underline"
                  >
                    تغيير الرمز
                  </button>
                </div>
              )}

              <div className="mb-4 flex gap-3 border-b border-[#E6DEF8] pb-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthAction('login');
                    setErrorMsg(null);
                  }}
                  className={
                    authAction === 'login'
                      ? 'border-b-2 border-[#6D28D9] pb-1 text-[#3E1591]'
                      : 'pb-1 text-[#6E6390]'
                  }
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthAction('register');
                    setErrorMsg(null);
                  }}
                  className={
                    authAction === 'register'
                      ? 'border-b-2 border-[#6D28D9] pb-1 text-[#3E1591]'
                      : 'pb-1 text-[#6E6390]'
                  }
                >
                  إنشاء حساب جديد
                </button>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleLogin}
                className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#D6C9F3] bg-white px-4 py-2.5 text-sm font-bold text-[#22163F] transition hover:bg-[#FAF8FF] disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>
                  {isAdminFlow ? 'دخول الإدارة عبر Google' : 'المتابعة باستخدام Google'}
                </span>
              </button>

              <div className="relative mb-4 text-center text-xs text-[#6E6390]">
                <span className="relative z-10 bg-white px-3">أو بالبريد الإلكتروني وكلمة المرور</span>
                <span className="absolute inset-x-0 top-1/2 h-px bg-[#E6DEF8]" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {authAction === 'register' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className={isAdminFlow ? 'sm:col-span-3' : 'sm:col-span-2'}>
                      <label className="mb-1 block text-xs font-bold text-[#22163F]">
                        {isAdminFlow ? 'اسم الأستاذ / المشرف' : 'الاسم واللقب'}
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={isAdminFlow ? 'مثال: أستاذ الرياضيات' : 'مثال: أمينة بن علي'}
                          className="w-full rounded-xl border border-[#D6C9F3] py-2 pr-9 pl-3 text-sm focus:border-[#6D28D9] focus:outline-none"
                        />
                      </div>
                    </div>
                    {!isAdminFlow && (
                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#22163F]">القسم</label>
                        <select
                          value={classGroup}
                          onChange={(e) => setClassGroup(e.target.value)}
                          className="w-full rounded-xl border border-[#D6C9F3] bg-white px-2.5 py-2 text-sm focus:border-[#6D28D9] focus:outline-none"
                        >
                          <option value="3AM1">3 متوسط 1</option>
                          <option value="3AM2">3 متوسط 2</option>
                          <option value="3AM3">3 متوسط 3</option>
                          <option value="3AM4">3 متوسط 4</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#22163F]">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
                    <input
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-[#D6C9F3] py-2 pr-9 pl-3 text-left text-sm focus:border-[#6D28D9] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#22163F]">كلمة المرور</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-[#6E6390]" />
                    <input
                      type="password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#D6C9F3] py-2 pr-9 pl-3 text-left text-sm focus:border-[#6D28D9] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-main w-full disabled:opacity-60"
                >
                  {busy
                    ? 'جارٍ التحقق...'
                    : isAdminFlow
                      ? authAction === 'register'
                        ? 'إنشاء حساب ودخول الإدارة'
                        : 'دخول الإدارة'
                      : authAction === 'register'
                        ? 'إنشاء حساب التلميذ'
                        : 'دخول المنصة'}
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="font-semibold text-[#6D28D9] hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
                <span className="text-[#6E6390]">مصادقة آمنة عبر Firebase Auth</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
