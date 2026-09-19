"use client";

import { useState } from "react";
import { SignInModalContext, type SignInModalMode } from "@/context/sign-in-modal-context";
import { SignInModal } from "./SignInModal";

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  warning?: string;
}

export function SignInModalProvider({ children, title, subtitle, warning }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<SignInModalMode>("signin");

  return (
    <SignInModalContext.Provider
      value={{ isOpen, open: (mode) => {
          // onClick={open} passes a click event here — only an explicit "signup" switches modes
          setInitialMode(mode === "signup" ? "signup" : "signin");
          setIsOpen(true);
        }, close: () => setIsOpen(false) }}
    >
      {children}
      <SignInModal
        isOpen={isOpen}
        initialMode={initialMode}
        onClose={() => setIsOpen(false)}
        title={title}
        subtitle={subtitle}
        warning={warning}
      />
    </SignInModalContext.Provider>
  );
}
