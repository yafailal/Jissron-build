"use client";

import { useState } from "react";
import { SignInModalContext, type SignInModalMode } from "@/context/sign-in-modal-context";
import { SignInModal } from "./SignInModal";

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
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
      <SignInModal isOpen={isOpen} initialMode={initialMode} onClose={() => setIsOpen(false)} />
    </SignInModalContext.Provider>
  );
}
