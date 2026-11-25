import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع في المنصة.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="wrap flex min-h-[70vh] items-center justify-center">
          <div className="notebook-card max-w-md space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="m-0 text-lg font-bold text-[#22163F]">تعذر عرض الصفحة مؤقتاً</h1>
            <p className="m-0 text-xs leading-relaxed text-[#6E6390]">
              حدث خلل تقني غير متوقع. اضغط على إعادة تحميل المنصة للمتابعة بأمان.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-main mx-auto !py-2.5 !px-5 !text-xs"
            >
              <RotateCcw className="h-4 w-4" />
              <span>إعادة تحميل المنصة</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
