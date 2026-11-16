import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import { getAllocations } from '@/features/academics/api/academicsApi';
import {
  DAYS_OF_WEEK,
  minutesToInputVal,
  timeStrToMinutes,
  type CreateSlotPayload,
  type DayOfWeek,
  type TimetableSlotItem,
} from '../types';

interface TimetableSlotModalProps {
  open: boolean;
  slotToEdit?: TimetableSlotItem | null;
  onClose: () => void;
  onSubmit: (data: CreateSlotPayload) => Promise<void>;
}

export function TimetableSlotModal({ open, slotToEdit, onClose, onSubmit }: TimetableSlotModalProps) {
  const isEdit = !!slotToEdit;
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => getAllocations(),
    enabled: open,
  });

  const [allocationId, setAllocationId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (slotToEdit) {
      setAllocationId(slotToEdit.allocationId);
      setDayOfWeek(slotToEdit.dayOfWeek);
      setStartTime(minutesToInputVal(slotToEdit.startMinute));
      setEndTime(minutesToInputVal(slotToEdit.endMinute));
      setRoom(slotToEdit.room);
    } else {
      setAllocationId(allocations[0]?.id || '');
      setDayOfWeek('MONDAY');
      setStartTime('09:00');
      setEndTime('10:00');
      setRoom('');
    }
    setErrorMsg(null);
  }, [slotToEdit, open, allocations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const startMinute = timeStrToMinutes(startTime);
    const endMinute = timeStrToMinutes(endTime);

    if (startMinute >= endMinute) {
      setErrorMsg('Start time must be earlier than end time');
      return;
    }

    if (!allocationId) {
      setErrorMsg('Please select a subject allocation');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({
        allocationId,
        dayOfWeek,
        startMinute,
        endMinute,
        room: room.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save timetable slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Timetable Slot' : 'Add Timetable Class Slot'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

        <FormField label="Subject & Class Allocation" htmlFor="slot-alloc">
          <select
            id="slot-alloc"
            required
            value={allocationId}
            onChange={(e) => setAllocationId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="" disabled>Select Subject, Section & Faculty</option>
            {allocations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.subject.code} - {a.subject.name} | Sec {a.section.name} | Prof. {a.faculty.user.lastName}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Day of Week" htmlFor="slot-day">
            <select
              id="slot-day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Classroom / Lab" htmlFor="slot-room">
            <Input
              id="slot-room"
              required
              placeholder="e.g. Room 302 or Lab 1"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Time" htmlFor="slot-start">
            <Input
              id="slot-start"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </FormField>
          <FormField label="End Time" htmlFor="slot-end">
            <Input
              id="slot-end"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Add Slot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
