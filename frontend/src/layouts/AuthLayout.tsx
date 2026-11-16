import type { ReactNode } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// [column 0-4, start row 0-5, row span]: a plausible week, drawn as the brand motif.
const BLOCKS: Array<[number, number, number]> = [
  [0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 2, 2], [2, 0, 2], [2, 3, 1], [3, 1, 1], [3, 4, 1], [4, 0, 1], [4, 3, 2],
];

/** The timetable grid is the one memorable element; everything else stays quiet. */
function TimetableMotif() {
  return (
    <div aria-hidden className="grid grid-cols-5 gap-2 text-xs text-white/70">
      {DAYS.map((d) => (
        <div key={d} className="pb-1 font-medium">{d}</div>
      ))}
      <div className="relative col-span-5 grid h-72 grid-cols-5 grid-rows-6 gap-2">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="rounded-sm border border-white/15" />
        ))}
        {BLOCKS.map(([col, row, span], i) => (
          <div
            key={i}
            className="rounded-sm bg-white/90"
            style={{ gridColumn: col + 1, gridRow: `${row + 1} / span ${span}`, opacity: 0.55 + (i % 3) * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <span className="text-xl font-bold tracking-tight">AcadMatrix</span>
        <div className="max-w-md space-y-8">
          <TimetableMotif />
          <p className="text-2xl font-semibold leading-snug">Timetables, attendance, assignments and fees, in one place.</p>
        </div>
        <span className="text-sm text-white/70">College management for admins, faculty and students.</span>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <span className="text-xl font-bold tracking-tight text-brand lg:hidden">AcadMatrix</span>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
