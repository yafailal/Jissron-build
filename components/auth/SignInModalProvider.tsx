"use client";

import { useState } from "react";
import { SignInModalContext } from "@/context/sign-in-modal-context";
import { SignInModal } from "./SignInModal";

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  warning?: string;
}

export function SignInModalProvider({ children, title, subtitle, warning }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SignInModalContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
      <SignInModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        subtitle={subtitle}
        warning={warning}
      />
    </SignInModalContext.Provider>
  );
}
