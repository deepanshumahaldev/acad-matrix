import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, FormField, Modal } from '@/components/ui';
import { getFacultyList } from '@/features/users/api/usersApi';
import { getSections, getSubjects } from '../api/academicsApi';
import type { Semester } from '../types';

interface AllocationModalProps {
  open: boolean;
  semesters: Semester[];
  onClose: () => void;
  onSubmit: (data: { facultyId: string; subjectId: string; sectionId: string }) => Promise<void>;
}

export function AllocationModal({ open, semesters, onClose, onSubmit }: AllocationModalProps) {
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: facultyRes } = useQuery({
    queryKey: ['faculty-all'],
    queryFn: () => getFacultyList({ limit: 100, status: 'ACTIVE' }),
    enabled: open,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', semesterId],
    queryFn: () => getSections(semesterId),
    enabled: !!semesterId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', semesterId],
    queryFn: () => getSubjects(semesterId),
    enabled: !!semesterId,
  });

  useEffect(() => {
    if (open) {
      setSemesterId(semesters[0]?.id || '');
      setSubjectId('');
      setSectionId('');
      setFacultyId(facultyRes?.items[0]?.id || '');
      setErrorMsg(null);
    }
  }, [open, semesters, facultyRes]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!facultyId || !subjectId || !sectionId) {
      setErrorMsg('Please select a faculty member, subject, and section.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ facultyId, subjectId, sectionId });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Assign Faculty to Subject & Section" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

        <FormField label="Semester" htmlFor="alloc-sem">
          <select
            id="alloc-sem"
            required
            value={semesterId}
            onChange={(e) => {
              setSemesterId(e.target.value);
              setSubjectId('');
              setSectionId('');
            }}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="" disabled>Select Semester</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course?.code || 'Course'} - Sem {s.number} ({s.academicYear})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Subject" htmlFor="alloc-sub">
          <select
            id="alloc-sub"
            required
            disabled={!semesterId}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">Select Subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </FormField>

        <FormField label="Section" htmlFor="alloc-sec">
          <select
            id="alloc-sec"
            required
            disabled={!semesterId}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>Section {sec.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Faculty Member" htmlFor="alloc-fac">
          <select
            id="alloc-fac"
            required
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">Select Faculty Member</option>
            {facultyRes?.items.map((f) => (
              <option key={f.id} value={f.id}>
                {f.user.firstName} {f.user.lastName} ({f.employeeId} • {f.department.code})
              </option>
            ))}
          </select>
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Allocation</Button>
        </div>
      </form>
    </Modal>
  );
}
