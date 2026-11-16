import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import type { Course, Department } from '../types';

interface CourseModalProps {
  open: boolean;
  courseToEdit?: Course | null;
  departments: Department[];
  onClose: () => void;
  onSubmit: (data: { departmentId: string; name: string; code: string; durationSemesters: number }) => Promise<void>;
}

export function CourseModal({ open, courseToEdit, departments, onClose, onSubmit }: CourseModalProps) {
  const isEdit = !!courseToEdit;
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [durationSemesters, setDurationSemesters] = useState(8);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (courseToEdit) {
      setDepartmentId(courseToEdit.departmentId);
      setName(courseToEdit.name);
      setCode(courseToEdit.code);
      setDurationSemesters(courseToEdit.durationSemesters);
    } else {
      setDepartmentId(departments[0]?.id || '');
      setName('');
      setCode('');
      setDurationSemesters(8);
    }
    setErrorMsg(null);
  }, [courseToEdit, open, departments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ departmentId, name, code, durationSemesters });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Course' : 'Create Course'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        <FormField label="Department" htmlFor="c-dept">
          <select
            id="c-dept"
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="" disabled>Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </FormField>
        <FormField label="Course Name" htmlFor="c-name">
          <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. B.Tech Computer Science" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Course Code" htmlFor="c-code">
            <Input id="c-code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BTECH-CSE" />
          </FormField>
          <FormField label="Duration (Semesters)" htmlFor="c-dur">
            <Input
              id="c-dur"
              type="number"
              min={1}
              max={16}
              required
              value={durationSemesters}
              onChange={(e) => setDurationSemesters(Number(e.target.value))}
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
