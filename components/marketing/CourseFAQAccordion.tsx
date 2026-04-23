"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface CourseFAQAccordionProps {
  faqs: FAQ[];
}

export function CourseFAQAccordion({ faqs }: CourseFAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="border border-line rounded-xl divide-y divide-line overflow-hidden">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
              className="flex items-center justify-between w-full gap-4 px-5 py-4 text-left hover:bg-bg-soft transition-colors"
            >
              <span className="text-sm font-700 text-primary leading-snug">
                {faq.question}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
              )}
              aria-hidden={!isOpen}
            >
              <p className="px-5 pb-5 pt-1 text-sm text-body-text leading-relaxed whitespace-pre-line">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
