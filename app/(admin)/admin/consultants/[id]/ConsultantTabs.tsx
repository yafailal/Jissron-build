"use client";

import { useState } from "react";
import { Pencil, CalendarDays } from "lucide-react";

interface Props {
  editTab: React.ReactNode;
  calendarTab: React.ReactNode;
}

export function ConsultantTabs({ editTab, calendarTab }: Props) {
  const [tab, setTab] = useState<"edit" | "calendar">("edit");

  return (
    <div>
      <div className="flex gap-1 border-b border-line mb-4 -mt-2">
        <TabButton active={tab === "edit"} onClick={() => setTab("edit")}>
          <Pencil className="w-3.5 h-3.5" /> Profile
        </TabButton>
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
          <CalendarDays className="w-3.5 h-3.5" /> Calendar
        </TabButton>
      </div>
      <div hidden={tab !== "edit"}>{editTab}</div>
      <div hidden={tab !== "calendar"}>{calendarTab}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
