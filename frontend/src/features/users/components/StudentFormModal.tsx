import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import { getCourses, getSections, getSemesters } from '@/features/academics/api/academicsApi';
import type { StudentFormData, StudentItem } from '../types';

interface StudentFormModalProps {
  open: boolean;
  studentToEdit?: StudentItem | null;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<{ temporaryPassword?: string } | void>;
}

export function StudentFormModal({ open, studentToEdit, onClose, onSubmit }: StudentFormModalProps) {
  const isEdit = !!studentToEdit;

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: () => getCourses(), enabled: open });
  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    rollNumber: '',
    courseId: '',
    semesterId: '',
    sectionId: '',
    admissionYear: new Date().getFullYear(),
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters', formData.courseId],
    queryFn: () => getSemesters(formData.courseId),
    enabled: !!formData.courseId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', formData.semesterId],
    queryFn: () => getSections(formData.semesterId),
    enabled: !!formData.semesterId,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        email: studentToEdit.user.email,
        firstName: studentToEdit.user.firstName,
        lastName: studentToEdit.user.lastName,
        phone: studentToEdit.user.phone || '',
        rollNumber: studentToEdit.rollNumber,
        courseId: studentToEdit.courseId,
        semesterId: studentToEdit.semesterId,
        sectionId: studentToEdit.sectionId,
        admissionYear: studentToEdit.admissionYear,
        dateOfBirth: studentToEdit.dateOfBirth ? studentToEdit.dateOfBirth.slice(0, 10) : '',
        guardianName: studentToEdit.guardianName || '',
        guardianPhone: studentToEdit.guardianPhone || '',
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        rollNumber: '',
        courseId: courses[0]?.id || '',
        semesterId: '',
        sectionId: '',
        admissionYear: new Date().getFullYear(),
        dateOfBirth: '',
        guardianName: '',
        guardianPhone: '',
      });
    }
    setErrorMsg(null);
    setCreatedPassword(null);
  }, [studentToEdit, open, courses]);

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
      title={createdPassword ? 'Student Account Created' : isEdit ? 'Edit Student' : 'Add New Student'}
      onClose={onClose}
    >
      {createdPassword ? (
        <div className="space-y-4">
          <Alert tone="success">
            Student account created! An email was sent with login instructions.
          </Alert>
          <div className="rounded-md border border-line bg-slate-50 p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase">Temporary Password</span>
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
            <p className="mt-2 text-xs text-slate-500">Student must change this password on their first login.</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" htmlFor="s-firstName">
              <Input
                id="s-firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="s-lastName">
              <Input
                id="s-lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email" htmlFor="s-email">
              <Input
                id="s-email"
                type="email"
                required
                disabled={isEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>
            <FormField label="Roll Number" htmlFor="s-rollNumber">
              <Input
                id="s-rollNumber"
                required
                disabled={isEdit}
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Course" htmlFor="s-course">
              <select
                id="s-course"
                required
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value, semesterId: '', sectionId: '' })}
                className="h-11 w-full rounded-md border border-line bg-white px-2 text-xs text-ink"
              >
                <option value="" disabled>Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Semester" htmlFor="s-sem">
              <select
                id="s-sem"
                required
                disabled={!formData.courseId}
                value={formData.semesterId}
                onChange={(e) => setFormData({ ...formData, semesterId: e.target.value, sectionId: '' })}
                className="h-11 w-full rounded-md border border-line bg-white px-2 text-xs text-ink"
              >
                <option value="" disabled>Select Semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Section" htmlFor="s-sec">
              <select
                id="s-sec"
                required
                disabled={!formData.semesterId}
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                className="h-11 w-full rounded-md border border-line bg-white px-2 text-xs text-ink"
              >
                <option value="" disabled>Select Section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>Sec {sec.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Admission Year" htmlFor="s-adyear">
              <Input
                id="s-adyear"
                type="number"
                required
                value={formData.admissionYear}
                onChange={(e) => setFormData({ ...formData, admissionYear: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Phone" htmlFor="s-phone">
              <Input
                id="s-phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Date of Birth" htmlFor="s-dob">
              <Input
                id="s-dob"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Guardian Name" htmlFor="s-guardian">
              <Input
                id="s-guardian"
                value={formData.guardianName || ''}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
              />
            </FormField>
            <FormField label="Guardian Phone" htmlFor="s-gphone">
              <Input
                id="s-gphone"
                value={formData.guardianPhone || ''}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Student'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
