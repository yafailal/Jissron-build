"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CourseFiltersSidebar } from "./CourseFiltersSidebar";

export function MobileFiltersDrawer() {
  const t = useTranslations("Courses");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center gap-2 h-9 px-4 rounded-full border-[1.5px] border-primary bg-transparent text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
      >
        <SlidersHorizontal size={14} strokeWidth={2} />
        {t("filters.title")}
      </button>

      <Drawer open={open} onOpenChange={setOpen} direction="left">
        <DrawerContent className="flex flex-col p-0 max-w-[320px]">
          <DrawerHeader className="px-5 py-4 border-b border-line">
            <DrawerTitle className="text-[15px] font-bold text-ink">{t("filters.title")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <CourseFiltersSidebar className="w-full" />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
