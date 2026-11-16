import { Button } from '@/components/ui';
import type { AttendanceStatus, StudentRecordItem } from '../types';

interface AttendanceRosterProps {
  students: Array<{ id: string; rollNumber: string; user: { firstName: string; lastName: string; email: string } }>;
  records: Record<string, StudentRecordItem>;
  onChange: (records: Record<string, StudentRecordItem>) => void;
}

export function AttendanceRoster({ students, records, onChange }: AttendanceRosterProps) {
  const setAllStatus = (status: AttendanceStatus) => {
    const updated = { ...records };
    students.forEach((s) => {
      updated[s.id] = { studentId: s.id, status, remark: records[s.id]?.remark };
    });
    onChange(updated);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    onChange({
      ...records,
      [studentId]: { studentId, status, remark: records[studentId]?.remark },
    });
  };

  const setStudentRemark = (studentId: string, remark: string) => {
    const current = records[studentId] || { studentId, status: 'PRESENT' };
    onChange({
      ...records,
      [studentId]: { ...current, remark },
    });
  };

  const presentCount = Object.values(records).filter((r) => r.status === 'PRESENT').length;
  const absentCount = Object.values(records).filter((r) => r.status === 'ABSENT').length;
  const lateCount = Object.values(records).filter((r) => r.status === 'LATE').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">Roster: {students.length} Students</span>
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">Present: {presentCount}</span>
          <span className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded">Absent: {absentCount}</span>
          {lateCount > 0 && (
            <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">Late: {lateCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => setAllStatus('PRESENT')}>
            Mark All Present
          </Button>
          <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => setAllStatus('ABSENT')}>
            Mark All Absent
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs">
            <tr>
              <th className="px-4 py-2.5 text-left">Roll Number</th>
              <th className="px-4 py-2.5 text-left">Student Name</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-left">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {students.map((s) => {
              const current = records[s.id]?.status || 'PRESENT';
              const remark = records[s.id]?.remark || '';

              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-mono text-xs font-bold text-slate-900">{s.rollNumber}</td>
                  <td className="px-4 py-2">
                    <div className="font-semibold text-slate-900">{s.user.firstName} {s.user.lastName}</div>
                    <div className="text-xs text-slate-400">{s.user.email}</div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((status) => {
                        const isSelected = current === status;
                        const label = status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : status === 'LATE' ? 'L' : 'E';
                        const activeColor =
                          status === 'PRESENT'
                            ? 'bg-emerald-600 text-white'
                            : status === 'ABSENT'
                            ? 'bg-red-600 text-white'
                            : status === 'LATE'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-600 text-white';

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStudentStatus(s.id, status)}
                            className={`px-3 py-1 text-xs font-bold border first:rounded-l-md last:rounded-r-md transition-colors ${
                              isSelected
                                ? activeColor
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Optional remark..."
                      value={remark}
                      onChange={(e) => setStudentRemark(s.id, e.target.value)}
                      className="h-8 w-full max-w-xs rounded border border-line px-2 text-xs text-ink placeholder:text-muted/50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
