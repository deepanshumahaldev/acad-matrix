import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, FormField, Input, Modal } from '@/components/ui';
import { getAllocations, getSections } from '@/features/academics/api/academicsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { CreateNotificationPayload, NotificationAudience } from '../types';

interface SendNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNotificationPayload) => Promise<void>;
}

export function SendNotificationModal({ open, onClose, onSubmit }: SendNotificationModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>(isAdmin ? 'ALL' : 'SECTION');
  const [targetRole, setTargetRole] = useState<'ADMIN' | 'FACULTY' | 'STUDENT'>('STUDENT');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections(),
    enabled: open && isAdmin,
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['my-allocations'],
    queryFn: () => getAllocations(),
    enabled: open && !isAdmin,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Please enter both a title and message body');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        audience,
        targetRole: audience === 'ROLE' ? targetRole : undefined,
        targetSectionId: audience === 'SECTION' ? targetSectionId : undefined,
        sendEmail,
      });
      setTitle('');
      setBody('');
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="Send Announcement / Notification" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

        <FormField label="Announcement Title" htmlFor="notif-title">
          <Input
            id="notif-title"
            required
            placeholder="e.g. Campus Holiday / Assignment Submission Deadline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        {isAdmin ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Target Audience" htmlFor="notif-aud">
              <select
                id="notif-aud"
                value={audience}
                onChange={(e) => setAudience(e.target.value as NotificationAudience)}
                className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
              >
                <option value="ALL">Everyone (College-wide)</option>
                <option value="ROLE">Specific Role</option>
                <option value="SECTION">Specific Section</option>
              </select>
            </FormField>

            {audience === 'ROLE' && (
              <FormField label="Role" htmlFor="notif-role">
                <select
                  id="notif-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
                >
                  <option value="STUDENT">All Students</option>
                  <option value="FACULTY">All Faculty</option>
                  <option value="ADMIN">Administrators</option>
                </select>
              </FormField>
            )}

            {audience === 'SECTION' && (
              <FormField label="Section" htmlFor="notif-sec">
                <select
                  id="notif-sec"
                  required
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name} ({s.semester?.course?.code || ''})
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>
        ) : (
          <FormField label="Target Section" htmlFor="notif-fac-sec">
            <select
              id="notif-fac-sec"
              required
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
              className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              <option value="">Select Section</option>
              {allocations.map((a) => (
                <option key={a.id} value={a.sectionId}>
                  Section {a.section.name} — {a.subject.code}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Message" htmlFor="notif-body">
          <textarea
            id="notif-body"
            rows={4}
            required
            placeholder="Type your announcement details here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border border-line p-3 text-sm text-ink placeholder:text-muted/60"
          />
        </FormField>

        <div className="flex items-center gap-2">
          <input
            id="notif-email"
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand"
          />
          <label htmlFor="notif-email" className="text-xs font-medium text-slate-700">
            Also dispatch transactional email to all recipients
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Send Announcement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
