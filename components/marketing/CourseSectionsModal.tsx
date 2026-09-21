"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseSectionsModalProps {
  overview: ReactNode;
  curriculum: ReactNode;
  instructor: ReactNode;
  reviews: ReactNode;
  faq: ReactNode | null;
}

type TabKey = "overview" | "curriculum" | "instructor" | "reviews" | "faq";

const TABS: { value: TabKey }[] = [
  { value: "overview" },
  { value: "curriculum" },
  { value: "instructor" },
  { value: "reviews" },
  { value: "faq" },
];

export function CourseSectionsModal({
  overview,
  curriculum,
  instructor,
  reviews,
  faq,
}: CourseSectionsModalProps) {
  const t = useTranslations("CourseDetail");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TabKey>("overview");

  const tabs = faq ? TABS : TABS.filter((tab) => tab.value !== "faq");

  function openWith(tab: TabKey) {
    setActive(tab);
    setOpen(true);
  }

  const content =
    active === "overview" ? overview :
    active === "curriculum" ? curriculum :
    active === "instructor" ? instructor :
    active === "reviews" ? reviews :
    faq;

  return (
    <>
      {/* Inline tab strip — clicking any tab opens the drawer at that tab */}
      <nav className="border-y border-line py-2.5 flex items-center gap-1 text-[11.5px] font-600 tracking-wide uppercase overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => openWith(tab.value)}
            className="shrink-0 px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-bg-soft transition-colors"
          >
            {t(`tabs.${tab.value}`)}
          </button>
        ))}
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="!max-h-[85vh]">
          <DrawerTitle className="sr-only">{t("sections.courseDetails")}</DrawerTitle>

          {/* Drawer-internal tab strip */}
          <div className="border-b border-line px-4 sm:px-6 pt-3 pb-2 flex items-center gap-1 overflow-x-auto sticky top-0 bg-popover z-10">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActive(tab.value)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-md text-[11.5px] font-600 tracking-wide uppercase transition-colors",
                  active === tab.value
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-bg-soft"
                )}
              >
                {t(`tabs.${tab.value}`)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto shrink-0 w-8 h-8 grid place-items-center rounded-md text-muted hover:text-ink hover:bg-bg-soft"
              aria-label={t("sections.close")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Active section content */}
          <div className="overflow-y-auto px-4 sm:px-6 py-5">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
