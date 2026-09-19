"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CourseFiltersSidebar } from "./CourseFiltersSidebar";

export function MobileFiltersDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#d9dcd6] bg-white text-[13px] font-600 text-[#0e1f1a] hover:border-[#0e1f1a] transition-colors"
      >
        <SlidersHorizontal size={14} strokeWidth={2} />
        Filters
      </button>

      <Drawer open={open} onOpenChange={setOpen} direction="left">
        <DrawerContent className="flex flex-col p-0 max-w-[320px]">
          <DrawerHeader className="px-5 py-4 border-b border-[#d9dcd6]">
            <DrawerTitle className="text-[15px] font-700 text-[#0e1f1a]">Filters</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <CourseFiltersSidebar className="w-full" />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
