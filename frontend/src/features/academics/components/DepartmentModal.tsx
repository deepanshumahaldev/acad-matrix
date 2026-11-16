import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import type { Department } from '../types';

interface DepartmentModalProps {
  open: boolean;
  departmentToEdit?: Department | null;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string }) => Promise<void>;
}

export function DepartmentModal({ open, departmentToEdit, onClose, onSubmit }: DepartmentModalProps) {
  const isEdit = !!departmentToEdit;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (departmentToEdit) {
      setName(departmentToEdit.name);
      setCode(departmentToEdit.code);
    } else {
      setName('');
      setCode('');
    }
    setErrorMsg(null);
  }, [departmentToEdit, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({ name, code });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Department' : 'Create Department'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}
        <FormField label="Department Name" htmlFor="dept-name">
          <Input id="dept-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science & Engineering" />
        </FormField>
        <FormField label="Department Code" htmlFor="dept-code">
          <Input id="dept-code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. CSE" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
