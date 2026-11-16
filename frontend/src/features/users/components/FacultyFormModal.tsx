import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import { getDepartments } from '@/features/academics/api/academicsApi';
import type { FacultyFormData, FacultyItem } from '../types';

interface FacultyFormModalProps {
  open: boolean;
  facultyToEdit?: FacultyItem | null;
  onClose: () => void;
  onSubmit: (data: FacultyFormData) => Promise<{ temporaryPassword?: string } | void>;
}

export function FacultyFormModal({ open, facultyToEdit, onClose, onSubmit }: FacultyFormModalProps) {
  const isEdit = !!facultyToEdit;
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments, enabled: open });

  const [formData, setFormData] = useState<FacultyFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    employeeId: '',
    departmentId: '',
    designation: '',
    joiningDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  useEffect(() => {
    if (facultyToEdit) {
      setFormData({
        email: facultyToEdit.user.email,
        firstName: facultyToEdit.user.firstName,
        lastName: facultyToEdit.user.lastName,
        phone: facultyToEdit.user.phone || '',
        employeeId: facultyToEdit.employeeId,
        departmentId: facultyToEdit.departmentId,
        designation: facultyToEdit.designation || '',
        joiningDate: facultyToEdit.joiningDate ? facultyToEdit.joiningDate.slice(0, 10) : '',
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        employeeId: '',
        departmentId: departments[0]?.id || '',
        designation: '',
        joiningDate: '',
      });
    }
    setErrorMsg(null);
    setCreatedPassword(null);
  }, [facultyToEdit, open, departments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onSubmit(formData);
      if (res && res.temporaryPassword) {
        setCreatedPassword(res.temporaryPassword);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={createdPassword ? 'Faculty Created Successfully' : isEdit ? 'Edit Faculty' : 'Add New Faculty'}
      onClose={onClose}
    >
      {createdPassword ? (
        <div className="space-y-4">
          <Alert tone="success">
            Faculty member account created! An email was sent with login instructions.
          </Alert>
          <div className="rounded-md border border-line bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase">Generated Temporary Password</span>
            <div className="mt-1 flex items-center justify-between">
              <code className="font-mono text-base font-bold text-slate-900">{createdPassword}</code>
              <Button
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => navigator.clipboard.writeText(createdPassword)}
              >
                Copy
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">The user must change this password upon first login.</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" htmlFor="firstName">
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName">
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                disabled={isEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>
            <FormField label="Employee ID" htmlFor="employeeId">
              <Input
                id="employeeId"
                required
                disabled={isEdit}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department" htmlFor="departmentId">
              <select
                id="departmentId"
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
              >
                <option value="" disabled>Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Designation" htmlFor="designation">
              <Input
                id="designation"
                placeholder="e.g. Assistant Professor"
                value={formData.designation || ''}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Joining Date" htmlFor="joiningDate">
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate || ''}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save Changes' : 'Create Faculty'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
