import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import type { Semester, Subject, SubjectType } from '../types';

interface SubjectModalProps {
  open: boolean;
  subjectToEdit?: Subject | null;
  semesters: Semester[];
  onClose: () => void;
  onSubmit: (data: { semesterId: string; code: string; name: string; credits: number; type: SubjectType }) => Promise<void>;
}

export function SubjectModal({ open, subjectToEdit, semesters, onClose, onSubmit }: SubjectModalProps) {
  const isEdit = !!subjectToEdit;
  const [semesterId, setSemesterId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [type, setType] = useState<SubjectType>('THEORY');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (subjectToEdit) {
      setSemesterId(subjectToEdit.semesterId);
      setCode(subjectToEdit.code);
      setName(subjectToEdit.name);
      setCredits(subjectToEdit.credits);
      setType(subjectToEdit.type);
    } else {
      setSemesterId(semesters[0]?.id || '');
      setCode('');
      setName('');
      setCredits(3);
      setType('THEORY');
    }
    setErrorMsg(null);
  }, [subjectToEdit, open, semesters]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ semesterId, code, name, credits, type });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Subject' : 'Create Subject'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        <FormField label="Semester" htmlFor="sub-sem">
          <select
            id="sub-sem"
            required
            disabled={isEdit}
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
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
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Subject Code" htmlFor="sub-code">
            <Input id="sub-code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. CS301" />
          </FormField>
          <FormField label="Credits" htmlFor="sub-cred">
            <Input id="sub-cred" type="number" min={1} max={10} required value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
          </FormField>
        </div>
        <FormField label="Subject Name" htmlFor="sub-name">
          <Input id="sub-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Structures & Algorithms" />
        </FormField>
        <FormField label="Type" htmlFor="sub-type">
          <select
            id="sub-type"
            value={type}
            onChange={(e) => setType(e.target.value as SubjectType)}
            className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="THEORY">Theory</option>
            <option value="PRACTICAL">Practical / Lab</option>
            <option value="ELECTIVE">Elective</option>
          </select>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
