import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { getSections } from '@/features/academics/api/academicsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createSlot, deleteSlot, getMyTimetable, getSlots, updateSlot } from '../api/timetableApi';
import { TimetableGrid } from '../components/TimetableGrid';
import { TimetableSlotModal } from '../components/TimetableSlotModal';
import type { CreateSlotPayload, TimetableSlotItem } from '../types';

export function TimetablePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [sectionId, setSectionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotItem | null>(null);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections(),
    enabled: isAdmin,
  });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: isAdmin ? ['timetable', { sectionId }] : ['timetable-my'],
    queryFn: () => (isAdmin ? getSlots({ sectionId: sectionId || undefined }) : getMyTimetable()),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['timetable-my'] });
    },
  });

  const handleModalSubmit = async (payload: CreateSlotPayload) => {
    if (editingSlot) {
      await updateSlot(editingSlot.id, payload);
    } else {
      await createSlot(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['timetable'] });
    queryClient.invalidateQueries({ queryKey: ['timetable-my'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'Timetable Management' : user?.role === 'FACULTY' ? 'My Teaching Timetable' : 'My Class Timetable'}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? 'Schedule weekly recurring classes and detect room or instructor conflicts'
              : 'Weekly class schedule and room allocations'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingSlot(null); setModalOpen(true); }}>
            + Add Class Slot
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-4">
          <label className="text-xs font-semibold text-slate-600">Filter by Section:</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="h-10 rounded-md border border-line bg-white px-3 text-xs text-ink min-w-[200px]"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                Section {s.name} ({s.semester?.course?.code || ''} Sem {s.semester?.number || ''})
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading timetable...</div>
      ) : (
        <TimetableGrid
          slots={slots}
          canManage={isAdmin}
          onEdit={(s) => { setEditingSlot(s); setModalOpen(true); }}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      )}

      <TimetableSlotModal
        open={modalOpen}
        slotToEdit={editingSlot}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
