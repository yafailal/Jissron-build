"use client";

import { useState } from "react";
import { SignInModalContext } from "@/context/sign-in-modal-context";
import { SignInModal } from "./SignInModal";

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SignInModalContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
      <SignInModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </SignInModalContext.Provider>
  );
}
