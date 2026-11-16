import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import type { Section, Semester } from '../types';

interface SectionModalProps {
  open: boolean;
  sectionToEdit?: Section | null;
  semesters: Semester[];
  onClose: () => void;
  onSubmit: (data: { semesterId: string; name: string }) => Promise<void>;
}

export function SectionModal({ open, sectionToEdit, semesters, onClose, onSubmit }: SectionModalProps) {
  const isEdit = !!sectionToEdit;
  const [semesterId, setSemesterId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sectionToEdit) {
      setSemesterId(sectionToEdit.semesterId);
      setName(sectionToEdit.name);
    } else {
      setSemesterId(semesters[0]?.id || '');
      setName('');
    }
    setErrorMsg(null);
  }, [sectionToEdit, open, semesters]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ semesterId, name });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Section' : 'Create Section'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        <FormField label="Semester" htmlFor="sec-sem">
          <select
            id="sec-sem"
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
        <FormField label="Section Name" htmlFor="sec-name">
          <Input id="sec-name" required value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="e.g. A or B" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
