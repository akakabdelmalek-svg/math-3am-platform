import { Calendar, Clock, ExternalLink, FileText, Megaphone, Plus, Trash2, Video } from 'lucide-react';
import type { EventItem, EventType } from '../types/math';

interface EventsViewProps {
  events: EventItem[];
  isAdmin?: boolean;
  onOpenAdminEvents?: () => void;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

const EVENT_TYPE_META: Record<EventType, { label: string; cls: string; icon: typeof Calendar }> = {
  live: { label: 'حصة مباشرة', cls: 'bg-sky-50 text-sky-700', icon: Video },
  devoir: { label: 'فرض محروس', cls: 'bg-amber-50 text-amber-800', icon: FileText },
  exam: { label: 'اختبار', cls: 'bg-rose-50 text-rose-700', icon: Calendar },
  announcement: { label: 'إعلان هام', cls: 'bg-[#EFE8FE] text-[#3E1591]', icon: Megaphone },
};

export function EventsView({ events, isAdmin, onOpenAdminEvents, onDeleteEvent }: EventsViewProps) {
  return (
    <div className="wrap space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="m-0 text-xl font-bold text-[#22163F]">الأحداث والمواعيد الدراسية</h1>
          <p className="m-0 text-xs text-[#6E6390]">
            جدول الحصص المباشرة، مواعيد الفروض والاختبارات، وإعلانات الأستاذ.
          </p>
        </div>
        {isAdmin && onOpenAdminEvents && (
          <button
            type="button"
            onClick={onOpenAdminEvents}
            className="btn btn-main !py-1.5 !px-3 !text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة / إدارة الأحداث</span>
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="notebook-card p-8 text-center text-sm text-[#6E6390]">
          لا توجد أحداث مجدولة حالياً.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const meta = EVENT_TYPE_META[evt.eventType] || EVENT_TYPE_META.announcement;
            const Icon = meta.icon;
            return (
              <article key={evt.id} className="notebook-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${meta.cls}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{meta.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums flex items-center gap-2 text-xs font-bold text-[#6E6390]">
                      <span>{evt.eventDate}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {evt.eventTime}
                      </span>
                    </span>
                    {isAdmin && onDeleteEvent && (
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(evt.id)}
                        aria-label={`حذف حدث ${evt.title}`}
                        className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="mt-2.5 mb-1 text-base font-bold text-[#22163F]">{evt.title}</h2>
                <p className="m-0 text-sm leading-relaxed text-[#6E6390]">{evt.description}</p>
                {evt.link && (
                  <div className="mt-3 border-t border-[#E6DEF8] pt-3">
                    <a
                      href={evt.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-main !py-2 !px-3.5 !text-xs"
                    >
                      <span>فتح رابط الحدث</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
