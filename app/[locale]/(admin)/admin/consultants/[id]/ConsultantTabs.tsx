"use client";

import { useState } from "react";
import { Pencil, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  editTab: React.ReactNode;
  calendarTab: React.ReactNode;
}

export function ConsultantTabs({ editTab, calendarTab }: Props) {
  const t = useTranslations("AdminConsultants");
  const [tab, setTab] = useState<"edit" | "calendar">("edit");

  return (
    <div>
      <div className="flex gap-1.5 mb-4 -mt-2">
        <TabButton active={tab === "edit"} onClick={() => setTab("edit")}>
          <Pencil className="w-3.5 h-3.5" /> {t("tabProfile")}
        </TabButton>
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
          <CalendarDays className="w-3.5 h-3.5" /> {t("tabCalendar")}
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
      className={`inline-flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-semibold rounded-full border transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-primary-softer text-ink border-primary-soft hover:border-primary-mid"
      }`}
    >
      {children}
    </button>
  );
}
