"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import {
  updateConsultantCalendar,
  type AvailabilityDay,
  type AvailabilityDayEntry,
} from "../actions";

const DAYS: AvailabilityDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<AvailabilityDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

// 7am – 10pm. Each cell = 30 minutes. Tuneable.
const START_HOUR = 7;
const END_HOUR = 22;
const SLOTS_PER_HOUR = 2;
const TOTAL_ROWS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;

function rowToTime(row: number): string {
  const totalMinutes = START_HOUR * 60 + row * (60 / SLOTS_PER_HOUR);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Convert the canonical {day, slots: [{start,end}]} to a grid of booleans:
// grid[day][row] = true if that 30-min cell is selected.
function entriesToGrid(entries: AvailabilityDayEntry[]): boolean[][] {
  const grid: boolean[][] = DAYS.map(() => Array(TOTAL_ROWS).fill(false));
  for (const e of entries) {
    const dayIdx = DAYS.indexOf(e.day);
    if (dayIdx < 0) continue;
    for (const s of e.slots) {
      const startRow = timeToRow(s.start);
      const endRow = timeToRow(s.end);
      if (startRow < 0 || endRow < 0) continue;
      for (let r = startRow; r < endRow && r < TOTAL_ROWS; r++) {
        grid[dayIdx][r] = true;
      }
    }
  }
  return grid;
}

function timeToRow(t: string | undefined | null): number {
  if (!t || typeof t !== "string" || !t.includes(":")) return -1;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  const totalMinutes = h * 60 + m;
  const startMinutes = START_HOUR * 60;
  if (totalMinutes < startMinutes) return 0;
  return Math.floor((totalMinutes - startMinutes) / (60 / SLOTS_PER_HOUR));
}

// Convert a grid back to {day, slots} merging consecutive selected cells.
function gridToEntries(grid: boolean[][]): AvailabilityDayEntry[] {
  const out: AvailabilityDayEntry[] = [];
  for (let d = 0; d < DAYS.length; d++) {
    const slots: { start: string; end: string }[] = [];
    let r = 0;
    while (r < TOTAL_ROWS) {
      if (!grid[d][r]) {
        r++;
        continue;
      }
      const startRow = r;
      while (r < TOTAL_ROWS && grid[d][r]) r++;
      slots.push({ start: rowToTime(startRow), end: rowToTime(r) });
    }
    if (slots.length > 0) out.push({ day: DAYS[d], slots });
  }
  return out;
}

interface Props {
  consultantId: string;
  initialAvailability: AvailabilityDayEntry[];
  initialTimezone: string;
}

const TIMEZONE_OPTIONS = [
  "UTC",
  "Africa/Casablanca",
  "Europe/Paris",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
];

export function AvailabilityEditor({ consultantId, initialAvailability, initialTimezone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [grid, setGrid] = useState<boolean[][]>(() => entriesToGrid(initialAvailability));
  const [timezone, setTimezone] = useState(initialTimezone || "UTC");
  const initialGridRef = useRef<boolean[][]>(entriesToGrid(initialAvailability));
  const initialTzRef = useRef(initialTimezone || "UTC");

  // Drag-to-select state
  const dragging = useRef<{ mode: "add" | "remove"; lastDay: number; lastRow: number } | null>(null);

  function setCell(day: number, row: number, value: boolean) {
    setGrid((g) => {
      if (g[day][row] === value) return g;
      const next = g.map((col) => col.slice());
      next[day][row] = value;
      return next;
    });
  }

  function onCellMouseDown(day: number, row: number) {
    const current = grid[day][row];
    const mode = current ? "remove" : "add";
    dragging.current = { mode, lastDay: day, lastRow: row };
    setCell(day, row, mode === "add");
  }

  function onCellMouseEnter(day: number, row: number) {
    if (!dragging.current) return;
    const { mode } = dragging.current;
    setCell(day, row, mode === "add");
  }

  function onMouseUp() {
    dragging.current = null;
  }

  function isDirty() {
    if (timezone !== initialTzRef.current) return true;
    const a = initialGridRef.current;
    for (let d = 0; d < DAYS.length; d++) {
      for (let r = 0; r < TOTAL_ROWS; r++) {
        if (a[d][r] !== grid[d][r]) return true;
      }
    }
    return false;
  }

  function reset() {
    setGrid(initialGridRef.current.map((c) => c.slice()));
    setTimezone(initialTzRef.current);
  }

  function clearAll() {
    setGrid(DAYS.map(() => Array(TOTAL_ROWS).fill(false)));
  }

  function save() {
    const entries = gridToEntries(grid);
    startTransition(async () => {
      const res = await updateConsultantCalendar(consultantId, entries, timezone);
      if (res.ok) {
        toast.success("Availability saved");
        initialGridRef.current = grid.map((c) => c.slice());
        initialTzRef.current = timezone;
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    });
  }

  const slotCountByDay = useMemo(() => {
    return grid.map((col) => col.filter(Boolean).length / SLOTS_PER_HOUR);
  }, [grid]);

  const totalHours = useMemo(
    () => slotCountByDay.reduce((s, h) => s + h, 0),
    [slotCountByDay]
  );

  return (
    <div className="bg-white rounded-lg border border-line p-4" onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {/* Header — controls */}
      <div className="flex flex-wrap items-end gap-3 mb-3 pb-3 border-b border-line">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight mb-1">
            Timezone
          </p>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
            {!TIMEZONE_OPTIONS.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
          </select>
        </div>
        <div className="text-[11.5px] text-muted">
          <span className="font-semibold text-ink">{totalHours}h</span> per week
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="h-8 px-3 rounded-md border border-line text-[12px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!isDirty() || isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line text-[12px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty() || isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-white text-[12px] font-bold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid select-none" style={{ gridTemplateColumns: `48px repeat(${DAYS.length}, minmax(56px, 1fr))` }}>
          {/* Header row */}
          <div className="text-[10.5px] font-bold text-muted uppercase tracking-wide py-1.5">
            {/* spacer */}
          </div>
          {DAYS.map((d, i) => (
            <div key={d} className="text-center py-1.5">
              <p className="text-[11px] font-bold text-ink uppercase tracking-wide">{DAY_LABELS[d]}</p>
              <p className="text-[10px] text-muted">{slotCountByDay[i]}h</p>
            </div>
          ))}

          {/* Hour rows */}
          {Array.from({ length: TOTAL_ROWS }).map((_, row) => {
            const isHourBoundary = row % SLOTS_PER_HOUR === 0;
            return (
              <FragmentRow
                key={row}
                row={row}
                isHourBoundary={isHourBoundary}
                grid={grid}
                onCellMouseDown={onCellMouseDown}
                onCellMouseEnter={onCellMouseEnter}
              />
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted mt-3">
        Click or drag across cells to add/remove recurring weekly slots. Each cell is 30 min.
      </p>
    </div>
  );
}

function FragmentRow({
  row,
  isHourBoundary,
  grid,
  onCellMouseDown,
  onCellMouseEnter,
}: {
  row: number;
  isHourBoundary: boolean;
  grid: boolean[][];
  onCellMouseDown: (day: number, row: number) => void;
  onCellMouseEnter: (day: number, row: number) => void;
}) {
  return (
    <>
      <div
        className={`text-[10.5px] text-muted font-mono pr-1.5 text-right leading-none flex items-start justify-end pt-0.5 ${
          !isHourBoundary ? "invisible" : ""
        }`}
        style={{ height: 14 }}
      >
        {rowToTime(row)}
      </div>
      {DAYS.map((_, dayIdx) => {
        const selected = grid[dayIdx][row];
        return (
          <button
            type="button"
            key={dayIdx}
            onMouseDown={(e) => {
              e.preventDefault();
              onCellMouseDown(dayIdx, row);
            }}
            onMouseEnter={() => onCellMouseEnter(dayIdx, row)}
            className={`border-l border-line transition-colors ${
              isHourBoundary ? "border-t" : ""
            } ${selected ? "bg-primary hover:bg-primary-hover" : "bg-bg-soft/40 hover:bg-primary/15"}`}
            style={{ height: 14 }}
            aria-label={`${DAY_LABELS[DAYS[dayIdx]]} ${rowToTime(row)}`}
          />
        );
      })}
    </>
  );
}
