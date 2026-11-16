import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import type { Course, Semester } from '../types';

interface SemesterModalProps {
  open: boolean;
  semesterToEdit?: Semester | null;
  courses: Course[];
  onClose: () => void;
  onSubmit: (data: {
    courseId: string;
    number: number;
    academicYear: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }) => Promise<void>;
}

export function SemesterModal({ open, semesterToEdit, courses, onClose, onSubmit }: SemesterModalProps) {
  const isEdit = !!semesterToEdit;
  const [courseId, setCourseId] = useState('');
  const [number, setNumber] = useState(1);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (semesterToEdit) {
      setCourseId(semesterToEdit.courseId);
      setNumber(semesterToEdit.number);
      setAcademicYear(semesterToEdit.academicYear);
      setStartDate(semesterToEdit.startDate.slice(0, 10));
      setEndDate(semesterToEdit.endDate.slice(0, 10));
      setIsCurrent(semesterToEdit.isCurrent);
    } else {
      setCourseId(courses[0]?.id || '');
      setNumber(1);
      setAcademicYear('2026-27');
      setStartDate('2026-08-01');
      setEndDate('2026-12-20');
      setIsCurrent(true);
    }
    setErrorMsg(null);
  }, [semesterToEdit, open, courses]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ courseId, number, academicYear, startDate, endDate, isCurrent });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Semester' : 'Create Semester'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        <FormField label="Course" htmlFor="sem-course">
          <select
            id="sem-course"
            required
            disabled={isEdit}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="" disabled>Select Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Semester Number" htmlFor="sem-num">
            <Input
              id="sem-num"
              type="number"
              min={1}
              max={16}
              required
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Academic Year" htmlFor="sem-year">
            <Input id="sem-year" required value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2026-27" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date" htmlFor="sem-start">
            <Input id="sem-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End Date" htmlFor="sem-end">
            <Input id="sem-end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="sem-current"
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand"
          />
          <label htmlFor="sem-current" className="text-sm font-medium text-slate-700">Set as Current Active Semester</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
