import { Badge, Button } from '@/components/ui';
import { DAYS_OF_WEEK, minutesToTimeStr, type DayOfWeek, type TimetableSlotItem } from '../types';

interface TimetableGridProps {
  slots: TimetableSlotItem[];
  canManage?: boolean;
  onEdit?: (slot: TimetableSlotItem) => void;
  onDelete?: (id: string) => void;
}

export function TimetableGrid({ slots, canManage, onEdit, onDelete }: TimetableGridProps) {
  const slotsByDay = DAYS_OF_WEEK.reduce<Record<DayOfWeek, TimetableSlotItem[]>>((acc, day) => {
    acc[day] = slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    return acc;
  }, {} as Record<DayOfWeek, TimetableSlotItem[]>);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {DAYS_OF_WEEK.map((day) => {
        const daySlots = slotsByDay[day] || [];
        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() === day;

        return (
          <div
            key={day}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${
              isToday ? 'border-brand ring-1 ring-brand' : 'border-line'
            }`}
          >
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
              <span className="font-bold text-slate-900 tracking-tight">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </span>
              <div className="flex items-center gap-1.5">
                {isToday && <Badge tone="blue">Today</Badge>}
                <span className="text-xs text-slate-500 font-medium">
                  {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                </span>
              </div>
            </div>

            {daySlots.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No classes scheduled
              </div>
            ) : (
              <div className="space-y-2.5">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="group relative rounded-lg border border-slate-200 bg-slate-50/70 p-3 hover:border-brand/40 hover:bg-white transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-brand">
                      <span>
                        {minutesToTimeStr(slot.startMinute)} – {minutesToTimeStr(slot.endMinute)}
                      </span>
                      <Badge tone="gray">{slot.room}</Badge>
                    </div>

                    <div className="mt-1 font-bold text-slate-900 text-sm">
                      {slot.allocation.subject.name}{' '}
                      <span className="text-xs font-normal text-slate-500 font-mono">
                        ({slot.allocation.subject.code})
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Sec {slot.allocation.section.name}</span>
                      <span>Prof. {slot.allocation.faculty.user.lastName}</span>
                    </div>

                    {canManage && (
                      <div className="mt-2 flex justify-end gap-1.5 border-t border-slate-100 pt-2 opacity-90 group-hover:opacity-100">
                        {onEdit && (
                          <Button
                            variant="secondary"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => onEdit(slot)}
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="danger"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => onDelete(slot.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
